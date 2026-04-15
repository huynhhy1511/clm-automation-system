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
                logger.warning(f"No contract found with payos_order_code: {numeric_order_code}")
        
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
