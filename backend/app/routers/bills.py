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

N8N_WEBHOOK_URL_BILLS = "http://n8n:5678/webhook/chot-dien-nuoc"

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
