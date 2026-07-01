import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.begin() as conn:
        try:
            print("Updating Malottu Sree Bhadrakali Temple profile...")
            await conn.execute(
                text("UPDATE temple_profiles SET district = :dist WHERE temple_id = :tid"),
                {"dist": "Trivandrum", "tid": "f96f45a1-d3a3-422f-9260-abfcd8df1aaa"}
            )
            print("Updating Temple Test 1 profile...")
            await conn.execute(
                text("UPDATE temple_profiles SET district = :dist WHERE temple_id = :tid"),
                {"dist": "Trivandrum", "tid": "7788f614-fc32-40c7-82f6-1914959b2d10"}
            )
            print("Database updates committed successfully!")
        except Exception as e:
            print("Error updating database:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
