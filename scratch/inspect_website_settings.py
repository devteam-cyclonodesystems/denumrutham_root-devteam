import asyncio
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            # First, find the temple ID and slug
            temple_res = await conn.execute(text("SELECT id, name, domain FROM temples WHERE domain LIKE 'malottu%';"))
            temple_rows = temple_res.fetchall()
            print("--- Temples ---")
            temple_id = None
            for row in temple_rows:
                print(f"ID: {row[0]}, Name: {row[1]}, Domain: {row[2]}")
                temple_id = row[0]
            
            if not temple_id:
                print("Malottu temple not found.")
                return
            
            # Query draft settings
            draft_res = await conn.execute(text(f"SELECT timings_settings, daily_activities_settings, feature_visibility FROM temple_website_settings WHERE temple_id = '{temple_id}';"))
            draft_row = draft_res.fetchone()
            print("\n--- Draft Settings ---")
            if draft_row:
                print("Timings Settings:", draft_row[0])
                print("Daily Activities:", draft_row[1])
                print("Feature Visibility:", draft_row[2])
            else:
                print("No draft settings found.")

            # Query live settings
            live_res = await conn.execute(text(f"SELECT settings_snapshot, published_at FROM temple_website_settings_live WHERE temple_id = '{temple_id}';"))
            live_row = live_res.fetchone()
            print("\n--- Live Settings ---")
            if live_row:
                print("Published At:", live_row[1])
                print("Settings Snapshot (keys):", list(live_row[0].keys()))
                print("Snapshot Timings Settings:", live_row[0].get("timings_settings"))
                print("Snapshot Daily Activities Settings:", live_row[0].get("daily_activities_settings"))
                print("Snapshot Feature Visibility:", live_row[0].get("featureVisibility"))
            else:
                print("No live settings found.")

        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
