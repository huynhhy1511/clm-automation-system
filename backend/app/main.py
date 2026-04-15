from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.endpoints import health
from app.database import engine
from app import models
import os
from fastapi.staticfiles import StaticFiles

# Import các routers mới
from app.routers import auth, contracts, rooms, bills, incidents, tenants, booking_requests, payments

from fastapi.exceptions import RequestValidationError
from fastapi import Request
from fastapi.responses import JSONResponse

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body = await request.body()
        print(f"422 ERROR Body: {body[:500]}...") 
    except Exception:
        pass
    print("422 DETAILS:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@asynccontextmanager
def lifespan(app: FastAPI):
    pass # this part is unchanged. Wait, I must just do an exact string replace.

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables in the database
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield

app = FastAPI(
    title="CoachPro Mngt - Property Management SaaS",
    description="Backend cung cấp API và kết nối chặt chẽ Webhook sang n8n",
    version="2.0.0",
    lifespan=lifespan,
)
# Đảm bảo thư mục static tồn tại để chứa PDF hóa đơn
# Lưu ý: Nếu dùng Docker, hãy mount volume cho folder này trong docker-compose.yml
STATIC_DIR = "static/invoices"
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# API Routers đăng ký
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(bills.router, prefix="/api/bills", tags=["bills"])
app.include_router(incidents.router, prefix="/api/client/incidents", tags=["client_incidents"])
app.include_router(tenants.router, prefix="/api/tenants", tags=["tenants"])
app.include_router(booking_requests.router, prefix="/api")
app.include_router(payments.router, prefix="/api", tags=["payments"])

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Backend - Property Management Ecosystem"}
