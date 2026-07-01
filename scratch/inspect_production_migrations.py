import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            # 1. Fetch applied migrations
            res = await conn.execute(text("SELECT version_num FROM alembic_version;"))
            versions = [row[0] for row in res.fetchall()]
            print("=== Applied Alembic Versions ===")
            print(versions)
            print()
            
            # 2. Check if state_master table exists and schema of temples
            res = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in res.fetchall()]
            print("=== Existing Tables ===")
            print(tables)
            print()
            
            # 3. Check columns in temples table
            res = await conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'temples' AND table_schema = 'public';
            """))
            print("=== Columns in 'temples' ===")
            for row in res.fetchall():
                print(f"- {row[0]} ({row[1]})")
            print()

            # 4. Check columns in temple_profiles table
            res = await conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'temple_profiles' AND table_schema = 'public';
            """))
            print("=== Columns in 'temple_profiles' ===")
            for row in res.fetchall():
                print(f"- {row[0]} ({row[1]})")
            print()

        except Exception as e:
            print("Error inspecting database:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
