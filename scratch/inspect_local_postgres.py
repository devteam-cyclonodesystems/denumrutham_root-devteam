import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    base_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    print(f"Connecting to Postgres server at 5432...")
    try:
        engine = create_async_engine(base_url)
        async with engine.connect() as conn:
            # List all databases
            result = await conn.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false"))
            db_names = [row[0] for row in result.all()]
            print(f"Databases found: {db_names}")
            
            for db_name in db_names:
                db_url = f"postgresql+asyncpg://postgres:postgres@localhost:5432/{db_name}"
                try:
                    db_engine = create_async_engine(db_url)
                    async with db_engine.connect() as db_conn:
                        # Check if table temples exists
                        table_check = await db_conn.execute(text(
                            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'temples')"
                        ))
                        has_temples = table_check.scalar()
                        if has_temples:
                            temples = (await db_conn.execute(text("SELECT COUNT(*) FROM temples"))).scalar()
                            staff = 0
                            has_users = (await db_conn.execute(text(
                                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
                            ))).scalar()
                            if has_users:
                                staff = (await db_conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'STAFF'"))).scalar()
                            print(f"  Database '{db_name}': Temples={temples}, Staff={staff}")
                        else:
                            print(f"  Database '{db_name}': No 'temples' table found.")
                except Exception as ex:
                    print(f"  Database '{db_name}': Connection failed: {ex}")
    except Exception as e:
        print(f"Failed to connect to postgres server: {e}")

if __name__ == "__main__":
    asyncio.run(main())
