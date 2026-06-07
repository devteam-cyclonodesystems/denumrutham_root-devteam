import asyncio
import sys
import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Set up path to import backend application packages
sys.path.append('c:/Denumrutham/backend')

from app.core.config import settings as app_settings
from app.core.database.database import Base
from app.modules.temple_management.models.temple_models import Temple, TempleWebsiteSettings, TempleAnnouncement, TempleActivity
from app.modules.temple_management.services.digital_experience_service import DigitalExperienceService

async def main():
    print("=== STARTING DIGITAL EXPERIENCE VERIFICATION ===")
    
    # Connect directly to Neon DB with SSL (matching active DB setup)
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True}, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # 1. Fetch first available temple in system
        res = await db.execute(select(Temple).limit(1))
        temple = res.scalars().first()
        if not temple:
            print("ERROR: No temples found in the database. Please seed first.")
            return
        
        temple_id = temple.id
        print(f"Using Temple: {temple.name} (ID: {temple_id})")
        
        # 2. Get or create website settings
        print("\n--- Testing: get_or_create_settings ---")
        settings_record = await DigitalExperienceService.get_or_create_settings(db, temple_id)
        print(f"Settings ID: {settings_record.id}")
        print(f"Active Theme: {settings_record.theme_name}")
        print(f"Colors: Primary={settings_record.primary_color}, Secondary={settings_record.secondary_color}")
        print(f"Section Order: {settings_record.section_order}")
        
        # 3. Update website settings
        print("\n--- Testing: update_settings ---")
        update_data = {
            "theme_name": "sunset",
            "primary_color": "#ff6600",
            "secondary_color": "#ffcc00",
            "hero_title": "Divine Abode of Bhagavathi",
            "hero_subtitle": "Experience peace in the sacred kasargod hills",
            "enable_donations": True,
            "section_order": ["hero", "announcements", "activities", "contact"]
        }
        updated_settings = await DigitalExperienceService.update_settings(db, temple_id, update_data, temple.created_by, "TEMPLE_MANAGER")
        print(f"Updated Theme: {updated_settings.theme_name}")
        print(f"Updated Hero Title: {updated_settings.hero_title}")
        print(f"Updated Section Order: {updated_settings.section_order}")
        
        # 4. Create an announcement
        print("\n--- Testing: create_announcement ---")
        ann_data = {
            "title": "Solar Eclipse Darshan Hours",
            "content": "Special deeparadhana schedules during upcoming eclipse phase.",
            "is_active": True,
            "is_pinned": True,
            "priority": 1,
            "display_order": 0
        }
        new_ann = await DigitalExperienceService.create_announcement(db, temple_id, ann_data, temple.created_by, "TEMPLE_MANAGER")
        print(f"Created Announcement ID: {new_ann.id}")
        print(f"Announcement Title: {new_ann.title}")
        print(f"Pinned: {new_ann.is_pinned}")
        
        # 5. List announcements
        print("\n--- Testing: get_announcements ---")
        all_anns = await DigitalExperienceService.list_announcements(db, temple_id)
        print(f"Fetched {len(all_anns)} announcements total.")
        
        # 6. Create activity
        print("\n--- Testing: create_activity ---")
        act_data = {
            "title": "Maha Ganapathi Homam",
            "description": "Obstacle clearing morning sacrificial ritual.",
            "activity_date": datetime.date(2026, 6, 15),
            "start_time": datetime.time(5, 0),
            "end_time": datetime.time(7, 30),
            "location": "Homakkunda Mandapam",
            "is_active": True,
            "status": "UPCOMING"
        }
        new_act = await DigitalExperienceService.create_activity(db, temple_id, act_data, temple.created_by, "TEMPLE_MANAGER")
        print(f"Created Activity ID: {new_act.id}")
        print(f"Activity Title: {new_act.title}")
        
        # 7. List activities
        print("\n--- Testing: get_activities ---")
        all_acts = await DigitalExperienceService.list_activities(db, temple_id)
        print(f"Fetched {len(all_acts)} activities total.")
        
        # Clean up database test insertions
        print("\n--- Cleaning up test objects... ---")
        await db.delete(new_ann)
        await db.delete(new_act)
        await db.commit()
        print("Cleanup completed successfully.")
        
    await engine.dispose()
    print("\n=== ALL DIGITAL EXPERIENCE VERIFICATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(main())
