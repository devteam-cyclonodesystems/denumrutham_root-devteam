import asyncio
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, email, role, is_active FROM users;"))
        for row in res.fetchall():
            print(f"ID: {row[0]} | Email: {row[1]} | Role: {row[2]} | Active: {row[3]}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
