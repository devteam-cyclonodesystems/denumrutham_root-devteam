import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            print("Querying columns of audit_integrity_verification_reports:")
            res = await conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'audit_integrity_verification_reports';
            """))
            for row in res.fetchall():
                print(f"Column: {row[0]}, Type: {row[1]}")

            print("\nQuerying audit_integrity_verification_reports...")
            res = await conn.execute(text("SELECT id, status, details FROM audit_integrity_verification_reports;"))
            rows = res.fetchall()
            if not rows:
                print("No startup errors logged.")
            for row in rows:
                print(f"ID: {row[0]}, Status: {row[1]}")
                print(f"Details:\n{row[2]}")
                print("-" * 50)
                
        except Exception as e:
            print("Error connecting/querying production DB:")
            print(str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
