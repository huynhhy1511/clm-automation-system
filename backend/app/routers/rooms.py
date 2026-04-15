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

from app.services.handover_service import perform_handover

@router.post("/{room_id}/handover")
async def room_handover(
    room_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_admin=Depends(get_current_admin)
):
    # Find the pending contract for this room
    res = await db.execute(
        select(models.Contract).where(
            models.Contract.room_id == room_id,
            models.Contract.trang_thai == "Chờ bàn giao"
        )
    )
    contract = res.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng đang chờ bàn giao cho phòng này")

    success = await perform_handover(db, contract.id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Quy trình bàn giao thất bại")

    return {"message": "Bàn giao thành công! Đã gửi thông tin cho khách hàng."}

