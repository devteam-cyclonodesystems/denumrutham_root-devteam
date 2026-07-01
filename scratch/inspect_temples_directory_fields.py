import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            # 1. Fetch temples list
            res = await conn.execute(text("""
                SELECT id, name, domain, is_active, status, directory_status, state, district, state_id, district_id 
                FROM temples;
            """))
            print("=== Temples in Database ===")
            for row in res.fetchall():
                print(f"Name: {row[1]}\nDomain: {row[2]}\nActive: {row[3]}, Status: {row[4]}, DirStatus: {row[5]}\nTextState: {row[6]}, TextDist: {row[7]}\nStateID: {row[8]}, DistID: {row[9]}")
                print("-" * 50)
            
            # 2. Fetch states list
            res = await conn.execute(text("SELECT id, name, slug, code FROM state_master;"))
            print("\n=== States in Database ===")
            for row in res.fetchall():
                print(f"ID: {row[0]}, Name: {row[1]}, Slug: {row[2]}, Code: {row[3]}")
            
            # 3. Fetch districts list
            res = await conn.execute(text("SELECT id, state_id, name, slug, code FROM district_master LIMIT 10;"))
            print("\n=== Districts in Database (Sample) ===")
            for row in res.fetchall():
                print(f"ID: {row[0]}, StateID: {row[1]}, Name: {row[2]}, Slug: {row[3]}, Code: {row[4]}")
                
        except Exception as e:
            print("Error inspecting database:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
