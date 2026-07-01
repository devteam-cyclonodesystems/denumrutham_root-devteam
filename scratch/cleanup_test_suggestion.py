import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    async with engine.connect() as conn:
        res = await conn.execute(text("DELETE FROM temple_suggestions WHERE name LIKE '%Test%';"))
        await conn.commit()
        print(f"Deleted {res.rowcount} test suggestions.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
