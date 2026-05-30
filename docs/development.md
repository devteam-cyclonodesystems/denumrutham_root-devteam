# Denumrutham TMS — Development Guide

This document outlines the standardized development workflow for the Temple Management System (TMS).

## 🛡️ Environment Standardization

To prevent "split-brain" database issues (where local scripts hit a host-level Postgres instead of the Docker container), we use a dedicated port mapping.

### PostgreSQL Ports
- **External (Host Machine)**: `5433`
- **Internal (Docker Network)**: `5432`

| Access Method | Host | Port | Database |
| :--- | :--- | :--- | :--- |
| **DBeaver / pgAdmin** | `localhost` | `5433` | `tms_postgres` |
| **Backend Service** | `db` | `5432` | `tms_postgres` |
| **Helper Scripts** | (via `manage`) | (internal) | `tms_postgres` |

---

## 🚀 The `manage` Workflow

**Never** run Python scripts directly on your host machine (e.g., `python backend/scratch/setup_sa.py`). This can lead to database corruption or data inconsistency.

### Correct Usage
Use the provided management wrappers in the project root:

#### Windows (PowerShell)
```powershell
./manage.ps1 scratch/setup_sa.py
```

#### Linux / macOS / Git Bash
```bash
./manage.sh scratch/setup_sa.py
```

### What these scripts do:
1.  **Validate** that Docker and the Backend container are running.
2.  **Verify** database connectivity before execution.
3.  **Execute** the script safely inside the Docker environment.
4.  **Preserve** correct `PYTHONPATH` and environment variables.

---

## 🔑 Common Tasks

### Reset SuperAdmin Password
If you are locked out or have an incorrect password:
```powershell
./manage.ps1 scratch/setup_sa.py
```
**Default Credentials:**
- **Username**: `superadmin@denumrutham.com`
- **Password**: `Admin@123`

### Create a Custom SuperAdmin
```powershell
./manage.ps1 create_superadmin.py
```

### Running Migrations
Migrations should be run within the backend context:
```bash
docker compose -f backend/docker-compose.yml exec app alembic upgrade head
```

---

## 🔍 Troubleshooting

### "Script must be run inside Docker"
If you see this error, it means you tried to run a sensitive script directly on your host. Use `./manage.ps1` instead.

### "Split-brain execution detected"
The backend logs may warn about this if `DATABASE_URL` points to `db:5432` but the host cannot resolve it. This is normal if you are inspecting logs, but if scripts fail, ensure you are using the `manage` helper.

### Database Connection Refused
Ensure Docker Compose is running:
```bash
cd backend
docker compose up -d
```
Check if port 5433 is actually bound:
```bash
netstat -ano | findstr 5433
```
