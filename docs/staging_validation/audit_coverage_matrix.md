# Audit Governance Coverage Matrix

This document provides a comprehensive verification matrix of the audit logs and activity logs captured for critical system and business governance actions in Denumrutham 2.0.

---

## 1. Governance Audit Architecture

All critical events undergo two levels of immutable logging:
1. **Central Audit Trail (`audit_logs`)**: Records administrative actions with tamper-evident SHA-256 hashes (`content_hash`) and link references to corresponding approval requests (`approval_id`).
2. **Centralized Activity Logs (`immutable_activity_logs`)**: An append-only log backed by database triggers that prohibit `UPDATE` and `DELETE` queries, protecting logs from deletion or tampering.

### Architectural Safeguard (Audit Bypass Check)
The platform features an automated startup integrity check (`validate_audit_bypass_prevention` inside `core/database/integrity.py`) that performs static scanning on startup. If a developer attempts to instantiate `AuditLog()` or `ImmutableActivityLog()` directly rather than routing through the official `AuditService.log_action()` pipeline, the application crashes and prevents boot.

---

## 2. Audit Governance Coverage Matrix

| Governance Action | Tracing Module | Logged Event Action | Entity ID Type | Payload Captured (Old/New) | Tamper Hash Verified | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Advertisement Approval** | `governance` | `ADVERTISEMENT_APPROVAL` | `ad_id` (UUID) | Approval status, priority, billing, CPC/CPM rates | Yes | **VERIFIED** |
| **Advertisement Rejection** | `governance` | `ADVERTISEMENT_REJECTION` | `ad_id` (UUID) | Rejection status and reviewer remarks | Yes | **VERIFIED** |
| **Global Settings Change** | `governance` | `SETTINGS_CHANGES` | `key` (String) | Before and after settings JSON payloads | Yes | **VERIFIED** |
| **FCM Credential Update** | `governance` | `FCM_CREDENTIAL_CHANGES` | `key` (String) | Masked values (`********` in logs) | Yes | **VERIFIED** |
| **Website Publish** | `digital_experience` | `PUBLISH_WEBSITE` | `live_id` (UUID) | Version, published timestamp, and author | Yes | **VERIFIED** |
| **Website Rollback** | `digital_experience` | `UPDATE_WEBSITE_SETTINGS` | `settings_id` | Historical configuration payload restore | Yes | **VERIFIED** |
| **Notification Broadcast** | `digital_experience` | `CREATE_ANNOUNCEMENT` | `announcement_id` | Content body and follower target category | Yes | **VERIFIED** |
| **Temple Feature Visibility** | `digital_experience` | `UPDATE_WEBSITE_SETTINGS` | `settings_id` | `featureVisibility` toggle changes | Yes | **VERIFIED** |

---

## 3. Log Payload Details & Safeguard Verification

### Tamper-Proof Log Protection (Triggers)
On PostgreSQL, the database is hardened via:
```sql
CREATE TRIGGER no_update_delete_audit
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
```
This is verified on SQLite staging by mock assertions confirming that any write attempt on `audit_logs` fails connection checks or is structurally disallowed by application transaction layers.

### Sample Audited Payload (FCM Credential Masking)
To prevent leakage of sensitive FCM secrets in audit databases, values are programmatically masked prior to storage in `audit_logs` and `immutable_activity_logs`:
```json
{
  "key": "fcm_credentials",
  "old_value": {
    "encrypted_credentials": "********"
  },
  "new_value": {
    "encrypted_credentials": "********"
  }
}
```
This is validated in `/api/v1/superadmin/global-settings` endpoint updates.
