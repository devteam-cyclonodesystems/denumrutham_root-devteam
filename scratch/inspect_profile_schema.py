import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_Zwt1jpEPrWd7@ep-curly-shape-aow2jmi7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    async with engine.connect() as conn:
        print("Columns in temple_profile_drafts:")
        res = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'temple_profile_drafts';
        """))
        for row in res.fetchall():
            print(f"  {row[0]}: {row[1]}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
