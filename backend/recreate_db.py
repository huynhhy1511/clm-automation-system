import asyncio
from app.database import engine
from app.models import Base

async def recreate():
    async with engine.begin() as conn:
        print("Dropping tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Done")

if __name__ == "__main__":
    asyncio.run(recreate())
