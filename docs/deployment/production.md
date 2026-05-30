# Temple Management System - Production Deployment Guide

This guide contains instructions on how to take the finalized Denumrutham Temple Management System into a scalable, production environment.

## 1. Prerequisites and Infrastructure

The system operates across three tiers:
- **Database**: PostgreSQL (accessible via Docker or managed RDS).
- **Backend API**: Python FastAPI (Uvicorn workers).
- **Frontend SPA**: Vanilla JS running on an NGINX proxy or CDN (e.g., Cloudflare Pages, S3, or native web server).

## 2. Environment Variables (`backend/.env`)

Ensure you create a strictly guarded `.env` file for production. **Never commit this file.**

```ini
# Production DB URL (replace with actual RDS or clustered Postgres IP)
DATABASE_URL=postgresql+asyncpg://prod_user:secure_password@db_host:5432/tms_production

# JWT Securty
SECRET_KEY=your-highly-secure-random-256-bit-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Third-Party Integrations
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=live_secret_xxx
WHATSAPP_API_TOKEN=EAA...
```

## 3. Database Schema Management (Alembic)

We have permanently removed the insecure `Base.metadata.create_all` from the FastAPI lifespan. **All schema structures are now strictly managed by Alembic.**

### Initializing the Production Database
Before launching the Python server against a brand new database, you **MUST** run the migrations:

```bash
# Inside the /backend directory
python -m alembic upgrade head
```

### Applying Future Schema Updates (Devs)
When you modify structures in `app/models/domain.py`:
1. Generate the migration script: `python -m alembic revision --autogenerate -m "Add description"`
2. Verify the script in `backend/alembic/versions/`.
3. Apply migration: `python -m alembic upgrade head`

## 4. Launching the Backend

Instead of running a single `uvicorn` instance dynamically, use Uvicorn with Gunicorn or multiple concurrent workers. Adjust the `Dockerfile` to match:

```dockerfile
# backend/Dockerfile production CMD
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Run via Docker compose (after updating `docker-compose.yml` to omit volume mappings for source code):
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 5. Front-End Deployment

Currently, the frontend is built using Vanilla JS modules. You do **not** need a build step (like Vite/Webpack) to host it. It can be hosted on:
- **NGINX**: Point the document root to `/frontend/`
- **Vercel / Netlify / Cloudflare**: Simply push the frontend directory. Since the code utilizes native ES modules `type="module"`, modern browsers execute it seamlessly.

## 6. Centralized Logging & Auditing

The system automatically catches and structures global Exceptions into JSON responses, maintaining security by hiding raw database errors from the client.

Backend logs are actively rotated continuously into the `backend/logs` directory:
- `tms_access.log`: Logs every inbound HTTP request mapping, parsing metrics, and processing times.
- `tms_error.log`: Captures massive stack traces of uncontrolled exceptions.

You should map `/backend/logs` to an external ingestion system (like Datadog, ELK stack, or CloudWatch) for monitoring.
