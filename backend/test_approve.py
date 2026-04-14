import asyncio
from app.database import async_session_maker
from app.models import Room, BookingRequest
from app.routers.booking_requests import approve_booking_request

async def test_it():
    async with async_session_maker() as db:
        # Create a room
        room = Room(ma_phong="TEST1", gia_thue=1000, trang_thai="Trống")
        db.add(room)
        await db.commit()
        await db.refresh(room)
        
        # Create a request
        req = BookingRequest(
            room_id=room.id,
            ho_ten="Test",
            ngay_sinh="01/01/2000",
            so_cccd="12345",
            thuong_tru="ABC",
            ngay_cap="01/01/2020",
            noi_cap="XYZ",
            sdt="123",
            email="test@example.com",
            anh_khuon_mat="img",
            cccd_truoc="img",
            cccd_sau="img",
            so_thang_thue=12
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)

        print("Testing approve on req_id:", req.id)
        try:
            res = await approve_booking_request(req.id, db, None)
            print("Success!", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test_it())
