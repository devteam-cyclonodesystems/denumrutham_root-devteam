import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    async with engine.connect() as conn:
        print("Altering temple_suggestion_images.image_url to TEXT...")
        await conn.execute(text("ALTER TABLE temple_suggestion_images ALTER COLUMN image_url TYPE TEXT;"))
        await conn.commit()
        print("Success! Column type altered.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
