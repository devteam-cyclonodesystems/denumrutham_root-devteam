# Denumrutham — Engineering Architecture Handover Document

**Classification:** Internal Engineering — Authoritative Reference  
**Version:** 1.0  
**Date:** 2026-06-25  
**Status:** Production Architecture — Frozen  

> [!IMPORTANT]
> This document reflects the production architecture as it exists on 2026-06-25. It was produced by direct inspection of the complete repository. It is not aspirational. Do not propose changes in this document — use ADRs for future decisions.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Business Vision](#2-business-vision)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Database Architecture](#7-database-architecture)
8. [Entity Relationship Overview](#8-entity-relationship-overview)
9. [Module-by-Module Architecture](#9-module-by-module-architecture)
10. [Authentication & RBAC](#10-authentication--rbac)
11. [Finance Architecture](#11-finance-architecture)
12. [Discovery Architecture](#12-discovery-architecture)
13. [Website Builder Architecture](#13-website-builder-architecture)
14. [Audit & Immutable Activity Architecture](#14-audit--immutable-activity-architecture)
15. [Notification Architecture](#15-notification-architecture)
16. [API Architecture](#16-api-architecture)
17. [Security Architecture](#17-security-architecture)
18. [Caching Strategy](#18-caching-strategy)
19. [Background Workers](#19-background-workers)
20. [Deployment Architecture](#20-deployment-architecture)
21. [Configuration Management](#21-configuration-management)
22. [Architectural Principles](#22-architectural-principles)
23. [Architecture Decision Records (ADR)](#23-architecture-decision-records)
24. [Data Ownership Matrix](#24-data-ownership-matrix)
25. [Single Source of Truth Matrix](#25-single-source-of-truth-matrix)
26. [Integration Points](#26-integration-points)
27. [Cross-Module Dependencies](#27-cross-module-dependencies)
28. [Extension Guidelines](#28-extension-guidelines)
29. [Known Technical Debt](#29-known-technical-debt)
30. [Future Architecture Roadmap](#30-future-architecture-roadmap)

---

## 1. Executive Overview

Denumrutham is a **multi-tenant, enterprise-grade Temple Management Platform (TMP)** that digitizes the complete operational lifecycle of Hindu temples across India.

The platform serves three distinct user classes:
- **Devotees** — Public worshippers who discover temples, book archana, donate, and interact via temple micro-portals
- **Temple Managers / Staff** — Temple administrators who run day-to-day operations across finance, inventory, bookings, HR, and communications
- **Platform Administrators (Superadmin)** — Denumrutham platform operators who govern temple onboarding, subscription billing, platform finance, and content quality

The system manages:
- Archana (ritual) bookings with queue management and priest assignment
- Hall venue bookings with refund governance
- Temple Kalavara inventory and procurement
- Temple store (products, POS, auctions)
- Enterprise-grade financial ledger, settlement, and bank governance
- Multi-level RBAC with maker-checker approval workflows
- Immutable cryptographic audit chain
- Temple micro-portals with custom website builder
- Platform-level advertisement system
- Devotee discovery platform with telemetry analytics

---

## 2. Business Vision

Denumrutham aims to be the **single operational backbone** for every temple in India, regardless of size. The business model is subscription SaaS (per-temple monthly/annual billing via Razorpay) with platform-level revenue from settlement convenience fees on online bookings.

**Core principles informing architecture:**
- Every temple is a tenant with strict data isolation
- Temple managers must be able to operate with minimal technical training
- Financial operations must be auditable and tamper-proof for regulatory compliance
- The platform must scale from a single-priest rural temple to a major pilgrimage site with hundreds of daily transactions

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Runtime | Python | 3.11+ |
| Framework | FastAPI | Latest |
| ORM | SQLAlchemy | 2.x (async) |
| Database Driver | asyncpg | Latest |
| Migrations | Alembic | Latest |
| Auth | PyJWT (HS256) | Latest |
| Validation | Pydantic v2 | 2.x |
| Config | pydantic-settings | Latest |
| Rate Limiting | slowapi | Latest |
| Metrics | prometheus-fastapi-instrumentator | Latest |
| Cache | Redis (aioredis) | 6+ |
| Logging | Python structlog / uvicorn | Latest |
| ASGI Server | Uvicorn | Latest |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Framework | React | 19.x |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | 8.x |
| Routing | React Router DOM | 7.x |
| State | Zustand | 5.x |
| HTTP Client | Axios | 1.x |
| Styling | Tailwind CSS | 4.x |
| Icons | Lucide React | Latest |
| Date Utils | date-fns | 4.x |
| Toast | Sonner | 2.x |
| Merge | clsx + tailwind-merge | Latest |

### Infrastructure
| Component | Technology |
|---|---|
| Database | PostgreSQL (Railway managed) |
| Cache | Redis (Railway managed) |
| Backend Hosting | Railway.app |
| Frontend Hosting | Vercel |
| File Storage | Local `static/uploads/` (Railway ephemeral volume) |
| Payment Gateway | Razorpay (webhook integration) |
| Monitoring | Prometheus (via instrumentator endpoint) |

---

## 4. Repository Structure

The repository is a **monorepo** with two independently-deployed applications.

```
Denumrutham/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py             # Bootstrap + Railway error capture entry point
│   │   ├── real_main.py        # FastAPI app construction, middleware, lifespan
│   │   ├── api/
│   │   │   ├── api_v1/
│   │   │   │   ├── api.py      # Master router — ALL routers registered here
│   │   │   │   ├── endpoints/  # Core/legacy endpoint files
│   │   │   │   └── routes/     # Audit, approvals, activity_logs routes
│   │   │   ├── deps.py         # Dependency injection (get_db, get_current_user, etc.)
│   │   │   └── routes/         # Shared route utilities
│   │   ├── core/
│   │   │   ├── config/config.py  # Settings (pydantic-settings)
│   │   │   ├── database/         # SQLAlchemy async engine & session
│   │   │   ├── middleware/        # RequestId, Logging, Security, HTTPS headers
│   │   │   ├── limiter.py         # slowapi rate limiter
│   │   │   ├── integrity.py       # Startup schema validation
│   │   │   ├── redis_client.py    # Redis connection pool
│   │   │   ├── exceptions.py      # AppException hierarchy
│   │   │   ├── response.py        # Standardized success_response/error_response
│   │   │   └── logging_config.py  # Structured logging setup
│   │   ├── modules/               # Domain modules (feature packages)
│   │   │   ├── analytics/         # Telemetry, dashboard aggregation
│   │   │   ├── attendance/        # HR / Payroll / Leaves
│   │   │   ├── audit/             # Immutable audit chain, outbox, governance
│   │   │   ├── auth/              # Users, RBAC, system roles, permissions
│   │   │   ├── billing/           # Transactions, payments, accounting, subscriptions
│   │   │   ├── bookings/          # Archana, hall bookings, devotees, inventory
│   │   │   ├── deployment/        # Deployment management endpoints
│   │   │   ├── finance/           # Enterprise finance (bank accounts, settlements)
│   │   │   ├── governance/        # Platform governance (claims, suggestions, ads, settings)
│   │   │   ├── inventory/         # Kalavara, store, procurement, suppliers
│   │   │   └── temple_management/ # Temple profiles, website settings, discovery
│   │   ├── models/                # Shared model imports (__init__.py)
│   │   ├── services/              # Cross-cutting services (staff, archana lifecycle, etc.)
│   │   ├── repositories/          # Data access layer (Repository pattern)
│   │   ├── tasks/                 # Background tasks (cleanup_expired_reservations)
│   │   ├── events/                # Event handlers (Domain Event Bus)
│   │   └── scripts/               # Admin/maintenance scripts
│   ├── alembic/
│   │   ├── env.py                 # Alembic async environment
│   │   └── versions/              # 56 migration files (full history)
│   └── requirements.txt / pyproject.toml
└── frontend/
    ├── src/
    │   ├── App.tsx                # Root router, layouts, route guards
    │   ├── main.tsx               # React entry point
    │   ├── layouts/               # MainLayout, ManagerLayout, AdminLayout, DenumruthamShell
    │   ├── pages/
    │   │   ├── auth/              # Login, Register, ForgotPassword, ResetPassword
    │   │   ├── devotee/           # TempleList, CartPage, NationalDirectory, HistoryPage
    │   │   ├── manager/           # All temple manager operational modules
    │   │   │   ├── website/       # Website builder sub-tabs (12 sections)
    │   │   │   └── *.tsx          # FinanceModule, InventoryModule, etc.
    │   │   └── admin/
    │   │       ├── governance/    # Finance/Claims/Suggestions/WebsiteBuilder/Ads governance
    │   │       └── *.tsx          # AdminDashboard, TempleList, AuditGovernance, etc.
    │   ├── services/              # API service clients
    │   ├── store/                 # Zustand state stores (authStore, etc.)
    │   ├── components/            # Reusable UI components
    │   ├── utils/                 # rbac.ts, permissionUtils.ts, safeLazy.ts
    │   └── layouts/               # Layout components
    └── package.json
```

---

## 5. Backend Architecture

### Application Startup (Lifespan)

The FastAPI application uses a **lifespan context manager** in `real_main.py` that executes the following on every boot:

1. **Schema Integrity Validation** (`validate_on_startup`) — verifies DB schema matches model expectations
2. **Audit Chain Verification** (`ChainVerificationService.verify_all_temples`) — checks cryptographic integrity of all immutable audit logs; corrupt temples are quarantined
3. **Global Permissions Seeding** (`StaffService.seed_global_permissions`) — idempotent seed of the RBAC permissions catalog
4. **Notification Listener Registration** (`register_notification_listeners`) — connects domain events to notification dispatch
5. **Background Task Launch** — starts 4 async loops (see §19)

> [!NOTE]
> `main.py` is a thin wrapper around `real_main.py` that captures any Python import errors (circular imports, missing env vars) and writes them directly to the `audit_integrity_verification_reports` table before re-raising, ensuring Railway deployment failures are traceable even when the full app can't boot.

### Middleware Stack (Execution Order — outermost to innermost)

1. `HTTPSRedirectHeadersMiddleware` — adds `Strict-Transport-Security`, proxy awareness
2. `RequestIdMiddleware` — generates UUID `X-Request-ID` per request
3. `RequestLoggingMiddleware` — structured logs with tenant/user context, timing
4. `SecurityHeadersMiddleware` — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
5. `CORSMiddleware` — allows localhost, `*.vercel.app`, `*.denumrutham.com`

### Dependency Injection (`app/api/deps.py`)

Standard FastAPI dependency chain:
- `get_db` → yields `AsyncSession` scoped to the request
- `get_current_user` → decodes JWT, loads `User` from DB
- `get_current_active_user` → ensures `is_active` and not deleted
- `get_temple_manager` → asserts `role in [TEMPLE_MANAGER, ADMIN, SUPERADMIN]`
- `get_superadmin` → asserts `role == SUPERADMIN`

### Exception Handling

All exceptions are mapped to a standard JSON envelope by four registered exception handlers:
- `HTTPException` → `error_response(message, code, status_code, request_id)`
- `RequestValidationError` → `VALIDATION_ERROR` / 422
- `SQLAlchemyError` → `DATABASE_ERROR` / 500
- `AppException` → application-level business errors with custom codes
- `Exception` → `INTERNAL_SERVER_ERROR` / 500

All error responses share the shape: `{ success: false, error: { code, message }, request_id }`.

### Module Structure Pattern

Each domain module follows this internal structure:
```
modules/<domain>/
├── models/        # SQLAlchemy ORM models
├── schemas/       # Pydantic request/response schemas
├── services/      # Business logic (stateless service classes)
├── repositories/  # Data access (pure DB queries)
└── routes/        # FastAPI APIRouter definitions
```

---

## 6. Frontend Architecture

### Routing Architecture

The frontend uses **React Router DOM v7** with three layout zones:

| Zone | Path Prefix | Layout | Access |
|---|---|---|---|
| Public / Devotee | `/`, `/temples`, `/t/:slug` | `MainLayout` + `DenumruthamShell` | Open |
| Manager | `/manager/*` | `ManagerLayout` | `TEMPLE_MANAGER`, `ADMIN`, `SUPERADMIN`, `STAFF` |
| Platform Admin | `/admin/*` | `AdminLayout` | `VIEW_ADMIN_DASHBOARD` permission |

**Route Guards:**
- `ProtectedRoute` — role-based OR permission-based route protection
- `RBACProtectedRoute` — RBAC module-level access via `RBAC.canView(moduleName)`

### Code Splitting Strategy

All operational modules use `safeLazy` (a hardened wrapper around `React.lazy`) which catches chunk load failures and renders an error state rather than crashing the entire app. Every module is wrapped in `<ModuleErrorBoundary>` + `<Suspense>`.

```typescript
const FinanceModule = safeLazy(() => import('@/pages/manager/FinanceModule'), 'Finance');
```

This means each module is a separate JS bundle loaded on demand, significantly reducing initial load time.

### State Management

**Zustand** is used for all shared client state:

| Store | Purpose |
|---|---|
| `authStore` | JWT token, user profile, roles, permissions; persisted to localStorage |
| `authenticityStore` | Per-module trust level (LIVE / CACHED / OFFLINE / DEGRADED); client-side only |

The `authStore` exposes `refreshProfile()` which is called on every page load when a token is present, ensuring the permission set is always fresh.

### API Client (`services/api.ts`)

A single Axios instance is configured with:
- `baseURL` pointing to the Railway backend
- `Authorization: Bearer <token>` header injected automatically
- Response interceptors that normalize error shapes (extracts `detail`, `message`, or string from various FastAPI error formats)
- 401 auto-logout

Specialized service files (`financeService.ts`, `inventoryService.ts`, `storeService.ts`, `digitalExperienceService.ts`, `telemetryService.ts`) encapsulate domain-specific API calls.

### Website Builder Sub-routing

The website builder is a **nested route** under `/manager/website/*` with 12 sub-sections (settings, hero, location, timings, festivals, announcements, activities, gallery, seo, notice-board, about, key-personnel), each as a lazy-loaded component. The admin curation mode reuses the exact same components under `/admin/governance/temples/:templeId/builder/*`.

---

## 7. Database Architecture

### Engine & Session

- **Driver:** `asyncpg` (fully async)
- **Engine:** `AsyncEngine` created at startup, shared across all requests
- **Session:** `AsyncSession` created per-request via `get_db()` dependency
- **Schema Management:** Alembic with 56 migration files covering full history from initial schema to present
- **Default Schema:** All tables in PostgreSQL `public` schema (by architectural decision — see ADR-006)

### Multi-Tenancy Implementation

Every business table that holds temple-scoped data includes a `temple_id` column with a **foreign key to `temples.id`** and an index. Multi-tenancy is enforced at the **application layer** (all queries filter by `temple_id` derived from the authenticated user's JWT). There is no Row-Level Security (RLS) at the database layer.

### UUID Primary Keys

All tables use `UUID(as_uuid=True)` primary keys generated via Python's `uuid.uuid4()`. This enables:
- Distributed ID generation without sequences
- Safe cross-environment data portability
- No sequential ID enumeration attacks

### Alembic Migration Conventions

- Migrations are hand-authored for complex operations (schema changes, data transforms)
- `autogenerate` is used only for additive column/index changes
- Each migration file is named with a descriptive slug
- Merge migrations are used when parallel feature branches create split heads

---

## 8. Entity Relationship Overview

```
temples (master entity)
├── users (staff, managers)
├── temple_profiles (extended temple information)
├── temple_website_settings (website builder config)
├── temple_bank_accounts (verified bank details)
│
├── archana_bookings (enterprise ritual bookings)
│   ├── archana_booking_members
│   ├── archana_booking_items
│   ├── archana_booking_payments
│   └── archana_booking_audit
│
├── hall_bookings (venue reservations)
│   ├── payment_ledgers
│   ├── payment_transactions
│   └── refund_transactions
│
├── transactions (Master Financial Ledger — SSOT for all money flows)
├── payments (gateway payment records)
├── donations (donation records)
│
├── kalavara_inventory_items (stock items)
│   ├── inventory_movements
│   ├── inventory_stock_ledger
│   └── inventory_issue_sessions
│
├── store_products (store catalog)
│   ├── store_sales_orders
│   │   └── store_sales_order_items
│   └── store_auctions
│       └── store_auction_bids
│
├── offerings (pooja offerings)
│   ├── offering_payments
│   └── offering_inventory_links
│
└── settlement_batches (platform settlement processing)
    ├── settlement_batch_items
    └── online_settlement_ledger
```

**Cross-cutting tables (not tenant-scoped or platform-scoped):**
- `immutable_activity_logs` (audit trail — write-once with cryptographic chain)
- `activity_outbox` (transactional outbox for audit delivery)
- `platform_financial_accounts` (platform-level bank/UPI accounts)
- `subscriptions` (temple subscription plans)
- `approval_requests` (maker-checker workflow)
- `system_roles`, `system_permissions`, `system_role_permissions` (RBAC catalog)

---

## 9. Module-by-Module Architecture

### 9.1 Archana / Pooja Module

**Purpose:** Manages the complete ritual booking lifecycle from counter booking through priest assignment, queue management, and completion.

**Frontend:** `/manager/vazhipadu` → `ArchanaPoojaModule.tsx`  
**Tabs:** Counter Booking | Archana Progress | Deity and Archanas

**Backend Components:**
- `modules/bookings/models/archana.py` — `ArchanaBooking`, `ArchanaBookingMember`, `ArchanaBookingItem`, `ArchanaBookingPayment`, `RitualQueue`, `ArchanaBookingAudit`, `ArchanaRefund`
- `api/api_v1/endpoints/archana_bookings.py` — primary router at `/archana-bookings`
- `services/archana_service.py`, `services/archana_lifecycle_service.py`
- `repositories/archana_repository.py`

**Key API Endpoints:**
| Method | Path | Purpose |
|---|---|---|
| GET | `/archana-bookings/kpis` | Dashboard KPIs |
| GET | `/archana-bookings/catalog` | Deity + archana catalog |
| POST | `/archana-bookings` | Create booking (idempotent) |
| GET | `/archana-bookings/queue` | Ritual execution queue |
| POST | `/archana-bookings/executions/:id/start` | Begin execution |
| POST | `/archana-bookings/executions/:id/complete` | Mark complete |
| GET | `/archana-bookings/:id/receipt` | Generate receipt |
| POST | `/archana-bookings/refunds` | Process refund |

**Idempotency:** Every booking creation carries an `idempotency_key` (client-generated UUID). The repository checks for existing keys before creating to prevent double-submissions.

**Booking Flow:**
```
Counter → ArchanaBooking created (CONFIRMED) → RitualQueue entry created (WAITING)
→ Priest starts (EXECUTING) → Priest completes (COMPLETED)
→ Transaction written to financial_ledger
→ ImmutableActivityLog via ActivityOutbox
```

**DB Tables:** `archana_bookings`, `archana_booking_members`, `archana_booking_items`, `archana_booking_payments`, `archana_booking_audit`, `ritual_queue`, `archana_refunds`, `archana_catalog`, `archana_catalog_versions`, `archana_executions`, `archana_sync_state`, `deity_master`, `deity_audit`

---

### 9.2 Hall Booking Module

**Purpose:** Manages venue reservation for weddings, events, and functions with payment tracking, partial payments, and refund governance.

**Frontend:** `/manager/hall-booking` → `HallBookingModule.tsx`  
**Tabs:** Bookings | Refund Requests | Refund History

**Backend Components:**
- `modules/bookings/models/hall_booking.py` — `BookingHold`, `PaymentLedger`, `PaymentTransaction`, `RefundTransaction`, `BookingAuditLog`, `BookingStatusHistory`, `BookingConflict`, `VenueSlot`, `PricingRule`, `BookingPolicy`
- `api/api_v1/endpoints/halls.py` — at `/manager/halls` and `/manager/hall-bookings`

**DB Tables:** `hall_bookings`, `booking_holds`, `payment_ledgers`, `payment_transactions`, `refund_transactions`, `booking_audit_logs`, `booking_status_history`, `booking_conflicts`, `venue_slots`, `pricing_rules`, `booking_policies`, `halls`

**Key Workflow:** Booking creates a `BookingHold` (concurrency lock) → Payment recorded in `PaymentLedger` → Refund request creates `RefundTransaction` (PENDING) → Manager/Admin approves → Refund executed → `BookingStatusHistory` updated.

---

### 9.3 Finance Module (Temple Manager View)

**Purpose:** Provides temple managers with a live financial ledger, income/expense registry, daily cash book, and settlement visibility.

**Frontend:** `/manager/finance` → `FinanceModule.tsx`  
**Tabs:** Master Ledger | Income Registry | Expenditure Register | Settlement & Bank Details | Daily Cash Book | Internal Audit Logs

**Backend Components:**
- `modules/billing/models/billing_models.py` — `Transaction` (SSOT), `Payment`, `Donation`
- `modules/billing/models/accounting.py` — `FinancialLedgerEntry`, `DailySettlement`, `CashSession`, `BookingAdjustment`
- `api/api_v1/endpoints/transactions.py` — at `/transactions`
- `modules/finance/routes/finance_routes.py` — temple manager bank account endpoints

**RBAC:** `VIEW_ACCOUNTING` required

---

### 9.4 Inventory Module

**Purpose:** Manages temple Kalavara (stock), material request workflows, supplier procurement, invoicing, and price governance.

**Frontend:** `/manager/inventory` → `InventoryModule.tsx`  
**Tabs:** Temple Kalavara | Request History | Purchase History | Kalavara Suppliers | Price Approvals

**Backend Components:**
- `modules/inventory/models/inventory_models.py` — 25+ models
- `api/api_v1/endpoints/inventory_routes.py` — at `/inventory`

**Key RBAC Permissions (17 granular):** `inventory:view_stock`, `inventory:request_materials`, `inventory:approve_requests`, `inventory:issue_stock`, `inventory:receive_stock`, `inventory:create_po`, `inventory:manage_suppliers`, `inventory:adjust_stock`, `inventory:view_request_history`, `inventory:view_purchase_history`, `inventory:view_price_approvals`, `inventory:approve_price_approval`

**DB Tables:** `kalavara_inventory_items`, `inventory_movements`, `inventory_stock_ledger`, `inventory_issue_sessions`, `inventory_item_requests`, `suppliers`, `supplier_price_history`, `inventory_invoices`, `inventory_payment_transactions`, `inventory_transactions`, `inventory_locations`, `procurement_grns`, `inventory_reconciliations`, `inventory_daily_snapshots`, `price_approval_requests`, `procurement_cost_history`

**Price Governance Flow:**
```
Supplier quotes new price → price_approval_requests created (PENDING_APPROVAL)
→ Authorized approver reviews → APPROVED/REJECTED
→ If approved: supplier_price_history updated, new price activated
```

---

### 9.5 Store Module

**Purpose:** Temple-operated store with POS checkout, product catalog, and auction management for temple prasadam and cultural goods.

**Frontend:** `/manager/store` → `StoreModule.tsx`

**Backend:** `api/api_v1/endpoints/store_routes.py` at `/store`

**DB Tables:** `store_products`, `store_stock`, `store_sales_orders`, `store_sales_order_items`, `store_auctions`, `store_auction_bids`, `store_stock_reservations`

**Auction Workflow:** Product listed as auction → Bids created (`AVAILABLE`) → Bid accepted → `RESERVED` → Settled → `SOLD`. Stale reservations auto-released by background job.

**Observability:** `/store/health-dashboard` endpoint reports: stale reservations released, active reservations, procurement backlog invoices, today's snapshot generated, low stock counts, concurrency conflicts, failed background jobs.

---

### 9.6 Offerings Module

**Purpose:** Records devotee offerings (flowers, lamps, etc.) with inventory linkage and receipt generation.

**Frontend:** `/manager/offerings` → `OfferingsModule.tsx`

**Backend:** `api/routes/offerings.py` at `/manager/offerings`

**DB Tables:** `offering_categories`, `offerings`, `offering_payments`, `offering_receipts`, `offering_audit_logs`, `offering_inventory_links`, `offering_reconciliations`

---

### 9.7 Staff Management Module

**Purpose:** Full staff directory management, role assignment, permission configuration, and onboarding governance.

**Frontend:** `/manager/staff` → `StaffManagement.tsx`  
**Tabs:** Staff Directory | Roles & Permissions Configuration

**Backend:**
- `api/routes/staff.py` at `/staff`
- `api/api_v1/endpoints/rbac.py` at `/rbac`
- `services/staff_service.py`

**Staff Statuses:** `ACTIVE` / `PENDING_APPROVAL` / `REJECTED` / `SUSPENDED` / `DISABLED`

**Onboarding Methods:** `INVITE_TOKEN` / `DOMAIN_APPROVAL` / `ADMIN_CREATED`

**KPIs Displayed:** Total Strength, On Duty, Suspended, On Leave

---

### 9.8 Activity Logs Module

**Purpose:** Temple managers can browse the complete immutable activity log for their temple, with filtering by module, action, and user.

**Frontend:** `/manager/activity-logs` → `ActivityLogsModule.tsx`

**Backend:** `api/api_v1/routes/activity_logs.py` at `/manager/activity-logs`

**Source of Truth:** `immutable_activity_logs` table (see §14)

---

### 9.9 NSS Karayogam Module

**Purpose:** National Service Scheme community organization management (early-stage module).

**Frontend:** `/manager/nss` → `NSSKarayogamModule.tsx`

---

### 9.10 HR / Payroll Module

**Purpose:** Employee attendance, leave management, and salary tracking.

**Frontend:** `/manager/hr-payroll` → `HRPayrollModule.tsx`

**RBAC:** `VIEW_DASHBOARD` (broad access)

**DB Tables:** `employees`, `leaves`

---

### 9.11 Communication Module

**Purpose:** Broadcast notifications and messaging to temple members.

**Frontend:** `/manager/communication` → `CommunicationModule.tsx`

**Backend:** `api/routes/notifications.py` at `/notifications`

---

## 10. Authentication & RBAC

### JWT Authentication

**Algorithm:** HS256  
**Secret:** `settings.jwt_secret_key` (falls back to `SECRET_KEY` if `JWT_SECRET` not set)  
**Expiry:** 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`)  
**Storage:** Frontend localStorage via `authStore` (Zustand with persistence)

**Token Payload:**
```json
{
  "sub": "<user_id>",
  "user_id": "<uuid>",
  "role": "TEMPLE_MANAGER",
  "temple_id": "<uuid>",
  "exp": <timestamp>
}
```

### Dual RBAC System

The platform operates two parallel RBAC systems:

**1. Legacy Role System (string-based)**

Simple role enum stored directly on `User.role`:
- `DEVOTEE` — public-facing users
- `STAFF` — temple staff with granular permissions
- `TEMPLE_MANAGER` — full temple access
- `ADMIN` — platform admin
- `SUPERADMIN` — full platform access

**2. System RBAC (Fine-grained permissions)**

Enterprise permission system for STAFF roles:
- `system_roles` — named role definitions (e.g. "Archana Priest", "Store Cashier")
- `system_permissions` — permission catalog with `module:action` format
- `system_role_permissions` — many-to-many junction
- `User.system_role_id` — FK to assigned system role

Temple-scoped RBAC:
- `roles` — temple-specific roles
- `permissions` — temple-specific permissions
- `role_permissions` — junction
- `user_roles` — user-to-role assignment

**Permission Seeding:** `StaffService.seed_global_permissions()` runs on every startup to ensure the global permissions catalog is current.

### Frontend RBAC Enforcement

- `RBAC.canView(moduleName)` — checks `authStore.permissions` against module permission requirement
- `hasPermission(user, permission)` — checks system permissions
- `SYSTEM_PERMISSIONS` constants define the admin portal permission keys

### Maker-Checker Governance

High-stakes operations (bank account verification, settlement batch approval) require two distinct users:
- **Maker:** Creates/proposes the action
- **Checker:** Independently reviews and approves/rejects
- Implemented via `approval_requests` table with `requested_by` and `reviewed_by` fields

---

## 11. Finance Architecture

### Architecture Layers

The finance architecture has two distinct layers that serve different purposes:

**Layer 1 — Temple Operations Finance (Billing Module)**

All money flows in/out of individual temples record into:
- `transactions` — **Enterprise Master Ledger / Single Source of Truth** for all financial events
- `payments` — payment gateway transaction records
- `donations` — structured donation tracking
- `financial_ledger` — legacy accounting entries (daily settlement support)
- `daily_settlements` — end-of-day cash book
- `cash_sessions` — cashier session management

**Layer 2 — Platform Finance (Finance Module)**

Platform-level accounts, settlement processing, and bank governance:
- `platform_financial_accounts` — BANK / UPI / ESCROW / GATEWAY accounts with encryption
- `temple_bank_accounts` — temple-submitted bank details with verification workflow
- `settlement_batches` — batch settlement generation with maker-checker approval
- `settlement_batch_items` — per-booking settlement breakdown
- `online_settlement_ledger` — individual online booking settlement records

### Settlement Flow

```
Online booking payment received via Razorpay
→ archana_booking_payments / hall_bookings record payment
→ online_settlement_ledger entry created (booking_id, amount, gateway_fee)
→ Platform admin triggers settlement batch generation (date range)
→ settlement_batches created (PENDING)
→ settlement_batch_items populated per booking
→ Maker: CFO generates batch
→ Checker: Platform Owner approves → APPROVED
→ UTR reference recorded → COMPLETED
→ Temple bank account receives net payout
```

### Bank Account Governance

1. Temple manager submits bank account details (IFSC, account number, account holder)
2. Account masking applied on storage — last 4 digits only in API responses by default
3. Admin uses `/admin/bank-accounts/:id/reveal` (additional authorization) to view full account
4. Admin verifies: VERIFIED / REJECTED
5. Only VERIFIED accounts can receive settlement payouts
6. New submissions create a new version; old account transitions to SUPERSEDED (zero-downtime)

### Platform Accounts

Managed exclusively by SUPERADMIN:
- Types: BANK, UPI, ESCROW, GATEWAY
- Stored with `account_number_enc` (application-level masking applied)
- UPI accounts additionally store `upi_id`
- Full audit trail via `ImmutableActivityLog`

---

## 12. Discovery Architecture

### Public Directory

Devotees can discover temples via:
- `/public/temples/:slug/bootstrap` — loads complete temple public portal in one call
- `/public/directory` — paginated national directory
- `/temples`, `/temples/:state`, `/temples/:state/:district` — geographically-filtered browsing

**DB Tables:** `temple_search_index`, `state_master`, `district_master`, `temples`, `temple_profiles`, `temple_followers`, `temple_follower_preferences`, `service_recommendations`

### Portal Telemetry

**`telemetryService.ts`** + `modules/analytics/routes/telemetry.py`

Every public portal interaction is tracked:
- **Impressions** (via IntersectionObserver) — lazy-fired when element enters viewport
- **Clicks** — explicit user actions

Events tracked (24 types): `TEMPLE_VIEW`, `BOOK_POOJA_CLICK`, `OFFERING_CLICK`, `STORE_CLICK`, `FOLLOW_CLICK`, `AD_CLICK`, `RECOMMENDATION_CLICK`, `CHECKOUT_STARTED`, `CHECKOUT_COMPLETED`, `HOMEPAGE_SEARCH`, `POPULAR_CHIP_CLICK`, `TEMPLE_CARD_CLICK`, `FESTIVAL_CLICK`, `CAROUSEL_SCROLL`, `SUGGEST_TEMPLE_CLICK`, `CLAIM_TEMPLE_CLICK`, `CLAIM_SUBMISSION`, `CLAIM_APPROVED`, etc.

Client-side deduplication: impressions are cached in memory per session to prevent multiple firings for the same element in the same session.

**DB Tables:** `portal_analytics_events`, `advertisement_analytics`, `campaign_revenue_metrics`

### Temple Claim Workflow

Unclaimed temples can be claimed by legitimate owners:
1. Devotee submits claim with documentation → `temple_claim_requests` (PENDING)
2. Platform admin reviews → APPROVED / REJECTED
3. Approved: temple ownership transferred → `temple_ownership_history` updated
4. New manager account activated → Email notification sent

---

## 13. Website Builder Architecture

### Overview

Each temple has a **fully customizable micro-portal** reachable at `/t/:slug` (clean URL) or `/:slug/portal` (legacy URL). The website builder gives temple managers control over the entire content.

### Three-Document Model

The website settings use a draft-publish-live workflow with three state documents:

| Document | Table | Description |
|---|---|---|
| Draft | `temple_website_settings` | Working copy — managers edit here |
| Review Copy | `temple_profile_drafts` | Submitted for admin review |
| Live / Published | `temple_website_settings_live` | What public sees |

**Why three documents?** Prevents accidental publishing of incomplete or incorrect content. Admin curators can review before a temple's portal goes live, especially important for newly onboarded temples.

### Website Builder Sections (12)

| Route | Section |
|---|---|
| `website/settings` | General settings (name, description, founded, etc.) |
| `website/hero` | Hero banner (desktop + mobile images) |
| `website/location` | Map coordinates, address, parking instructions |
| `website/timings` | Daily puja schedules and timing windows |
| `website/daily-activities` | Regular activities (status: UPCOMING/ACTIVE/COMPLETED) |
| `website/festivals` | Festival catalog with dates and media |
| `website/announcements` | Notice board |
| `website/activities` | Temple activities |
| `website/gallery` | Image gallery by category (HERO/GALLERY/DEITY/FESTIVAL/FACILITY/OTHER) |
| `website/seo` | Meta title, description, keywords |
| `website/notice-board` | Rules, dress code, photography restrictions |
| `website/about` | Temple history and about |
| `website/key-personnel` | Priests and administrators with photos |

### Admin Curation Mode

Platform admins can curate any temple's website builder content at:
`/admin/governance/temples/:templeId/builder/*`

The same 12 section components are reused. The `digitalExperienceService.ts` conditionally adds `targetTempleId` to API calls to switch between self-managed and admin-curated modes.

### Publication Flow

```
Manager edits Draft → Submit for Review → temple_profile_drafts (PENDING_REVIEW)
→ Admin reviews (compare view) → APPROVED / REJECTED
→ If approved: Draft promoted to temple_website_settings_live
→ Public portal serves live document
```

---

## 14. Audit & Immutable Activity Architecture

### Design Principles

The audit system was designed to be **tamper-evident and legally defensible**. The core constraint is: once written, an audit record cannot be modified, deleted, or silently corrupted.

### Transactional Outbox Pattern

Every auditable action follows this sequence:

1. **Business operation** executes (e.g., create bank account)
2. **`ActivityLogService.emit_event()`** called *before* `db.commit()`
3. An `ActivityOutbox` record is written in the **same database transaction** as the business data
4. Transaction commits atomically — either both the business data and the outbox record are saved, or neither are
5. The **outbox processor** (background task) reads `activity_outbox` WHERE `processed = FALSE`
6. For each pending record, it creates an `ImmutableActivityLog` with:
   - SHA-256 hash of the content
   - `previous_hash` of the preceding record for the same temple (cryptographic chain)
   - `sequence_number` (monotonic per temple)
7. Marks `activity_outbox.processed = TRUE`

**Why outbox?** Directly writing to `immutable_activity_logs` from business code is fragile — if the DB transaction rolls back, the audit entry would be lost or orphaned. The outbox guarantees delivery exactly once.

### Cryptographic Chain

Each `ImmutableActivityLog` record contains:
```
hash = SHA256(temple_id + sequence_number + action + actor + timestamp + payload + previous_hash)
```

The `previous_hash` creates a linked chain. Any tampering with a historical record breaks the chain from that point forward. `ChainVerificationService.verify_all_temples()` runs this check on every application startup.

### Startup Audit Verification

On startup, `ChainVerificationService` verifies the entire audit chain for every temple. If a temple's chain is found corrupt:
- The temple's status is set to SUSPENDED
- An `AuditChainIncident` is recorded
- A `CRITICAL` log entry is emitted
- Platform admin receives notification

### Audit Governance UI

`/admin/audit-governance` → `AuditGovernance.tsx`

Provides:
- Integrity verification reports
- Chain incident history
- Manual verification trigger
- Log export

### ActivityOutbox Constraints

- `temple_id` is **NOT NULL** — platform-level actions (not tied to a specific temple) use sentinel UUID `00000000-0000-0000-0000-000000000000`
- `emit_event()` **must** be called before `db.commit()` to guarantee atomicity

---

## 15. Notification Architecture

### Event-Driven Notifications

The platform uses an internal **Domain Event Bus** pattern:

1. Domain events are emitted via `app/events/handlers.py` (registered on startup)
2. `register_notification_listeners()` connects event types to notification dispatch
3. Notifications are created in the `notifications` table
4. Frontend polls `/notifications` for unread count

**DB Tables:** `notifications`, `notification_templates`, `notification_delivery_logs`

### Notification Types

- **Role-based delivery** — `Notification.role` field routes to all users with a given role at a temple
- **User-specific delivery** — `Notification.user_id` targets an individual

### Admin Notification Governance

`/admin/governance/notifications` → `NotificationGovernance.tsx`

Platform admins can broadcast notifications to all temples or specific temples.

---

## 16. API Architecture

### Base URL

All API endpoints are prefixed: `https://<railway-domain>/api/v1/`

### Router Organization

The master router (`api/api_v1/api.py`) registers 40+ sub-routers grouped by domain:

| Tag | Prefix | Purpose |
|---|---|---|
| Discovery | `/public/temples`, `/public/directory`, `/public` | Temple portal, directory, telemetry |
| Authentication | `/auth` | Login, register, JWT refresh, password reset |
| System | `/health`, `/sync`, `/system` | Liveness, readiness, system ops |
| Bookings | `/devotees`, `/bookings`, `/archana-bookings`, `/devotee` | Booking operations |
| Finance | `/transactions`, `/payments`, `/donations` | Financial operations |
| Settings | `/rbac` | Role and permission management |
| Platform Governance | `/temples`, `/claims`, `/temple-suggestions`, `/approvals`, `/change-requests`, `/superadmin`, `/admin`, `/onboarding` | Admin operations |
| Hall Booking | `/manager/halls`, `/manager/hall-bookings` | Venue management |
| Website Builder | `/manager/website-settings`, `/manager/announcements`, `/manager/festivals`, `/manager/images`, `/manager/key-personnel`, `/manager/activities` | Content management |
| Temple Profile | `/temple-profile` | Profile drafts |
| Inventory | `/inventory` | Stock management |
| Store | `/store` | Product/auction/POS |
| Dashboard | `/manager`, `/dashboard` | KPI aggregation |
| Audit | `/audit-logs`, `/manager/activity-logs` | Audit access |
| Advertisements | `/superadmin/ads`, `/manager/advertisements` | Ad management |
| Poojas | `/poojas`, `/manager/offerings` | Offering catalog |
| Subscriptions | `/subscriptions` | SaaS billing |
| Analytics | `/superadmin/analytics`, `/manager/analytics` | Telemetry aggregation |

### Response Envelope

All API responses follow a consistent shape:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message"
  },
  "request_id": "uuid"
}
```

### Rate Limiting

`slowapi` limits are applied per-IP using `get_remote_address`. Specific sensitive endpoints (auth, bank reveal) have custom limits.

### OpenAPI / Swagger

Available at `/api/v1/openapi.json`.  
Organized by Swagger tags matching the router groups above.  
Used as the official API contract for frontend development.

---

## 17. Security Architecture

### Network Security

- **HTTPS enforced** — `HTTPSRedirectHeadersMiddleware` adds HSTS headers
- **CORS** — restrictive allow-list: localhost + `*.vercel.app` + `*.denumrutham.com`
- **Security Headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

### Authentication Security

- JWT with HS256 — token expires in 60 minutes
- No refresh tokens (user must re-login after expiry)
- Passwords stored as bcrypt hashes
- `force_password_change` flag for newly onboarded staff
- OTP stored with expiry for password reset flow

### Financial Data Protection

- **Account masking** — bank account numbers are masked in all API responses by default (last 4 digits shown)
- **Reveal endpoint** — `/admin/bank-accounts/:id/reveal` requires SUPERADMIN role, each call creates an audit log entry
- **UPI ID encryption** — stored as `upi_id` field with application-level masking
- **Idempotency keys** — all financial creation operations accept `idempotency_key` to prevent double-charges

### Multi-Tenant Isolation

- Every query against business data must include `temple_id = current_user.temple_id`
- SQLAlchemy dependency injection enforces this at the route level
- No RLS at DB level — isolation is application-enforced

### Audit Trail

All financial, RBAC, and governance operations write to `immutable_activity_logs`. The cryptographic chain makes tampering detectable.

### Production Configuration Validation

`Settings.validate_secrets()` runs at startup in production and raises `ValueError` if:
- `DATABASE_URL` is missing
- `SECRET_KEY` equals the default placeholder
- `JWT_SECRET` is empty or equals the default
- `RAZORPAY_WEBHOOK_SECRET` is missing

---

## 18. Caching Strategy

### Redis Usage

Redis is used primarily for **dashboard cache invalidation** in the Finance module:

- Settlement dashboard data is computed and cached
- Cache key format: `finance:settlement_dashboard:<temple_id>`
- Cache is explicitly invalidated on:
  - New settlement batch creation
  - Batch status changes (approve, complete)
  - Bank account changes

### Client-Side Caching

The frontend `authenticityStore` tracks per-module trust levels:
- `LIVE` — data freshly loaded from backend
- `CACHED` — showing stale data (backend unavailable)
- `OFFLINE` — no backend connectivity
- `DEGRADED` — partial data available
- `UNVERIFIED` — data state unknown

Last sync timestamp persisted to `localStorage` under key `tms_last_sync`.

### Ad Impression Deduplication

Telemetry service maintains an in-memory `Set` per session to deduplicate impression events. An impression for the same ad/element is only sent once per browser session.

---

## 19. Background Workers

The platform runs **4 async background workers** launched as `asyncio.create_task()` in the lifespan startup, running inside the same FastAPI process. There is no external task queue (Celery, etc.).

| Worker | Interval | Purpose |
|---|---|---|
| `archana_completion_loop` | 60s | Auto-completes archana bookings past their scheduled time |
| `reservation_cleanup_loop` | 60s | Releases stale store stock reservations |
| `payment_expiry_loop` | 60s | Expires online payment sessions that haven't completed |
| `outbox_worker` (`run_outbox_worker`) | Continuous | Processes `activity_outbox` → `immutable_activity_logs` |

**Worker Lifecycle:**
- Workers are created on startup
- The `outbox_shutdown_event` (asyncio.Event) signals the outbox worker to stop gracefully
- Shutdown waits up to 10 seconds for the outbox worker to drain before terminating

**Architecture Note:** All workers share the same event loop as the HTTP server. A long-running worker iteration will not block the HTTP server (async/await throughout) but could delay the next iteration of other workers. This is acceptable at current scale.

---

## 20. Deployment Architecture

### Backend — Railway.app

- **Runtime:** Python / Uvicorn
- **Entry point:** `app.main:app` (gunicorn/uvicorn)
- **Environment variables:** Injected via Railway service variables
- **Database:** Railway managed PostgreSQL (same private network)
- **Redis:** Railway managed Redis
- **File storage:** `static/uploads/` — Railway ephemeral filesystem (⚠️ files lost on redeploy — see §29)
- **Metrics:** Prometheus endpoint exposed via `prometheus-fastapi-instrumentator`
- **Build commit:** Available via `RAILWAY_GIT_COMMIT_SHA` env var
- **Startup error capture:** Startup failures write to `audit_integrity_verification_reports` before crashing

### Frontend — Vercel

- **Build:** `tsc -b && vite build` → static HTML/JS/CSS
- **Runtime:** Vercel Edge Network (CDN)
- **SPA routing:** Vercel configured to serve `index.html` for all routes
- **Environment:** `VITE_API_BASE_URL` points to Railway backend URL
- **Code splitting:** Each lazy module becomes a separate Vercel-served chunk

### CI/CD

- Deployment triggered by push to `main` branch on both repositories
- Railway auto-deploys backend; Vercel auto-deploys frontend
- Alembic migrations are **not** run automatically — must be run manually: `alembic upgrade head`

---

## 21. Configuration Management

### Backend Configuration (`app/core/config/config.py`)

All configuration via `pydantic-settings` (`BaseSettings`):

| Variable | Default | Required in Prod |
|---|---|---|
| `DATABASE_URL` | localhost:5433 | ✅ |
| `SECRET_KEY` | placeholder | ✅ |
| `JWT_SECRET` | empty | ✅ |
| `REDIS_URL` | localhost:6379/0 | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | empty | ✅ |
| `ENVIRONMENT` | development | ✅ |
| `CORS_ALLOWED_ORIGINS` | empty (→ localhost) | ✅ |
| `PORT` | 8000 | ❌ |
| `LOG_LEVEL` | development | ❌ |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 60 | ❌ |

### Database URL Normalization

The config automatically normalizes Railway's `postgres://` URLs to the SQLAlchemy-required `postgresql+asyncpg://` format.

### Frontend Configuration

All configuration via Vite env vars (`import.meta.env`):
- `VITE_API_BASE_URL` — Railway backend URL

---

## 22. Architectural Principles

These principles guided every design decision:

### 1. Single Source of Truth
Each domain has exactly one authoritative data store. `transactions` is the financial SSOT. `immutable_activity_logs` is the audit SSOT. No duplicating critical data across tables.

### 2. Multi-Tenancy by Design
Every database operation is tenant-scoped. `temple_id` is a first-class citizen in every business model. Platform-level operations use `temple_id = NULL` or a sentinel UUID.

### 3. Idempotency for Financial Operations
All financial creation endpoints accept `idempotency_key`. The repository layer enforces uniqueness before writing. This prevents double-charges and double-bookings regardless of retry storms.

### 4. Immutable Audit Log
Once written, financial and governance events cannot be modified. The cryptographic hash chain makes tampering detectable at startup.

### 5. Transactional Outbox for Audit Delivery
Audit log entries are written in the same transaction as business data. This guarantees that no business operation is ever "unlogged" even in the face of background worker failures.

### 6. Maker-Checker for High-Stakes Operations
Bank account verification, settlement batch approval, and large expense approvals require two distinct authorized actors.

### 7. Defense in Depth
Security is layered: HTTPS → CORS → JWT → Role check → Permission check → Business rule validation. No single bypass compromises the system.

### 8. Operational Simplicity over Organizational Elegance
Database tables remain in the `public` schema rather than being split into per-module schemas. This trades perfect organizational symmetry for operational simplicity (simpler Alembic migrations, no cross-schema FK complexity, no `search_path` management).

### 9. Error Transparency
Every error is structured, machine-readable, and includes a `request_id` for tracing. No opaque 500 errors in production.

### 10. Zero Downtime by Design
Bank account versioning, settlement batch PENDING → APPROVED → COMPLETED states, and idempotent writes ensure the platform can evolve without maintenance windows.

---

## 23. Architecture Decision Records

### ADR-001: Async-First Backend
**Decision:** Use `asyncpg` + SQLAlchemy 2.x async throughout. No sync DB calls in request handlers.  
**Rationale:** Temple operations can involve concurrent archana bookings during festivals. Async allows the single Uvicorn worker to handle hundreds of concurrent requests without thread exhaustion.  
**Status:** Active

### ADR-002: Zustand over Redux
**Decision:** Use Zustand for client state instead of Redux Toolkit.  
**Rationale:** The application state is simple (auth, permissions, per-module trust). Redux's boilerplate adds complexity without benefit. Zustand's store-per-concern model maps cleanly to the domain.  
**Status:** Active

### ADR-003: PostgreSQL Only — No ORM Polymorphism
**Decision:** Single PostgreSQL database. No per-tenant database isolation.  
**Rationale:** At current scale (tens to hundreds of temples), per-tenant databases would add operational overhead (connection pooling, migration management) with no benefit. Row-level filtering by `temple_id` is sufficient.  
**Status:** Active

### ADR-004: In-Process Background Workers — No Celery
**Decision:** Use `asyncio.create_task()` for background work instead of Celery or RQ.  
**Rationale:** The current background jobs (auto-completion, cleanup, outbox processor) are low-frequency (60s intervals) and stateless. An external task queue would add Redis queue management complexity. Workers run in the same process as the HTTP server.  
**Consequence:** If the process dies, in-flight worker iterations are lost. This is acceptable because all workers are idempotent (safe to re-run).  
**Status:** Active. Revisit when task volume requires separate scaling.

### ADR-005: Draft-Publish-Live Model for Website Builder
**Decision:** Three documents (draft, review, live) instead of simple save-and-publish.  
**Rationale:** Temple managers are non-technical. Publishing incomplete or incorrect content can damage a temple's public reputation. Admin review gates prevent mistakes from going live.  
**Status:** Active

### ADR-006: Single public PostgreSQL Schema
**Decision:** All business tables remain in the `public` schema, not split into named schemas by module.  
**Rationale:** Named schemas would improve Supabase browsing but introduce permanent complexity: cross-schema FK strings in SQLAlchemy models, `search_path` management on every connection, autogenerate incompatibility, and Railway configuration overhead. The organizational benefit does not outweigh the maintenance cost at this stage.  
**Review Trigger:** If regulatory compliance requires logical data separation, or if the team exceeds 10 engineers with domain ownership boundaries, reconsider named schemas at that point.  
**Status:** Active (decided 2026-06-25)

### ADR-007: Transactional Outbox for Audit
**Decision:** Write audit entries to `activity_outbox` in the same transaction as business data. Background worker promotes to `immutable_activity_logs`.  
**Rationale:** Direct writes to the immutable log from business code would be lost on transaction rollback. The outbox pattern guarantees "at-least-once" delivery and atomic consistency.  
**Status:** Active

### ADR-008: Frontend Code Splitting via safeLazy
**Decision:** Each operational module is a separate lazily-loaded bundle wrapped in `safeLazy` + `ModuleErrorBoundary`.  
**Rationale:** The application has 20+ modules. Loading all at once would create a massive initial bundle. Code splitting reduces initial load time. `safeLazy` catches chunk load failures (network errors, deployment mismatches) gracefully.  
**Status:** Active

### ADR-009: Idempotency Keys for Financial Operations
**Decision:** All financial creation endpoints require caller-supplied `idempotency_key`.  
**Rationale:** Network retries on mobile devices or poor connectivity can result in duplicate API calls. Without idempotency, a devotee might be charged twice for a single archana booking. The key is stored and checked before creating, making the operation safe to retry.  
**Status:** Active

### ADR-010: table rename enterprise_archana_bookings → archana_bookings
**Decision:** Rename the primary archana booking table to drop the legacy `enterprise_` prefix.  
**Rationale:** The `enterprise_` prefix was added during an early architectural phase to distinguish from a Sprint-era legacy table. The legacy table is now deprecated. The prefix adds noise and conflicts with the frontend API naming convention (`/archana-bookings/`). A backward-compat alias `EnterpriseArchanaBooking = ArchanaBooking` allows the 40+ existing code references to continue working without a mass rename sweep.  
**Status:** Active (implemented 2026-06-25, Alembic migration a9f1e2d3c4b5)

---

## 24. Data Ownership Matrix

| Domain | Primary Owner | Tables | Consumers |
|---|---|---|---|
| Temple Master | Platform Admin | `temples`, `temple_profiles`, `temple_status_audit` | All modules |
| Temple Content | Temple Manager | `temple_website_settings`, `temple_announcements`, `temple_images` | Website Builder, Public Portal |
| Finance (Temple) | Temple Manager | `transactions`, `donations`, `financial_ledger`, `daily_settlements` | Finance Module, Dashboard |
| Finance (Platform) | Superadmin | `platform_financial_accounts`, `settlement_batches`, `temple_bank_accounts` | Finance Governance |
| Archana Bookings | Temple Staff / Manager | `archana_bookings`, `archana_booking_members`, `archana_booking_items` | Archana Module, Finance |
| Hall Bookings | Temple Manager | `hall_bookings`, `payment_ledgers`, `refund_transactions` | Hall Booking Module |
| Inventory | Temple Manager / Staff | `kalavara_inventory_items`, `inventory_movements`, `suppliers` | Inventory Module |
| Store | Temple Manager | `store_products`, `store_sales_orders`, `store_auctions` | Store Module |
| Audit | System (immutable) | `immutable_activity_logs`, `activity_outbox` | Activity Logs Module, Audit Governance |
| RBAC | Superadmin / Temple Manager | `system_roles`, `system_permissions`, `roles`, `permissions` | All modules |
| Analytics | System | `portal_analytics_events`, `advertisement_analytics` | Discovery Analytics |
| Subscriptions | Superadmin | `subscriptions`, `subscription_events` | Platform Governance |

---

## 25. Single Source of Truth Matrix

| Domain Concept | SSOT Table | Rationale |
|---|---|---|
| All temple money flows | `transactions` | Every income/expense event writes one Transaction record. Finance module reads exclusively from here. |
| Archana bookings | `archana_bookings` | The enterprise booking engine is the only active booking system. |
| Platform bank accounts | `platform_financial_accounts` | Single table, single model, single route for all platform accounts. |
| Temple bank accounts | `temple_bank_accounts` | Version-based record — active account identified by `status = VERIFIED`. |
| Audit trail | `immutable_activity_logs` | Cryptographically chained, write-once. Cannot be superseded. |
| RBAC permissions | `system_permissions` (global catalog) | Seeded at startup, never duplicated. |
| Temple public content | `temple_website_settings_live` | The published snapshot is the source for public portal rendering. |
| Staff/user identity | `users` | All authentication, authorization, and attribution references this table. |

---

## 26. Integration Points

### Razorpay (Payment Gateway)

- **Checkout:** Online bookings create a Razorpay order (`gateway_order_id`) stored on `archana_bookings`
- **Webhook:** `RAZORPAY_WEBHOOK_SECRET` validates incoming payment confirmation webhooks
- **Status:** `online_status` field on `archana_bookings` tracks: `INITIATED → PAYMENT_PENDING → PAYMENT_CONFIRMED → COMPLETED / PAYMENT_EXPIRED`

### Prometheus (Monitoring)

- Auto-instrumented via `prometheus-fastapi-instrumentator`
- Exposes `/metrics` endpoint on the FastAPI app
- Metrics: HTTP request counts, latency histograms, in-flight requests
- Excludes: `/metrics`, `/health/live`, `/health/ready` from instrumentation to avoid noise

### Static File Serving

- Uploaded images are stored to `static/uploads/` and served via `/static/` mount
- `POST /upload/image`, `/upload/audio`, `/upload/document` handle multi-part form uploads

### Future Integrations (Not Yet Active)

- SMS gateway (OTP delivery is mocked — `User.otp_code` stored in DB)
- Email gateway (notifications are DB-only — no SMTP integration currently)
- WhatsApp notifications (`whatsapp_consent` flag exists on bookings but delivery not implemented)

---

## 27. Cross-Module Dependencies

```
Auth Module
└── referenced by ALL modules (every request validates JWT → User)

Temple Management Module  
└── referenced by ALL business modules (temple_id FK)

Billing / Finance Module
├── receives data FROM: Archana, Hall Booking, Donations, Offerings, Store
└── provides data TO: Finance Module UI, Dashboard, Settlement

Audit Module
├── receives events FROM: Finance, Archana, Auth, Governance (via ActivityOutbox)
└── provides data TO: Activity Logs UI, Audit Governance UI

Inventory Module
├── linked TO: Store (store_products reference inventory)
├── linked TO: Offerings (offering_inventory_links)
└── provides data TO: Store health dashboard

Analytics Module
├── receives events FROM: Public Portal (telemetry)
└── provides data TO: Discovery Analytics (Superadmin)

Finance Module
├── reads FROM: Billing/transactions (settlement basis)
├── reads FROM: Temple bank accounts (payout destination)
└── writes TO: Audit module (settlement audit events)
```

---

## 28. Extension Guidelines

### Adding a New Temple Manager Module

1. Create `modules/<domain>/` with `models/`, `schemas/`, `services/`, `repositories/`, `routes/`
2. Register the router in `api/api_v1/api.py`
3. Create Alembic migration for new tables
4. Create frontend page at `frontend/src/pages/manager/<ModuleName>.tsx`
5. Add lazy import in `App.tsx` with `safeLazy` + `ModuleErrorBoundary`
6. Add route under `/manager` in `App.tsx`
7. Register in `ModuleRegistry.ts` with permission requirement
8. Add RBAC permissions to `StaffService.seed_global_permissions()`

### Adding a New Financial Event

1. Identify the event type (income/expense) and category
2. Call `TransactionService.create_transaction()` — DO NOT write directly to `transactions` table
3. Also emit via `ActivityLogService.emit_event()` before `db.commit()`
4. Update `TransactionCategory` enum in `billing_models.py` if new category needed

### Adding a New Audit Event

1. Call `ActivityLogService.emit_event(db, temple_id, actor_id, action, module, payload)` inside your transaction (before `db.commit()`)
2. For platform-level events (no temple): use `temple_id = UUID("00000000-0000-0000-0000-000000000000")`
3. Outbox processor handles delivery to `immutable_activity_logs` automatically

### Adding a New RBAC Permission

1. Add the permission string to the global catalog in `StaffService.seed_global_permissions()`
2. Add to `uiTargetMapping` in `StaffManagement.tsx` for the UI label
3. Check permission in the relevant route via `get_current_user` + permission check

---

## 29. Known Technical Debt

> [!WARNING]
> The following items are known to require engineering attention. They represent conscious trade-offs made during rapid development phases.

### High Priority

| Item | Impact | Location |
|---|---|---|
| **Ephemeral file storage** | Uploaded images are lost on every Railway redeploy. No object storage (S3/R2) integration. | `static/uploads/` |
| **No SMTP/SMS gateway** | OTP is stored plaintext in `users.otp_code`. Notifications are DB-only. | `auth_models.py`, `notifications` table |
| **No refresh token** | Users are force-logged out every 60 minutes. No JWT refresh endpoint. | `api/api_v1/endpoints/auth.py` |
| **Legacy `archana_bookings` table** | The governance-module `ArchanaBooking` model (Sprint-era) still has its own DB table and is no longer used for new bookings. Needs data migration audit and DROP. | `governance_models.py` L82 |

### Medium Priority

| Item | Impact | Location |
|---|---|---|
| **Manual Alembic migrations** | No `alembic upgrade head` on deploy — migrations must be run manually after push. | Deploy process |
| **`force_password_change` not enforced on every login** | Flag exists on user but login flow may not redirect correctly in all paths. | `auth` routes |
| **In-process background workers** | If the process dies mid-run, incomplete iterations are lost. At current scale acceptable; at high scale requires an external queue. | `real_main.py` |
| **`dashboard_service.py` legacy imports** | Multiple legacy service imports (`ArchanaService`, `EmployeeService`, `TransactionService` from old `app.services.*` paths) may conflict with newer module paths. | `analytics/services/dashboard_service.py` |
| **`service_recommendations` appears in both `temple` and `governance` logical domains** | Minor model ownership confusion, no functional impact. | `temple_models.py`, `governance_models.py` |

### Low Priority

| Item | Impact | Location |
|---|---|---|
| **`WhatsApp consent` field without delivery** | `whatsapp_consent` stored but WhatsApp API not integrated. | `archana_bookings` |
| **`NSS Karayogam` module is a stub** | Module routes to a placeholder page. No backend routes. | `NSSKarayogamModule.tsx` |
| **`ENABLE_STAFF_SELF_REGISTRATION` hardcoded false** | Flag exists in config but is not wired to any logic that conditionally enables self-registration. | `config.py` |

---

## 30. Future Architecture Roadmap

> [!NOTE]
> This section documents directions that have been discussed or implied by the current architecture. These are NOT approved or committed. They require separate engineering review and ADR approval.

### Near-Term (Operational Hardening)

- **Object Storage (R2 / S3):** Replace `static/uploads/` with cloud object storage to survive deployments. Migration requires presigned URL generation, existing URL backfilling.
- **Email Gateway:** Integrate SendGrid or AWS SES for OTP delivery, booking confirmations, and staff onboarding emails.
- **JWT Refresh Tokens:** Add sliding refresh token rotation to eliminate the 60-minute forced re-login.
- **Automated Alembic on Deploy:** Wire `alembic upgrade head` as a pre-deployment step in Railway.

### Medium-Term (Scale & Reliability)

- **Celery + Redis Queue:** Migrate background workers to Celery when task volume or isolation requirements grow. The `asyncio.create_task()` approach does not support distributed execution.
- **Read Replicas:** Separate analytics/reporting queries to a read replica to reduce load on the primary during report generation.
- **Row-Level Security (RLS):** Implement PostgreSQL RLS as a defense-in-depth layer for multi-tenancy once the `search_path` and policy management tooling is evaluated.
- **Razorpay Payout API:** Automate settlement payouts directly from the platform rather than manually recording UTR numbers.

### Long-Term (Product Expansion)

- **Devotee Mobile App:** The public portal API already supports a mobile app. The `/public/temples/:slug/bootstrap` endpoint is designed as a single-call data loader for mobile.
- **Priest-facing App:** The `ritual_queue` and archana execution APIs are designed for a dedicated priest tablet/phone interface.
- **Analytics Dashboard:** The `portal_analytics_events` telemetry infrastructure supports a full analytics product. A dedicated analytics UI beyond the current `DiscoveryAnalytics.tsx` page.
- **WhatsApp Integration:** The `whatsapp_consent` field and notification architecture are pre-wired for WhatsApp Business API integration for booking confirmations.
- **Multi-Currency / GST Invoicing:** The financial ledger schema can accommodate GST fields. Future regulatory compliance work may require structured invoice generation.

---

*End of Engineering Architecture Handover Document*

---

**Document History:**

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | Antigravity (AI Engineering Assistant) | Initial version — produced by direct repository inspection |

**Review Status:** Awaiting sign-off from Engineering Lead / CTO

**Next Review:** Recommended after every major architectural change or quarterly, whichever comes first.
