# Temple Management System (TMS) — Knowledge Base

This document maps all database migrations, table structures, system permissions, seeding scripts, and architectural modifications implemented in the TMS platform (Sprint 3).

---

## 1. Database Schema Changes & Seeding

All updates are run via the database maintenance script: [execute_database_updates.py](file:///c:/Denumrutham/backend/scratch/execute_database_updates.py).

### Schema Modifications
* **Live Profile (`temple_profiles` Table)**:
  * `short_description` (TEXT, nullable)
  * `meta_title` (VARCHAR, nullable)
  * `meta_description` (TEXT, nullable)
  * `published_at` (TIMESTAMP WITH TIME ZONE, nullable)
  * `published_by` (UUID, nullable)
* **Staging Profile (`temple_profile_drafts` Table)**:
  * `short_description` (TEXT, nullable)
  * `meta_title` (VARCHAR, nullable)
  * `meta_description` (TEXT, nullable)

### New Tables
#### `temple_key_personnels`
Holds administrative directory entries for temple officials (Pujaris, Managers, etc.):
```sql
CREATE TABLE IF NOT EXISTS temple_key_personnels (
    id UUID PRIMARY KEY,
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    designation VARCHAR NOT NULL,
    image_url VARCHAR,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
```

### System Permissions Seeding
Mapped directly to the `SUPER_ADMIN` role:
* **`MANAGE_TEMPLE_PROFILES`**: Direct publish override and live content modifications.
* **`REVIEW_PROFILE_DRAFTS`**: Moderation approval/rejection capability for manager-submitted drafts.

---

## 2. API Endpoint Registrations

All endpoints enforce multi-tenant isolation validation check checks.

### Curation & Staging Profiles
* **`GET /api/v1/temple-profile/draft`** — Retrieve staging draft & live profile side-by-side.
* **`POST /api/v1/temple-profile/draft`** — Submit/Create a profile draft (Locks edits if already pending review).
* **`GET /api/v1/temple-profile/{temple_id}/completeness`** — Computes weighted completeness score (max 100).

### Key Personnel Directory
* **`GET /api/v1/digital-experience/key-personnel`** — List personnel.
* **`POST /api/v1/digital-experience/key-personnel`** — Create personnel.
* **`PUT /api/v1/digital-experience/key-personnel/{id}`** — Edit details.
* **`DELETE /api/v1/digital-experience/key-personnel/{id}`** — Soft deactivates (`is_active = False`) by default.
* **`PATCH /api/v1/digital-experience/key-personnel/reorder`** — Reorder personnel priority hierarchy.

---

## 3. UI Curation & Public Enhancements

* **Notice Board & Announcements**:
  * Tickers automatically sorted and injected deterministically on public pages:
    `['hero', 'about', 'announcements', 'activities', 'festivals', 'gallery', 'key_personnel', 'mantras', 'contact']`
* **Auditing & Moderation**:
  * Built diffing layout highlighting staging changes next to live profile content.
  * Supported direct overrides with "Approve with Edits" metadata trails tracked.
* **Mantra Chanting Preview Card**:
  * Extracted video ID from YouTube/YouTube Music URLs.
  * Controls playback (play, pause, mute, unmute) via an iframe API message passing model (`postMessage`).
