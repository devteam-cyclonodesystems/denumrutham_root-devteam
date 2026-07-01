import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.begin() as conn:
        try:
            print("Updating all temples to DIRECTORY_ONLY so they can be claimed in the frontend...")
            res = await conn.execute(text("UPDATE temples SET management_mode = 'DIRECTORY_ONLY';"))
            print(f"Updated {res.rowcount} temples successfully!")
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
