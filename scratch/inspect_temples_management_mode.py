import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            res = await conn.execute(text("SELECT id, name, domain, management_mode FROM temples;"))
            print("=== Temples Management Modes ===")
            for row in res.fetchall():
                print(f"ID: {row[0]}, Name: {row[1]}, Domain: {row[2]}, Mode: {row[3]}")
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
