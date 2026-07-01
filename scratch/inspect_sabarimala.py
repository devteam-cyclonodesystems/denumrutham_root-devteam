import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            print("--- Searching for Sabarimala in temples table ---")
            query = text("SELECT id, name, domain, is_active, status, directory_status, state, district, state_id, district_id FROM temples WHERE name ILIKE '%sabarimala%';")
            res = await conn.execute(query)
            temples = res.fetchall()
            if not temples:
                print("No temples matching 'Sabarimala' found in temples table.")
            for t in temples:
                print(f"ID: {t.id}, Name: {t.name}, Domain: {t.domain}, IsActive: {t.is_active}, Status: {t.status}, DirStatus: {t.directory_status}, State: {t.state}, District: {t.district}, StateID: {t.state_id}, DistrictID: {t.district_id}")
                
                print("\n--- Profile ---")
                p_query = text("SELECT * FROM temple_profiles WHERE temple_id = :tid;")
                p_res = await conn.execute(p_query, {"tid": t.id})
                profile = p_res.mappings().first()
                if profile:
                    for k, v in profile.items():
                        print(f"  {k}: {v}")
                else:
                    print("  No profile found.")
                
                print("\n--- Live Website Settings ---")
                s_query = text("SELECT * FROM temple_website_settings_live WHERE temple_id = :tid;")
                s_res = await conn.execute(s_query, {"tid": t.id})
                setting = s_res.mappings().first()
                if setting:
                    for k, v in setting.items():
                        if k in ['timings_settings', 'daily_activities_settings', 'notice_board_content', 'location_settings']:
                            print(f"  {k}: [JSON content present]")
                        else:
                            print(f"  {k}: {v}")
                else:
                    print("  No live settings found.")
                
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
