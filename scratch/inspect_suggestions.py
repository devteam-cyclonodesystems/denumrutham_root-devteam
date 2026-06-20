import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, reference_number, name, status, created_at FROM temple_suggestions;"))
        rows = res.fetchall()
        print(f"Total suggestions in DB: {len(rows)}")
        for row in rows:
            print(f"ID: {row[0]} | Ref: {row[1]} | Name: {row[2]} | Status: {row[3]} | Created: {row[4]}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
