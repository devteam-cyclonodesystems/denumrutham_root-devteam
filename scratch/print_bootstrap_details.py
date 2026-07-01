import asyncio
import os
import sys
import json

# Set the DATABASE_URL environment variable to production database
os.environ["DATABASE_URL"] = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

sys.path.append("c:/Denumrutham/backend")
from app.main import app
from httpx import AsyncClient, ASGITransport

async def run():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        slug = "malottu-sree-bhadrakali-temple"
        print(f"=== Fetching bootstrap for: {slug} ===")
        res = await ac.get(f"/api/v1/public/temples/{slug}/bootstrap")
        print("Status Code:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            print("--- Feature Visibility ---")
            print(json.dumps(data.get("featureVisibility"), indent=2))
            print("\n--- Section Order ---")
            print(data.get("settings", {}).get("section_order"))
            print("\n--- Settings Toggles ---")
            settings = data.get("settings", {})
            for k in ["enable_store", "enable_hall_booking", "enable_donations", "enable_festivals", "enable_mantras"]:
                print(f" - {k}: {settings.get(k)}")
        else:
            print("Error:", res.text)

if __name__ == "__main__":
    asyncio.run(run())
