from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# --- USER & AUTH SCHEMAS --- #
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "tenant"

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

# --- TENANT SCHEMAS --- #
class TenantBase(BaseModel):
    ho_ten: str
    ngay_sinh: Optional[str] = None
    so_cccd: Optional[str] = None
    thuong_tru: Optional[str] = None
    ngay_cap: Optional[str] = None
    noi_cap: Optional[str] = None
    sdt: Optional[str] = None
    anh_khuon_mat: Optional[str] = None
    cccd_truoc: Optional[str] = None
    cccd_sau: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantResponse(TenantBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- ROOM SCHEMAS --- #
class RoomBase(BaseModel):
    ma_phong: str
    gia_thue: float
    trang_thai: Optional[str] = "Trống"

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int

    class Config:
        from_attributes = True

# --- CONTRACT SCHEMAS --- #
class ContractBase(BaseModel):
    tenant_id: int
    room_id: int
    gia_thue_chot: float
    tien_coc: float
    ngay_bat_dau: date
    ngay_ket_thuc: date

class ContractCreate(ContractBase):
    so_nguoi: Optional[int] = 1

class ContractResponse(ContractBase):
    id: int
    trang_thai: str
    pdf_link: Optional[str] = None
    so_nguoi: int
    tenant: Optional[TenantResponse] = None
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

