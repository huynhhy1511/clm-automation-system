import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_admin, get_current_user
import base64
import os
from sqlalchemy.orm import selectinload

router = APIRouter()

N8N_WEBHOOK_URL_BILLS = "http://n8n:5678/n8n/webhook/chot-dien-nuoc"

@router.post("/calculate", response_model=schemas.UtilityBillResponse)
async def calculate_bill(
    bill: schemas.UtilityBillBase, 
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    new_bill = models.UtilityBill(**bill.model_dump())
    db.add(new_bill)
    await db.commit()
    await db.refresh(new_bill)

    room_res = await db.execute(select(models.Room).where(models.Room.id == new_bill.room_id))
    room = room_res.scalar_one_or_none()
    
    # Lookup tenant email via contract
    email = None
    if room:
        contract_res = await db.execute(
            select(models.Contract).where(models.Contract.room_id == room.id)
        )
        contract = contract_res.scalars().first()
        if contract:
            tenant_res = await db.execute(
                select(models.Tenant).where(models.Tenant.id == contract.tenant_id)
            )
            tenant = tenant_res.scalar_one_or_none()
            if tenant:
                user_res = await db.execute(
                    select(models.User).where(models.User.id == tenant.user_id)
                )
                user = user_res.scalar_one_or_none()
                if user:
                    email = user.email
    
    if room:
        payload = {
            "phong": room.ma_phong,
            "thangNam": new_bill.thang_nam,
            "tongTien": new_bill.tong_tien,
            "billId": new_bill.id,
            "email": email or "",
            "chiSoDienCu": new_bill.chi_so_dien_cu,
            "chiSoDienMoi": new_bill.chi_so_dien_moi,
            "chiSoNuocCu": new_bill.chi_so_nuoc_cu,
            "chiSoNuocMoi": new_bill.chi_so_nuoc_moi,
        }
        async with httpx.AsyncClient() as client:
            try:
                await client.post(N8N_WEBHOOK_URL_BILLS, json=payload)
            except Exception as e:
                print(f"Webhook failed: {e}")
                
    return new_bill

@router.get("/", response_model=list[schemas.UtilityBillResponse])
async def list_bills(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Admin can see all, Tenant can only see their room's bills.
    # To keep it simple, we just return all mapping if it's admin.
    if current_user.role == "admin":
        res = await db.execute(
            select(models.UtilityBill, models.Contract.so_nguoi)
            .outerjoin(models.Contract, models.UtilityBill.room_id == models.Contract.room_id)
        )
        bills = []
        for bill, so_nguoi in res.all():
            bill_data = schemas.UtilityBillResponse.model_validate(bill)
            bill_data.so_nguoi = so_nguoi or 1
            bills.append(bill_data)
        return bills
    else:
        # Get tenant room
        tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.user_id == current_user.id))
        tenant = tenant_res.scalar_one_or_none()
        if not tenant:
             return []
        contract_res = await db.execute(select(models.Contract).where(models.Contract.tenant_id == tenant.id))
        contract = contract_res.scalars().first()
        if not contract:
             return []

        res = await db.execute(
            select(models.UtilityBill, models.Contract.so_nguoi)
            .where(models.UtilityBill.room_id == contract.room_id)
            .outerjoin(models.Contract, models.UtilityBill.room_id == models.Contract.room_id)
        )
        bills = []
        for bill, so_nguoi in res.all():
            bill_data = schemas.UtilityBillResponse.model_validate(bill)
            bill_data.so_nguoi = so_nguoi or 1
            bills.append(bill_data)
        return bills

