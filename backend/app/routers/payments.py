from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app import models
from app.core.payos_provider import payos
from app.services.handover_service import perform_handover

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/payos-webhook")
async def payos_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger("uvicorn.error")
    
    try:
        body = await request.json()
        logger.info(f"PAYOS WEBHOOK RAW PAYLOAD: {body}")
        
        if payos is None:
            logger.error("PayOS service is not configured. Cannot verify webhook.")
            return {"status": "error", "message": "PayOS not configured"}
            
        try:
            # PayOS SDK throws WebhookError if verification fails
            payos.verifyPaymentWebhookData(body)
        except Exception as e:
            logger.error(f"PayOS Webhook Signature Verification Failed: {e}")
            return {"status": "error", "message": "Invalid Webhook Signature"}

        # Luôn ghi lại để debug
        with open("/tmp/payos.log", "a") as f:
            import time, json
            f.write(f"\n--- WEBHOOK RECEIVED {time.ctime()} ---\n")
            f.write(f"Body: {json.dumps(body)}\n")
            
        data = body.get("data")
        if not data:
            logger.warning("Webhook received without 'data' field (possibly a ping)")
            return {"status": "success", "message": "Webhook acknowledged"}

        # Lấy orderCode và status một cách linh hoạt
        order_code = data.get("orderCode")
        
        # Chiến thuật nhận diện trạng thái "Đã thanh toán":
        payos_status = str(data.get("status") or "").upper()
        payos_desc = str(data.get("desc") or body.get("desc") or "").lower()
        payos_code = str(data.get("code") or body.get("code") or "")
        
        is_paid = (payos_status == "PAID") or (payos_desc == "success") or (payos_code == "00")
        
        logger.info(f"Processing Order: {order_code}, IsPaid: {is_paid} (Status: {payos_status}, Desc: {payos_desc}, Code: {payos_code})")

        if is_paid:
            # Chuyển order_code sang int cho chắc chắn
            try:
                numeric_order_code = int(order_code)
            except:
                numeric_order_code = order_code

            # Tìm hợp đồng
            res = await db.execute(
                select(models.Contract).where(models.Contract.payos_order_code == numeric_order_code)
            )
            contract = res.scalar_one_or_none()
            
            if contract:
                if contract.trang_thai == "Hiệu lực":
                    logger.info(f"Contract {contract.id} is already ACTIVE. Skipping handover.")
                    return {"status": "success", "message": "Already processed"}
                    
                logger.info(f"Payment SUCCESS for Order {numeric_order_code}. Starting handover for contract {contract.id}")
                success = await perform_handover(db, contract.id)
                if success:
                    return {"status": "success", "message": "Handover completed"}
                else:
                    logger.error(f"Handover failed for contract {contract.id}")
            else:
                # TÌM TRONG HÓA ĐƠN
                bill_res = await db.execute(
                    select(models.UtilityBill).where(models.UtilityBill.payos_order_code == numeric_order_code)
                )
                bill = bill_res.scalar_one_or_none()
                if bill:
                    if bill.trang_thai == "Đã thanh toán":
                        return {"status": "success", "message": "Bill already paid"}
                    bill.trang_thai = "Đã thanh toán"
                    await db.commit()
                    
                    # Gọi webhook n8n
                    import httpx
                    try:
                        room_res = await db.execute(select(models.Room).where(models.Room.id == bill.room_id))
                        room = room_res.scalar_one_or_none()
                        
                        contract_res = await db.execute(select(models.Contract).where(models.Contract.room_id == bill.room_id).where(models.Contract.trang_thai == "Hiệu lực"))
                        current_contract = contract_res.scalars().first()
                        
                        tenant_name = "Khách Hàng"
                        user_email = ""
                        if current_contract:
                            tenant_res = await db.execute(select(models.Tenant).where(models.Tenant.id == current_contract.tenant_id))
                            tenant = tenant_res.scalar_one_or_none()
                            if tenant:
                                tenant_name = tenant.ho_ten
                                user_res = await db.execute(select(models.User).where(models.User.id == tenant.user_id))
                                usr = user_res.scalar_one_or_none()
                                if usr:
                                    user_email = usr.email
                        
                        thang = bill.thang_nam.split('/')[0] if '/' in bill.thang_nam else bill.thang_nam
                        nam = bill.thang_nam.split('/')[1] if '/' in bill.thang_nam else "2026"
                        
                        payload = {
                            "phong": room.ma_phong if room else "",
                            "thang": thang,
                            "nam": nam,
                            "hoTen": tenant_name,
                            "email": user_email,
                            "tienDienFormatted": f"{bill.chi_so_dien_moi - bill.chi_so_dien_cu:,.0f} kWh",
                            "tienNuocFormatted": f"{bill.chi_so_nuoc_moi - bill.chi_so_nuoc_cu:,.0f} m3/ng",
                            "tienDichVuFormatted": "Thu chung",
                            "tienPhongFormatted": "Thu chung",
                            "tongTienFormatted": f"{bill.tong_tien:,.0f}".replace(",", ".")
                        }
                        async with httpx.AsyncClient() as client:
                            await client.post("http://n8n:5678/webhook/xac-nhan-hoa-don", json=payload, timeout=10.0)
                    except Exception as e:
                        logger.error(f"Failed to call n8n webhook: {e}")
                    
                    return {"status": "success", "message": "Bill marked as paid and webhook triggered"}
                    
                logger.warning(f"No contract or bill found with payos_order_code: {numeric_order_code}")
        
        return {"status": "success", "message": "Webhook processed"}
        
    except Exception as e:
        logger.error(f"WEBHOOK ERROR: {str(e)}")
        return {"status": "error", "message": str(e)}

# Add an endpoint to manually check status (optional)
@router.get("/check-status/{order_code}")
async def check_payment_status(order_code: int, db: AsyncSession = Depends(get_db)):
    if payos is None:
        raise HTTPException(status_code=503, detail="PayOS service is not configured")
    try:
        payment_info = await payos.getPaymentLinkInformation(order_code)
        if payment_info.status == "PAID":
            res = await db.execute(
                select(models.Contract).where(models.Contract.payos_order_code == order_code)
            )
            contract = res.scalar_one_or_none()
            if contract and contract.trang_thai != "Hiệu lực":
                await perform_handover(db, contract.id)
                return {"status": "PAID", "message": "Handover triggered"}
        return {"status": payment_info.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
