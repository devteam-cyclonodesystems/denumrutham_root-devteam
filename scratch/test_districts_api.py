import asyncio
import os
import sys

sys.path.append("c:/Denumrutham/backend")
os.environ["DATABASE_URL"] = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"

from app.main import app
from httpx import AsyncClient, ASGITransport

async def run():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        print("=== Querying /api/v1/public/directory/states ===")
        res = await ac.get("/api/v1/public/directory/states")
        print("States response:", res.status_code, res.json())
        
        print("\n=== Querying /api/v1/public/directory/states/Kerala/districts ===")
        res = await ac.get("/api/v1/public/directory/states/Kerala/districts")
        print("Districts response:", res.status_code, res.json())
        
        print("\n=== Querying /api/v1/public/temples?state=Kerala ===")
        res = await ac.get("/api/v1/public/temples", params={"state": "Kerala"})
        print("Temples response status:", res.status_code)
        if res.status_code == 200:
            print("Temples count:", len(res.json()))
            for t in res.json():
                print(f"  - {t['name']} ({t['district']})")

if __name__ == "__main__":
    asyncio.run(run())
