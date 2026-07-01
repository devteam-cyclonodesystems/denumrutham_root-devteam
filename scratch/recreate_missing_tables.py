import asyncio
import os
import sys

# Add backend to path
sys.path.append("c:/Denumrutham/backend")

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Import Base and all models so metadata is complete
from app.core.database.database import Base
from app.models import domain  # This triggers imports of all domain models

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    # 1. Fetch current tables from database
    async with engine.connect() as conn:
        res = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """))
        existing_tables = {row[0] for row in res.fetchall()}
        
    print("Existing tables in database:", len(existing_tables))
    
    # 2. Get tables defined in SQLAlchemy metadata
    metadata_tables = set(Base.metadata.tables.keys())
    print("Tables defined in metadata:", len(metadata_tables))
    
    # 3. Find missing tables
    missing_tables = metadata_tables - existing_tables
    print("\nMissing tables to be created:")
    for t in sorted(missing_tables):
        print(f" - {t}")
        
    if not missing_tables:
        print("No missing tables detected.")
        await engine.dispose()
        return

    # 4. Recreate only the missing tables
    print("\nCreating missing tables...")
    async with engine.begin() as conn:
        # We can construct a subset metadata if we want, or run_sync(Base.metadata.create_all)
        # run_sync(Base.metadata.create_all) is safe because SQLAlchemy's create_all 
        # naturally checks for existence (using checkfirst=True by default) and only creates missing ones.
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
