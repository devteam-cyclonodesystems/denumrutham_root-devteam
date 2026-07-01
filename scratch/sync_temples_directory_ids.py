import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.begin() as conn:
        try:
            # 1. Fetch all temples and their profiles
            res = await conn.execute(text("""
                SELECT 
                    t.id, 
                    t.name, 
                    t.state AS t_state, 
                    t.district AS t_district, 
                    p.state AS p_state, 
                    p.district AS p_district
                FROM temples t
                LEFT JOIN temple_profiles p ON t.id = p.temple_id;
            """))
            temples = res.fetchall()
            
            # 2. Fetch states mapping
            res = await conn.execute(text("SELECT id, name FROM state_master;"))
            states_map = {row[1].lower(): row[0] for row in res.fetchall()}
            print("Loaded states map:", states_map)
            
            # 3. Fetch districts mapping
            res = await conn.execute(text("SELECT id, name, state_id FROM district_master;"))
            districts_map = {}
            for row in res.fetchall():
                districts_map[row[1].lower()] = row[0]
            # Add aliases for common variants
            districts_map["trivandrum"] = districts_map.get("thiruvananthapuram")
            print("Loaded districts map keys:", list(districts_map.keys()))
            
            # 4. Update each temple
            for temple in temples:
                tid = temple[0]
                tname = temple[1]
                t_state = temple[2]
                t_district = temple[3]
                p_state = temple[4]
                p_district = temple[5]
                
                # Determine state text
                state_txt = t_state or p_state or "Kerala"
                # Determine district text
                district_txt = t_district or p_district or ""
                
                # Normalize state name to lookup
                state_id = states_map.get(state_txt.strip().lower())
                if not state_id:
                    # Fallback to Kerala
                    state_id = states_map.get("kerala")
                    state_txt = "Kerala"
                    
                # Normalize district name to lookup
                district_id = None
                if district_txt:
                    normalized_dist = district_txt.strip().lower()
                    district_id = districts_map.get(normalized_dist)
                    
                print(f"Temple: '{tname}' ({tid})")
                print(f"  Input State: '{t_state}' / Profile State: '{p_state}' -> resolved text: '{state_txt}' -> ID: {state_id}")
                print(f"  Input Dist: '{t_district}' / Profile Dist: '{p_district}' -> resolved text: '{district_txt}' -> ID: {district_id}")
                
                # Update database
                await conn.execute(
                    text("""
                        UPDATE temples 
                        SET 
                            state_id = :state_id, 
                            district_id = :district_id,
                            state = :state_txt,
                            district = :district_txt
                        WHERE id = :tid
                    """),
                    {
                        "state_id": state_id,
                        "district_id": district_id,
                        "state_txt": state_txt,
                        "district_txt": district_txt or None,
                        "tid": tid
                    }
                )
                print(f"  Updated successfully!")
                print("-" * 40)
            
            print("All temples synced and database changes committed!")
            
        except Exception as e:
            print("Error syncing temples:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
