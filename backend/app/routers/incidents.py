import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

N8N_WEBHOOK_URL_INCIDENT = "http://n8n:5678/webhook/bao-cao-su-co"

@router.post("/", response_model=schemas.IncidentResponse)
async def create_incident(
    incident: schemas.IncidentClientCreate, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Auto figure out tenant_id and room_id
    tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.user_id == current_user.id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=400, detail="Tenant profile not found")

    contract_res = await db.execute(select(models.Contract).where(models.Contract.tenant_id == tenant.id))
    contract = contract_res.scalars().first()
    if not contract:
        raise HTTPException(status_code=400, detail="No active contract found")

    new_incident = models.Incident(
        tenant_id=tenant.id,
        room_id=contract.room_id,
        loai_su_co=incident.loai_su_co,
        muc_do_khan_cap=incident.muc_do_khan_cap,
        mo_ta=incident.mo_ta
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)

    room_res = await db.execute(select(models.Room).where(models.Room.id == contract.room_id))
    room = room_res.scalar_one_or_none()

    if room:
        payload = {
            "hoTen": tenant.ho_ten,
            "phong": room.ma_phong,
            "loaiSuCo": incident.loai_su_co,
            "mucDoKhẩnCap": incident.muc_do_khan_cap,
            "moTa": incident.mo_ta
        }
        async with httpx.AsyncClient() as client:
            try:
                await client.post(N8N_WEBHOOK_URL_INCIDENT, json=payload)
            except Exception as e:
                print(f"Webhook failed: {e}")
                
    return new_incident

@router.get("/", response_model=list[schemas.IncidentResponse])
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
     res = await db.execute(select(models.Incident))
     return res.scalars().all()
