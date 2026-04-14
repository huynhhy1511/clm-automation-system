import httpx
import secrets
import string
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.core import security
from app.api.deps import get_current_admin

router = APIRouter()

N8N_WEBHOOK_URL_HANDOVER = "http://n8n:5678/webhook/ban-giao-phong"

class HandoverRequest(BaseModel):
    ho_ten: str
    email: EmailStr
    sdt: str

@router.post("/", response_model=schemas.RoomResponse)
async def create_room(room: schemas.RoomCreate, db: AsyncSession = Depends(get_db)):
    new_room = models.Room(**room.model_dump())
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    return new_room

@router.get("/", response_model=list[schemas.RoomResponse])
async def list_rooms(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.Room))
    return res.scalars().all()

@router.post("/{room_id}/handover")
async def room_handover(
    room_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_admin=Depends(get_current_admin)
):
    room_res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = room_res.scalar_one_or_none()
    if not room or room.trang_thai != "Đã cọc":
        raise HTTPException(status_code=400, detail="Room is not in Đã cọc status")

    # 1. Look for pending contract
    contract_res = await db.execute(
        select(models.Contract).where(
            models.Contract.room_id == room_id,
            models.Contract.trang_thai == "Chờ bàn giao"
        )
    )
    contract = contract_res.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=400, detail="No pending contract found for this room")

    # 2. Get Tenant
    tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.id == contract.tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=400, detail="Tenant data missing")

    # 3. Create User Account for Tenant
    # if user already exists
    if tenant.user_id:
        raise HTTPException(status_code=400, detail="Tenant already has an account")

    user_res = await db.execute(select(models.User).where(models.User.email == tenant.email))
    if user_res.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Email already registered in Users")

    raw_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(6))
    new_user = models.User(
        email=tenant.email,
        hashed_password=security.get_password_hash(raw_password),
        role="tenant"
    )
    db.add(new_user)
    await db.flush() # flush to get ID
    
    tenant.user_id = new_user.id
    
    # 4. Update Room and Contract Status
    room.trang_thai = "Đang thuê"
    contract.trang_thai = "Hiệu lực"
    await db.commit()

    # 5. Fire Webhook to Workflow 2
    webhook_payload = {
        "email": tenant.email,
        "hoTen": tenant.ho_ten,
        "phong": room.ma_phong,
        "sdt": tenant.sdt,
        "cccdTruoc": tenant.cccd_truoc,
        "cccdSau": tenant.cccd_sau,
        "pdfBase64": contract.pdf_data, # Use the string stored in DB
        "matKhau": raw_password,
        "tenDangNhap": tenant.email,
        "trangThai": "Đã bàn giao",
        "khachId": new_user.id
    }
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(N8N_WEBHOOK_URL_HANDOVER, json={"body": webhook_payload}, timeout=8.0)
    except Exception as e:
        print(f"Webhook ban-giao-phong failed: {e}")

    return {"message": "Handover successful! Webhook fired.", "user_id": new_user.id}

