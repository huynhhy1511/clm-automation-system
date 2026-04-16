from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://admin:adminpassword@postgres:5432/clm_system_db"
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_DEMO_CHANGE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    PAYOS_CLIENT_ID: str = ""
    PAYOS_API_KEY: str = ""
    PAYOS_CHECKSUM_KEY: str = ""
    
    # Back-off/Return urls for PayOS
    PAYOS_RETURN_URL: str = "http://localhost:3000/payment-success"
    PAYOS_CANCEL_URL: str = "http://localhost:3000/payment-cancel"

    class Config:
        env_file = ".env"

settings = Settings()
