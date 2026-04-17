import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional
from dateutil.relativedelta import relativedelta
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_admin

router = APIRouter()

N8N_WEBHOOK_URL_CONTRACT = "http://n8n:5678/webhook/tao-hop-dong"

class SavePdfPayload(BaseModel):
    contract_id: int
    pdf_base64: str
    pdf_link: Optional[str] = None

@router.post("/save-pdf")
async def save_pdf_to_contract(payload: SavePdfPayload, db: AsyncSession = Depends(get_db)):
    """Called by n8n after generating PDF — saves base64 PDF to DB"""
    contract = await db.get(models.Contract, payload.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.pdf_data = payload.pdf_base64
    if payload.pdf_link:
        contract.pdf_link = payload.pdf_link
    await db.commit()
    return {"message": "PDF saved successfully", "contract_id": payload.contract_id}


class ContractDecision(BaseModel):
    contractId: int
    action: str
    timestamp: Optional[str] = None

@router.post("/update-decision")
async def update_decision(payload: ContractDecision, db: AsyncSession = Depends(get_db)):
    """Ghi nhận quyết định gia hạn hoặc trả phòng từ Tenant và tự động hóa các bước tiếp theo"""
    contract = await db.get(models.Contract, payload.contractId)
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")
    
    message = ""
    if payload.action == "renew":
        # 1. Tự động gia hạn thêm 6 tháng
        old_expiry = contract.ngay_ket_thuc
        contract.ngay_ket_thuc = old_expiry + relativedelta(months=6)
        message = f"Cảm ơn bạn! Hợp đồng đã được gia hạn tự động thêm 6 tháng. Ngày hết hạn mới: {contract.ngay_ket_thuc.strftime('%d/%m/%Y')}."
    
    elif payload.action == "return":
        # 2. Đánh dấu thanh lý và giải phóng phòng
        contract.trang_thai = "Đã thanh lý"
        room = await db.get(models.Room, contract.room_id)
        if room:
            room.trang_thai = "Trống"
        message = "Cảm ơn bạn! Chúng tôi đã ghi nhận yêu cầu trả phòng và sẽ tiến hành các thủ tục thanh lý."
    
    else:
        message = "Cảm ơn bạn đã phản hồi. Chúng tôi đã ghi nhận lựa chọn của bạn."

    await db.commit()
    
    # Log the decision
    print(f"--- TENANT DECISION PROCESSED ---")
    print(f"Contract ID: {payload.contractId}, Action: {payload.action}")
    
    return {
        "status": "success", 
        "message": message,
        "contractId": payload.contractId
    }


@router.post("/", response_model=schemas.ContractResponse)
async def create_contract(
    contract: schemas.ContractCreate, 
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    new_contract = models.Contract(**contract.model_dump())
    db.add(new_contract)
    await db.commit()
    await db.refresh(new_contract)

    tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.id == new_contract.tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    
    room_res = await db.execute(select(models.Room).where(models.Room.id == new_contract.room_id))
    room = room_res.scalar_one_or_none()
    
    if tenant and room:
        payload = {
            "hoTen": tenant.ho_ten,
            "phong": room.ma_phong,
            "giaThue": new_contract.gia_thue_chot,
            "tienCoc": new_contract.tien_coc,
            "contractId": new_contract.id
        }
        async with httpx.AsyncClient() as client:
            try:
                await client.post(N8N_WEBHOOK_URL_CONTRACT, json=payload)
            except Exception as e:
                print(f"Webhook failed: {e}")
                
    return new_contract

from sqlalchemy.orm import selectinload

@router.get("/", response_model=list[schemas.ContractResponse])
async def list_contracts(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    res = await db.execute(
        select(models.Contract)
        .options(selectinload(models.Contract.tenant), selectinload(models.Contract.room))
    )
    return res.scalars().all()

@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    contract = await db.get(models.Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")
    
    # 1. Reset phòng về trạng thái Trống
    room = await db.get(models.Room, contract.room_id)
    if room:
        room.trang_thai = "Trống"
    
    # 2. Xóa Tenant + User liên kết (để email có thể dùng lại)
    tenant = await db.get(models.Tenant, contract.tenant_id)
    if tenant:
        user = await db.get(models.User, tenant.user_id)
        await db.delete(tenant)
        if user:
            await db.delete(user)
    
    # 3. Xóa hợp đồng
    await db.delete(contract)
    await db.commit()
    return {"message": "Đã xóa hợp đồng, tài khoản và giải phóng phòng thành công"}
