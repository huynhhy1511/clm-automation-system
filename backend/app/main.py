from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import health

app = FastAPI(
    title="CLM Automation Backend",
    description="FastAPI Backend for CLM Automation",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, change in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Backend"}
