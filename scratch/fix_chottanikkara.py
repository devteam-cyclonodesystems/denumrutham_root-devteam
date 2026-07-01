import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.begin() as conn:
        try:
            print("Updating Chottanikkara Bhagavathy Temple state and district...")
            query = text("""
                UPDATE temples 
                SET state = 'Kerala', district = 'Ernakulam' 
                WHERE id = '707ef36b-0998-429d-abb8-68cf73227cf5';
            """)
            await conn.execute(query)
            print("Successfully updated state and district for Chottanikkara!")
        except Exception as e:
            print("Error updating Chottanikkara:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
