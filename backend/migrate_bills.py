import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://admin:adminpassword@postgres:5432/clm_system_db")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL)

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE utility_bills ADD COLUMN payos_order_code BIGINT UNIQUE;"))
            print("Successfully added payos_order_code to utility_bills.")
        except Exception as e:
            print(f"Migration error (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(main())
