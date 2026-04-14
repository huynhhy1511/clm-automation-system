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

# --- UTILITY BILL SCHEMAS --- #
class UtilityBillBase(BaseModel):
    room_id: int
    thang_nam: str
    chi_so_dien_cu: float = 0
    chi_so_dien_moi: float = 0
    chi_so_nuoc_cu: float = 0
    chi_so_nuoc_moi: float = 0
    tong_tien: float

class UtilityBillCreate(UtilityBillBase):
    pass

class UtilityBillResponse(UtilityBillBase):
    id: int
    trang_thai: str
    anh_bill: Optional[str] = None
    pdf_link: Optional[str] = None
    qr_url: Optional[str] = None
    so_nguoi: Optional[int] = 1 # Thêm so_nguoi

    class Config:
        from_attributes = True

# --- NEW BILLING SCHEMAS --- #
class ActiveRoomBillingResponse(BaseModel):
    room_id: int
    ma_phong: str
    tenant_name: str
    tenant_email: str
    so_nguoi: int
    room_price: float
    prev_electricity: float
    prev_water: float

class InvoiceSaveRequest(BaseModel):
    phong: str
    thang_nam: str
    chi_so_dien_cu: float
    chi_so_dien_moi: float
    chi_so_nuoc_cu: float
    chi_so_nuoc_moi: float
    tong_tien: float
    pdf_base64: Optional[str] = None
    qr_url: Optional[str] = None

# --- INCIDENT SCHEMAS --- #
class IncidentBase(BaseModel):
    loai_su_co: str
    muc_do_khan_cap: str
    mo_ta: str

class IncidentCreate(IncidentBase):
    room_id: int

class IncidentClientCreate(IncidentBase):
    pass # Tenant ID and Room ID are inferred from JWT

class IncidentResponse(IncidentBase):
    id: int
    room_id: int
    tenant_id: int
    ngay_bao_cao: datetime
    trang_thai: str

    class Config:
        from_attributes = True

# --- BOOKING REQUEST SCHEMAS --- #
class BookingRequestBase(BaseModel):
    ho_ten: str
    ngay_sinh: str
    so_cccd: str
    thuong_tru: str
    ngay_cap: str
    noi_cap: str
    sdt: str
    email: EmailStr
    anh_khuon_mat: str
    cccd_truoc: str
    cccd_sau: str
    room_id: int
    ngay_bat_dau: Optional[date] = None
    so_thang_thue: Optional[int] = 12

class BookingRequestCreate(BookingRequestBase):
    pass

class BookingRequestResponse(BookingRequestBase):
    id: int
    trang_thai: str
    ngay_tao: datetime

    class Config:
        from_attributes = True
