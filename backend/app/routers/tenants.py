from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.TenantResponse)
async def get_my_tenant_profile(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    res = await db.execute(select(models.Tenant).where(models.Tenant.user_id == current_user.id))
    tenant = res.scalar_one_or_none()
    return tenant

@router.get("/", response_model=list[schemas.TenantResponse])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    res = await db.execute(select(models.Tenant))
    return res.scalars().all()
