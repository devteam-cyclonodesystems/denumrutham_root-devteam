import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            query = text("SELECT id, name, is_active, status, directory_status, state_id, district_id FROM temples WHERE name ILIKE '%sabarimala%';")
            res = await conn.execute(query)
            for row in res.fetchall():
                print(f"Name: {row.name}")
                print(f"  IsActive: {row.is_active}")
                print(f"  Status: {row.status}")
                print(f"  DirStatus: {row.directory_status}")
                print(f"  StateID: {row.state_id}")
                print(f"  DistrictID: {row.district_id}")
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
