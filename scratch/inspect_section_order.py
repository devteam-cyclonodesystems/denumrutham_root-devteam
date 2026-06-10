import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            # Get temple
            temple_res = await conn.execute(text("SELECT id FROM temples WHERE domain LIKE 'malottu%';"))
            temple_id = temple_res.scalar()
            
            # Query draft settings
            draft_res = await conn.execute(text(f"SELECT section_order, feature_visibility FROM temple_website_settings WHERE temple_id = '{temple_id}';"))
            draft_row = draft_res.fetchone()
            print("\n--- Draft Section Order & Feature Visibility ---")
            if draft_row:
                print("Draft Section Order:", draft_row[0])
                print("Draft Feature Visibility:", draft_row[1])
            else:
                print("No draft settings found.")

            # Query live settings
            live_res = await conn.execute(text(f"SELECT settings_snapshot FROM temple_website_settings_live WHERE temple_id = '{temple_id}';"))
            live_row = live_res.fetchone()
            print("\n--- Live Section Order & Feature Visibility ---")
            if live_row:
                snapshot = live_row[0]
                print("Live Section Order:", snapshot.get("section_order"))
                print("Live Feature Visibility:", snapshot.get("featureVisibility"))
                print("Live Enable Store:", snapshot.get("enable_store"))
                print("Live Enable Hall Booking:", snapshot.get("enable_hall_booking"))
            else:
                print("No live settings found.")

        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