@router.get("/active-rooms", response_model=list[schemas.ActiveRoomBillingResponse])
async def get_active_rooms(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    """Lấy danh sách các phòng và trạng thái chốt điện trong tháng này."""
    query = (
        select(models.Room, models.Contract, models.Tenant, models.User)
        .join(models.Contract, models.Room.id == models.Contract.room_id)
        .join(models.Tenant, models.Contract.tenant_id == models.Tenant.id)
        .join(models.User, models.Tenant.user_id == models.User.id)
        .where(models.Contract.trang_thai == "Hiệu lực")
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    import datetime
    today = datetime.date.today()
    current_month_str = f"{today.month}/{today.year}"
    
    active_rooms = []
    for room, contract, tenant, user in rows:
        # Kiểm tra xem tháng này đã có bill chưa
        bill_res = await db.execute(
            select(models.UtilityBill)
            .where(
                models.UtilityBill.room_id == room.id,
                models.UtilityBill.thang_nam == current_month_str
            )
        )
        current_bill = bill_res.scalar_one_or_none()
            
        last_bill_res = await db.execute(
            select(models.UtilityBill)
            .where(models.UtilityBill.room_id == room.id)
            .order_by(models.UtilityBill.id.desc())
            .limit(2 if current_bill else 1)
        )
        bills = last_bill_res.scalars().all()
        # Nếu đã có bill tháng này, lấy bill trước đó làm mốc "cũ"
        last_bill = None
        if current_bill:
            for b in bills:
                if b.id != current_bill.id:
                    last_bill = b
                    break
        else:
            last_bill = bills[0] if bills else None
        
        active_rooms.append(schemas.ActiveRoomBillingResponse(
            room_id=room.id,
            ma_phong=room.ma_phong,
            tenant_name=tenant.ho_ten,
            tenant_email=user.email,
            so_nguoi=contract.so_nguoi,
            room_price=contract.gia_thue_chot,
            prev_electricity=last_bill.chi_so_dien_moi if last_bill else 0,
            prev_water=last_bill.chi_so_nuoc_moi if last_bill else 0,
            is_completed=True if current_bill else False,
            bill_id=current_bill.id if current_bill else None,
            pdf_link=current_bill.pdf_link if current_bill else None,
            current_total=current_bill.tong_tien if current_bill else None
        ))
    
    return active_rooms

import logging

logger = logging.getLogger("uvicorn.error")

@router.post("/save")
async def save_invoice(
    payload: schemas.InvoiceSaveRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint gọi bởi n8n sau khi tạo PDF.
    Tìm/Tạo Bill -> Giải mã Base64 -> Lưu file .pdf vật lý -> Cập nhật URL.
    """
    logger.info(f"N8N PAYLOAD RECEIVED: {payload.model_dump_json(indent=2)}")
    
    # 1. Tìm Room_id từ ma_phong (Khớp với trường 'phong' trong n8n)
    room_res = await db.execute(select(models.Room).where(models.Room.ma_phong == payload.phong))
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy phòng {payload.phong}")
    
    # 2. Tìm xem đã có Bill cho phòng này và tháng này chưa
    bill_res = await db.execute(
        select(models.UtilityBill)
        .where(models.UtilityBill.room_id == room.id, models.UtilityBill.thang_nam == payload.thang_nam)
    )
    bill = bill_res.scalar_one_or_none()
    
    if not bill:
        # Nếu chưa có thì tạo mới
        bill = models.UtilityBill(
            room_id=room.id,
            thang_nam=payload.thang_nam,
            chi_so_dien_cu=payload.chi_so_dien_cu,
            chi_so_dien_moi=payload.chi_so_dien_moi,
            chi_so_nuoc_cu=payload.chi_so_nuoc_cu,
            chi_so_nuoc_moi=payload.chi_so_nuoc_moi,
            tong_tien=payload.tong_tien,
            trang_thai="Chưa thanh toán"
        )
        db.add(bill)
        await db.flush() # Để có bill.id
    else:
        # Nếu có rồi thì cập nhật thông tin
        bill.chi_so_dien_cu = payload.chi_so_dien_cu
        bill.chi_so_dien_moi = payload.chi_so_dien_moi
        bill.chi_so_nuoc_cu = payload.chi_so_nuoc_cu
        bill.chi_so_nuoc_moi = payload.chi_so_nuoc_moi
        bill.tong_tien = payload.tong_tien
        # Reset trạng thái về 'Chưa thanh toán' để cho phép thanh toán lại với số tiền mới
        bill.trang_thai = "Chưa thanh toán"
        bill.payos_order_code = None

    # 3. Giải mã và lưu PDF (Chỉ thực hiện nếu có dữ liệu)
    if payload.pdf_base64:
        try:
            pdf_bytes = base64.b64decode(payload.pdf_base64)
            file_name = f"invoice_{bill.id}_{payload.thang_nam.replace('/', '-')}.pdf"
            file_path = os.path.join("static", "invoices", file_name)
            with open(file_path, "wb") as f:
                f.write(pdf_bytes)
            bill.pdf_link = f"/static/invoices/{file_name}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lỗi xử lý file PDF: {str(e)}")
    
    if payload.qr_url:
        bill.qr_url = payload.qr_url
    
    await db.commit()
    return {"message": "Hóa đơn đã được lưu thành công", "pdf_link": bill.pdf_link}

@router.post("/{bill_id}/create-payment-link")
async def create_payment_link(
    bill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bill_res = await db.execute(select(models.UtilityBill).where(models.UtilityBill.id == bill_id))
    bill = bill_res.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
    
    room_res = await db.execute(select(models.Room).where(models.Room.id == bill.room_id))
    room = room_res.scalar_one_or_none()
    room_name = room.ma_phong if room else f"Bill {bill.id}"

    import time
    if not bill.payos_order_code:
        bill.payos_order_code = int(str(bill.id) + str(int(time.time() * 1000))[-6:])
        await db.commit()

    from payos.types import CreatePaymentLinkRequest
    from app.core.config import settings
    from app.core.payos_provider import payos
    import logging
    logger = logging.getLogger("uvicorn.error")

    payment_data = CreatePaymentLinkRequest(
        orderCode=bill.payos_order_code,
        amount=int(bill.tong_tien),
        description=f"{room_name}",
        cancelUrl=settings.PAYOS_CANCEL_URL,
        returnUrl=settings.PAYOS_RETURN_URL
    )

    try:
        if payos:
            try:
                payment_response = await payos.payment_requests.create(payment_data)
            except Exception as e_create:
                if "tồn tại" in str(e_create).lower() or "exist" in str(e_create).lower():
                    # Generate a new order code and retry
                    bill.payos_order_code = int(str(bill.id) + str(int(time.time() * 1000))[-7:])
                    payment_data_new = CreatePaymentLinkRequest(
                        orderCode=bill.payos_order_code,
                        amount=int(bill.tong_tien),
                        description=f"{room_name}",
                        cancelUrl=settings.PAYOS_CANCEL_URL,
                        returnUrl=settings.PAYOS_RETURN_URL
                    )
                    payment_response = await payos.payment_requests.create(payment_data_new)
                    await db.commit()
                else:
                    raise e_create
                    
            checkout_url = getattr(payment_response, 'checkout_url', getattr(payment_response, 'checkoutUrl', ''))
            qr_code_str = getattr(payment_response, 'qr_code', getattr(payment_response, 'qrCode', ''))
        else:
            logger.warning("PAYOS SKIPPED: Provider not initialized (missing keys).")
            checkout_url = f"https://payos.vn/error-placeholder-{bill.payos_order_code}"
            qr_code_str = ""
            
        return {"checkoutUrl": checkout_url, "qrCode": qr_code_str}
    except Exception as e:
        logger.error(f"PAYOS BILL ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Không thể tạo link thanh toán: {str(e)}")
