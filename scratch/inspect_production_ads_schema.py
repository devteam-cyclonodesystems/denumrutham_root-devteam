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
            
            # 2. Check check constraints on platform_advertisements
            res = await conn.execute(text("""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE conrelid = 'platform_advertisements'::regclass AND contype = 'c';
            """))
            print("=== check constraints on platform_advertisements ===")
            for row in res.fetchall():
                print(f"- {row[0]}: {row[1]}")
            print()

            # 3. Check check constraints on temple_advertisements
            res = await conn.execute(text("""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE conrelid = 'temple_advertisements'::regclass AND contype = 'c';
            """))
            print("=== check constraints on temple_advertisements ===")
            for row in res.fetchall():
                print(f"- {row[0]}: {row[1]}")
            print()

        except Exception as e:
            print("Error inspecting database:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
