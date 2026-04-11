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

