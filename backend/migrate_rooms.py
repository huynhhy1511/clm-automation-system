import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Altering rooms table...")
        try:
            await conn.execute(text("ALTER TABLE rooms ADD COLUMN mo_ta TEXT;"))
        except Exception as e:
            print(f"Error adding mo_ta: {e}")
        try:
            await conn.execute(text("ALTER TABLE rooms ADD COLUMN anh_phong JSON;"))
        except Exception as e:
            print(f"Error adding anh_phong: {e}")
    print("Done")

if __name__ == "__main__":
    asyncio.run(migrate())
