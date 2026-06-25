# Denumrutham — Developer Guide

**Classification:** Internal Engineering — Official Handbook  
**Version:** 1.0  
**Date:** 2026-06-25  
**Audience:** Backend Engineers, Frontend Engineers, Full-Stack Contributors  

> [!IMPORTANT]
> This guide documents how to work **within** the existing Denumrutham architecture. Before writing any code, read the [Engineering Architecture Handover Document](./Denumrutham_Engineering_Architecture_Handover.md). This guide assumes you have read it.

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Repository Structure](#2-repository-structure)
3. [Backend Folder Organization](#3-backend-folder-organization)
4. [Frontend Folder Organization](#4-frontend-folder-organization)
5. [Module Ownership Rules](#5-module-ownership-rules)
6. [Coding Standards — Python](#6-coding-standards--python)
7. [Coding Standards — TypeScript](#7-coding-standards--typescript)
8. [React Standards](#8-react-standards)
9. [FastAPI Standards](#9-fastapi-standards)
10. [SQLAlchemy Standards](#10-sqlalchemy-standards)
11. [Alembic Migration Standards](#11-alembic-migration-standards)
12. [API Design Standards](#12-api-design-standards)
13. [Swagger Documentation Standards](#13-swagger-documentation-standards)
14. [Response Model Standards](#14-response-model-standards)
15. [Error Handling Standards](#15-error-handling-standards)
16. [Logging Standards](#16-logging-standards)
17. [RBAC Standards](#17-rbac-standards)
18. [Security Checklist](#18-security-checklist)
19. [Database Design Standards](#19-database-design-standards)
20. [Service Layer Rules](#20-service-layer-rules)
21. [Repository Layer Rules](#21-repository-layer-rules)
22. [Transaction Ownership Rules](#22-transaction-ownership-rules)
23. [Audit Logging Rules](#23-audit-logging-rules)
24. [Cache Management Rules](#24-cache-management-rules)
25. [Redis Usage Guidelines](#25-redis-usage-guidelines)
26. [Background Worker Guidelines](#26-background-worker-guidelines)
27. [Testing Standards](#27-testing-standards)
28. [Unit Test Patterns](#28-unit-test-patterns)
29. [Integration Test Patterns](#29-integration-test-patterns)
30. [End-to-End Test Guidelines](#30-end-to-end-test-guidelines)
31. [Git Branch Strategy](#31-git-branch-strategy)
32. [Pull Request Standards](#32-pull-request-standards)
33. [Code Review Checklist](#33-code-review-checklist)
34. [Performance Best Practices](#34-performance-best-practices)
35. [Common Anti-Patterns](#35-common-anti-patterns)
36. [Debugging Guide](#36-debugging-guide)
37. [Adding a New Module](#37-adding-a-new-module)
38. [Adding a New API Endpoint](#38-adding-a-new-api-endpoint)
39. [Adding a New Database Table](#39-adding-a-new-database-table)
40. [Adding a New React Page](#40-adding-a-new-react-page)
41. [Adding Permissions](#41-adding-permissions)
42. [Updating Swagger](#42-updating-swagger)
43. [Common Pitfalls](#43-common-pitfalls)
44. [Frequently Asked Questions](#44-frequently-asked-questions)

---

## 1. Development Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 20+ (LTS) | Frontend build toolchain |
| PostgreSQL | 15+ | Local database |
| Redis | 6+ | Local cache |
| Git | Any | Version control |

### Backend Setup

```bash
# 1. Clone the repo
git clone https://github.com/amrithvijayvl/denumrutham-backend.git
cd denumrutham-backend

# 2. Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file (copy from .env.example or create manually)
# Minimum required:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/denumrutham
SECRET_KEY=your-dev-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
RAZORPAY_WEBHOOK_SECRET=dev-placeholder

# 5. Run migrations
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/api/v1/openapi.json` (use any OpenAPI viewer).  
Health check: `http://localhost:8000/health/live`

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env.local file
# VITE_API_BASE_URL=http://localhost:8000/api/v1

# 4. Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`.

### Local Database Setup

```bash
# Create local PostgreSQL database
createdb denumrutham

# Run all migrations
cd backend
alembic upgrade head

# Verify migration state
alembic current
```

### Verifying Your Setup

1. Backend responds at `GET http://localhost:8000/health/live` → `{"status": "alive"}`
2. Frontend loads at `http://localhost:5173` → Temple list page renders
3. Login with a seeded admin account (created by seed scripts in `backend/scripts/`)

---

## 2. Repository Structure

The project is a **monorepo** with two independently-deployed applications:

```
Denumrutham/
├── backend/          # FastAPI Python application → deploys to Railway
└── frontend/         # React TypeScript application → deploys to Vercel
```

Each application has its **own Git workflow** but they live in the same monorepo. Changing a backend API and the frontend that consumes it should be in the same commit/PR for traceability.

### Key Principle: Atomic Cross-Stack Changes

When you change a backend API response shape, **update the frontend TypeScript interface in the same PR**. Never leave the frontend consuming a stale API contract.

---

## 3. Backend Folder Organization

```
backend/app/
├── main.py                    # Entry: import guard + Railway error capture
├── real_main.py               # FastAPI app, middleware, lifespan, exception handlers
│
├── api/
│   ├── api_v1/
│   │   ├── api.py             # ← THE ONLY PLACE routers are registered
│   │   ├── endpoints/         # Core endpoint files (legacy/flat files)
│   │   └── routes/            # Newer endpoint files organized by feature
│   ├── deps.py                # Dependency injection definitions
│   └── routes/                # Shared/utility route files
│
├── core/
│   ├── config/config.py       # pydantic-settings Settings class
│   ├── database/              # Async engine, session factory
│   ├── middleware/            # All ASGI middleware classes
│   ├── limiter.py             # slowapi rate limiter singleton
│   ├── integrity.py           # Startup schema validator
│   ├── redis_client.py        # Redis connection pool
│   ├── exceptions.py          # AppException, ServiceException classes
│   ├── response.py            # success_response() / error_response()
│   └── logging_config.py      # Structured logging setup
│
├── modules/                   # Domain feature modules — THE MAIN CODE LOCATION
│   ├── <domain>/
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Database queries
│   │   └── routes/            # FastAPI routers
│   └── ...
│
├── models/                    # Shared model re-exports (__init__.py)
├── services/                  # Cross-cutting services (used by multiple modules)
├── repositories/              # Cross-cutting repositories
├── tasks/                     # Standalone background task functions
├── events/                    # Domain event handlers
└── scripts/                   # Admin/maintenance one-off scripts
```

### The Rule: Where Does New Code Go?

| Type of code | Location |
|---|---|
| New business domain | `modules/<domain>/` (new directory) |
| New endpoint in existing domain | `modules/<domain>/routes/` |
| Code used by 3+ modules | `services/` or `repositories/` (root level) |
| Data model | `modules/<domain>/models/` |
| Pydantic schema | `modules/<domain>/schemas/` |
| Migration | `alembic/versions/` |
| Admin script | `scripts/` |
| Background job | `tasks/` if standalone; `real_main.py` lifespan if integrated |

---

## 4. Frontend Folder Organization

```
frontend/src/
├── App.tsx                    # Root router — ALL routes defined here
├── main.tsx                   # React entry point
│
├── layouts/
│   ├── MainLayout.tsx         # Public devotee layout
│   ├── ManagerLayout.tsx      # Temple manager sidebar + nav
│   ├── AdminLayout.tsx        # Platform admin layout
│   ├── DenumruthamShell.tsx   # Minimal wrapper (auth pages, public portal)
│   └── PlatformGovernanceLayout.tsx  # Admin governance sub-layout
│
├── pages/
│   ├── auth/                  # Login, Register, ForgotPassword, etc.
│   ├── devotee/               # TempleList, CartPage, NationalDirectory, HistoryPage
│   ├── manager/               # All temple manager operational modules
│   │   └── website/           # Website builder sub-tabs (12 sections)
│   └── admin/
│       ├── governance/        # Platform governance modules
│       └── *.tsx              # Admin pages
│
├── services/
│   ├── api.ts                 # Axios instance — THE only HTTP client
│   ├── financeService.ts      # Finance-specific API calls
│   ├── inventoryService.ts    # Inventory-specific API calls
│   ├── storeService.ts        # Store-specific API calls
│   ├── digitalExperienceService.ts  # Website builder API calls
│   ├── telemetryService.ts    # Analytics event tracking
│   └── authenticityService.ts # Client-side trust level state (Zustand)
│
├── store/
│   ├── authStore.ts           # Auth state — user, token, permissions
│   └── authenticityStore.ts   # Module trust levels
│
├── components/
│   ├── ui/                    # Shared UI primitives (PrimaryButton, etc.)
│   ├── dashboard/             # Dashboard-specific components
│   └── ...
│
└── utils/
    ├── rbac.ts                # RBAC.canView() client-side check
    ├── permissionUtils.ts     # hasPermission() helpers
    └── safeLazy.ts            # Hardened React.lazy wrapper
```

### The Rule: Where Does New Frontend Code Go?

| Type | Location |
|---|---|
| New manager module page | `pages/manager/<ModuleName>.tsx` |
| New admin governance page | `pages/admin/governance/<Name>.tsx` |
| New public/devotee page | `pages/devotee/<Name>.tsx` |
| New API service calls | Existing service file for that domain OR new `<domain>Service.ts` |
| New shared UI component | `components/ui/` |
| New Zustand store | `store/<name>Store.ts` |
| New utility | `utils/<name>.ts` |

---

## 5. Module Ownership Rules

Every module has a clear owner. Code in one module **must not** directly import service/repository classes from another module. Use only:

1. **Shared models** (`app/models/__init__.py`) — OK to import across modules
2. **Cross-cutting services** (`app/services/`) — OK to import across modules
3. **API layer calls** — if module A needs data from module B, it calls via the service layer, not directly via B's repository

### Module Boundary Rules

```python
# ✅ CORRECT: Import from shared models
from app.models import ArchanaBooking, Transaction

# ✅ CORRECT: Import from cross-cutting services
from app.services.archana_service import ArchanaService

# ❌ WRONG: Import repository from another module directly
from app.modules.finance.repositories.settlement_repo import SettlementRepository
# (use only within the finance module)

# ❌ WRONG: Import route handler from another module
from app.modules.billing.routes.payments import create_payment
```

---

## 6. Coding Standards — Python

### Naming Conventions

```python
# Classes: PascalCase
class ArchanaBookingService:
    pass

# Functions/methods: snake_case
async def get_booking_by_id(db: AsyncSession, booking_id: UUID) -> ArchanaBooking:
    pass

# Constants: UPPER_SNAKE_CASE
SENTINEL_TEMPLE_ID = UUID("00000000-0000-0000-0000-000000000000")

# Private helpers: leading underscore
def _format_ref_id(temple_code: str, sequence: int) -> str:
    pass

# Variables: snake_case, descriptive
active_bookings_count = 0  # ✅
abc = 0                    # ❌
```

### Type Annotations

All function signatures must have type annotations. Return types are mandatory.

```python
# ✅ Correct
async def create_booking(
    db: AsyncSession,
    temple_id: UUID,
    payload: ArchanaBookingCreate
) -> ArchanaBooking:
    ...

# ❌ Wrong — missing types
async def create_booking(db, temple_id, payload):
    ...
```

### Imports Order

Follow PEP 8 import ordering:
1. Standard library (`uuid`, `datetime`, `enum`)
2. Third-party (`fastapi`, `sqlalchemy`, `pydantic`)
3. Local application (`app.core.*`, `app.modules.*`)

Separate groups with a blank line.

### Async/Await Rules

- **All database operations must be `async`**. Never use `db.execute()` without `await`.
- Never mix sync and async DB calls in the same request handler.
- Never call `asyncio.run()` from within a request handler.

```python
# ✅ Correct
result = await db.execute(select(ArchanaBooking).filter(...))
booking = result.scalar_one_or_none()

# ❌ Wrong — sync execute in async context
result = db.execute(select(ArchanaBooking).filter(...))
```

### Docstrings

Required for all public service methods, repository methods, and route handlers:

```python
async def create_booking(db: AsyncSession, payload: BookingCreate) -> ArchanaBooking:
    """
    Create a new archana booking with idempotency protection.
    
    Checks idempotency_key before creating. Writes audit event to outbox
    within the same transaction.
    
    Args:
        db: Async database session (request-scoped).
        payload: Validated booking request payload.
        
    Returns:
        Created ArchanaBooking ORM instance.
        
    Raises:
        ConflictError: If a booking with this idempotency_key already exists.
    """
```

---

## 7. Coding Standards — TypeScript

### Naming Conventions

```typescript
// Interfaces and Types: PascalCase
interface ArchanaBooking {
  id: string;
  temple_id: string;
  primary_devotee_name: string;
}

// Components: PascalCase
function FinanceModule(): React.ReactElement { ... }

// Hooks: camelCase, prefix with 'use'
function useTempleData(templeId: string) { ... }

// Constants: UPPER_SNAKE_CASE for module-level constants
const DEFAULT_PAGE_SIZE = 20;

// Variables and functions: camelCase
const activeBookings = await fetchBookings();
async function fetchSettlementBatches() { ... }

// Enum values: PascalCase
enum TrustLevel {
  Live = 'LIVE',
  Cached = 'CACHED',
}
```

### Strict Mode

The project uses TypeScript in strict mode. No `any` types except where interfacing with legacy JSON shapes. Use `unknown` and narrow with type guards.

```typescript
// ✅ Correct — typed
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    return String((error as { detail: string }).detail);
  }
  return 'An unexpected error occurred';
}

// ❌ Wrong — any escapes type safety
function extractErrorMessage(error: any): string {
  return error.detail;
}
```

### Interface Naming

Do NOT prefix interfaces with `I` (not `IArchanaBooking`). Use plain PascalCase.

### File Naming

- Component files: `PascalCase.tsx` (e.g., `FinanceModule.tsx`)
- Service files: `camelCase.ts` (e.g., `financeService.ts`)
- Utility files: `camelCase.ts` (e.g., `permissionUtils.ts`)
- Store files: `camelCase.ts` (e.g., `authStore.ts`)

---

## 8. React Standards

### Functional Components Only

No class components (except `GlobalErrorBoundary` and `ModuleErrorBoundary` which require `componentDidCatch`). All new components must be function components with hooks.

### Component Structure Order

```typescript
function MyComponent({ prop1, prop2 }: Props) {
  // 1. Store hooks (Zustand)
  const { user } = useAuthStore();
  
  // 2. State (useState)
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DataType | null>(null);
  
  // 3. Derived values (useMemo)
  const filteredData = useMemo(() => data?.filter(...), [data]);
  
  // 4. Effects (useEffect)
  useEffect(() => {
    fetchData();
  }, []);
  
  // 5. Event handlers
  const handleSubmit = async () => { ... };
  
  // 6. Early returns (loading, error states)
  if (isLoading) return <LoadingSpinner />;
  
  // 7. Main render
  return <div>...</div>;
}
```

### Never Import from Another Module's Internal Files

```typescript
// ✅ Correct — import from shared services
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// ❌ Wrong — reaching into another page's internals
import { BookingCard } from '@/pages/manager/HallBookingModule';
```

### Lazy Loading Rule

Every manager module page **must** be lazy-loaded with `safeLazy`:

```typescript
// ✅ Correct
const NewModule = safeLazy(() => import('@/pages/manager/NewModule'), 'NewModule');

// ❌ Wrong — eager import creates a huge initial bundle
import NewModule from '@/pages/manager/NewModule';
```

### Error Boundaries

Every lazy-loaded module must be wrapped in `<ModuleErrorBoundary>`:

```tsx
<ModuleErrorBoundary moduleName="New Module Display Name">
  <Suspense fallback={<div>Loading...</div>}>
    <NewModule />
  </Suspense>
</ModuleErrorBoundary>
```

### State Management Rules

- **Server state** (data from API): `useState` + `useEffect` + API call. Do not use a global store for data that is request-specific.
- **Auth state**: Always use `useAuthStore()`. Never derive auth state locally.
- **UI state** (modal open/close, active tab): Local `useState` within the component.
- **Cross-module shared state**: Only if genuinely shared — create a Zustand store. Do not pass props 3+ levels deep.

### Toast Notifications

Always use `sonner` toast for user feedback:

```typescript
import { toast } from 'sonner';

// Success
toast.success('Archana booking created successfully');

// Error
toast.error('Failed to create booking. Please try again.');

// Never use alert() or console.log for user feedback
```

---

## 9. FastAPI Standards

### Router Structure

Every router file must define ONE `APIRouter` instance and all its routes:

```python
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.models.auth_models import User

router = APIRouter()

@router.get("/", response_model=list[BookingResponse])
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all bookings for the current user's temple."""
    return await BookingService.list_bookings(db, current_user.temple_id)
```

### Router Registration

Routers are registered **exclusively** in `app/api/api_v1/api.py`. Never import and use a router anywhere else.

```python
# In api.py — the ONLY place
from app.modules.mymodule.routes.my_routes import router as my_router
api_router.include_router(my_router, prefix="/my-prefix", tags=["MyTag"])
```

### Dependency Injection Pattern

Always use the standard dependency chain. Never instantiate services or sessions directly in route functions.

```python
# ✅ Correct
@router.post("/bookings")
async def create_booking(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ...

# ❌ Wrong — manually creating session
@router.post("/bookings")
async def create_booking(payload: BookingCreate):
    async with AsyncSessionLocal() as db:  # ❌ Don't do this in routes
        ...
```

### Route Naming Convention

Use **plural nouns** for resource collections, snake_case for multi-word segments:

```
GET    /archana-bookings          → list
POST   /archana-bookings          → create
GET    /archana-bookings/{id}     → retrieve
PUT    /archana-bookings/{id}     → full update
PATCH  /archana-bookings/{id}     → partial update
DELETE /archana-bookings/{id}     → delete

# Action endpoints use verb after ID
POST   /archana-bookings/{id}/approve
POST   /archana-bookings/{id}/complete
POST   /archana-bookings/{id}/cancel
```

### Response Model Declaration

All routes must declare `response_model`. Never return untyped dicts from routes.

```python
# ✅ Correct
@router.get("/{id}", response_model=BookingResponse)
async def get_booking(id: UUID, ...):
    ...

# ❌ Wrong — untyped return
@router.get("/{id}")
async def get_booking(id: UUID, ...):
    return {"id": str(id), ...}
```

### HTTP Status Codes

| Scenario | Status Code |
|---|---|
| Successful read | 200 |
| Successful creation | 201 |
| Accepted for processing | 202 |
| No content (delete) | 204 |
| Validation error | 422 (FastAPI auto) |
| Not found | 404 |
| Unauthorized | 401 |
| Forbidden | 403 |
| Conflict (duplicate) | 409 |
| Internal error | 500 |

---

## 10. SQLAlchemy Standards

### Model Class Structure

```python
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Text, Enum, Integer, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database.database import Base


def utcnow():
    """Always use this for default timestamp values — never datetime.utcnow()."""
    return datetime.now(timezone.utc)


class MyModel(Base):
    """One-line description of what this model represents."""
    __tablename__ = "my_models"
    
    # Primary key — always UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Tenant isolation — mandatory for all business models
    temple_id = Column(UUID(as_uuid=True), ForeignKey("temples.id"), nullable=False, index=True)
    
    # Business fields
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(MyStatusEnum), default=MyStatusEnum.PENDING)
    notes = Column(Text, nullable=True)
    metadata = Column(JSONB().with_variant(JSON, "sqlite"), nullable=True)
    
    # Audit timestamps — on every model
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    # Relationships
    temple = relationship("Temple")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("temple_id", "name", name="uq_my_models_temple_name"),
        Index("ix_my_models_status_temple", "temple_id", "status"),
    )
```

### Enum Fields

Always define enums as Python `str` enums for string storage:

```python
class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
```

Using `str` as a base class means SQLAlchemy stores the string value, making DB queries readable without joining to a lookup table.

### Async Query Patterns

```python
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

# Fetch single by primary key
result = await db.get(ArchanaBooking, booking_id)

# Fetch single with filter
result = await db.execute(
    select(ArchanaBooking)
    .filter(ArchanaBooking.temple_id == temple_id, ArchanaBooking.id == booking_id)
)
booking = result.scalar_one_or_none()

# Fetch list
result = await db.execute(
    select(ArchanaBooking)
    .filter(ArchanaBooking.temple_id == temple_id)
    .order_by(ArchanaBooking.created_at.desc())
    .limit(50)
)
bookings = result.scalars().all()

# Fetch with eager loading (avoid N+1)
result = await db.execute(
    select(ArchanaBooking)
    .options(
        selectinload(ArchanaBooking.members)
        .selectinload(ArchanaBookingMember.items)
    )
    .filter(ArchanaBooking.temple_id == temple_id)
)

# Count query
result = await db.execute(
    select(func.count(ArchanaBooking.id))
    .filter(ArchanaBooking.temple_id == temple_id)
)
count = result.scalar()
```

### JSONB Column Pattern

For JSONB columns that need SQLite compatibility (local dev):

```python
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON

# Use JSONB in production (PostgreSQL), fall back to JSON for SQLite tests
JSONB_VARIANT = JSONB().with_variant(JSON, "sqlite")

metadata_col = Column(JSONB_VARIANT, nullable=True)
```

---

## 11. Alembic Migration Standards

### Creating a Migration

```bash
# After adding/changing a model, generate a migration
alembic revision --autogenerate -m "add_xyz_to_archana_bookings"

# Always review the generated file before running
# IMPORTANT: autogenerate misses: custom indexes, JSONB, check constraints, 
# schema renames. Always verify the generated SQL manually.

# Apply migration
alembic upgrade head

# Roll back one step
alembic downgrade -1

# Check current state
alembic current

# Show migration history
alembic history
```

### Migration File Rules

**1. Always review before committing.** Never commit an autogenerated migration without reading it.

**2. Write a reversible `downgrade()`** for every migration:

```python
def upgrade() -> None:
    op.add_column('archana_bookings', sa.Column('priority_level', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('archana_bookings', 'priority_level')
```

**3. Use `op.execute()` for operations autogenerate cannot handle:**

```python
def upgrade() -> None:
    # Table renames must be done manually
    op.rename_table('enterprise_archana_bookings', 'archana_bookings')
    
    # Index renames must be done manually
    op.execute("ALTER INDEX IF EXISTS ix_enterprise_archana_bookings_temple_id RENAME TO ix_archana_bookings_temple_id")
```

**4. Never modify historical migration files.** If a migration was wrong, write a new migration to correct it.

**5. Handle merge heads** when parallel branches create split migration trees:

```bash
alembic merge heads -m "merge_heads"
```

**6. Migration naming convention:**
```
<autogenerated_hash>_<descriptive_slug>.py
# Examples:
# a9f1e2d3c4b5_rename_enterprise_archana_bookings.py
# 522c76d941bd_add_centralized_activity_logs_and_outbox.py
```

**7. Data migrations** (transforming existing data) must be done in a separate migration from schema migrations:

```python
def upgrade() -> None:
    # Step 1: Add nullable column
    op.add_column('transactions', sa.Column('category_v2', sa.String(), nullable=True))
    
    # Step 2: Backfill data
    op.execute("UPDATE transactions SET category_v2 = category WHERE category_v2 IS NULL")
    
    # Step 3: Make it not-nullable AFTER backfill
    op.alter_column('transactions', 'category_v2', nullable=False)
```

---

## 12. API Design Standards

### URL Design

| Convention | Example |
|---|---|
| Kebab-case segments | `/archana-bookings`, `/hall-bookings` |
| Plural resource names | `/transactions` not `/transaction` |
| Action sub-paths | `/archana-bookings/{id}/start` |
| No trailing slashes | `/archana-bookings` not `/archana-bookings/` |
| Scoped manager paths | `/manager/halls`, `/manager/hall-bookings` |
| Admin paths | `/admin/finance/overview` |

### Query Parameters

```python
# Filtering
GET /transactions?type=income&category=archana&from_date=2026-01-01

# Pagination
GET /transactions?limit=50&offset=0

# Sorting
GET /transactions?sort=created_at&order=desc

# Search
GET /suppliers?q=krishna
```

### Request Body Convention

Use Pydantic models for all request bodies. Never accept raw dicts:

```python
class ArchanaBookingCreate(BaseModel):
    primary_devotee_name: str
    phone_number: str | None = None
    booking_date: datetime
    items: list[ArchanaItemPayload]
    idempotency_key: str  # Required for all financial creation endpoints
    
    model_config = ConfigDict(str_strip_whitespace=True)
```

### Idempotency Key Requirement

Every `POST` endpoint that creates financial records **must** accept and process `idempotency_key`:

```python
class PaymentCreate(BaseModel):
    amount: float
    payment_mode: str
    idempotency_key: str  # ← mandatory for all financial POSTs
```

---

## 13. Swagger Documentation Standards

### Router Tags

Every `include_router()` call in `api.py` must have a meaningful `tags=` list:

```python
api_router.include_router(my_router, prefix="/my-prefix", tags=["Hall Booking"])
```

Tags are the Swagger grouping headings. Use the same tag as the existing routers for the same domain.

### Existing Tag Catalog

| Tag | Domain |
|---|---|
| `Authentication` | Auth flows |
| `Bookings` | Archana, devotee bookings |
| `Finance` | Transactions, payments, donations |
| `Hall Booking` | Venue management |
| `Inventory` | Stock, procurement |
| `Audit` | Audit logs, activity logs |
| `Platform Governance` | Admin/superadmin operations |
| `Temple Governance` | Temple-level governance |
| `Settings` | RBAC, configuration |
| `Website Builder` | Digital experience endpoints |
| `Discovery` | Public portal, directory |
| `Analytics` | Telemetry, metrics |
| `System` | Health, sync, system ops |
| `Advertisements` | Platform and temple ads |

### Route Docstrings

Every route that will be consumed by the frontend must have a docstring. It becomes the Swagger description:

```python
@router.post("/archana-bookings", response_model=BookingResponse, status_code=201)
async def create_archana_booking(
    payload: ArchanaBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new archana (ritual) booking.
    
    This endpoint is idempotent — supply the same `idempotency_key` to safely retry.
    On success, creates a RitualQueue entry with status WAITING.
    
    **Required permission:** Staff with `archana:create_booking` OR TEMPLE_MANAGER
    """
```

---

## 14. Response Model Standards

### Standard Response Shape

All responses must use the standard envelope from `app/core/response.py`:

```python
from app.core.response import success_response, error_response

# Success
return success_response(data=booking_dict, message="Booking created successfully")
# → { "success": true, "data": {...}, "message": "..." }

# Error (from exception handler — don't call directly in routes)
return error_response(message="Booking not found", code="NOT_FOUND", status_code=404)
# → { "success": false, "error": { "code": "NOT_FOUND", "message": "..." }, "request_id": "..." }
```

### Pydantic Response Models

Define explicit Pydantic schemas for every response model. Never return ORM objects directly — always call `.model_validate()` or construct via `from_orm`:

```python
class BookingResponse(BaseModel):
    id: UUID
    temple_id: UUID
    primary_devotee_name: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# In route:
booking = await BookingService.get(db, booking_id)
return success_response(data=BookingResponse.model_validate(booking).model_dump())
```

### Sensitive Field Masking

Never return full financial account numbers. Mask in the schema:

```python
class BankAccountResponse(BaseModel):
    id: UUID
    account_holder_name: str
    bank_name: str
    masked_account_number: str  # Only last 4 digits
    ifsc_code: str
    # ← NO full account_number field in this schema
```

---

## 15. Error Handling Standards

### Exception Hierarchy

```python
# Base application exception
class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

# Specific exceptions
class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: str = ""):
        super().__init__(f"{resource} not found: {resource_id}", status_code=404)

class ConflictError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409)

class ForbiddenError(AppException):
    def __init__(self, message: str = "You do not have permission for this action"):
        super().__init__(message, status_code=403)
```

### Where to Raise Exceptions

- **Service layer:** Raise `AppException` subclasses for business rule violations
- **Route layer:** Never catch and re-raise — let the global exception handler deal with it
- **Repository layer:** Let `SQLAlchemyError` propagate — the global handler catches it

```python
# ✅ Correct — raise from service
class BookingService:
    @staticmethod
    async def get_booking(db: AsyncSession, booking_id: UUID, temple_id: UUID) -> ArchanaBooking:
        booking = await db.get(ArchanaBooking, booking_id)
        if not booking or booking.temple_id != temple_id:
            raise NotFoundError("ArchanaBooking", str(booking_id))
        return booking

# ❌ Wrong — raising HTTPException from service (couples service to HTTP layer)
class BookingService:
    @staticmethod
    async def get_booking(db: AsyncSession, booking_id: UUID) -> ArchanaBooking:
        booking = await db.get(ArchanaBooking, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Not found")  # ❌
```

### Frontend Error Handling

Always extract the error message using the established pattern from `api.ts`:

```typescript
try {
  const response = await api.post('/archana-bookings', payload);
  toast.success('Booking created!');
} catch (error: unknown) {
  // Use the extractErrorMessage utility or inline the pattern
  const message = 
    (error as { response?: { data?: { error?: { message?: string }; detail?: string; message?: string } } })
      ?.response?.data?.error?.message
    || (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    || 'An error occurred. Please try again.';
  toast.error(message);
}
```

---

## 16. Logging Standards

### Logger Setup

Every module file that needs logging must create its own logger with a hierarchical name:

```python
import logging
logger = logging.getLogger("tms.modules.finance.routes")
```

Naming convention: `tms.<module_path>` (e.g., `tms.services.archana_lifecycle`, `tms.modules.audit.chain_verification`)

### Log Levels

| Level | When to Use |
|---|---|
| `DEBUG` | Detailed diagnostic info (query plans, intermediate values) |
| `INFO` | Normal operational events (startup steps, record created) |
| `WARNING` | Unusual but recoverable situations (retry, fallback, deprecated path) |
| `ERROR` | Failure that affects one request (exception caught, DB error) |
| `CRITICAL` | System-level failure (audit chain corrupted, startup blocked) |

### Structured Logging Pattern

```python
# Include contextual fields via `extra` dict
logger.info(
    "Archana booking created",
    extra={
        "booking_id": str(booking.id),
        "temple_id": str(temple_id),
        "amount": booking.grand_total,
    }
)

# For errors, always include exc_info for stack trace
logger.error(
    "Failed to process settlement batch",
    exc_info=True,
    extra={"batch_id": str(batch_id)}
)

# NEVER log sensitive data
logger.info("Processing bank account", extra={
    "account_id": str(account.id),
    # ❌ NEVER: "account_number": account.account_number
})
```

### What to Always Log

1. Module startup events (seeds, verifications)
2. Background worker start/stop/errors
3. Every `CRITICAL` and `ERROR` with `exc_info=True`
4. Financial operation completion with amounts (not account numbers)
5. Audit chain verification results

### What to Never Log

1. Passwords, password hashes
2. JWT tokens
3. Full bank account numbers
4. UPI IDs
5. OTP codes

---

## 17. RBAC Standards

### Backend Role Enforcement

Use the established dependency functions. Never implement your own role check logic in a route:

```python
from app.api.deps import (
    get_current_user,        # Any authenticated user
    get_current_active_user, # Active (not deleted/suspended)
    get_temple_manager,      # TEMPLE_MANAGER | ADMIN | SUPERADMIN
    get_superadmin,          # SUPERADMIN only
)

# For granular permission checks, use the permission utility:
from app.core.permissions import require_permission

@router.post("/settlement-batches/{id}/approve")
async def approve_batch(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_superadmin),  # Only superadmin
):
    ...
```

### Frontend Permission Enforcement

```typescript
import { useAuthStore } from '@/store/authStore';
import { hasPermission, SYSTEM_PERMISSIONS } from '@/utils/permissionUtils';
import { RBAC } from '@/utils/rbac';

function MyComponent() {
  const { user } = useAuthStore();
  
  // Check system permission
  const canApprove = hasPermission(user, 'inventory:approve_requests');
  
  // Check module-level access
  const canViewFinance = RBAC.canView('finance');
  
  return (
    <div>
      {canApprove && <Button onClick={handleApprove}>Approve</Button>}
    </div>
  );
}
```

### New Permission Rules

1. Every new sensitive action requires a corresponding permission string
2. Permission format: `module:action` (e.g., `archana:start_ritual`, `inventory:adjust_stock`)
3. Add to the global seed catalog in `StaffService.seed_global_permissions()`
4. Add display label to `uiTargetMapping` in `StaffManagement.tsx`

---

## 18. Security Checklist

Before submitting any PR, verify the following:

### Authentication
- [ ] All non-public endpoints use `Depends(get_current_user)` or stricter
- [ ] No hardcoded credentials in source code
- [ ] No `SECRET_KEY` or `JWT_SECRET` values in `.env.example` or committed files

### Authorization
- [ ] All tenant-scoped queries filter by `temple_id == current_user.temple_id`
- [ ] Superadmin-only operations use `Depends(get_superadmin)`
- [ ] STAFF operations check granular `system_permission` before proceeding

### Data
- [ ] No bank account numbers returned in plain text in any API response
- [ ] No passwords, tokens, or OTPs logged anywhere
- [ ] All `float` financial amounts use precision-safe handling (no string parsing of money)
- [ ] All UUIDs from user input are validated (FastAPI/Pydantic does this automatically)

### Financial Operations
- [ ] Every financial creation endpoint accepts `idempotency_key`
- [ ] `idempotency_key` uniqueness is checked BEFORE creating
- [ ] Transaction writes use `db.flush()` (not `db.commit()`) when more operations follow
- [ ] `ActivityLogService.emit_event()` is called BEFORE `db.commit()`

### API Design
- [ ] No sensitive data in URL path parameters (use POST body)
- [ ] Rate limiting applied to auth and payment endpoints
- [ ] File upload endpoints validate file type and size

---

## 19. Database Design Standards

### Mandatory Columns

Every new business table must have:

```python
id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
temple_id  = Column(UUID(as_uuid=True), ForeignKey("temples.id"), nullable=False, index=True)
created_at = Column(DateTime(timezone=True), default=utcnow)
updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
```

Exception: Platform-level tables not tied to a specific temple (e.g., `platform_financial_accounts`) omit `temple_id`.

### Soft Delete Convention

When records should be soft-deletable:

```python
deleted_at  = Column(DateTime(timezone=True), nullable=True)
is_active   = Column(Boolean, default=True, index=True)
```

Always filter `WHERE is_active = TRUE` in list queries.

### Index Rules

Add an index when:
- Filtering by the column in almost every query → add index
- The column is a FK → SQLAlchemy adds automatically if you specify `index=True` on the FK column
- Composite queries filter on two columns together → add composite index

```python
__table_args__ = (
    # Composite index for common query pattern
    Index("ix_transactions_temple_type_date", "temple_id", "type", "created_at"),
    UniqueConstraint("temple_id", "ref_id", name="uq_archana_booking_ref_id"),
)
```

### No Implicit Schema Migrations

Never use `create_all()` or `drop_all()` in application code. All schema changes go through Alembic.

```python
# ❌ NEVER in production code
Base.metadata.create_all(engine)

# ✅ Always via Alembic
# alembic upgrade head
```

### JSONB vs Separate Columns

Use JSONB for:
- Truly dynamic/variable-schema data (audit payload, metadata)
- Arrays that don't need relational joins

Use separate columns for:
- Fields that are queried, filtered, or sorted
- Fields that appear in reports
- Fields that have foreign key constraints

---

## 20. Service Layer Rules

The service layer contains all **business logic**. It is the only layer that:
- Makes decisions (should this operation be allowed?)
- Coordinates multiple repository calls
- Emits audit events
- Manages transaction boundaries

### Service Class Structure

```python
class ArchanaBookingService:
    """Service for archana booking business operations."""
    
    @staticmethod
    async def create_booking(
        db: AsyncSession,
        temple_id: UUID,
        user_id: UUID,
        payload: ArchanaBookingCreate,
    ) -> ArchanaBooking:
        """Create a booking with idempotency and audit trail."""
        
        # 1. Check idempotency
        existing = await ArchanaRepository.get_by_idempotency_key(
            db, temple_id, payload.idempotency_key
        )
        if existing:
            return existing  # Idempotent — return existing record
        
        # 2. Business rules
        if not payload.items:
            raise ValueError("At least one archana item is required")
        
        # 3. Create the entity
        booking = ArchanaBooking(
            temple_id=temple_id,
            **payload.model_dump(exclude={"idempotency_key"})
        )
        db.add(booking)
        await db.flush()  # Get the ID without committing
        
        # 4. Emit audit event (BEFORE commit)
        await ActivityLogService.emit_event(
            db=db,
            temple_id=temple_id,
            actor_id=user_id,
            action="ARCHANA_BOOKING_CREATED",
            module="archana",
            payload={"booking_id": str(booking.id), "amount": booking.grand_total}
        )
        
        # 5. Commit (all or nothing)
        await db.commit()
        await db.refresh(booking)
        return booking
```

### Service Rules

1. **Services are stateless** — all context passed as parameters
2. **One service method, one transaction** — a service method either commits or raises; never partially commits
3. **Audit before commit** — `emit_event()` always before `db.commit()`
4. **Never call `db.commit()` twice** in one service method
5. **Never import from route files** — service layer must not depend on HTTP layer

---

## 21. Repository Layer Rules

The repository layer contains **only database queries**. No business logic, no transaction commits.

```python
class ArchanaRepository:
    """Data access for ArchanaBooking."""
    
    @staticmethod
    async def get_booking_by_id(
        db: AsyncSession,
        booking_id: UUID,
        temple_id: UUID,
    ) -> ArchanaBooking | None:
        """Fetch a single booking by ID scoped to temple."""
        result = await db.execute(
            select(ArchanaBooking)
            .filter(
                ArchanaBooking.id == booking_id,
                ArchanaBooking.temple_id == temple_id,
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_bookings(
        db: AsyncSession,
        temple_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ArchanaBooking]:
        """List bookings for a temple with pagination."""
        result = await db.execute(
            select(ArchanaBooking)
            .filter(ArchanaBooking.temple_id == temple_id)
            .order_by(ArchanaBooking.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())
```

### Repository Rules

1. **No `db.commit()` in repositories** — only services commit
2. **`db.flush()` is allowed** in repositories when the service needs the generated ID before committing
3. **All queries must be tenant-scoped** — always filter by `temple_id`
4. **No business logic** — if you find yourself writing an `if` statement based on field values, move that to the service

---

## 22. Transaction Ownership Rules

> [!CAUTION]
> This is the most common source of bugs. Read carefully.

### The Rule

**One service method = one transaction.** The service method is the transaction owner.

```
Route function
    ↓ calls
Service method (OWNS the transaction)
    ↓ calls
Repository methods (operate within the transaction)
    ↓ uses
db session (the shared transaction context)
```

### Correct Transaction Sequence

```python
async def perform_complex_operation(db: AsyncSession, ...):
    # 1. All repository operations within the same session
    entity_a = EntityA(...)
    db.add(entity_a)
    await db.flush()  # Assign ID without committing
    
    entity_b = EntityB(parent_id=entity_a.id, ...)
    db.add(entity_b)
    await db.flush()
    
    # 2. Emit audit event (still within the same uncommitted transaction)
    await ActivityLogService.emit_event(db=db, ...)
    
    # 3. Single commit at the end
    await db.commit()
    
    # 4. Refresh to load DB-computed fields
    await db.refresh(entity_a)
    return entity_a
```

### Common Mistakes

```python
# ❌ Wrong: Double commit
async def bad_service(db):
    db.add(entity_a)
    await db.commit()  # ← First commit
    
    # Audit event is now in a SEPARATE transaction
    await ActivityLogService.emit_event(db=db, ...)  # ← This might fail silently
    await db.commit()  # ← Second commit

# ❌ Wrong: Audit after commit
async def bad_service(db):
    db.add(entity)
    await db.commit()  # ← Business data saved
    
    await ActivityLogService.emit_event(db=db, ...)  # ← Audit is NOT atomic!
    await db.commit()

# ✅ Correct: Audit before commit
async def good_service(db):
    db.add(entity)
    await db.flush()  # Get ID
    
    await ActivityLogService.emit_event(db=db, ...)  # ← Same transaction
    await db.commit()  # ← Everything commits atomically
```

---

## 23. Audit Logging Rules

### When to Log

Log every action that:
- Creates, modifies, or deletes financial data
- Creates, modifies, or deletes user or role data
- Approves or rejects any governance request
- Changes temple status or configuration
- Accesses sensitive data (bank account number reveal)

### How to Log

```python
from app.modules.audit.services.activity_log_service import ActivityLogService

# Inside a service method, BEFORE db.commit():
await ActivityLogService.emit_event(
    db=db,
    temple_id=temple_id,          # UUID of the temple
    actor_id=current_user.id,     # UUID of the user performing the action
    action="BANK_ACCOUNT_VERIFIED",  # SCREAMING_SNAKE_CASE action name
    module="finance",              # Module name (lowercase)
    payload={                      # Relevant context (no sensitive data)
        "account_id": str(account.id),
        "account_holder": account.account_holder_name,
        "verified_by": str(current_user.id),
    }
)
```

### Action Name Conventions

Use `MODULE_ENTITY_ACTION` format:
- `ARCHANA_BOOKING_CREATED`
- `ARCHANA_BOOKING_CANCELLED`
- `FINANCE_BANK_ACCOUNT_VERIFIED`
- `FINANCE_SETTLEMENT_BATCH_APPROVED`
- `INVENTORY_STOCK_ADJUSTED`
- `AUTH_USER_SUSPENDED`
- `RBAC_ROLE_PERMISSION_UPDATED`

### Platform-Level Actions (No Temple)

When the action is platform-scoped (not tied to a specific temple):

```python
SENTINEL_TEMPLE_ID = UUID("00000000-0000-0000-0000-000000000000")

await ActivityLogService.emit_event(
    db=db,
    temple_id=SENTINEL_TEMPLE_ID,  # ← Platform sentinel, NOT None
    actor_id=current_user.id,
    action="PLATFORM_ACCOUNT_CREATED",
    module="finance",
    payload={"account_id": str(account.id)}
)
```

> [!CAUTION]
> `temple_id` is NOT NULL in `activity_outbox`. Passing `None` or `null` will cause an `IntegrityError`.

---

## 24. Cache Management Rules

### When to Cache

Cache only:
- Computed aggregations that are expensive to recalculate (settlement dashboard)
- Reference data that changes rarely (permission catalog)
- Public portal bootstrap data (temple public info)

### When NOT to Cache

Never cache:
- Financial transaction lists (must always be real-time)
- User authentication state (must reflect current DB state)
- Pending approval queues (must be real-time)

### Cache Invalidation Rule

**Every write operation that affects cached data must invalidate the cache.**

If you add a new write endpoint for a domain that has a cached read, you must invalidate the cache in the write path:

```python
from app.core.redis_client import get_redis

async def invalidate_settlement_cache(temple_id: UUID) -> None:
    redis = await get_redis()
    cache_key = f"finance:settlement_dashboard:{temple_id}"
    await redis.delete(cache_key)
```

---

## 25. Redis Usage Guidelines

### Connection Pattern

Always use the Redis client from `app.core.redis_client`:

```python
from app.core.redis_client import get_redis

async def my_cached_function(key: str) -> dict | None:
    redis = await get_redis()
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    return None
```

### Key Naming Convention

```
<domain>:<entity>:<identifier>
# Examples:
finance:settlement_dashboard:<temple_id>
archana:catalog:<temple_id>
auth:permissions_seed:global
```

### TTL Rules

Always set a TTL on cached values. Never cache indefinitely:

```python
# Cache for 5 minutes
await redis.setex(cache_key, 300, json.dumps(data))

# Cache for 1 hour
await redis.setex(cache_key, 3600, json.dumps(data))
```

### Graceful Degradation

Always handle Redis connection failures gracefully — Redis being down should not crash the application:

```python
async def get_cached_dashboard(temple_id: UUID) -> dict | None:
    try:
        redis = await get_redis()
        cached = await redis.get(f"finance:dashboard:{temple_id}")
        if cached:
            return json.loads(cached)
    except Exception:
        logger.warning("Redis unavailable, serving fresh data")
    return None  # Fall through to DB
```

---

## 26. Background Worker Guidelines

### Current Workers (Do Not Modify Without Review)

| Worker | Interval | File |
|---|---|---|
| `archana_completion_loop` | 60s | `services/archana_lifecycle_service.py` |
| `reservation_cleanup_loop` | 60s | `tasks/background_jobs.py` |
| `payment_expiry_loop` | 60s | `services/devotee_booking_service.py` |
| `outbox_worker` | Continuous | `modules/audit/services/activity_log_processor.py` |

### Rules for Adding a New Worker

1. **Workers must be idempotent** — if the process dies mid-run, restarting should produce the same final state
2. **Workers must handle their own exceptions** — an unhandled exception in a worker kills the `asyncio.create_task`
3. **Workers must log start/stop/errors** using the structured logger
4. **Workers should not hold a DB session across sleep intervals** — open a new session per iteration

```python
# ✅ Correct background worker pattern
async def my_cleanup_loop():
    while True:
        try:
            async with AsyncSessionLocal() as db:  # New session per iteration
                await MyService.run_cleanup(db)
        except Exception as e:
            logger.error("Error in my_cleanup_loop: %s", str(e), exc_info=True)
        await asyncio.sleep(300)  # Sleep between iterations

# Register in real_main.py lifespan, before the yield:
asyncio.create_task(my_cleanup_loop())
```

### Graceful Shutdown

If your worker needs to be shut down gracefully (like the outbox worker), use an `asyncio.Event`:

```python
async def my_stoppable_loop(shutdown_event: asyncio.Event):
    while not shutdown_event.is_set():
        try:
            await do_work()
        except Exception as e:
            logger.error(...)
        await asyncio.sleep(60)

# In lifespan:
shutdown_event = asyncio.Event()
task = asyncio.create_task(my_stoppable_loop(shutdown_event))
yield
shutdown_event.set()
await asyncio.wait_for(task, timeout=10.0)
```

---

## 27. Testing Standards

> [!NOTE]
> The test infrastructure for this project is currently being established. These standards describe the target state. Write tests for all new code going forward.

### Test File Location

```
backend/
└── tests/
    ├── unit/
    │   ├── services/          # Unit tests for service methods
    │   └── repositories/      # Unit tests for repo queries
    ├── integration/
    │   ├── api/               # API integration tests (full request/response)
    │   └── db/                # Database integration tests
    └── conftest.py            # Shared fixtures
```

### Test Naming Convention

```python
# File: tests/unit/services/test_archana_service.py
# Class: TestArchanaService (optional)
# Function: test_<scenario>_<expected_outcome>

def test_create_booking_with_duplicate_idempotency_key_returns_existing():
    ...

def test_create_booking_without_items_raises_validation_error():
    ...

def test_create_booking_writes_audit_event_before_commit():
    ...
```

---

## 28. Unit Test Patterns

### Mocking the DB Session

```python
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

@pytest.mark.asyncio
async def test_create_booking_idempotent():
    # Arrange
    mock_db = AsyncMock()
    existing_booking = MagicMock(spec=ArchanaBooking)
    existing_booking.id = uuid4()
    
    with patch.object(
        ArchanaRepository,
        'get_by_idempotency_key',
        return_value=existing_booking
    ):
        # Act
        result = await ArchanaBookingService.create_booking(
            db=mock_db,
            temple_id=uuid4(),
            user_id=uuid4(),
            payload=ArchanaBookingCreate(
                primary_devotee_name="Test",
                booking_date=datetime.now(),
                items=[],
                idempotency_key="test-key-123"
            )
        )
    
    # Assert
    assert result == existing_booking
    mock_db.add.assert_not_called()  # Should not create a new record
```

### Testing Service Business Rules

```python
@pytest.mark.asyncio
async def test_create_booking_without_items_raises():
    mock_db = AsyncMock()
    
    with patch.object(ArchanaRepository, 'get_by_idempotency_key', return_value=None):
        with pytest.raises(ValueError, match="At least one archana item"):
            await ArchanaBookingService.create_booking(
                db=mock_db,
                temple_id=uuid4(),
                user_id=uuid4(),
                payload=ArchanaBookingCreate(
                    primary_devotee_name="Test",
                    booking_date=datetime.now(),
                    items=[],  # ← empty list
                    idempotency_key="test-key"
                )
            )
```

---

## 29. Integration Test Patterns

### Test Client Setup

```python
# conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.real_main import app

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/denumrutham_test"

@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

@pytest.fixture
async def auth_headers(client):
    """Get auth headers for a seeded test manager user."""
    response = await client.post("/api/v1/auth/login", json={
        "user_id": "test_manager",
        "password": "TestPassword123!"
    })
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### Integration Test Pattern

```python
@pytest.mark.asyncio
async def test_create_archana_booking_returns_201(client, auth_headers):
    payload = {
        "primary_devotee_name": "Integration Test Devotee",
        "booking_date": "2026-07-01T09:00:00Z",
        "items": [{"archana_id": "...", "price": 100.0}],
        "idempotency_key": str(uuid4())
    }
    
    response = await client.post(
        "/api/v1/archana-bookings",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["primary_devotee_name"] == "Integration Test Devotee"

@pytest.mark.asyncio
async def test_create_booking_is_idempotent(client, auth_headers):
    key = str(uuid4())
    payload = { ..., "idempotency_key": key }
    
    # First call
    r1 = await client.post("/api/v1/archana-bookings", json=payload, headers=auth_headers)
    # Second call with same key
    r2 = await client.post("/api/v1/archana-bookings", json=payload, headers=auth_headers)
    
    assert r1.status_code == 201
    assert r2.status_code == 200  # Or 201 — same booking returned
    assert r1.json()["data"]["id"] == r2.json()["data"]["id"]
```

---

## 30. End-to-End Test Guidelines

E2E tests cover complete user flows from the browser through the API to the database. Currently, E2E tests are not implemented but follow these guidelines when adding them:

1. Use a dedicated test database — never run E2E tests against production
2. Seed a fresh database state before each test run
3. Test the critical paths:
   - Archana booking → payment → receipt
   - Hall booking → refund request → approval
   - Staff invite → login → module access
   - Temple onboarding → claim → activation
4. Clean up created data after tests
5. Run E2E tests in CI only, not on every local development cycle

---

## 31. Git Branch Strategy

### Branch Naming

```
feature/<ticket-id>-short-description
fix/<ticket-id>-short-description
hotfix/<ticket-id>-short-description
chore/<description>
docs/<description>

# Examples:
feature/DENU-142-add-offering-reconciliation
fix/DENU-201-archana-idempotency-race-condition
hotfix/DENU-210-fix-temple-id-null-audit-outbox
chore/upgrade-fastapi-0.115
docs/update-developer-guide
```

### Branch Lifetime

- Feature branches: Delete after merge
- Hotfix branches: Delete after merge and verification
- `main`: Protected — direct pushes disabled; always deploy-ready

### Commit Message Format

```
<type>(<scope>): <short description>

[optional body — explain WHY not WHAT]

[optional footer — ticket references]
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`

```
feat(finance): add UPI account type to platform accounts

Added UPI_ID as a distinct account_type enum value for platform accounts.
Required for collecting UPI payments from online temple store.
Includes field masking in all response models.

Closes DENU-178
```

---

## 32. Pull Request Standards

### PR Title

Match the commit message format: `feat(archana): add bulk booking endpoint`

### PR Description Template

```markdown
## Summary
<!-- 2-3 sentences explaining what this PR does and WHY -->

## Changes
- [ ] Backend: New model `XYZ` in `modules/xxx/models/`
- [ ] Backend: New endpoint `POST /xyz`
- [ ] Frontend: New page `XyzModule.tsx`
- [ ] Migration: `alembic/versions/<hash>_add_xyz.py`

## Testing Done
- [ ] Ran `alembic upgrade head` locally — no errors
- [ ] Tested API via Swagger UI
- [ ] Tested UI end-to-end in browser
- [ ] No regressions in existing features

## Security Checklist
- [ ] All endpoints require authentication
- [ ] Tenant isolation enforced (all queries filter by temple_id)
- [ ] No sensitive data in logs or API responses
- [ ] Audit events emitted before db.commit()

## Breaking Changes
<!-- List any API or DB schema changes that affect existing consumers -->
```

### PR Size Guidelines

- **Small PR:** < 200 lines changed — preferred
- **Medium PR:** 200-500 lines — acceptable
- **Large PR:** > 500 lines — requires justification; consider splitting

---

## 33. Code Review Checklist

For **reviewers**, verify:

### Backend
- [ ] All new routes registered in `api.py`
- [ ] All new models exported in `models/__init__.py`
- [ ] Alembic migration created for schema changes
- [ ] `db.commit()` called only once per service method
- [ ] `emit_event()` called before `db.commit()`
- [ ] `temple_id` filter on all business queries
- [ ] `idempotency_key` handling on financial create endpoints
- [ ] No sensitive data returned in response schemas
- [ ] No sensitive data in log statements
- [ ] Docstrings on public service/route methods
- [ ] `response_model` declared on all route handlers

### Frontend
- [ ] New modules use `safeLazy` and `ModuleErrorBoundary`
- [ ] API errors handled with `toast.error()`
- [ ] No hardcoded API URLs (all go through `api.ts`)
- [ ] TypeScript types defined for all API response shapes
- [ ] No `any` types without justification comment
- [ ] Route added to `App.tsx` with appropriate guard

### Both
- [ ] No `console.log()` committed (use logger)
- [ ] No commented-out code blocks
- [ ] Tests added or updated for changed logic
- [ ] Documentation updated if public API changed

---

## 34. Performance Best Practices

### Database

1. **Avoid N+1 queries** — use `selectinload()` or `joinedload()` for relationships accessed in loops

```python
# ❌ N+1 — one query per booking member
bookings = await list_bookings(db, temple_id)
for booking in bookings:
    members = await get_members(db, booking.id)  # N additional queries

# ✅ Eager load — one query with JOIN
result = await db.execute(
    select(ArchanaBooking)
    .options(selectinload(ArchanaBooking.members))
    .filter(...)
)
```

2. **Paginate all list endpoints** — never return unbounded lists

```python
@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = 50,  # Default + cap
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    ...
):
    if limit > 200:
        limit = 200  # Cap at 200
```

3. **Use `db.execute(select(...))` not `db.query()`** — `db.query()` is the sync/legacy API

4. **Index your FK columns** — add `index=True` to every ForeignKey column

### Frontend

1. **Memoize expensive calculations** with `useMemo`
2. **Debounce search inputs** — wait 300ms after typing stops before fetching
3. **Avoid fetching in `useEffect` on every render** — use proper dependency arrays
4. **Don't import entire lodash/date-fns** — use named imports

```typescript
// ✅ Named import (tree-shaken)
import { format } from 'date-fns';

// ❌ Full import (entire library bundled)
import * as dateFns from 'date-fns';
```

---

## 35. Common Anti-Patterns

### Backend Anti-Patterns

❌ **Calling `db.commit()` in a repository**
```python
# ❌ Wrong
class BookingRepository:
    async def create(db, booking):
        db.add(booking)
        await db.commit()  # ← Repositories never commit
```

❌ **Raising `HTTPException` from service layer**
```python
# ❌ Couples service to HTTP protocol
raise HTTPException(status_code=404, detail="Not found")

# ✅ Correct
raise NotFoundError("ArchanaBooking", str(booking_id))
```

❌ **Returning ORM objects directly from routes**
```python
# ❌ No response_model, returns ORM object
@router.get("/{id}")
async def get_booking(id: UUID, db=Depends(get_db)):
    return await db.get(ArchanaBooking, id)  # ← Unvalidated ORM
```

❌ **Using `datetime.utcnow()` (deprecated in Python 3.12)**
```python
# ❌
from datetime import datetime
Column(DateTime, default=datetime.utcnow)

# ✅
def utcnow():
    return datetime.now(timezone.utc)
Column(DateTime(timezone=True), default=utcnow)
```

❌ **Opening a new DB session in a route instead of using `Depends(get_db)`**
```python
# ❌ Bypasses request scoping
async def my_route():
    async with AsyncSessionLocal() as db:
        ...
```

❌ **Emitting audit events after `db.commit()`**
```python
# ❌ Audit event is NOT atomic with business data
await db.commit()
await ActivityLogService.emit_event(...)  # ← Separate transaction!
```

### Frontend Anti-Patterns

❌ **Using `any` to silence TypeScript**
```typescript
const data = response.data as any;  // ❌ — define the interface
```

❌ **Direct API calls without `api.ts`**
```typescript
// ❌ Bypasses auth headers and error handling
const res = await fetch('http://localhost:8000/api/v1/bookings');
```

❌ **`useEffect` without cleanup for subscriptions/intervals**
```typescript
// ❌ Memory leak
useEffect(() => {
  const interval = setInterval(fetchData, 5000);
  // Missing cleanup
}, []);

// ✅
useEffect(() => {
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);  // Cleanup
}, []);
```

❌ **Mutations in render functions**
```typescript
// ❌ Side effects in render
function MyComponent() {
  localStorage.setItem('key', 'value');  // ← Should be in useEffect
  return <div />;
}
```

---

## 36. Debugging Guide

### Backend Debugging

**1. Check Railway logs first:**
```bash
railway logs --tail 100
```

**2. Check startup sequence:**  
Startup errors write to `audit_integrity_verification_reports`. Query this table to see what happened:
```sql
SELECT status, details, verified_at 
FROM audit_integrity_verification_reports 
ORDER BY verified_at DESC 
LIMIT 5;
```

**3. Run the API locally with detailed logging:**
```bash
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

**4. Test a specific endpoint directly:**
```bash
curl -X POST http://localhost:8000/api/v1/archana-bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"primary_devotee_name": "Test", ...}'
```

**5. Check Alembic migration state:**
```bash
alembic current   # Shows current revision
alembic history   # Shows full history
alembic check     # Checks for pending migrations
```

**6. Common error: `IntegrityError: null value in column temple_id`**  
You're calling `ActivityLogService.emit_event()` with `temple_id=None`. Use the sentinel UUID for platform-level events.

**7. Common error: `DetachedInstanceError`**  
You're accessing a lazy relationship after the session has closed. Add `selectinload()` to the query or call `await db.refresh(instance)`.

### Frontend Debugging

**1. Check network tab in DevTools** — look for 4xx/5xx responses

**2. Check `authStore` state in Redux DevTools (Zustand DevTools extension)**

**3. Verify `VITE_API_BASE_URL` in your `.env.local` — it must match the running backend URL

**4. Module chunk load error** — usually a deployment mismatch. Hard-refresh with Ctrl+Shift+R.

**5. Common: `user is undefined` in a component** — ensure you're calling `useAuthStore()` inside the component, not at module level.

**6. CORS error in browser** — add `http://localhost:5173` to `CORS_ALLOWED_ORIGINS` in your local `.env` if not already there.

---

## 37. Adding a New Module

Follow these steps to add a complete new domain module (e.g., "Events & Ceremonies"):

### Step 1: Backend — Create the module structure

```bash
mkdir -p backend/app/modules/ceremonies/models
mkdir -p backend/app/modules/ceremonies/schemas
mkdir -p backend/app/modules/ceremonies/services
mkdir -p backend/app/modules/ceremonies/repositories
mkdir -p backend/app/modules/ceremonies/routes
touch backend/app/modules/ceremonies/__init__.py
touch backend/app/modules/ceremonies/models/__init__.py
touch backend/app/modules/ceremonies/schemas/__init__.py
touch backend/app/modules/ceremonies/services/__init__.py
touch backend/app/modules/ceremonies/repositories/__init__.py
touch backend/app/modules/ceremonies/routes/__init__.py
```

### Step 2: Backend — Create the SQLAlchemy model

```python
# backend/app/modules/ceremonies/models/ceremony_models.py
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class CeremonyStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Ceremony(Base):
    """Temple ceremony / event record."""
    __tablename__ = "ceremonies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id = Column(UUID(as_uuid=True), ForeignKey("temples.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(CeremonyStatus), default=CeremonyStatus.UPCOMING)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
```

### Step 3: Backend — Create Pydantic schemas

```python
# backend/app/modules/ceremonies/schemas/ceremony_schemas.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class CeremonyCreate(BaseModel):
    name: str
    description: str | None = None
    scheduled_at: datetime

class CeremonyResponse(BaseModel):
    id: UUID
    temple_id: UUID
    name: str
    description: str | None
    scheduled_at: datetime
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

### Step 4: Backend — Create repository

```python
# backend/app/modules/ceremonies/repositories/ceremony_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.modules.ceremonies.models.ceremony_models import Ceremony

class CeremonyRepository:
    @staticmethod
    async def list_for_temple(db: AsyncSession, temple_id: UUID) -> list[Ceremony]:
        result = await db.execute(
            select(Ceremony)
            .filter(Ceremony.temple_id == temple_id)
            .order_by(Ceremony.scheduled_at.asc())
        )
        return list(result.scalars().all())
```

### Step 5: Backend — Create service

```python
# backend/app/modules/ceremonies/services/ceremony_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.modules.ceremonies.models.ceremony_models import Ceremony
from app.modules.ceremonies.schemas.ceremony_schemas import CeremonyCreate
from app.modules.audit.services.activity_log_service import ActivityLogService

class CeremonyService:
    @staticmethod
    async def create_ceremony(
        db: AsyncSession,
        temple_id: UUID,
        actor_id: UUID,
        payload: CeremonyCreate,
    ) -> Ceremony:
        ceremony = Ceremony(temple_id=temple_id, **payload.model_dump())
        db.add(ceremony)
        await db.flush()
        
        await ActivityLogService.emit_event(
            db=db, temple_id=temple_id, actor_id=actor_id,
            action="CEREMONY_CREATED", module="ceremonies",
            payload={"ceremony_id": str(ceremony.id), "name": ceremony.name}
        )
        
        await db.commit()
        await db.refresh(ceremony)
        return ceremony
```

### Step 6: Backend — Create router

```python
# backend/app/modules/ceremonies/routes/ceremony_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_temple_manager
from app.modules.auth.models.auth_models import User
from app.modules.ceremonies.services.ceremony_service import CeremonyService
from app.modules.ceremonies.schemas.ceremony_schemas import CeremonyCreate, CeremonyResponse
from app.core.response import success_response

router = APIRouter()

@router.get("/", response_model=list[CeremonyResponse])
async def list_ceremonies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_temple_manager),
):
    """List all ceremonies for the current temple."""
    ceremonies = await CeremonyService.list_ceremonies(db, current_user.temple_id)
    return [CeremonyResponse.model_validate(c) for c in ceremonies]

@router.post("/", response_model=CeremonyResponse, status_code=201)
async def create_ceremony(
    payload: CeremonyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_temple_manager),
):
    """Create a new ceremony."""
    ceremony = await CeremonyService.create_ceremony(
        db, current_user.temple_id, current_user.id, payload
    )
    return CeremonyResponse.model_validate(ceremony)
```

### Step 7: Backend — Register router in `api.py`

```python
# In backend/app/api/api_v1/api.py — add:
from app.modules.ceremonies.routes.ceremony_routes import router as ceremonies_router
api_router.include_router(ceremonies_router, prefix="/manager/ceremonies", tags=["Ceremonies"])
```

### Step 8: Backend — Add Alembic migration

```bash
alembic revision --autogenerate -m "add_ceremonies_module"
# Review the generated file, then:
alembic upgrade head
```

### Step 9: Frontend — Create the page component

```typescript
// frontend/src/pages/manager/CeremoniesModule.tsx
import React, { useState, useEffect } from 'react';
import api from '@/services/api';

interface Ceremony {
  id: string;
  name: string;
  scheduled_at: string;
  status: string;
}

export default function CeremoniesModule() {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCeremonies();
  }, []);

  const fetchCeremonies = async () => {
    try {
      const res = await api.get('/manager/ceremonies/');
      setCeremonies(res.data);
    } catch {
      // error handled by api.ts interceptor
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ceremonies</h1>
      {ceremonies.map(c => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  );
}
```

### Step 10: Frontend — Add route in `App.tsx`

```tsx
// In App.tsx — add the lazy import:
const CeremoniesModule = safeLazy(() => import('@/pages/manager/CeremoniesModule'), 'Ceremonies');

// In the manager routes section:
<Route
  path="ceremonies"
  element={
    <RBACProtectedRoute moduleName="ceremonies">
      <ModuleErrorBoundary moduleName="Ceremonies">
        <Suspense fallback={<div>Loading...</div>}>
          <CeremoniesModule />
        </Suspense>
      </ModuleErrorBoundary>
    </RBACProtectedRoute>
  }
/>
```

### Step 11: Frontend — Add to `ModuleRegistry.ts`

```typescript
{
  id: 'ceremonies',
  name: 'Ceremonies',
  route: '/manager/ceremonies',
  requiredPermissions: 'VIEW_DASHBOARD',
  description: 'Manage temple ceremonies and events'
}
```

---

## 38. Adding a New API Endpoint

For a new endpoint in an **existing** module:

1. Add the Pydantic request/response schemas to `modules/<domain>/schemas/`
2. Add business logic to `modules/<domain>/services/`
3. Add DB query to `modules/<domain>/repositories/` (if needed)
4. Add the route function to `modules/<domain>/routes/`
5. **No changes needed to `api.py`** — the router is already registered
6. Write the corresponding frontend API call in the relevant service file

---

## 39. Adding a New Database Table

1. Create or add to a model file in `modules/<domain>/models/`
2. Export from `app/models/__init__.py` if it needs to be imported by other modules
3. Create Alembic migration: `alembic revision --autogenerate -m "add_<table_name>"`
4. Review the generated migration file carefully
5. Run migration: `alembic upgrade head`

**Checklist:**
- [ ] UUID primary key
- [ ] `temple_id` FK with index (for tenant-scoped tables)
- [ ] `created_at` and `updated_at` timestamps
- [ ] `utcnow` function used for defaults (not `datetime.utcnow`)
- [ ] Meaningful indexes on frequently-queried columns
- [ ] `nullable=False` on required fields
- [ ] Enum fields use `str` enum subclass

---

## 40. Adding a New React Page

1. Create `frontend/src/pages/<zone>/<PageName>.tsx`
2. Add the lazy import in `App.tsx`:
   ```typescript
   const PageName = safeLazy(() => import('@/pages/<zone>/PageName'), 'PageName');
   ```
3. Add the route in the appropriate `<Route>` section in `App.tsx`
4. Wrap with `ModuleErrorBoundary` and `Suspense`
5. Add appropriate route guard (`ProtectedRoute` or `RBACProtectedRoute`)
6. If it's a manager module, add to `ModuleRegistry.ts`

---

## 41. Adding Permissions

### Backend

1. Add the permission string to `StaffService.seed_global_permissions()`:
```python
SystemPermission(
    name="ceremonies:create",
    description="Create new temple ceremonies",
    module="ceremonies"
)
```

2. Check the permission in the route:
```python
# In route or service, check system permission
if not current_user.system_role or not any(
    p.name == "ceremonies:create" 
    for p in current_user.system_role.permissions
):
    raise ForbiddenError("Insufficient permissions to create ceremonies")
```

### Frontend

1. Add to `uiTargetMapping` in `StaffManagement.tsx`:
```typescript
'ceremonies:create': {
  label: 'Create Ceremony',
  description: 'Allows creating new ceremony records'
}
```

2. Use in components:
```typescript
const canCreate = hasPermission(user, 'ceremonies:create');
{canCreate && <Button onClick={handleCreate}>Add Ceremony</Button>}
```

---

## 42. Updating Swagger

Swagger is automatically generated from:
1. **Route `response_model`** parameters
2. **Route docstrings** 
3. **Pydantic model field descriptions**

To improve Swagger documentation:

```python
# Add descriptions to Pydantic fields
class CeremonyCreate(BaseModel):
    name: str = Field(..., description="Name of the ceremony or event", example="Brahmotsavam 2026")
    scheduled_at: datetime = Field(..., description="Scheduled date and time in UTC ISO format")
    
# Add detailed route docstring
@router.post("/", response_model=CeremonyResponse)
async def create_ceremony(payload: CeremonyCreate, ...):
    """
    Create a new ceremony.
    
    **Required permission:** `ceremonies:create` OR TEMPLE_MANAGER role
    
    **Idempotency:** This endpoint does not require an idempotency key as ceremonies
    are uniquely identified by name and scheduled_at.
    """
```

---

## 43. Common Pitfalls

### Pitfall 1: Forgetting to Emit Audit Before Commit

**Symptom:** Business data saved but no audit trail.  
**Fix:** Always call `emit_event()` before `db.commit()`.

### Pitfall 2: `temple_id=None` in Audit Outbox

**Symptom:** `IntegrityError: null value in column "temple_id" of relation "activity_outbox"`  
**Fix:** Use the sentinel UUID `00000000-0000-0000-0000-000000000000` for platform-level events.

### Pitfall 3: Lazy Relationship Accessed After Session Closes

**Symptom:** `MissingGreenlet` or `DetachedInstanceError` when accessing `.members` on a booking  
**Fix:** Add `selectinload(ArchanaBooking.members)` to the query, or `await db.refresh(booking)`.

### Pitfall 4: Circular Import in Models

**Symptom:** `ImportError: cannot import name X from partially initialized module`  
**Fix:** Move shared imports to `app/models/__init__.py`. Use string-based relationship references where possible: `relationship("ArchanaBookingMember")`.

### Pitfall 5: Railway DB URL Format

**Symptom:** `sqlalchemy.exc.ArgumentError: Could not parse rfc1738 URL`  
**Fix:** Railway provides `postgres://` URLs. The config auto-normalizes to `postgresql+asyncpg://`. If bypassing config, normalize manually.

### Pitfall 6: Vite HMR Breaks on Zustand Store Update

**Symptom:** Store state resets unexpectedly during development  
**Fix:** Zustand stores with `persist` middleware need the storage key to be stable. Don't generate dynamic keys.

### Pitfall 7: Alembic Autogenerate Misses JSONB Columns

**Symptom:** Migration adds `JSON` type instead of `JSONB`  
**Fix:** Always review autogenerated migrations. Manually change `JSON` to `postgresql.JSONB()` for PostgreSQL-targeted columns.

### Pitfall 8: `double commit` Race Condition

**Symptom:** Intermittent `InvalidRequestError: Can't reconnect until invalid transaction is rolled back`  
**Fix:** Ensure each service method calls `db.commit()` exactly once. Review the call chain for multiple commits.

---

## 44. Frequently Asked Questions

**Q: Where is the main FastAPI app defined?**  
A: `backend/app/real_main.py`. The `backend/app/main.py` is just an import wrapper with error capture.

**Q: How do I add a new API endpoint?**  
A: See §38. Create schema → service → repository → route. Register in `api.py` only if it's a new router file.

**Q: Why does my background task die silently?**  
A: Unhandled exceptions in `asyncio.create_task()` are swallowed unless logged. Wrap your worker body in `try/except Exception as e: logger.error(...)`.

**Q: How do I test auth-protected endpoints locally?**  
A: Login via `POST /api/v1/auth/login` with seeded test credentials. Copy the `access_token` and use it as `Authorization: Bearer <token>`.

**Q: Why is `datetime.utcnow()` giving a warning?**  
A: It's deprecated in Python 3.12. Use `datetime.now(timezone.utc)` (the `utcnow()` helper defined in every model file).

**Q: How do I run only a specific migration?**  
A: `alembic upgrade <revision_id>` — use the 12-character hash from the migration file.

**Q: How do I find which migration created a specific table?**  
A: `grep -r "create_table.*'my_table'" alembic/versions/`

**Q: Can I call `db.commit()` in a route handler?**  
A: No. Route handlers delegate to services. Services own transactions. Routes just call services and return responses.

**Q: How do I add a field to an existing model?**  
A: Add the `Column()` to the model class → `alembic revision --autogenerate -m "add_field_to_table"` → review → `alembic upgrade head`. Update the Pydantic schema and frontend interface simultaneously.

**Q: Why is the frontend not picking up my backend changes?**  
A: Check `VITE_API_BASE_URL` in `.env.local`. Ensure the backend is running. Check the browser Network tab for the actual request URL and response.

**Q: How do I make a field optional in an existing NOT NULL column?**  
A: Two-step migration: (1) make nullable with a default, (2) optionally apply the default retroactively. Never drop `nullable=False` in a single migration without backfilling.

**Q: Where should I put a helper function used by 3 different modules?**  
A: `backend/app/services/` (for business logic) or `backend/app/core/` (for infrastructure utilities).

**Q: How is the `archana_bookings` table named now?**  
A: `archana_bookings` (as of migration `a9f1e2d3c4b5`). The Python class is `ArchanaBooking`. `EnterpriseArchanaBooking` is a backward-compat alias that resolves to the same class.

**Q: Who owns the `transactions` table?**  
A: It is the **Enterprise Master Ledger** and the Single Source of Truth for all financial flows. Every module that generates income or expense must write a `Transaction` record via `TransactionService`. Never write directly to the table.

**Q: Can I use raw SQL?**  
A: Prefer SQLAlchemy ORM. Use `op.execute(text(...))` in Alembic migrations for operations the ORM cannot express. In application code, raw SQL is permitted only when the ORM cannot express the query efficiently — must be reviewed and documented.

---

*End of Developer Guide*

---

**Document History:**

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | Antigravity (AI Engineering Assistant) | Initial version — produced by direct repository inspection |

**Next Review:** After any major architectural change, or when onboarding the first external contributor.
