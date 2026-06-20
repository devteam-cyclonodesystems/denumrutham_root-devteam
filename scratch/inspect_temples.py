import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_R3hWbAYn0tuI@ep-proud-shadow-aom9gssv-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            print("--- All Temples ---")
            res = await conn.execute(text("SELECT id, name, domain, is_active, status FROM temples;"))
            temples = res.fetchall()
            for t in temples:
                print(f"ID: {t[0]}, Name: {t[1]}, Domain: {t[2]}, IsActive: {t[3]}, Status: {t[4]}")
            
            print("\n--- All Temple Profiles ---")
            res = await conn.execute(text("SELECT temple_id, state, district, location FROM temple_profiles;"))
            profiles = res.fetchall()
            for p in profiles:
                print(f"TempleID: {p[0]}, State: '{p[1]}', District: '{p[2]}', Location: '{p[3]}'")

            print("\n--- All Live Settings ---")
            res = await conn.execute(text("SELECT id, temple_id FROM temple_website_settings_live;"))
            lives = res.fetchall()
            for l in lives:
                print(f"Live ID: {l[0]}, TempleID: {l[1]}")
                
        except Exception as e:
            print("Error:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
