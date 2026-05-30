# Deep Architecture Security & QA Audit Report

**Date:** April 5, 2026
**Target:** Temple Management System SaaS Architecture
**Scope:** FastAPI Backend, Vanilla SPA Frontend, Authentication, Authorization, Isolation, and Integrations.

---

## 🛑 1. Critical Vulnerabilities

### 1.1 Plaintext Credentials Logged via Standard Output 
**Risk Level: CRITICAL**
In `backend/app/api/api_v1/endpoints/auth.py`, the `login` endpoint contains print statements that log the user's raw password directly to the standard output: 
```python
print(f"DEBUG LOGIN: username={form_data.username}, password={form_data.password}")
```
**Impact:** If these logs are scraped by centralized logging agents (like Datadog/ELK), user passwords will be stored globally in plain text.
**Fix:** Immediately remove all `print` debug statements from `auth.py`. 

### 1.2 Synchronous Blocking Webhooks (Reliability Failure)
**Risk Level: HIGH / CRITICAL**
In `backend/app/api/api_v1/endpoints/devotee_bookings.py`, the system explicitly awaits third-party notifications during the HTTP request cycle:
```python
await NotificationService.send_whatsapp_message(...)
```
**Impact:** If the WhatsApp API rate-limits, network timeouts, or fails, the Devotee's browser will hang and eventually receive an HTTP 500 Server Error. Worse, the DB will have actively created the booking/payment, but the user assumes it failed leading to duplicate bookings or support tickets.
**Fix:** Inject FastAPI's `BackgroundTasks` to offload external I/O integrations to a background queue, returning an immediate 200 OK to the client.

## ⚠️ 2. Medium Risks

### 2.1 Overly Permissive RBAC Bindings (Inadequate Granularity)
**Risk Level: MEDIUM**
While `poojas.py` correctly requests `get_current_active_admin`, other modules like `bookings.py` and `donations.py` merely require `get_current_user` combined with `get_current_temple_id`. 
**Impact:** ANY user role attached to a temple (e.g., a "Priest" or local "Staff") can arbitrarily create bookings or dump all donations for the temple by simply hitting the endpoints. 
**Fix:** Introduce granular dependency handlers (`get_current_priest`, `get_current_accountant`) and map them to the proper CRUD endpoints based on module.

### 2.2 Payment Webhook Replay & Idempotency Missing
**Risk Level: MEDIUM**
Although `PaymentService.verify_payment_signature` is staged securely, the current flow lacks native idempotency.
**Impact:** Payment providers constantly send duplicate webhooks. If the system acknowledges a webhook granting a ticket or updating inventory, a duplicate delivery will blindly grant it twice.
**Fix:** Enforce DB-level state checking `if payment.status == COMPLETED: return 200` before releasing any business logic artifacts inside the webhook router.

### 2.3 JWT No-Revocation Strategy
**Risk Level: MEDIUM**
Access tokens map to `ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24 Hours) with absolutely no Refresh Token exchange. 
**Impact:** If an Admin's permissions are revoked mid-day, or a token is intercepted, the JWT remains 100% implicitly trusted by the backend for 1 full day.
**Fix:** Migrate to 15-minute Access Tokens with strict Refresh Tokens, and manage a lightweight Redis invalidation cache if strict revocation is required.

## 🛠 3. Minor Issues & Architectural Gaps

### 3.1 Missing RESTful ID Endpoints
Currently, `bookings.py`, `donations.py`, and `poojas.py` successfully filter via `get_multi_by_temple(...)`, completely shutting down cross-tenant leakage for list pulls. However, there are no `GET /{id}` or `PUT /{id}` endpoints developed for these routers yet.
**Fix:** Upon implementation of these single-item fetches, ensure `temple_id` is passed downward into the SELECT query (`where(obj.id == id, obj.temple_id == temple_id)`) to enforce Insecure Direct Object Reference (IDOR) blocks. 

### 3.2 SPA Token Auto-Refresh Handling
The frontend (`authService.js`) pulls the JWT statically. If the backend kicks a 401 Unauthorized for an expired token, there is no generic Axios/Fetch interceptor to capture it and wipe `window.AuthService.logout()`.
**Fix:** Intercept HTTP 401 outputs globally on the frontend `apiRequest` wrapper to trigger a unified route dump back to the `/login` frame.

## 🛡️ Executive Summary

The system boasts **remarkable architectural safety** regarding global SQL injection, Pydantic type validation, and structural Multi-Tenant strictness due to the recently enforced `get_current_temple_id()` dependency. Moving to Alembic structurally hardens the entire migration scheme.

If the **Debug Password Print statement** and **Synchronous Webhook executions** are resolved, this platform is easily stable enough to support high-concurrent production load.
