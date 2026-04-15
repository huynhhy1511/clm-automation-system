from payos import AsyncPayOS
from app.core.config import settings

# Chỉ khởi tạo nếu đã điền đủ thông tin xác thực
if settings.PAYOS_CLIENT_ID and settings.PAYOS_API_KEY and settings.PAYOS_CHECKSUM_KEY:
    payos = AsyncPayOS(
        client_id=settings.PAYOS_CLIENT_ID,
        api_key=settings.PAYOS_API_KEY,
        checksum_key=settings.PAYOS_CHECKSUM_KEY
    )
else:
    payos = None
    print("WARNING: PayOS credentials missing. Payment features will be disabled.")
