# Cache Invalidation Validation Report

This report documents the staging validation of caching and cache-invalidation mechanisms for the Denumrutham 2.0 platform. The goal is to ensure configuration updates, layout publishes, security permissions, and advertisement state changes propagate immediately without serving stale data.

---

## 1. Cache Architecture Overview

The platform implements a multi-tiered in-memory cache architecture designed to maximize read performance while maintaining strict data consistency:
1. **Global Configuration Cache (`GlobalConfigurationCache`)**: Keeps compiled global website configurations and layout definitions in memory to hit sub-200ms SLAs on public portals.
2. **Permission Cache**: Stores resolved RBAC permission sets for authenticated users to avoid overhead on every API request.
3. **Dynamic Query Filters**: Avoids caching for volatile entities (such as advertisement campaign caps and expirations) to ensure real-time limit enforcement.

---

## 2. Invalidation Events & Validation Results

### Event A: Temple Website Builder Publish
* **Mechanics**: When a Temple Manager publishes a layout draft, the draft layout is written to the live table, and the active cached website settings are cleared.
* **Validation Procedure**:
  1. Requested public website layout via GET `/api/v1/temple/{slug}/layout` (Cache set).
  2. POSTed layout update to draft.
  3. POSTed layout publish API.
  4. **Asserted**: `GlobalConfigurationCache.invalidate_all()` was triggered.
  5. **Asserted**: Next GET request fetched the newly-published layout (Cache hit for updated version).
* **Result**: **SUCCESS**

### Event B: Global Website Builder Publish
* **Mechanics**: Superadmin publishes global site settings, which triggers `GlobalConfigurationCache.invalidate_all()` to clear the shared settings cache.
* **Validation Procedure**:
  1. GET `/api/v1/public/global-settings/global_website_builder_live` (Cache set).
  2. POSTed `/api/v1/superadmin/global-settings/publish`.
  3. **Asserted**: Cache cleared and subsequent GET request loaded the updated settings from the DB.
* **Result**: **SUCCESS**

### Event C: Advertisement Approval & Visibility
* **Mechanics**: Platform governance approvals (approving or rejecting ads) bypass cache. They query the DB directly to prevent delays in ad campaign activations.
* **Validation Procedure**:
  1. Approved an ad campaign using the superadmin endpoints.
  2. **Asserted**: The ad became visible immediately in the public directory query without requiring cache clearing, as advertisements are query-filtered rather than layout-cached.
* **Result**: **SUCCESS**

### Event D: Advertisement Campaign Expiry
* **Mechanics**: Ad campaigns that hit revenue caps or reach their expiry date are filtered out in real-time query logic (`campaign_end >= NOW()`), bypassing layout-cached stale states.
* **Validation Procedure**:
  1. Updated the end-date of a running campaign to a past timestamp.
  2. GET `/api/v1/public/advertisements`.
  3. **Asserted**: Expired ad was omitted immediately from the query results.
* **Result**: **SUCCESS**

### Event E: Feature Visibility Changes
* **Mechanics**: Superadmin updates a temple's feature visibility toggles. This invalidates global layout caches to ensure public users instantly see/hide offerings.
* **Validation Procedure**:
  1. Toggled a temple feature flag.
  2. **Asserted**: Layout cache was evicted, and the public portal instantly adjusted its navigation items.
* **Result**: **SUCCESS**

### Event F: User Permission Cache Eviction
* **Mechanics**: Whenever a user's role is updated, their cached permissions must be evicted via `invalidate_user_cache(user_id)` to prevent authorization bypass.
* **Validation Procedure**:
  1. Checked permissions for User A (Cache set).
  2. Updated User A's role to Superadmin.
  3. **Asserted**: `invalidate_user_cache` cleared User A's cache.
  4. **Asserted**: Next permission check read the updated roles and allowed access to settings immediately.
* **Result**: **SUCCESS**

---

## 3. Cache Management Matrix

| Cache Region | Storage Backed | Cache Key Pattern | Invalidation Trigger | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Global Config** | In-Memory Dict | `global_website_builder_live` | Global settings publish | Clear entire cache (`invalidate_all`) |
| **Temple Layout** | In-Memory Dict | `layout_{slug}` | Layout publish / rollback | Evict specific key / clear all |
| **User Perms** | In-Memory Dict | `user_perms_{user_id}` | User role / perm update | Evict specific user key (`invalidate_user_cache`) |
