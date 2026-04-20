import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

N8N_WEBHOOK_URL_INCIDENT = "https://skewed-privatize-igloo.ngrok-free.dev/webhook/bao-cao-su-co"

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
        mo_ta=incident.mo_ta,
        anh_su_co=incident.anh_su_co
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)

    room_res = await db.execute(select(models.Room).where(models.Room.id == contract.room_id))
    room = room_res.scalar_one_or_none()

    if room:
        payload = {
            "incident_id": new_incident.id,
            "room_id": room.ma_phong,
            "user_name": tenant.ho_ten,
            "description": incident.mo_ta,
            "image_url": incident.anh_su_co[0] if incident.anh_su_co else None
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
    current_user=Depends(get_current_user)
):
    # If user is admin, return all incidents
    if current_user.role == "admin":
        res = await db.execute(select(models.Incident).order_by(models.Incident.ngay_bao_cao.desc()))
        return res.scalars().all()

    # If user is a tenant, find their tenant profile
    tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.user_id == current_user.id))
    tenant = tenant_res.scalar_one_or_none()

    # If no tenant profile, they have no incidents
    if not tenant:
        return []

    # Return incidents for the specific tenant
    res = await db.execute(
        select(models.Incident)
        .where(models.Incident.tenant_id == tenant.id)
        .order_by(models.Incident.ngay_bao_cao.desc())
    )
    return res.scalars().all()

@router.patch("/{incident_id}/status", response_model=schemas.IncidentResponse)
async def update_incident_status(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    res = await db.execute(select(models.Incident).where(models.Incident.id == incident_id))
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.trang_thai = "Đã xử lý" if incident.trang_thai == "Đã tiếp nhận" else "Đã tiếp nhận"
    await db.commit()
    await db.refresh(incident)
    return incident

@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    res = await db.execute(select(models.Incident).where(models.Incident.id == incident_id))
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    await db.delete(incident)
    await db.commit()
    return {"success": True, "message": "Incident deleted"}