import asyncio
import traceback
import sys
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Setup path so it can import app modules
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.modules.governance.schemas.suggestions import (
    TempleSuggestionCreate, SuggestionContactSchema, SuggestionImageSchema
)
from app.modules.governance.services.suggestions_service import SuggestionsService
from app.models import User, StateMaster, DistrictMaster

async def main():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Find a devotee user
            res = await db.execute(select(User).filter(User.email == 'devotee@example.com').limit(1))
            user = res.scalar()
            if not user:
                print("Devotee user not found in production DB.")
                return
            print(f"Using user: {user.email} (ID: {user.id})")

            # 2. Find Kerala state and Thiruvananthapuram district
            state_res = await db.execute(select(StateMaster).filter(StateMaster.slug == 'kerala').limit(1))
            state = state_res.scalar()
            if not state:
                print("Kerala state not found.")
                return
            print(f"Using State: {state.name} (ID: {state.id})")

            dist_res = await db.execute(select(DistrictMaster).filter(DistrictMaster.state_id == state.id).limit(1))
            district = dist_res.scalar()
            if not district:
                print("District not found.")
                return
            print(f"Using District: {district.name} (ID: {district.id})")

            # 3. Create dummy payload
            payload = TempleSuggestionCreate(
                name="Kaithottukonam Mahadeva Temple Test",
                deity="Lord Shiva",
                description="Test description",
                address_line_1="Kaithottukonam Mahadeva Temple",
                address_line_2="Balaramapuram",
                village_town="Balaramapuram",
                district_id=district.id,
                state_id=state.id,
                pincode="695501",
                latitude=8.423,
                longitude=77.012,
                google_maps_url="https://maps.google.com/?q=8.423,77.012",
                website="https://example.com",
                social_media_links={},
                festival_info="Shivaratri",
                office_phone="0471234567",
                submitter_affiliation="DEVOTEE",
                contacts=[
                    SuggestionContactSchema(
                        name="Test Contact",
                        designation="Primary Contact",
                        mobile_number="9876543210",
                        is_primary=True
                    )
                ],
                images=[
                    SuggestionImageSchema(
                        image_url="data:image/webp;base64," + "A" * 600,
                        is_primary=True
                    )
                ]
            )

            # 4. Attempt suggestion creation
            print("Calling create_suggestion...")
            suggestion = await SuggestionsService.create_suggestion(
                db=db,
                user_id=user.id,
                schema=payload,
                client_ip="127.0.0.1"
            )
            print("Flushing/committing transaction...")
            await db.commit()
            print(f"Success! Suggestion created with ID: {suggestion.id}, Ref: {suggestion.reference_number}")

        except Exception as e:
            print("\n!!! EXCEPTION CAUGHT !!!")
            traceback.print_exc()
            await db.rollback()
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
