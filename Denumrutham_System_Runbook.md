# Denumrutham — System Operations Runbook

**Classification:** Internal Operations — Official Production Manual  
**Version:** 1.0  
**Date:** 2026-06-25  
**Audience:** DevOps Engineers, Release Managers, System Administrators, Senior Developers  

> [!IMPORTANT]
> This is the authoritative operations manual for the Denumrutham production platform. All production changes must follow the procedures documented here. No exceptions.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure Architecture](#2-infrastructure-architecture)
3. [Environment Variables](#3-environment-variables)
4. [Railway Deployment](#4-railway-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Database Deployment](#6-database-deployment)
7. [Redis Configuration](#7-redis-configuration)
8. [Background Workers](#8-background-workers)
9. [Docker Configuration](#9-docker-configuration)
10. [Secrets Management](#10-secrets-management)
11. [SMTP Configuration](#11-smtp-configuration)
12. [Push Notification Configuration](#12-push-notification-configuration)
13. [Storage Configuration](#13-storage-configuration)
14. [DNS & Domain Management](#14-dns--domain-management)
15. [SSL/TLS](#15-ssltls)
16. [Health Checks](#16-health-checks)
17. [Logging](#17-logging)
18. [Monitoring](#18-monitoring)
19. [Alerting](#19-alerting)
20. [Database Backup Strategy](#20-database-backup-strategy)
21. [Database Restore Procedure](#21-database-restore-procedure)
22. [Disaster Recovery](#22-disaster-recovery)
23. [Incident Response](#23-incident-response)
24. [Rollback Procedure](#24-rollback-procedure)
25. [Alembic Migration Procedure](#25-alembic-migration-procedure)
26. [Production Deployment Checklist](#26-production-deployment-checklist)
27. [Release Checklist](#27-release-checklist)
28. [Post-Deployment Verification](#28-post-deployment-verification)
29. [Performance Monitoring](#29-performance-monitoring)
30. [Cache Maintenance](#30-cache-maintenance)
31. [Redis Maintenance](#31-redis-maintenance)
32. [Scheduled Jobs](#32-scheduled-jobs)
33. [Background Task Monitoring](#33-background-task-monitoring)
34. [Security Operations](#34-security-operations)
35. [Key Rotation Procedures](#35-key-rotation-procedures)
36. [Production Troubleshooting Guide](#36-production-troubleshooting-guide)
37. [Common Failure Scenarios](#37-common-failure-scenarios)
38. [Recovery Procedures](#38-recovery-procedures)
39. [Operational Best Practices](#39-operational-best-practices)
40. [Known Operational Risks](#40-known-operational-risks)
41. [Maintenance Schedule](#41-maintenance-schedule)
42. [Production Validation Checklist](#42-production-validation-checklist)

---

## 1. System Overview

Denumrutham is a multi-tenant Temple Management Platform (TMP) comprising two independently-deployed applications:

| Application | Stack | Platform | URL |
|---|---|---|---|
| **Backend API** | Python 3.12 / FastAPI / Uvicorn / Gunicorn | Railway.app | `https://denumrutham-backend-production.up.railway.app` |
| **Frontend** | React 19 / TypeScript / Vite | Vercel | Custom domain via Vercel |

**Supporting Infrastructure:**

| Service | Provider | Purpose |
|---|---|---|
| PostgreSQL | Railway managed | Primary datastore |
| Redis | Railway managed | Cache, rate-limit state |
| Static file storage | Railway ephemeral FS | Uploaded media (⚠️ not persistent) |

**Current Production State:**
- Backend runs as a **Docker container** on Railway
- Migrations run automatically as part of container `CMD`
- Frontend is a **static SPA** served from Vercel CDN
- No external task queue — background workers are in-process async tasks
- No external SMTP — email delivery not yet integrated
- No external push notification service — not yet integrated

---

## 2. Infrastructure Architecture

```
                     ┌─────────────────────────────────────────┐
                     │             Vercel Edge CDN              │
                     │   (React SPA, global CDN, HTTPS)        │
                     │   vercel.json rewrites:                  │
                     │   /api/* → Railway backend               │
                     │   /static/* → Railway backend            │
                     │   /* → index.html (SPA routing)          │
                     └──────────────────┬──────────────────────┘
                                        │ HTTPS
                     ┌──────────────────▼──────────────────────┐
                     │            Railway.app                   │
                     │  ┌─────────────────────────────────┐    │
                     │  │    FastAPI / Gunicorn Container  │    │
                     │  │    4 UvicornWorker processes     │    │
                     │  │    Port: $PORT (Railway-assigned)│    │
                     │  │    Health: /health/live          │    │
                     │  │                                  │    │
                     │  │    In-process async tasks:       │    │
                     │  │    • archana_completion_loop     │    │
                     │  │    • reservation_cleanup_loop    │    │
                     │  │    • payment_expiry_loop         │    │
                     │  │    • outbox_worker               │    │
                     │  └────────┬──────────────┬──────────┘    │
                     │           │              │               │
                     │  ┌────────▼──────┐ ┌────▼──────────┐    │
                     │  │  PostgreSQL   │ │     Redis     │    │
                     │  │  (managed)   │ │   (managed)   │    │
                     │  └───────────────┘ └───────────────┘    │
                     └─────────────────────────────────────────┘
```

### Network Topology

- Vercel → Railway: Public HTTPS (all API traffic proxied via `vercel.json` rewrites)
- Railway backend → Railway PostgreSQL: Private railway internal network
- Railway backend → Railway Redis: Private railway internal network
- CORS: Backend allows `*.vercel.app` and `*.denumrutham.com`

---

## 3. Environment Variables

### Backend — Required in Production

All variables are set in Railway service → Variables tab.

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ Critical | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host/db` |
| `SECRET_KEY` | ✅ Critical | Master secret (session signing, fallback) | 64-char random hex |
| `JWT_SECRET` | ✅ Critical | JWT signing secret (must differ from SECRET_KEY) | 64-char random hex |
| `ENVIRONMENT` | ✅ | Runtime environment flag | `production` |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Validates Razorpay webhook signatures | From Razorpay dashboard |
| `CORS_ALLOWED_ORIGINS` | ✅ | Comma-separated allowed origins | `https://app.denumrutham.com,https://denumrutham.vercel.app` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://:password@host:6379/0` |
| `PORT` | Auto | Injected by Railway | (set by Railway) |
| `LOG_LEVEL` | Optional | Logging verbosity | `production` |
| `RAILWAY_GIT_COMMIT_SHA` | Auto | Injected by Railway CI | (set by Railway) |

### Backend — Railway Auto-Injected Variables

Railway automatically sets these when services are linked:

| Variable | Source | Description |
|---|---|---|
| `DATABASE_URL` | Railway PostgreSQL plugin | Auto-set when DB is linked to service |
| `REDIS_URL` | Railway Redis plugin | Auto-set when Redis is linked to service |
| `PORT` | Railway | Port the service should listen on |
| `RAILWAY_GIT_COMMIT_SHA` | Railway CI | Current deployed commit |
| `RAILWAY_ENVIRONMENT` | Railway | Railway environment name |

> [!IMPORTANT]
> Even though Railway auto-sets `DATABASE_URL`, ensure the value uses `postgresql+asyncpg://` format, not `postgres://`. The Settings class in `config.py` auto-normalizes `postgres://` → `postgresql+asyncpg://`, but verify after any DB credential rotation.

### Backend — Production Validation

The `Settings.validate_secrets()` validator runs at startup and raises `ValueError` if any of the following are missing or default in `ENVIRONMENT=production`:

```
DATABASE_URL      → must be set
SECRET_KEY        → must NOT be "supersecretkey-change-in-prod"
JWT_SECRET        → must be set and not equal SECRET_KEY default
RAZORPAY_WEBHOOK_SECRET → must be set
```

A startup failure due to missing secrets writes to `audit_integrity_verification_reports` before crashing and will appear in Railway deployment logs.

### Frontend — Vercel Environment Variables

Set in Vercel project → Settings → Environment Variables:

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Optional | Backend base URL (fallback to proxy) | `https://denumrutham-backend-production.up.railway.app` |

> [!NOTE]
> In production, the frontend does NOT need `VITE_API_URL` if `vercel.json` rewrites are in place. All `/api/*` requests are proxied to Railway automatically. Set this only if the Vercel URL is deprecated or you need to override the proxy.

### Generating Secure Secrets

```bash
# Generate SECRET_KEY (64-char hex)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate JWT_SECRET (must be different from SECRET_KEY)
python -c "import secrets; print(secrets.token_hex(32))"

# Verify they are different before setting
```

---

## 4. Railway Deployment

### Build Configuration

Railway uses Docker to build and run the backend. Configuration in `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health/live",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Deployment Trigger

Every push to the `main` branch of the backend repository automatically triggers a Railway build and deploy.

### Deployment Process (Automated)

```
git push origin main
       ↓
Railway detects push via GitHub webhook
       ↓
Railway builds Docker image (multi-stage)
       ↓
Docker CMD executes: alembic upgrade head && gunicorn ...
       ↓
Railway health-checks /health/live
       ↓ (if health check passes)
Traffic switched to new container
       ↓ (if health check fails)
Deployment marked as failed, previous container stays live
```

### Manual Deployment

To trigger a deployment without a code push (e.g., after environment variable change):

1. Railway Dashboard → Project → Backend Service → Settings → Redeploy
2. Or via Railway CLI:
```bash
railway up --detach
```

### Viewing Deployment Status

```bash
# Via Railway CLI
railway status
railway logs

# Tail live logs
railway logs --tail 200

# View specific deployment
railway logs --deployment <deployment-id>
```

### Rollback via Railway Dashboard

1. Railway Dashboard → Project → Backend Service → Deployments tab
2. Find the last successful deployment
3. Click ⋮ → Redeploy

---

## 5. Frontend Deployment

### Build & Deploy Process

Every push to the `main` branch of the frontend repository automatically triggers a Vercel build.

```bash
# Vercel build command (auto-configured):
tsc -b && vite build

# Output directory:
dist/
```

### Vercel Routing Configuration (`vercel.json`)

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/:path*",    "destination": "https://denumrutham-backend-production.up.railway.app/api/:path*" },
    { "source": "/static/:path*", "destination": "https://denumrutham-backend-production.up.railway.app/static/:path*" },
    { "source": "/(.*)",          "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection",       "value": "1; mode=block" },
        { "key": "Referrer-Policy",        "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

> [!WARNING]
> The `vercel.json` hardcodes the Railway backend URL. If the Railway service URL ever changes, update `vercel.json` and redeploy the frontend. Do **not** rely on Vercel environment variables for this — use `vercel.json` rewrites for reliability.

### Manual Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Preview deployment (not production)
vercel
```

### Frontend Rollback

1. Vercel Dashboard → Project → Deployments
2. Find the last successful deployment
3. Click ⋮ → Promote to Production

---

## 6. Database Deployment

### Connection

Railway provides a managed PostgreSQL instance. The connection string is injected as `DATABASE_URL`.

**Connection format used by the application:**
```
postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>
```

Railway auto-normalizes `postgres://` → `postgresql+asyncpg://` via the config validator.

### Connecting to Production DB

```bash
# Via Railway CLI (recommended — no credentials in shell history)
railway connect postgresql

# Via psql with connection string
psql $DATABASE_URL

# Via Railway CLI (direct psql)
railway run psql $DATABASE_URL
```

### Migration Execution

**Migrations run automatically** in the Docker `CMD` on every deployment:

```dockerfile
CMD ["sh", "-c", "alembic upgrade head && gunicorn ..."]
```

This means every deploy runs `alembic upgrade head` before starting the server. If migrations fail, the container fails to start and Railway keeps the old version live.

### Manual Migration (Emergency)

```bash
# Connect to Railway shell
railway run bash

# Inside Railway shell:
alembic upgrade head
alembic current          # Verify current revision
alembic history --verbose  # Full history

# Downgrade one step (DANGEROUS — see §21 first)
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision_hash>
```

### Checking Migration State

```bash
# What revision is the DB currently at?
railway run alembic current

# Are there pending migrations?
railway run alembic check

# View full history with current marker
railway run alembic history --verbose
```

---

## 7. Redis Configuration

### Connection

Railway managed Redis is linked to the backend service. The `REDIS_URL` is auto-injected.

**Connection format:**
```
redis://:<password>@<host>:<port>/<db>
```

### Redis Database Allocation

| DB Index | Purpose |
|---|---|
| `0` | Production cache (default) |

### Current Redis Usage

| Key Pattern | TTL | Purpose |
|---|---|---|
| `finance:settlement_dashboard:<temple_id>` | 300s | Settlement dashboard cache |
| `archana:catalog:<temple_id>` | 3600s | Archana catalog cache |
| Rate limit counters | Configured by slowapi | API rate limiting |

### Connecting to Production Redis

```bash
# Via Railway CLI
railway connect redis

# Or via redis-cli with URL
redis-cli -u $REDIS_URL

# Check connection
redis-cli -u $REDIS_URL ping  # → PONG

# Monitor all commands in real-time (CAUTION: high output in production)
redis-cli -u $REDIS_URL monitor
```

---

## 8. Background Workers

### Overview

The backend runs **4 in-process async workers** launched at startup within the Gunicorn/Uvicorn process. There is no external task queue.

| Worker | Interval | Function |
|---|---|---|
| `archana_completion_loop` | Every 60s | Auto-completes archana bookings past scheduled time |
| `reservation_cleanup_loop` | Every 60s | Releases stale store stock reservations |
| `payment_expiry_loop` | Every 60s | Expires unpaid online payment sessions |
| `outbox_worker` | Continuous | Promotes `activity_outbox` → `immutable_activity_logs` |

### Worker Architecture

Workers run as `asyncio.create_task()` inside the same event loop as the HTTP server. With 4 Gunicorn workers, **each process runs its own copy** of each background task. This means 4 instances of each worker run simultaneously.

> [!WARNING]
> Because 4 Gunicorn worker processes each run all 4 background tasks, operations must be **idempotent**. The `outbox_worker` uses database-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`) to prevent duplicate processing. The other three workers run cleanup/completion logic that is safe to run concurrently.

### Worker Health Verification

Workers do not expose a separate health endpoint. Verify via logs:

```bash
# Check for worker activity in logs
railway logs | grep -E "archana_completion_loop|reservation_cleanup|payment_expiry|outbox_worker"

# Check for worker errors
railway logs | grep -i "error in.*loop"

# Verify outbox is processing (no growing backlog)
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;"
```

---

## 9. Docker Configuration

### Dockerfile Overview

The Dockerfile uses a **two-stage multi-stage build**:

**Stage 1 — `base`:**
- `python:3.12-slim` base image
- Installs `gcc` and `libpq-dev` (needed to compile `asyncpg`/`psycopg2`)
- Installs all Python dependencies from `requirements.txt`
- Also installs `psycopg2-binary` and `gunicorn`

**Stage 2 — `production`:**
- Fresh `python:3.12-slim` (smaller — no build tools)
- Copies site-packages from Stage 1 (no recompilation)
- Installs only runtime `libpq5` and `curl` (for health check)
- Creates non-root user `tms:tms`
- Exposes port 8000
- Runs health check every 30s against `/health/live`

**Startup command:**
```bash
alembic upgrade head && gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:${PORT:-8000} \
  --forwarded-allow-ips='*' \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### Docker Build — Local Testing

```bash
cd backend

# Build the production image
docker build -t denumrutham-backend:latest .

# Run locally with env vars
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://..." \
  -e SECRET_KEY="..." \
  -e JWT_SECRET="..." \
  -e REDIS_URL="redis://localhost:6379/0" \
  -e ENVIRONMENT="production" \
  -e RAZORPAY_WEBHOOK_SECRET="..." \
  denumrutham-backend:latest

# Verify container health
curl http://localhost:8000/health/live
```

### Gunicorn Worker Count

Currently configured at 4 workers. Recommended formula for CPU-bound:
```
workers = (2 × CPU_cores) + 1
```

For Railway's typical 1 vCPU shared environment, 2–4 workers is appropriate. Adjust in `Dockerfile CMD` if Railway plan changes.

---

## 10. Secrets Management

### Current Approach

All secrets are stored as **Railway service environment variables**. There is no external secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.) at this time.

### Secret Inventory

| Secret | Location | Rotation Frequency |
|---|---|---|
| `SECRET_KEY` | Railway Variables | Annually or on suspected compromise |
| `JWT_SECRET` | Railway Variables | Annually or on suspected compromise |
| `DATABASE_URL` | Railway Variables (auto) | On Railway DB credential rotation |
| `REDIS_URL` | Railway Variables (auto) | On Railway Redis credential rotation |
| `RAZORPAY_WEBHOOK_SECRET` | Railway Variables | When rotating in Razorpay dashboard |

### Accessing Secrets

```bash
# List all variables (values hidden by default)
railway variables

# Get specific variable
railway variables get SECRET_KEY

# Set a new variable
railway variables set SECRET_KEY="new-value-here"
```

### Secret Access Audit

Railway tracks who changed variables and when via the Railway Dashboard audit log. Review any variable change under:
`Railway Dashboard → Project → Activity`

### Security Rules for Secrets

1. **Never commit secrets to Git** — even in test branches
2. **Never log secrets** — verify log statements don't include env var values
3. **Rotate immediately** on any suspected exposure
4. **Different `SECRET_KEY` and `JWT_SECRET`** — must be distinct values
5. **Never use default values in production** — startup validator blocks this

---

## 11. SMTP Configuration

> [!WARNING]
> **SMTP is not currently integrated.** Email delivery (OTP, booking confirmations, staff invitations, notifications) is not implemented. OTPs are stored in the database (`users.otp_code` column) as a placeholder.

### Current State

| Feature | Status |
|---|---|
| OTP delivery | ❌ Not sent — stored in DB only |
| Booking confirmations | ❌ Not sent |
| Staff invitation emails | ❌ Not sent |
| Settlement notifications | ❌ Not sent |

### Future Integration Plan

When SMTP is implemented, the following variables will be required:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
SMTP_FROM_EMAIL=noreply@denumrutham.com
SMTP_FROM_NAME=Denumrutham
```

---

## 12. Push Notification Configuration

> [!WARNING]
> **Push notifications are not currently integrated.** The `notifications` table and domain event bus exist, but delivery is DB-only. No FCM, APNs, or WebSocket push is implemented.

### Current State

Notifications are written to the `notifications` table and surfaced via polling:
- `GET /api/v1/notifications` — returns unread notifications for the current user

### Future Integration Plan

When push notifications are implemented:
```env
FCM_SERVER_KEY=<firebase-cloud-messaging-key>
# or
APNS_KEY_ID=<apple-push-notification-key>
APNS_TEAM_ID=<apple-team-id>
```

---

## 13. Storage Configuration

> [!CAUTION]
> **File storage is ephemeral.** Uploaded images and documents are stored in `/app/static/uploads/` inside the Railway container. **All files are permanently deleted on every deployment.** This is a known operational risk.

### Current State

| Upload Type | Endpoint | Storage Location |
|---|---|---|
| Images | `POST /api/v1/upload/image` | `/app/static/uploads/` |
| Audio | `POST /api/v1/upload/audio` | `/app/static/uploads/` |
| Documents | `POST /api/v1/upload/document` | `/app/static/uploads/` |

Uploaded files are served at: `https://denumrutham-backend-production.up.railway.app/static/uploads/<filename>`

### Workaround (Current)

Before any production deployment that will cause file loss:
1. Notify temple managers that uploaded media may be affected
2. There is currently no automated backup of uploaded files

### Future Integration Plan (Required)

Replace local storage with Cloudflare R2 or AWS S3:
```env
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
R2_BUCKET_NAME=denumrutham-uploads
R2_PUBLIC_URL=https://uploads.denumrutham.com
```

---

## 14. DNS & Domain Management

### Current Domain Configuration

| Domain | Points To | Purpose |
|---|---|---|
| `*.vercel.app` | Vercel CDN | Frontend (auto-managed by Vercel) |
| `denumrutham-backend-production.up.railway.app` | Railway | Backend API (auto-managed by Railway) |

### Custom Domain Setup (When Required)

**Frontend custom domain (Vercel):**
1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `app.denumrutham.com`
3. Add CNAME record at DNS registrar: `app.denumrutham.com → cname.vercel-dns.com`
4. Vercel auto-issues SSL certificate

**Backend custom domain (Railway):**
1. Railway Dashboard → Service → Settings → Networking → Custom Domain
2. Add domain: `api.denumrutham.com`
3. Add CNAME record: `api.denumrutham.com → <railway-provided-target>`
4. Update `vercel.json` rewrite destination to use new domain
5. Update `CORS_ALLOWED_ORIGINS` if the frontend domain changes

---

## 15. SSL/TLS

### Current TLS Configuration

| Layer | Provider | Certificate |
|---|---|---|
| Frontend → User | Vercel | Auto-managed Let's Encrypt |
| Backend → Vercel | Railway | Auto-managed Railway TLS |
| Backend → DB | Railway internal | Railway private network (no external TLS needed) |
| Backend → Redis | Railway internal | Railway private network (no external TLS needed) |

### HTTPS Enforcement

The backend enforces HTTPS via `HTTPSRedirectHeadersMiddleware`:
- Adds `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Reads `X-Forwarded-Proto` header from Railway's reverse proxy to determine scheme
- Adds `X-Forwarded-Proto` awareness for proper HTTPS detection behind proxy

### Certificate Renewal

Both Vercel and Railway handle SSL certificate renewal automatically. No manual action required.

---

## 16. Health Checks

### Endpoints

| Endpoint | Method | Response | Purpose |
|---|---|---|---|
| `/health/live` | GET | `{"status": "alive", "commit": "..."}` | Liveness probe |
| `/api/v1/health` | GET | Database + Redis connectivity | Readiness probe |
| `/api/v1/diag/ping` | GET | `{"status": "pong"}` | Deployment verification |
| `/metrics` | GET | Prometheus metrics | Monitoring |

### Railway Health Check

Railway pings `/health/live` every 30 seconds with a 30-second timeout. Three consecutive failures trigger a restart (up to 3 retries before marking the deployment failed).

### Manual Health Verification

```bash
# Quick liveness check
curl https://denumrutham-backend-production.up.railway.app/health/live

# Full readiness check (includes DB + Redis)
curl https://denumrutham-backend-production.up.railway.app/api/v1/health

# Deployment verification (confirms latest code is running)
curl https://denumrutham-backend-production.up.railway.app/api/v1/diag/ping

# Check Prometheus metrics
curl https://denumrutham-backend-production.up.railway.app/metrics | head -50
```

### Application-Level Health: Audit Chain

The audit chain verification runs on every startup. Results are stored in `audit_integrity_verification_reports`:

```sql
-- Check startup health history
SELECT status, details, temple_id, verified_at
FROM audit_integrity_verification_reports
ORDER BY verified_at DESC
LIMIT 10;

-- Check for any FAIL or ERROR states
SELECT status, details, verified_at
FROM audit_integrity_verification_reports
WHERE status NOT IN ('PASS', 'VERIFIED')
ORDER BY verified_at DESC;
```

---

## 17. Logging

### Log Format

The backend uses structured JSON logging via `logging_config.py`. Each log line includes:

```json
{
  "timestamp": "2026-06-25T14:30:00.000Z",
  "level": "INFO",
  "logger": "tms.modules.finance.routes",
  "message": "Settlement batch approved",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "temple_id": "f96f45a1-...",
  "user_id": "a1b2c3d4-...",
  "batch_id": "...",
  "amount": 45000.00
}
```

Access logs (HTTP requests) are written to stdout/stderr by Gunicorn (`--access-logfile -`).

### Viewing Logs

```bash
# Railway CLI — tail latest logs
railway logs --tail 200

# Filter for errors only
railway logs | grep -E '"level":"ERROR"|"level":"CRITICAL"'

# Filter for specific module
railway logs | grep "tms.modules.finance"

# Filter for specific request ID
railway logs | grep "550e8400-e29b-41d4-a716-446655440000"

# Filter for startup events
railway logs | grep "Starting TMS API\|startup\|Startup"
```

### Log Retention

Railway retains logs for the duration of the current and a limited number of previous deployments. For long-term log retention, configure a log drain:

**Railway Dashboard → Project → Settings → Log Drain → Add Drain**

Recommended targets:
- **Datadog** (if subscribed)
- **Logtail / Better Stack**
- **Papertrail**

### Critical Log Events to Monitor

| Log Pattern | Severity | Meaning |
|---|---|---|
| `CRITICAL: AUDIT CHAIN CORRUPTION` | 🔴 Critical | Audit chain integrity failure — immediate action required |
| `APPLICATION STARTUP BLOCKED` | 🔴 Critical | Schema integrity failure at startup |
| `STARTUP CRASH DETECTED` | 🔴 Critical | Unhandled exception during startup |
| `CRITICAL: DATABASE_ERROR` | 🔴 Critical | Database unavailable |
| `Error in archana_completion_loop` | 🟡 Warning | Background worker failure |
| `Error in outbox_worker` | 🟡 Warning | Audit delivery failure |
| `Redis unavailable` | 🟡 Warning | Cache degraded mode |

---

## 18. Monitoring

### Prometheus Metrics

The backend exposes Prometheus metrics at `/metrics` via `prometheus-fastapi-instrumentator`.

**Key metrics exposed:**

| Metric | Type | Description |
|---|---|---|
| `http_requests_total` | Counter | Total HTTP requests by method, path, status |
| `http_request_duration_seconds` | Histogram | Request duration latency |
| `http_requests_in_progress` | Gauge | Currently active requests |

Metrics are excluded for: `/metrics`, `/health/live`, `/health/ready` (to reduce noise).

### Connecting Prometheus (Self-Hosted)

```yaml
# prometheus.yml scrape config
scrape_configs:
  - job_name: 'denumrutham-backend'
    static_configs:
      - targets: ['denumrutham-backend-production.up.railway.app']
    scheme: https
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Database Monitoring

```sql
-- Active connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Slow queries (requires pg_stat_statements extension)
SELECT query, mean_exec_time, calls, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 20;
```

### Operational Dashboard Queries

```sql
-- Daily booking volume
SELECT DATE(created_at), COUNT(*) FROM archana_bookings
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at) ORDER BY 1;

-- Active temple count
SELECT COUNT(*) FROM temples WHERE status = 'ACTIVE';

-- Outbox backlog (should stay near 0)
SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;

-- Failed audit verifications
SELECT COUNT(*) FROM audit_integrity_verification_reports
WHERE status NOT IN ('PASS', 'VERIFIED')
AND verified_at > NOW() - INTERVAL '24 hours';
```

---

## 19. Alerting

### Current State

No automated alerting is configured. Monitoring is manual via Railway logs and Prometheus metrics.

### Recommended Alert Thresholds

Configure these in your chosen alerting platform (Datadog, PagerDuty, Grafana Alerts):

| Alert | Condition | Severity | Action |
|---|---|---|---|
| **API Error Rate** | HTTP 5xx > 5% of requests over 5 min | 🔴 Critical | Page on-call engineer |
| **Latency** | p95 request duration > 3s for 5 min | 🟡 Warning | Investigate DB/Redis |
| **Backend Down** | `/health/live` fails 3 times | 🔴 Critical | Page on-call immediately |
| **Audit Chain Corrupt** | Log pattern `AUDIT CHAIN CORRUPTION` | 🔴 Critical | Page CTO immediately |
| **Outbox Backlog** | `activity_outbox WHERE processed=FALSE > 100` | 🟡 Warning | Check outbox worker |
| **DB Connections** | Connections > 80% of max | 🟡 Warning | Investigate connection leaks |
| **Disk Usage** | Railway disk > 80% | 🟡 Warning | Clean ephemeral files |

---

## 20. Database Backup Strategy

### Railway Automatic Backups

Railway managed PostgreSQL provides automatic daily backups. Retention period depends on your Railway plan:

- **Starter/Hobby:** 7-day rolling retention
- **Pro:** 30-day rolling retention

Verify current backup schedule:
`Railway Dashboard → Project → PostgreSQL → Backups tab`

### Manual Backup Procedure

Run before any significant schema migration or major data operation:

```bash
# Method 1: Via Railway CLI + pg_dump
railway run pg_dump $DATABASE_URL \
  --format=custom \
  --no-acl \
  --no-owner \
  -f /tmp/denumrutham_backup_$(date +%Y%m%d_%H%M%S).dump

# Method 2: Plain SQL dump
railway run pg_dump $DATABASE_URL \
  --format=plain \
  --no-acl \
  --no-owner \
  > denumrutham_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list denumrutham_backup.dump | head -20
```

### Tables Requiring Backup Priority

In order of criticality:

1. `transactions` — Enterprise Master Ledger
2. `immutable_activity_logs` — Audit chain
3. `archana_bookings` + child tables — Core booking data
4. `temples` + `temple_profiles` — Master temple records
5. `users` — User accounts
6. `temple_bank_accounts` — Financial configuration
7. `platform_financial_accounts` — Platform financial config
8. `settlement_batches` + `settlement_batch_items` — Settlement history

---

## 21. Database Restore Procedure

> [!CAUTION]
> Database restore overwrites production data. Never attempt without authorization from the Engineering Lead or CTO.

### Step 1: Notify Stakeholders

- Send incident notice to Engineering Lead, CTO, and Operations team
- Set maintenance mode if possible (currently no maintenance mode endpoint exists)

### Step 2: Create Pre-Restore Backup

```bash
# Even before restoring, snapshot the current broken state for forensics
railway run pg_dump $DATABASE_URL \
  --format=custom \
  -f pre_restore_snapshot_$(date +%Y%m%d_%H%M%S).dump
```

### Step 3: Restore from Backup

**From Railway automatic backup:**
1. Railway Dashboard → PostgreSQL → Backups
2. Select desired restore point
3. Click "Restore" → Confirm
4. Railway handles the restore process (5–30 minutes depending on DB size)

**From manual dump file:**
```bash
# Restore custom format backup
pg_restore \
  --dbname=$DATABASE_URL \
  --clean \
  --if-exists \
  --no-acl \
  --no-owner \
  --verbose \
  denumrutham_backup.dump

# Restore SQL format backup
psql $DATABASE_URL < denumrutham_backup.sql
```

### Step 4: Run Migrations

After restore, the DB revision may be behind the codebase:

```bash
railway run alembic upgrade head
```

### Step 5: Verify Restore

```bash
# Check migration state
railway run alembic current

# Spot-check table counts
railway run psql $DATABASE_URL -c "
SELECT
  (SELECT COUNT(*) FROM temples) AS temples,
  (SELECT COUNT(*) FROM archana_bookings) AS bookings,
  (SELECT COUNT(*) FROM transactions) AS transactions,
  (SELECT COUNT(*) FROM immutable_activity_logs) AS audit_logs;
"

# Verify audit chain integrity
railway run psql $DATABASE_URL -c "
SELECT status, COUNT(*) FROM audit_integrity_verification_reports
GROUP BY status;"
```

### Step 6: Redeploy Application

```bash
# Force redeploy to reinitialize background workers and validate schema
railway up --detach
```

---

## 22. Disaster Recovery

### RTO and RPO Targets

| Metric | Target | Notes |
|---|---|---|
| **RTO** (Recovery Time Objective) | < 2 hours | Time to restore service after complete failure |
| **RPO** (Recovery Point Objective) | < 24 hours | Maximum acceptable data loss |

These targets reflect current Railway backup cadence (daily). With manual pre-deploy backups, RPO is effectively < 1 hour for planned operations.

### Disaster Scenarios and Recovery

**Scenario A: Backend Container Crash**
- Railway auto-restarts up to 3 times (`restartPolicyMaxRetries: 3`)
- If restarts fail: check Railway logs for startup error, fix and redeploy
- RTO: 5–15 minutes

**Scenario B: Database Corruption**
- Immediate: Railway managed restore from latest backup
- See §21 for full procedure
- RTO: 1–2 hours

**Scenario C: Full Railway Region Outage**
- Frontend continues serving (Vercel global CDN)
- Backend API unavailable — API calls return errors
- Resolution: Wait for Railway recovery OR migrate service to alternate region
- RTO: Dependent on Railway SLA (typically < 1 hour)

**Scenario D: Audit Chain Corruption**
- Detected at startup via `ChainVerificationService`
- Affected temple(s) automatically quarantined
- Do NOT attempt in-place fix — involves forensic review
- Contact Engineering Lead immediately
- See §38 Recovery Procedures

**Scenario E: Secret Compromise**
- Immediately rotate all secrets (see §35)
- Rotate `SECRET_KEY` invalidates all active JWT sessions (all users logged out)
- Rotate `JWT_SECRET` invalidates all active JWT sessions

---

## 23. Incident Response

### Severity Classification

| Severity | Definition | Response Time | Escalation |
|---|---|---|---|
| **P0** | Complete service unavailability OR audit chain corruption OR data breach | Immediate | Engineering Lead + CTO within 5 min |
| **P1** | Major feature broken for all temples (finance/bookings down) | 30 min | Engineering Lead within 15 min |
| **P2** | Single module broken or degraded for some temples | 2 hours | Engineering Lead within 1 hour |
| **P3** | Minor issue, cosmetic, or non-critical degradation | Next business day | Slack channel |

### Incident Response Steps

**1. Detection**
- Railway logs alert
- User report via support channel
- Monitoring threshold breach

**2. Triage (< 5 minutes)**
```bash
# Is the backend alive?
curl https://denumrutham-backend-production.up.railway.app/health/live

# Check Railway deployment status
railway status

# Check recent logs for errors
railway logs --tail 100 | grep -E "ERROR|CRITICAL"

# Check DB connectivity
railway run psql $DATABASE_URL -c "SELECT NOW();"
```

**3. Communicate**
- Post incident notice in engineering Slack channel
- Notify Engineering Lead within 5 minutes of P0/P1

**4. Contain**
- If data is at risk: take immediate backup before any action
- If backend is unreachable: check Railway deployment status and logs

**5. Resolve**
- Apply fix and redeploy, OR
- Roll back to last known good deployment (see §24)

**6. Post-Mortem**
- Write incident report within 24 hours of resolution
- Document: timeline, root cause, impact, resolution, prevention

---

## 24. Rollback Procedure

### When to Roll Back

Roll back when:
- A deployment causes > 5% error rate increase
- A critical feature is broken by the deployment
- The health check fails consistently post-deployment

### Backend Rollback (Railway)

```bash
# Method 1: Via Railway Dashboard (recommended)
# Railway → Project → Backend Service → Deployments → find last good → Redeploy

# Method 2: Via Railway CLI
railway rollback  # Redeploys the previous successful deployment

# Method 3: Git revert + redeploy
git revert HEAD
git push origin main
# Railway auto-deploys the reverted commit
```

### Database Rollback

If the deployment included a schema migration:

```bash
# 1. First redeploy the old code (step above)
# 2. Then manually downgrade the migration
railway run alembic downgrade -1  # One step back
# or
railway run alembic downgrade <target_revision>

# 3. Verify
railway run alembic current
```

> [!CAUTION]
> **Never run `alembic downgrade` without first confirming that the new code has been rolled back.** Running old code against a new schema, or new code against an old schema, causes undefined behavior.

### Frontend Rollback (Vercel)

```bash
# Via Vercel Dashboard
# Vercel → Project → Deployments → find last good → ⋮ → Promote to Production

# Via Vercel CLI
vercel rollback <deployment-url>
```

### Rollback Decision Matrix

| Situation | Action |
|---|---|
| Deploy failed health check | Railway auto-keeps old version — no action needed |
| Deploy succeeded but runtime errors appeared | Roll back via Railway dashboard |
| Deploy with migration caused DB errors | Roll back code + `alembic downgrade` |
| Frontend deploy broke UI | Roll back via Vercel dashboard |
| Both services need rollback | Roll back backend first, then frontend |

---

## 25. Alembic Migration Procedure

> [!IMPORTANT]
> Migrations run automatically in the Docker CMD (`alembic upgrade head`). Follow this SOP for any migration that requires additional care.

### Standard Procedure (Automated)

1. Migration committed to `alembic/versions/` in a feature branch
2. PR reviewed and merged to `main`
3. Railway auto-builds → `alembic upgrade head` runs in CMD
4. If migration fails, container fails to start → Railway keeps old version live

### High-Risk Migration SOP

For migrations that: rename tables, drop columns, modify constraints on large tables, or transform data.

**Before:**
```bash
# 1. Take a manual backup
railway run pg_dump $DATABASE_URL --format=custom -f pre_migration_$(date +%Y%m%d_%H%M%S).dump

# 2. Verify current revision matches expected
railway run alembic current

# 3. Review the migration SQL dry-run
railway run alembic upgrade head --sql  # Shows SQL without executing
```

**During:**
```bash
# Deploy as normal (migration runs automatically)
git push origin main

# Monitor Railway logs during deployment
railway logs --tail 100 | grep -E "alembic|INFO|ERROR"
```

**After:**
```bash
# Verify migration completed
railway run alembic current

# Verify data integrity
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM <affected_table>;"

# Run post-migration verification queries if applicable
```

### Emergency Manual Migration

If automated migration failed mid-way:

```bash
# 1. Connect to Railway environment
railway run bash

# 2. Check current state
alembic current

# 3. Check for incomplete migrations
psql $DATABASE_URL -c "SELECT * FROM alembic_version;"

# 4. If migration is partially applied, investigate:
# - Was it a DDL migration? PostgreSQL DDL is transactional — it either committed or rolled back
# - Was it a data migration? May need manual cleanup

# 5. Either complete or revert
alembic upgrade head   # Try to complete
# or
alembic downgrade -1   # Revert and investigate
```

---

## 26. Production Deployment Checklist

Complete this checklist before every production deployment:

### Code Readiness
- [ ] All tests passing in CI
- [ ] PR reviewed and approved by at least 1 engineer
- [ ] `main` branch is the deployment source
- [ ] No debug code (`print()`, `breakpoint()`, `console.log`)
- [ ] No hardcoded secrets or credentials
- [ ] No commented-out code blocks
- [ ] Docstrings present on new public APIs

### Database
- [ ] Alembic migration reviewed and tested locally
- [ ] `downgrade()` function is present and tested
- [ ] Pre-deployment backup taken (for high-risk migrations)
- [ ] Estimated migration runtime acceptable (for large tables, estimate rows × row_time)

### Configuration
- [ ] All required env vars present in Railway Variables
- [ ] `ENVIRONMENT=production` set
- [ ] CORS origins include production frontend URL
- [ ] `RAZORPAY_WEBHOOK_SECRET` is current

### API Contract
- [ ] If backend API shape changed, frontend has been updated
- [ ] No breaking changes to existing API consumers without version bump
- [ ] Swagger documentation updated for new endpoints

### Security
- [ ] No new endpoints missing authentication
- [ ] Bank account masking in place for new financial responses
- [ ] Audit events emitted for new financial/governance operations
- [ ] Rate limiting applied to new auth/payment endpoints

---

## 27. Release Checklist

For planned releases (feature releases, not hotfixes):

### Pre-Release (1 week before)
- [ ] All features merged to `main`
- [ ] Full regression test completed
- [ ] Performance test on staging environment (if available)
- [ ] Database migration impact assessed
- [ ] Release notes drafted

### Pre-Release (day of)
- [ ] Final backup of production database
- [ ] Railway and Vercel dashboards accessible to release manager
- [ ] Engineering Lead on standby for first 30 minutes post-deployment
- [ ] Rollback procedure reviewed and agreed

### Release Window
- [ ] Preferred window: Low-traffic period (after midnight IST, before 6 AM IST)
- [ ] Avoid: Festival periods, payroll dates, major temple event days

### Go/No-Go Criteria
- [ ] All P0 and P1 bugs fixed
- [ ] No pending migrations with unknown risk
- [ ] Backend health check passing in pre-release environment
- [ ] Frontend build successful

---

## 28. Post-Deployment Verification

Run immediately after every deployment:

### Automated Checks (< 5 minutes)

```bash
# 1. Liveness
curl -f https://denumrutham-backend-production.up.railway.app/health/live
# Expected: {"status": "alive", "commit": "<hash>"}

# 2. Readiness (DB + Redis)
curl -f https://denumrutham-backend-production.up.railway.app/api/v1/health
# Expected: {"status": "healthy", ...}

# 3. API ping
curl https://denumrutham-backend-production.up.railway.app/api/v1/diag/ping
# Expected: {"status": "pong", "message": "Backend is reachable and updated"}

# 4. Verify correct commit deployed
curl https://denumrutham-backend-production.up.railway.app/health/live | python -m json.tool

# 5. Check error rate (first 5 minutes of logs post-deploy)
railway logs --tail 200 | grep -c "ERROR"  # Should be near 0
```

### Functional Smoke Tests (< 15 minutes)

| Test | Expected Result |
|---|---|
| Login with manager account | 200, JWT returned |
| List archana bookings | 200, array returned |
| Manager dashboard KPIs | 200, metrics returned |
| Public temple list | 200, temples returned |
| Health endpoint via Vercel proxy | 200 (verifies Vercel → Railway routing) |

### Database Verification

```bash
# Confirm migration applied
railway run alembic current

# Confirm no outbox backlog
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;"
# Expected: 0 or near 0

# Confirm audit chain healthy
railway run psql $DATABASE_URL -c "
SELECT status, COUNT(*) FROM audit_integrity_verification_reports
WHERE verified_at > NOW() - INTERVAL '1 hour'
GROUP BY status;"
# Expected: Only 'PASS' or 'VERIFIED' statuses
```

---

## 29. Performance Monitoring

### Key Metrics to Track

| Metric | Healthy Baseline | Warning Threshold | Critical Threshold |
|---|---|---|---|
| API p50 latency | < 200ms | > 500ms | > 1000ms |
| API p95 latency | < 500ms | > 1500ms | > 3000ms |
| DB query time (avg) | < 50ms | > 200ms | > 500ms |
| 5xx error rate | < 0.1% | > 1% | > 5% |
| Outbox backlog | 0 | > 50 | > 100 |
| Active DB connections | < 20 | > 50 | > 80 |

### Querying Current Performance

```bash
# Current active connections
railway run psql $DATABASE_URL -c "
SELECT count(*), state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type, wait_event;"

# Longest running queries right now
railway run psql $DATABASE_URL -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC
LIMIT 10;"

# Table bloat check
railway run psql $DATABASE_URL -c "
SELECT schemaname, tablename,
       n_live_tup, n_dead_tup,
       ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
ORDER BY dead_pct DESC NULLIF 0
LIMIT 10;"
```

### Prometheus Query Examples

If Prometheus is configured:

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# In-flight requests
http_requests_in_progress
```

---

## 30. Cache Maintenance

### Viewing Cache State

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# List all keys with pattern
redis-cli -u $REDIS_URL keys "finance:*"
redis-cli -u $REDIS_URL keys "archana:*"

# Get a cached value
redis-cli -u $REDIS_URL get "finance:settlement_dashboard:<temple_uuid>"

# Check TTL of a key
redis-cli -u $REDIS_URL ttl "finance:settlement_dashboard:<temple_uuid>"

# Memory usage
redis-cli -u $REDIS_URL info memory | grep -E "used_memory_human|maxmemory_human"
```

### Cache Invalidation (Manual)

When stale cache causes data issues:

```bash
# Invalidate specific temple's finance cache
redis-cli -u $REDIS_URL del "finance:settlement_dashboard:<temple_uuid>"

# Invalidate all finance caches (ALL temples)
redis-cli -u $REDIS_URL keys "finance:*" | xargs redis-cli -u $REDIS_URL del

# Nuclear option — flush all Redis data (CAUTION: also clears rate limit state)
redis-cli -u $REDIS_URL flushdb
```

### Cache Warm-Up

After a cache flush, data will be fetched from DB on the next request. This is the correct behaviour — no warm-up scripts are needed.

---

## 31. Redis Maintenance

### Health Check

```bash
redis-cli -u $REDIS_URL ping  # → PONG
redis-cli -u $REDIS_URL info server | grep redis_version
redis-cli -u $REDIS_URL info stats | grep total_commands_processed
```

### Memory Monitoring

```bash
redis-cli -u $REDIS_URL info memory
```

Key fields:
- `used_memory_human` — current memory used
- `maxmemory_human` — configured max (0 = unlimited on Railway)
- `mem_fragmentation_ratio` — above 1.5 indicates fragmentation

### Key Expiry Monitoring

```bash
# Number of keys with TTL (should be most keys)
redis-cli -u $REDIS_URL info keyspace

# List keys without TTL (could be leaking)
redis-cli -u $REDIS_URL keys "*" | while read key; do
  ttl=$(redis-cli -u $REDIS_URL ttl "$key")
  if [ "$ttl" == "-1" ]; then
    echo "No TTL: $key"
  fi
done
```

> [!WARNING]
> Any key with TTL `-1` (no expiry) is a potential memory leak. Investigate and set a TTL or delete if stale.

### Redis Restart (Railway)

If Redis is in a bad state:
1. Railway Dashboard → Project → Redis Service → Settings → Restart
2. The backend will recover automatically (graceful Redis degradation is implemented)

---

## 32. Scheduled Jobs

There are **no cron-based scheduled jobs** in the current architecture. All recurring work is done by in-process async background workers (see §8).

### Background Worker Schedule

| Worker | Cadence | What it Does |
|---|---|---|
| Archana completion | Every 60s | Sets `COMPLETED` status on archana bookings past their ritual time |
| Reservation cleanup | Every 60s | Releases store stock reservations held > 30 minutes with no payment |
| Payment expiry | Every 60s | Expires `PAYMENT_PENDING` online booking sessions > 15 minutes |
| Outbox processor | Continuous | Moves `activity_outbox` records → `immutable_activity_logs` |

### Verifying Worker Cadence

```bash
# Check archana completions in last hour
railway run psql $DATABASE_URL -c "
SELECT COUNT(*), DATE_TRUNC('minute', completed_at) AS minute
FROM archana_bookings
WHERE completed_at > NOW() - INTERVAL '1 hour'
AND status = 'COMPLETED'
GROUP BY minute
ORDER BY minute DESC;"

# Check outbox processing rate
railway run psql $DATABASE_URL -c "
SELECT COUNT(*) AS pending FROM activity_outbox WHERE processed = FALSE;"
# Should be near 0 if worker is healthy
```

---

## 33. Background Task Monitoring

### Outbox Backlog Alert Query

```sql
-- Run this regularly or set up an alert
SELECT COUNT(*) AS pending_outbox_entries
FROM activity_outbox
WHERE processed = FALSE;

-- If > 0, check oldest unprocessed entry
SELECT id, temple_id, action, created_at, retry_count, error_message
FROM activity_outbox
WHERE processed = FALSE
ORDER BY created_at ASC
LIMIT 5;
```

### Diagnosing Worker Failure

If the outbox backlog is growing:

```bash
# 1. Check if the worker is running (look for recent processing)
railway logs | grep "outbox_worker\|activity_log_processor"

# 2. Check for errors in the worker
railway logs | grep "Error in outbox_worker"

# 3. Check for stuck entries (high retry count)
railway run psql $DATABASE_URL -c "
SELECT id, retry_count, error_message, created_at
FROM activity_outbox
WHERE processed = FALSE AND retry_count > 3
ORDER BY retry_count DESC LIMIT 10;"

# 4. If worker appears dead, redeploy to restart it
railway up --detach
```

### Reservation Cleanup Verification

```sql
-- Stale reservations that should have been cleaned up
SELECT COUNT(*)
FROM store_stock_reservations
WHERE status = 'ACTIVE'
AND created_at < NOW() - INTERVAL '35 minutes';

-- If > 0 and has been > 35 min, cleanup worker may be stuck
```

---

## 34. Security Operations

### Daily Security Checks

```bash
# Check for unusual login failures
railway logs | grep -i "auth\|login\|401\|403" | grep -i "error" | wc -l

# Check for rate limit triggers
railway logs | grep -i "rate.limit\|429" | tail -20

# Check for CRITICAL level events
railway logs | grep "CRITICAL" | tail -20
```

### Database Security Checks

```sql
-- New superadmin accounts (should be rare)
SELECT id, user_id, name, email, role, created_at
FROM users
WHERE role = 'SUPERADMIN'
ORDER BY created_at DESC;

-- Recently suspended users
SELECT id, user_id, name, status, updated_at
FROM users
WHERE status = 'SUSPENDED'
AND updated_at > NOW() - INTERVAL '24 hours';

-- Bank account reveals in last 7 days (should be audited)
SELECT payload, created_at, actor_id
FROM immutable_activity_logs
WHERE action = 'FINANCE_BANK_ACCOUNT_REVEALED'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Webhook Security

Razorpay webhook signatures are validated using `RAZORPAY_WEBHOOK_SECRET`. If you receive a spike in unverified webhook requests:

```bash
# Check webhook processing logs
railway logs | grep -i "webhook\|razorpay"

# Check for invalid signature events
railway logs | grep -i "webhook.*invalid\|signature.*fail"
```

---

## 35. Key Rotation Procedures

### Rotating `SECRET_KEY` and `JWT_SECRET`

> [!CAUTION]
> Rotating these keys immediately invalidates **all active user sessions**. Every logged-in user will be forced to log in again. Plan during low-traffic hours.

```bash
# 1. Generate new keys
python -c "import secrets; print('SECRET_KEY:', secrets.token_hex(32))"
python -c "import secrets; print('JWT_SECRET:', secrets.token_hex(32))"

# 2. Set in Railway Variables (do both at once to avoid partial state)
railway variables set SECRET_KEY="<new-secret-key>"
railway variables set JWT_SECRET="<new-jwt-secret>"

# 3. Redeploy to pick up new values
railway up --detach

# 4. Verify deployment succeeded
curl https://denumrutham-backend-production.up.railway.app/health/live

# 5. Test login with a known account
# All existing tokens are now invalid — users must log in again
```

### Rotating Razorpay Webhook Secret

```bash
# 1. Generate new webhook secret in Razorpay Dashboard
# Razorpay Dashboard → Settings → Webhooks → Edit → Regenerate Secret

# 2. Update Railway variable
railway variables set RAZORPAY_WEBHOOK_SECRET="<new-secret>"

# 3. Redeploy
railway up --detach

# 4. Verify webhooks are processing correctly (test with a Razorpay test event)
```

### Rotating Database Credentials

```bash
# 1. Railway handles credential rotation for managed PostgreSQL
# Railway Dashboard → PostgreSQL → Settings → Rotate Credentials

# 2. Railway auto-updates DATABASE_URL in linked services (verify this happened)
railway variables get DATABASE_URL

# 3. Redeploy backend to pick up new URL
railway up --detach

# 4. Verify DB connectivity
curl https://denumrutham-backend-production.up.railway.app/api/v1/health
```

---

## 36. Production Troubleshooting Guide

### Diagnostic Command Reference

```bash
# Is the backend running?
curl -f https://denumrutham-backend-production.up.railway.app/health/live

# Is the DB reachable?
railway run psql $DATABASE_URL -c "SELECT NOW();"

# Is Redis reachable?
redis-cli -u $REDIS_URL ping

# What's the current deployed commit?
curl https://denumrutham-backend-production.up.railway.app/api/v1/diag/ping

# What migration revision is deployed?
railway run alembic current

# Are there any pending migrations?
railway run alembic check

# What errors occurred in the last 100 log lines?
railway logs --tail 100 | grep -E "ERROR|CRITICAL|WARN"

# Are workers running?
railway logs | grep -E "archana_completion|outbox_worker|payment_expiry"

# Is the outbox healthy?
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;"
```

### Startup Failure Diagnostics

If the backend fails to start, check in this order:

```bash
# 1. Check Railway deployment logs
railway logs --tail 100

# 2. Check audit integrity verification reports (startup errors write here)
railway run psql $DATABASE_URL -c "
SELECT status, details, verified_at
FROM audit_integrity_verification_reports
ORDER BY verified_at DESC LIMIT 5;"

# 3. Common startup failures:
# - "Missing required production environment variable" → set missing variable
# - "SECRET_KEY must be changed" → rotate secrets (see §35)
# - "AUDIT CHAIN CORRUPTION" → see §38 audit chain recovery
# - "alembic upgrade head" failed → migration error, check migration file

# 4. Simulate startup locally
ENVIRONMENT=production DATABASE_URL=... uvicorn app.main:app
```

---

## 37. Common Failure Scenarios

### Scenario 1: Backend Returns 503 / Connection Refused

**Symptoms:** All API calls fail, frontend shows "Service Unavailable"

**Diagnosis:**
```bash
curl https://denumrutham-backend-production.up.railway.app/health/live
railway status
railway logs --tail 50
```

**Resolution options:**
1. Railway service crashed → Railway is auto-restarting; wait 2 minutes
2. Deployment in progress → Wait for deployment to complete
3. Startup failure → Check logs for startup error, fix and redeploy

---

### Scenario 2: Database Connection Errors

**Symptoms:** `DATABASE_ERROR` in API responses; 500 errors from DB-touching endpoints

**Diagnosis:**
```bash
railway logs | grep "DATABASE_ERROR\|sqlalchemy"
railway run psql $DATABASE_URL -c "SELECT 1;"  # Tests connectivity
```

**Resolution:**
1. Railway PostgreSQL service restarting → Wait 2–5 minutes
2. DB credentials rotated but not updated → Update `DATABASE_URL` in Railway variables
3. Connection pool exhausted → Redeploy to reset connection pool

---

### Scenario 3: Outbox Backlog Growing

**Symptoms:** `activity_outbox WHERE processed = FALSE` count increasing; audit logs not appearing

**Diagnosis:**
```bash
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;"
railway logs | grep "outbox_worker\|Error in outbox"
```

**Resolution:**
1. Worker crashed → Redeploy to restart the outbox worker
2. DB lock contention → Check for long-running transactions holding locks
3. Stuck entry with high retry count → Investigate the specific entry's `error_message`

---

### Scenario 4: Auth Token Rejected (401 for Valid Users)

**Symptoms:** Users report being logged out; all requests return 401

**Cause:** `SECRET_KEY` or `JWT_SECRET` was rotated without user notification

**Resolution:**
- This is expected behaviour after key rotation
- Users must log in again with their credentials
- Notify support team to inform affected users

---

### Scenario 5: Audit Chain Integrity Failure

**Symptoms:** Log entry `CRITICAL: AUDIT CHAIN CORRUPTION DETECTED`; temple status shows SUSPENDED

**Diagnosis:**
```sql
SELECT status, details, temple_id, verified_at
FROM audit_integrity_verification_reports
WHERE status = 'FAIL'
ORDER BY verified_at DESC;
```

**Immediate Actions:**
1. Do NOT attempt to modify `immutable_activity_logs` — this makes things worse
2. Contact Engineering Lead and CTO immediately
3. Quarantine is automatic — do not override temple suspension
4. Begin forensic analysis of when the chain broke (sequence_number + timestamp)
5. Escalate to a full security incident (P0)

---

### Scenario 6: Settlement Batch Stuck in PENDING

**Symptoms:** Finance team reports settlement batch has been in PENDING for > 24 hours

**Diagnosis:**
```sql
SELECT id, status, created_at, approved_at, completed_at, total_amount
FROM settlement_batches
WHERE status = 'PENDING'
ORDER BY created_at ASC;
```

**Resolution:**
- This is a process issue, not a technical failure
- Settlement requires maker-checker approval by SUPERADMIN
- Contact the Platform Finance team to action the batch
- If the batch ID doesn't appear in the UI, check `temple_id` scope in the query

---

### Scenario 7: Uploaded Files Missing After Deployment

**Symptoms:** Temple images/media showing 404 after a deployment

**Root Cause:** Railway ephemeral filesystem — files lost on every deploy

**Immediate Mitigation:**
- Temple manager must re-upload affected files
- This is a known risk (see §40)

**Resolution:** Implement object storage (see §13 future plan)

---

## 38. Recovery Procedures

### Recovering from Partial Migration

```bash
# 1. Check what revision is applied
railway run alembic current

# 2. Check what the DB actually contains vs expected
railway run alembic check

# 3. If migration partially applied and data is inconsistent:
# Option A: Try completing it
railway run alembic upgrade head

# Option B: Revert to previous known-good revision
railway run alembic downgrade <last_known_good_revision>

# 4. Verify table exists and has expected columns
railway run psql $DATABASE_URL -c "\d <affected_table>"
```

### Recovering from Corrupted Audit Chain

```bash
# 1. Identify which temple(s) are affected
railway run psql $DATABASE_URL -c "
SELECT temple_id, MIN(sequence_number) AS first_broken_seq
FROM immutable_activity_logs ial1
WHERE NOT EXISTS (
  SELECT 1 FROM immutable_activity_logs ial2
  WHERE ial2.temple_id = ial1.temple_id
  AND ial2.sequence_number = ial1.sequence_number - 1
  AND ial2.hash = ial1.previous_hash
)
AND ial1.sequence_number > 1
GROUP BY temple_id;"

# 2. Capture the full chain for the affected temple (forensic copy)
railway run psql $DATABASE_URL -c "
SELECT id, temple_id, sequence_number, action, actor_id, created_at, hash, previous_hash
FROM immutable_activity_logs
WHERE temple_id = '<affected_temple_id>'
ORDER BY sequence_number;" > audit_chain_forensic_$(date +%Y%m%d).csv

# 3. Do NOT modify immutable_activity_logs
# 4. Involve Engineering Lead + CTO for resolution decision
# 5. If chain corruption is confirmed malicious: preserve all evidence, escalate
```

### Recovering from Locked DB Table

```bash
# 1. Identify blocking locks
railway run psql $DATABASE_URL -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query, state, wait_event
FROM pg_stat_activity
WHERE wait_event IS NOT NULL AND state != 'idle'
ORDER BY duration DESC;"

# 2. Identify lock dependencies
railway run psql $DATABASE_URL -c "
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.pid != blocked_locks.pid
WHERE NOT blocked_locks.granted;"

# 3. Terminate the blocking query (CAUTION — verify it is safe to kill)
railway run psql $DATABASE_URL -c "SELECT pg_terminate_backend(<blocking_pid>);"
```

---

## 39. Operational Best Practices

1. **Always take a backup before any database migration** — even for "safe" migrations
2. **Never run raw UPDATE/DELETE on production without a transaction wrapping it** — use `BEGIN; ... ROLLBACK;` to verify first
3. **Verify migration SQL with `--sql` flag before applying** — `alembic upgrade head --sql`
4. **Deploy during low-traffic hours** — after midnight IST, before 6 AM IST
5. **Never rotate `SECRET_KEY` / `JWT_SECRET` during business hours** — it logs everyone out
6. **Monitor Railway logs for 30 minutes after every deployment**
7. **Never use `SELECT *` in production diagnostic queries** — always select specific columns
8. **Run forensic queries with `LIMIT`** — unbounded queries on large tables can cause slowdowns
9. **Communicate maintenance windows** to temple managers before any planned downtime
10. **Keep the `audit_integrity_verification_reports` table clean** — old rows can be archived after 90 days

### Forbidden Production Actions

❌ `DELETE FROM immutable_activity_logs` — ever, for any reason  
❌ `TRUNCATE` any table without explicit authorization and a prior backup  
❌ `DROP TABLE` or `DROP COLUMN` without Alembic migration review  
❌ Modifying Railway environment variables without documenting the reason  
❌ `alembic downgrade` on a production DB without prior code rollback  
❌ Connecting to production DB from a personal machine without VPN/tunnel  

---

## 40. Known Operational Risks

> [!WARNING]
> These are live operational risks. Each has a mitigation note. Escalate if risk materializes.

| Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| **Ephemeral file storage** — uploaded images lost on every deploy | High | Medium | Notify managers; implement R2/S3 (planned) | 🔴 Active |
| **No SMTP** — OTPs and notifications not emailed | High | Medium | Staff use manual workarounds; integrate SendGrid (planned) | 🔴 Active |
| **In-process workers** — workers die with the process | Low | Medium | Workers are idempotent; restart auto-recovers | 🟡 Managed |
| **No JWT refresh token** — 60-min forced re-login | Medium | Low | Educate users; implement refresh token (planned) | 🟡 Managed |
| **No RLS at DB level** — multi-tenancy app-enforced only | Low | High | Code review enforces `temple_id` filtering; audit on violations | 🟡 Managed |
| **4 workers run 4 copies of each background task** | Low | Low | All workers are idempotent; SELECT ... FOR UPDATE SKIP LOCKED on outbox | 🟢 Mitigated |
| **No automated Alembic on CI** — migrations run manually | Medium | Medium | Docker CMD runs migration on deploy; process doc in §25 | 🟡 Managed |
| **No staging environment** — only production | High | High | Pre-deploy checklist compensates; staging planned | 🔴 Active |

---

## 41. Maintenance Schedule

### Daily (Automated)
- Railway PostgreSQL backup (automatic)
- Background worker execution (continuous)
- Audit chain processed via outbox worker (continuous)

### Weekly (Manual — Every Monday)
- Review Railway deployment logs for error patterns
- Check `activity_outbox` backlog count
- Review new `audit_integrity_verification_reports`
- Check `audit_chain_incidents` table for new entries
- Review `settlement_batches` in PENDING state

```sql
-- Weekly health summary query
SELECT
  (SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE) AS outbox_backlog,
  (SELECT COUNT(*) FROM audit_integrity_verification_reports WHERE status NOT IN ('PASS','VERIFIED') AND verified_at > NOW() - INTERVAL '7 days') AS audit_failures,
  (SELECT COUNT(*) FROM settlement_batches WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '3 days') AS stale_pending_batches,
  (SELECT COUNT(*) FROM users WHERE approval_status = 'PENDING' AND created_at < NOW() - INTERVAL '7 days') AS pending_staff_approvals;
```

### Monthly
- Security review: new SUPERADMIN accounts, recent bank account reveals
- Performance review: p95 latency, top slow queries, table bloat
- Dependency review: check for critical CVEs in `requirements.txt`
- Secret rotation assessment: any secrets approaching annual rotation date

### Quarterly
- Full disaster recovery drill (restore to staging environment if one exists)
- Dependency version update pass (`requirements.txt`, `package.json`)
- Access review: SUPERADMIN user list

### Annually
- Rotate `SECRET_KEY` and `JWT_SECRET` (coordinate for low-traffic window)
- Rotate Razorpay webhook secret
- Review and update this runbook

---

## 42. Production Validation Checklist

Run after any significant production event (major release, incident recovery, migration):

### Infrastructure Health

```bash
# 1. Backend liveness
curl -f https://denumrutham-backend-production.up.railway.app/health/live
# ✅ Passes: {"status": "alive"}

# 2. API readiness
curl -f https://denumrutham-backend-production.up.railway.app/api/v1/health
# ✅ Passes: {"status": "healthy"}

# 3. Frontend loads
curl -f https://<vercel-domain>.vercel.app
# ✅ Passes: HTML returned (200)

# 4. Vercel proxy working
curl -f https://<vercel-domain>.vercel.app/api/v1/diag/ping
# ✅ Passes: Backend response proxied through Vercel
```

### Database Health

```sql
-- Run via: railway run psql $DATABASE_URL -c "<query>"

-- 5. Migration state
SELECT version_num FROM alembic_version;
-- ✅ Passes: Shows expected latest revision hash

-- 6. Outbox clear
SELECT COUNT(*) FROM activity_outbox WHERE processed = FALSE;
-- ✅ Passes: 0 or near 0

-- 7. No audit failures in last 24h
SELECT status, COUNT(*) FROM audit_integrity_verification_reports
WHERE verified_at > NOW() - INTERVAL '24 hours' GROUP BY status;
-- ✅ Passes: Only PASS or VERIFIED

-- 8. No stuck reservations
SELECT COUNT(*) FROM store_stock_reservations
WHERE status = 'ACTIVE' AND created_at < NOW() - INTERVAL '35 minutes';
-- ✅ Passes: 0
```

### Security Validation

```sql
-- 9. No unexpected SUPERADMIN accounts
SELECT user_id, name, email, created_at FROM users
WHERE role = 'SUPERADMIN' ORDER BY created_at DESC;
-- ✅ Passes: Only known superadmin accounts

-- 10. Audit chain intact for all active temples
SELECT t.name, COUNT(ial.id) AS log_count
FROM temples t
LEFT JOIN immutable_activity_logs ial ON ial.temple_id = t.id
WHERE t.status = 'ACTIVE'
GROUP BY t.name ORDER BY log_count DESC LIMIT 10;
-- ✅ Passes: Reasonable log counts for all active temples
```

### Background Worker Validation

```bash
# 11. Workers producing output (check logs for recent activity)
railway logs --tail 200 | grep -c "process_auto_completions\|cleanup_expired\|outbox"
# ✅ Passes: Count > 0 (workers are logging activity)
```

### End-to-End Smoke Test

```bash
# 12. Authentication works
curl -X POST https://denumrutham-backend-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<test_user_id>","password":"<test_password>"}' | python -m json.tool
# ✅ Passes: {"success": true, "data": {"access_token": "..."}}

# 13. Public portal loads
curl -f "https://denumrutham-backend-production.up.railway.app/api/v1/public/temples" | python -m json.tool
# ✅ Passes: {"success": true, "data": [...]}
```

---

**Runbook Status: ✅ Validated against production configuration on 2026-06-25**

---

*End of Operations Runbook*

---

**Document History:**

| Date | Author | Change |
|---|---|---|
| 2026-06-25 | Antigravity (AI Engineering Assistant) | Initial version — produced by direct inspection of Dockerfile, railway.json, vercel.json, requirements.txt, alembic.ini, and all configuration files |

**Next Review:** Mandatory before any infrastructure migration. Recommended quarterly.
