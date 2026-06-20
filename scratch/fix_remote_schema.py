import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    connect_args = {"ssl": True}
    print(f"Connecting to remote database to patch schema...")
    try:
        engine = create_async_engine(url, connect_args=connect_args)
        async with engine.connect() as conn:
            await conn.execute(text("ALTER TABLE temple_followers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE"))
            await conn.commit()
            print("Successfully patched 'temple_followers' table by adding 'is_active' column.")
    except Exception as e:
        print(f"Failed to patch schema: {e}")

if __name__ == "__main__":
    asyncio.run(main())
