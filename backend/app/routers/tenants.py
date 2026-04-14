from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import schemas, models
from app.database import get_db
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("/", response_model=list[schemas.TenantResponse])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    res = await db.execute(select(models.Tenant))
    return res.scalars().all()
