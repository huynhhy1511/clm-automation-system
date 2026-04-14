from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_DEMO_CHANGE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    class Config:
        env_file = ".env"

settings = Settings()
