from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# 0. Bảng Người dùng (Users - Authentication)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="tenant", nullable=False) # admin, tenant

    tenant_profile = relationship("Tenant", back_populates="user", uselist=False)

# 1. Bảng Khách Thuê (Tenants)
class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True) # Liên kết 1-1 với User
    ho_ten = Column(String(100), nullable=False)
    ngay_sinh = Column(String(20), nullable=True)
    so_cccd = Column(String(20), nullable=True)
    thuong_tru = Column(String(255), nullable=True)
    ngay_cap = Column(String(20), nullable=True)
    noi_cap = Column(String(100), nullable=True)
    sdt = Column(String(15), nullable=True)
    email = Column(String(100), nullable=True)
    anh_khuon_mat = Column(Text, nullable=True)
    cccd_truoc = Column(Text, nullable=True)
    cccd_sau = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="tenant_profile")
    contracts = relationship("Contract", back_populates="tenant")
    incidents = relationship("Incident", back_populates="tenant")

# 2. Bảng Phòng (Rooms)
class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    ma_phong = Column(String(20), unique=True, index=True, nullable=False)
    gia_thue = Column(Float, nullable=False) # Đã đổi gia_thue_co_ban -> gia_thue
    trang_thai = Column(String(50), default="Trống") # Trống, Đang thuê, Đang sửa chữa
    
    contracts = relationship("Contract", back_populates="room")
    bills = relationship("UtilityBill", back_populates="room")
    incidents = relationship("Incident", back_populates="room")
    booking_requests = relationship("BookingRequest", back_populates="room")

# 3. Bảng Hợp Đồng (Contracts)
class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    gia_thue_chot = Column(Float, nullable=False)
    tien_coc = Column(Float, nullable=False)
    ngay_bat_dau = Column(Date, nullable=False)
    ngay_ket_thuc = Column(Date, nullable=False)
    trang_thai = Column(String(50), default="Chờ bàn giao") # Chờ bàn giao, Đã bàn giao, Đã thanh lý
    pdf_link = Column(String(255), nullable=True)
    pdf_data = Column(Text, nullable=True)
    so_nguoi = Column(Integer, default=1, nullable=False) # Thêm số người để tính tiền nước
    
    tenant = relationship("Tenant", back_populates="contracts")
    room = relationship("Room", back_populates="contracts")

# 4. Bảng Hóa Đơn (UtilityBills)
class UtilityBill(Base):
    __tablename__ = "utility_bills"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    thang_nam = Column(String(50), nullable=False) # VD: 10/2023 hoặc Tháng 04, 2026
    chi_so_dien_cu = Column(Float, default=0)
    chi_so_dien_moi = Column(Float, default=0)
    chi_so_nuoc_cu = Column(Float, default=0)
    chi_so_nuoc_moi = Column(Float, default=0)
    tong_tien = Column(Float, nullable=False)
    trang_thai = Column(String(50), default="Chưa thanh toán") # Chưa thanh toán, Đã thanh toán
    anh_bill = Column(Text, nullable=True) # UNC thanh toán từ tenant
    pdf_link = Column(String(255), nullable=True)
    qr_url = Column(Text, nullable=True)
    
    room = relationship("Room", back_populates="bills")

# 5. Bảng Sự cố (Incidents)
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    loai_su_co = Column(String(100), nullable=False)
    muc_do_khan_cap = Column(String(50), nullable=False) # Bình thường, Khẩn cấp
    mo_ta = Column(Text, nullable=False)
    ngay_bao_cao = Column(DateTime, default=datetime.utcnow)
    trang_thai = Column(String(50), default="Đã tiếp nhận") 
    
    room = relationship("Room", back_populates="incidents")
    tenant = relationship("Tenant", back_populates="incidents")

# 6. Bảng Yêu cầu Khách lạ Đặt phòng (BookingRequest)
class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    ho_ten = Column(String(100), nullable=False)
    ngay_sinh = Column(String(20), nullable=False)
    so_cccd = Column(String(20), nullable=False)
    thuong_tru = Column(String(255), nullable=False)
    ngay_cap = Column(String(20), nullable=False)
    noi_cap = Column(String(100), nullable=False)
    sdt = Column(String(15), nullable=False)
    email = Column(String(100), nullable=False)
    anh_khuon_mat = Column(Text, nullable=False) # Base64 Image
    cccd_truoc = Column(Text, nullable=False) # Base64 Image
    cccd_sau = Column(Text, nullable=False) # Base64 Image
    ngay_bat_dau = Column(Date, nullable=True)  # Ngày bắt đầu thuê
    so_thang_thue = Column(Integer, default=12)  # Số tháng muốn thuê
    trang_thai = Column(String(50), default="Chờ duyệt") # Chờ duyệt, Đã duyệt, Từ chối
    ngay_tao = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="booking_requests")