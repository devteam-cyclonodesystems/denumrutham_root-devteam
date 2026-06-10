import asyncio
import os
import httpx
from httpx import AsyncClient, ASGITransport
import json

async def run():
    # Set the DATABASE_URL environment variable to the production database so the app can start successfully
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    
    import sys
    sys.path.append("c:/Denumrutham/backend")
    from app.main import app
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        for slug in ["malottu-sree-bhadrkali-temple", "malottu-sree-bhadrakali-temple"]:
            print(f"\n=== Querying slug: {slug} ===")
            try:
                res = await ac.get(f"/api/v1/public/temples/{slug}/bootstrap")
                print("Status Code:", res.status_code)
                if res.status_code == 200:
                    data = res.json()
                    print("Keys in response:", list(data.keys()))
                else:
                    print("Error response status:", res.status_code)
                    print("Error response text:", res.text)
            except Exception as e:
                print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(run())
