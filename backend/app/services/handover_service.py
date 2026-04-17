import httpx
import secrets
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models
from app.core import security

N8N_WEBHOOK_URL_HANDOVER = "http://n8n:5678/webhook/ban-giao-phong"

async def perform_handover(db: AsyncSession, contract_id: int):
    # 1. Fetch Contract
    contract_res = await db.execute(select(models.Contract).where(models.Contract.id == contract_id))
    contract = contract_res.scalar_one_or_none()
    if not contract:
        print(f"Handover failed: Contract {contract_id} not found")
        return False

    if contract.trang_thai == "Hiệu lực":
        print(f"Handover skipped: Contract {contract_id} already active")
        return True

    # 2. Fetch Room
    room = await db.get(models.Room, contract.room_id)
    if not room:
        print(f"Handover failed: Room {contract.room_id} not found")
        return False

    # 3. Fetch Tenant
    tenant = await db.get(models.Tenant, contract.tenant_id)
    if not tenant:
        print(f"Handover failed: Tenant {contract.tenant_id} not found")
        return False

    # 4. Create User Account for Tenant
    raw_password = ""
    new_user_id = None
    
    if not tenant.user_id:
        # Check if email already used
        user_res = await db.execute(select(models.User).where(models.User.email == tenant.email))
        existing_user = user_res.scalar_one_or_none()
        
        if existing_user:
            # Re-link existing user if found (safety measure)
            tenant.user_id = existing_user.id
            new_user_id = existing_user.id
            # We don't have the password, maybe send a reset link? 
            # For now, let's assume it's a new flow and we generate one.
            raw_password = "Vui lòng đăng nhập bằng tài khoản cũ của bạn" 
        else:
            raw_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(8))
            new_user = models.User(
                email=tenant.email,
                hashed_password=security.get_password_hash(raw_password),
                role="tenant"
            )
            db.add(new_user)
            await db.flush()
            tenant.user_id = new_user.id
            new_user_id = new_user.id
    else:
        new_user_id = tenant.user_id
        raw_password = "(Tài khoản đã được cấp trước đó)"

    # 5. Update Room and Contract Status
    room.trang_thai = "Đang thuê"
    contract.trang_thai = "Hiệu lực"
    await db.commit()

    # 6. Fire Webhook to Workflow 2 (Bàn giao)
    webhook_payload = {
        "email": tenant.email,
        "hoTen": tenant.ho_ten,
        "phong": room.ma_phong,
        "sdt": tenant.sdt,
        "cccdTruoc": tenant.cccd_truoc,
        "cccdSau": tenant.cccd_sau,
        "pdfBase64": contract.pdf_data,
        "matKhau": raw_password,
        "tenDangNhap": tenant.email,
        "trangThai": "Hiệu lực",
        "khachId": new_user_id
    }
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(N8N_WEBHOOK_URL_HANDOVER, json={"body": webhook_payload}, timeout=10.0)
            print(f"Handover webhook fired for contract {contract_id}")
    except Exception as e:
        print(f"Webhook ban-giao-phong failed for contract {contract_id}: {e}")

    return True
