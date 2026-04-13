from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import httpx
import secrets
import string
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models import BookingRequest, Room, User, Tenant, Contract
from app.schemas import BookingRequestCreate, BookingRequestResponse, UserResponse as UserSchema
from app.api.deps import get_current_admin
from app.core.security import get_password_hash

router = APIRouter(prefix="/booking-requests", tags=["Booking Requests"])

def generate_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/", response_model=BookingRequestResponse)
async def create_booking_request(request: BookingRequestCreate, db: AsyncSession = Depends(get_db)):
    # Check if room exists and is empty
    room = await db.get(Room, request.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")
    if room.trang_thai != "Trống":
        raise HTTPException(status_code=400, detail="Phòng không còn trống để đặt")
    
    new_request = BookingRequest(
        room_id=request.room_id,
        ho_ten=request.ho_ten,
        ngay_sinh=request.ngay_sinh,
        so_cccd=request.so_cccd,
        thuong_tru=request.thuong_tru,
        ngay_cap=request.ngay_cap,
        noi_cap=request.noi_cap,
        sdt=request.sdt,
        email=request.email,
        anh_khuon_mat=request.anh_khuon_mat,
        cccd_truoc=request.cccd_truoc,
        cccd_sau=request.cccd_sau,
        ngay_bat_dau=request.ngay_bat_dau,
        so_thang_thue=request.so_thang_thue,
        trang_thai="Chờ duyệt"
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return new_request

@router.get("/", response_model=List[BookingRequestResponse])
async def get_all_booking_requests(
    db: AsyncSession = Depends(get_db), 
    current_admin: UserSchema = Depends(get_current_admin)
):
    result = await db.execute(select(BookingRequest).order_by(BookingRequest.ngay_tao.desc()))
    return result.scalars().all()

@router.delete("/{req_id}")
async def delete_booking_request(
    req_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: UserSchema = Depends(get_current_admin)
):
    booking = await db.get(BookingRequest, req_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    await db.delete(booking)
    await db.commit()
    return {"message": "Đã xóa yêu cầu thành công"}

@router.post("/{req_id}/approve")
async def approve_booking_request(
    req_id: int, 
    db: AsyncSession = Depends(get_db),
    current_admin: UserSchema = Depends(get_current_admin)
):
    # 1. Fetch Request
    booking = await db.get(BookingRequest, req_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Yêu cầu thuê không tồn tại")
    if booking.trang_thai != "Chờ duyệt":
        raise HTTPException(status_code=400, detail="Yêu cầu này đã được xử lý")

    # 2. Fetch Room
    room = await db.get(Room, booking.room_id)
    if not room or room.trang_thai != "Trống":
        raise HTTPException(status_code=400, detail="Phòng đã được thuê hoặc không khả dụng")

    # 3. Check if email already used for User
    existing_user_result = await db.execute(select(User).where(User.email == booking.email))
    if existing_user_result.scalars().first():
        raise HTTPException(status_code=400, detail="Email này đã tồn tại trong hệ thống. Khách phải dùng email khác.")

    # 4. Generate Credentials (MOVED TO HANDOVER)
    # raw_password = generate_password()
    # hashed_password = get_password_hash(raw_password)

    # 5. Create User (MOVED TO HANDOVER)
    # new_user = User(
    #     email=booking.email,
    #     hashed_password=hashed_password,
    #     role="tenant"
    # )
    # db.add(new_user)
    # await db.flush() # flush to get new_user.id

    # 6. Create Tenant Profile (Without User ID)
    new_tenant = Tenant(
        user_id=None,
        email=booking.email,
        ho_ten=booking.ho_ten,
        ngay_sinh=booking.ngay_sinh,
        so_cccd=booking.so_cccd,
        thuong_tru=booking.thuong_tru,
        ngay_cap=booking.ngay_cap,
        noi_cap=booking.noi_cap,
        sdt=booking.sdt,
        anh_khuon_mat=booking.anh_khuon_mat,
        cccd_truoc=booking.cccd_truoc,
        cccd_sau=booking.cccd_sau
    )
    db.add(new_tenant)
    await db.flush() # flush to get new_tenant.id

    # 7. Create Contract using dates from booking request
    from datetime import date as date_type
    from dateutil.relativedelta import relativedelta  # type: ignore
    
    # Use guest's chosen start date, or default to today
    if booking.ngay_bat_dau:
        ngay_bd = booking.ngay_bat_dau
    else:
        ngay_bd = date.today()
    
    so_thang = booking.so_thang_thue if booking.so_thang_thue else 12
    
    # Calculate end date based on number of months
    try:
        from dateutil.relativedelta import relativedelta
        ngay_kt = ngay_bd + relativedelta(months=so_thang)
    except ImportError:
        # Fallback: nếu không có dateutil thì tính thủ công
        month = ngay_bd.month - 1 + so_thang
        year = ngay_bd.year + month // 12
        month = month % 12 + 1
        ngay_kt = ngay_bd.replace(year=year, month=month)
    
    new_contract = Contract(
        tenant_id=new_tenant.id,
        room_id=room.id,
        gia_thue_chot=room.gia_thue,
        tien_coc=room.gia_thue,
        ngay_bat_dau=ngay_bd,
        ngay_ket_thuc=ngay_kt,
        trang_thai="Chờ bàn giao"
    )
    db.add(new_contract)

    # 8. Update States
    booking.trang_thai = "Đã duyệt"
    room.trang_thai = "Đã cọc"

    await db.commit()

    # 9. Trigger n8n Webhook - payload phải khớp với "CLM workflow 1" (flat camelCase)
    webhook_payload = {
        # Fields dùng bởi n8n Code node: $input.item.json.body.X
        "hoTen": booking.ho_ten,
        "phong": room.ma_phong,
        "giaThue": room.gia_thue,
        "tienCoc": room.gia_thue,
        "ngayBatDau": str(ngay_bd),
        "ngayKetThuc": str(ngay_kt),
        "soThang": so_thang,
        "contractId": new_contract.id,
        # Email data — để n8n gửi mail xác nhận cho khách
        "email": booking.email,
        "sdt": booking.sdt,
        "ngaySinh": booking.ngay_sinh,
        "soCccd": booking.so_cccd,
        "thuongTru": booking.thuong_tru,
        "ngayCap": booking.ngay_cap,
        "noiCap": booking.noi_cap
        # Account credentials removed, will be sent during handover
    }
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://n8n:5678/webhook/tao-hop-dong", json=webhook_payload, timeout=8.0)
    except Exception as e:
        print(f"Failed to trigger n8n webhook: {e}")

    return {
        "message": "Duyệt thành công. Hợp đồng và Tài khoản đã được tạo.",
        "tenant_id": new_tenant.id,
        "contract_id": new_contract.id,
        "email_sent_to": booking.email
    }
