import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            res = await conn.execute(text("SELECT resource_key, description FROM permissions WHERE resource_key LIKE 'website%' OR resource_key LIKE 'festivals%' ORDER BY resource_key;"))
            for row in res.fetchall():
                print(f"Key: {row[0]}, Desc: {row[1]}")
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
