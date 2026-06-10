import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            # Get list of tables
            res = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            rows = res.fetchall()
            print("--- Production Tables ---")
            for row in rows:
                print(row[0])
                
            # Get alembic version
            res_version = await conn.execute(text("SELECT version_num FROM alembic_version;"))
            row_version = res_version.fetchone()
            print("\n--- Alembic Version ---")
            if row_version:
                print("Alembic Version in Prod:", row_version[0])
            else:
                print("No Alembic Version found.")
                
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
