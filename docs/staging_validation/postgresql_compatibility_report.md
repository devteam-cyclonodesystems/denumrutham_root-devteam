# SQLite vs PostgreSQL Compatibility Report

This report outlines the compatibility gaps between the development/staging environment (SQLite) and the production target database (PostgreSQL), with remediation details for the Denumrutham 2.0 platform.

---

## 1. JSON & JSONB Column behavior
* **SQLite**: Stores JSON data as standard text strings. Querying inside JSON structures requires SQLite JSON extension helpers, which do not benefit from traditional database indexing.
* **PostgreSQL**: Stores JSON data as `JSONB` (binary format), which is pre-parsed and allows rapid indexing.
* **Remediation**:
  - We use SQLAlchemy's `JSON` type with custom dialects or JSONB variants.
  - For production, GIN (Generalized Inverted Index) indexes are configured on JSONB columns (like `offering_metadata` in the `offerings` table, and `scheduling_rules` in the advertisement tables) to enable index-backed queries inside JSON objects.

---

## 2. Row-Level Transaction Locking (`SELECT FOR UPDATE`)
* **SQLite**: SQLite uses database-wide write locks. When a transaction performs a write, the entire database is locked. SQLite ignores `SELECT FOR UPDATE` statements or parses them silently without blocking concurrent read operations. This means SQLite cannot simulate row-level contention in development.
* **PostgreSQL**: Implements fine-grained row-level locking via `SELECT FOR UPDATE`. Concurrent checkouts of different products lock only their respective `StoreStock` rows, ensuring high checkout throughput.
* **Remediation**:
  - To prevent double-selling on SQLite during testing, we implemented **optimistic concurrency control (version columns)** on `StoreStock`.
  - The checkout service performs both:
    1. Pessimistic row locking (`with_for_update()`) for PostgreSQL production.
    2. Optimistic version checking (`version = version + 1` where `version = current_version`) for SQLite staging.

---

## 3. Foreign Key Constraint Enforcement
* **SQLite**: Foreign key constraints are disabled by default. They must be explicitly enabled per-connection via connection pool hooks:
  ```python
  @event.listens_for(Engine, "connect")
  def set_sqlite_pragma(dbapi_connection, connection_record):
      cursor = dbapi_connection.cursor()
      cursor.execute("PRAGMA foreign_keys=ON")
      cursor.close()
  ```
* **PostgreSQL**: Foreign key constraints are natively active, indexed, and strictly enforced.
* **Remediation**:
  - Connection pragmas are activated in `core/database/session.py` to ensure SQLite staging catches constraint violations during E2E tests.

---

## 4. Enum handling & Check Constraints
* **SQLite**: SQLite does not support native `CREATE TYPE AS ENUM`. SQLAlchemy translates Python Enums into simple `VARCHAR` columns backed by a `CheckConstraint` (e.g., `offering_type IN ('GENERAL', 'VAZHIPADU', 'DONATION', 'ANNADANAM')`).
* **PostgreSQL**: Supports native database-level custom Enum types.
* **Remediation**:
  - Schema migrations define enums with `create_type=True` so Alembic correctly generates `postgresql.ENUM` types in production, while falling back gracefully to text-based check constraints in SQLite.

---

## 5. Schema Alterations & Migrations
* **SQLite**: Does not support many standard SQL alter actions, such as `DROP COLUMN` or `ALTER CONSTRAINT`.
* **Remediation**:
  - Alembic is configured with `render_as_batch=True` inside `alembic/env.py`.
  - Batch migrations copy SQLite tables to temporary tables with the revised schemas and drop the old ones, avoiding SQLite alteration crash limits.

---

## 6. Compatibility Audit Matrix

| Feature | SQLite Staging | PostgreSQL Production | Compatibility Risk | Mitigation Status |
| :--- | :--- | :--- | :--- | :--- |
| **UUIDs** | Text (String) storage | Native 128-bit `UUID` | Low (format parsing) | Handled by SQLAlchemy `UUID(as_uuid=True)` |
| **JSON Indexing** | Full Scan | GIN Indexes | Performance | Configured GIN indexes for production DDL |
| **Row Locking** | Database Lock | Row Lock | Concurrency/Overlapping | Dual pessimistic (select for update) + optimistic (version check) |
| **Enums** | check constraints | Native Enum Types | High (Alter migrations) | Alembic migration scripts structured for conditional enum creations |
