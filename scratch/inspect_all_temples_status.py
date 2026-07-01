import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            query = text("SELECT id, name, is_active, status, directory_status, state, district, state_id, district_id FROM temples;")
            res = await conn.execute(query)
            rows = res.fetchall()
            print(f"{'Name':<35} | {'Active':<6} | {'Status':<10} | {'DirStatus':<10} | {'District':<15} | {'DistrictID':<10}")
            print("-" * 105)
            for row in rows:
                dist_id_str = str(row.district_id)[:8] + "..." if row.district_id else "None"
                print(f"{row.name[:35]:<35} | {str(row.is_active):<6} | {row.status:<10} | {row.directory_status:<10} | {str(row.district):<15} | {dist_id_str:<10}")
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
