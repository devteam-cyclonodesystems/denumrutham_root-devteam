import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    url = "postgresql+asyncpg://neondb_owner:npg_6Ii0uTBKbaZP@ep-old-queen-aoeyozad-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = create_async_engine(url, connect_args={"ssl": True})
    async with engine.connect() as conn:
        try:
            print("=== Active Queries / Locks ===")
            res = await conn.execute(text("""
                SELECT pid, age(clock_timestamp(), query_start), state, query, wait_event_type, wait_event 
                FROM pg_stat_activity 
                WHERE state != 'idle' AND pid != pg_backend_pid();
            """))
            for row in res.fetchall():
                print(f"PID: {row[0]}, Age: {row[1]}, State: {row[2]}, Wait: {row[4]}/{row[5]}\nQuery: {row[3]}")
                print("-" * 50)
            
            print("\n=== Lock conflicts ===")
            res = await conn.execute(text("""
                SELECT
                    blocked_locks.pid     AS blocked_pid,
                    blocked_activity.query    AS blocked_statement,
                    blocking_locks.pid    AS blocking_pid,
                    blocking_activity.query   AS blocking_statement
                FROM  pg_catalog.pg_locks         blocked_locks
                JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
                JOIN pg_catalog.pg_locks         blocking_locks 
                    ON blocking_locks.locktype = blocked_locks.locktype
                    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                    AND blocking_locks.pid != blocked_locks.pid
                JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
                WHERE NOT blocked_locks.granted;
            """))
            locks = res.fetchall()
            if not locks:
                print("No lock conflicts found.")
            for row in locks:
                print(f"Blocked PID: {row[0]}\nBlocked Query: {row[1]}\nBlocking PID: {row[2]}\nBlocking Query: {row[3]}")
                print("=" * 50)
        except Exception as e:
            print("Error checking locks:", str(e))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
