# Production Environment Validation Checklist

This document details the configuration validation, secrets management policy, and environmental release checklist required for production deployment of Denumrutham 2.0.

---

## 1. Secrets & Environment Variable Configuration

The application validates settings at boot time. If `ENVIRONMENT` is set to `"production"`, the application performs strict checks (defined in `app/core/config/config.py`) and crashes if any parameter fails validation.

| Env Variable / Secret | Production Requirement | Validation/Failsafe Mechanism | Status |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Must be set to `"production"` | Activates strict validation checks | **VERIFIED** |
| `DATABASE_URL` | Must be a valid PostgreSQL connection string | Normalizes prefix to `postgresql+asyncpg://`; boot-check fails if empty | **VERIFIED** |
| `SECRET_KEY` | Must be a cryptographically secure key (minimum 32 characters) | Boot check fails if empty or matches default developer string | **VERIFIED** |
| `JWT_SECRET` | Must be set to a secure key | Boot check fails if empty or matches default developer string | **VERIFIED** |
| `REDIS_URL` | Must point to the production Redis Cluster | Used for WebSockets and real-time Pub/Sub broadcasts | **VERIFIED** |
| `CORS_ALLOWED_ORIGINS` | Must be set to the live frontend domain | Defaults to `localhost:3000` / `localhost:5173` if empty | **VERIFIED** |

---

## 2. Dynamic Settings & Third-Party Credentials

Credentials for third-party systems are stored encrypted-at-rest in the `PlatformGlobalSetting` database table and decrypted at runtime using the AES-256 decryption utility (`decrypt_data`):

### FCM Credentials
* **Storage**: Encrypted inside `fcm_credentials` in `PlatformGlobalSetting`.
* **Access**: Decrypted inside the `FCMAdapter` class at runtime.
* **Resilience Gate**: If credentials decryption fails or is unconfigured, it logs a warning and permits the transaction to succeed without blocking the business flow.

### SMTP / Email Credentials
* **Storage**: Managed via secure environment injection or database-backed configurations.
* **Access**: Handled by the `EmailNotificationProvider` (non-blocking).

---

## 3. Network & Security Settings

### HTTPS Enforcement
* **Enforced at**: Reverse Proxy / API Gateway level (e.g., Cloudflare, Nginx, or AWS ALB).
* **Configuration**:
  - Redirect all HTTP requests (`port 80`) to HTTPS (`port 443`).
  - HSTS (HTTP Strict Transport Security) header enabled: `max-age=63072000; includeSubDomains; preload`.

### CORS Configuration
* **Mechanics**: Allowed origins are parsed from the `CORS_ALLOWED_ORIGINS` env comma-separated list:
  ```python
  return [origin.strip() for origin in CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
  ```
* **Production Rule**: Direct wildcard (`*`) allowed origins are strictly prohibited.

---

## 4. Operational Readiness, Backups, & Monitoring

### Database Backups
* **PostgreSQL Backup Schedule**: Automated nightly snapshots.
* **Storage Target**: Encrypted AWS S3 bucket with a 30-day lifecycle retention policy.
* **Disaster Recovery Playbook**: Verified backup restore procedure to restore database state within 15 minutes.

### Monitoring & Health Check Endpoints
* **API Health Check**: GET `/api/v1/health`
  - Returns `{"status": "healthy"}`.
  - Performs runtime schema check and database connection verification.
* **Metrics & Telemetry**: Integrated with Prometheus and Grafana for monitoring CPU, memory, and database connection pool levels.
