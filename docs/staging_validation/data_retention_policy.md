# Data Retention & Analytics Policy

This document defines the data retention, archiving, and purging policies for Denumrutham 2.0. Implementing this policy minimizes database size growth, improves query performance, and satisfies compliance/security audit mandates.

---

## 1. Data Classification and Retention Periods

| Data Classification | Relational DB Retention | Target Cold Storage / Archive | Regulatory/Compliance Mandate |
| :--- | :--- | :--- | :--- |
| **Advertisement Analytics** | 90 days | GCS / S3 (Compressed Parquet) | None (Internal analytics optimization) |
| **Portal Analytics Events** | 30 days | Google BigQuery / Snowflake | None (Operational metrics) |
| **Notification Delivery Logs** | 60 days | None (No archive required) | None (Stale message cleanup) |
| **Audit Logs (Governance)** | 365 days (Live) | AWS S3 Glacier (WORM Storage) | 7 Years (Tax and governance audit compliance) |

---

## 2. Archiving and Purging Strategies

### 2.1. Advertisement Analytics
* **Archive Strategy**: Daily aggregates (total impressions, total clicks, total attributed cost, and revenue) are compiled into the `campaign_revenue_metrics` summary table. Before raw events are purged from `advertisement_analytics`, they are exported in batch-parquet format to cold object storage.
* **Purge Strategy**: An automated scheduler executes weekly:
  ```sql
  DELETE FROM advertisement_analytics WHERE created_at < NOW() - INTERVAL '90 days';
  ```

### 2.2. Portal Analytics Events
* **Archive Strategy**: Events are streamed directly to the data warehouse (e.g., BigQuery) for long-term cohort analysis. Relational tables are only used for brief session validation.
* **Purge Strategy**: Raw event rows are cleared via partition truncation or a cron job:
  ```sql
  DELETE FROM portal_analytics_events WHERE timestamp < NOW() - INTERVAL '30 days';
  ```

### 2.3. Notification Delivery Logs
* **Archive Strategy**: Notifications delivered to user dashboards or mobile devices are not archived. Raw delivery metadata is discarded once it is no longer relevant for operational debugging.
* **Purge Strategy**: System tables are cleaned of read notifications or old pending notifications:
  ```sql
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '60 days';
  ```

### 2.4. Audit Logs (Governance Trail)
* **Archive Strategy**: The `audit_logs` and `immutable_activity_logs` are preserved in the live database for 1 year. Every quarter, log batches older than 1 year are extracted, signed with a GPG key, and transferred to write-once-read-many (WORM) storage.
* **Purge Strategy**: Purging is strictly restricted. Only records exceeding the 7-year legal threshold are permanently removed:
  ```sql
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '7 years';
  ```
  *(Note: Triggers preventing manual DELETE statements must be temporarily bypassed by a superadmin session possessing specific, audited maintenance-level roles).*
