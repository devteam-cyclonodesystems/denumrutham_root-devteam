import asyncio
import os
import sys
# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from uuid import UUID
from app.core.database.database import AsyncSessionLocal
from sqlalchemy import select
from app.modules.temple_management.models.temple_models import PlatformAdvertisement, TempleAdvertisement
from app.modules.analytics.services.analytics_service import AnalyticsService

async def main():
    async with AsyncSessionLocal() as db:
        print("=== PLATFORM ADVERTISEMENTS ===")
        stmt = select(PlatformAdvertisement)
        res = await db.execute(stmt)
        platform_ads = res.scalars().all()
        for ad in platform_ads:
            print(f"ID: {ad.id} | Title: {ad.title} | Target: {ad.target_url}")

        print("\n=== TEMPLE ADVERTISEMENTS ===")
        stmt = select(TempleAdvertisement)
        res = await db.execute(stmt)
        temple_ads = res.scalars().all()
        for ad in temple_ads:
            print(f"ID: {ad.id} | Title: {ad.title} | Target: {ad.target_url}")

        print("\n=== PLATFORM REPORT DATA ===")
        report = await AnalyticsService.get_campaign_health_report(db=db, temple_id=None)
        for item in report:
            print(item)

if __name__ == "__main__":
    asyncio.run(main())
