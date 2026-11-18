# Data Model: User Management & Authentication

**Feature**: `003-user-management`  
**Date**: 2026-11-11

## 1. `public.profiles`
Mirrors and extends `auth.users(id)`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, FK `auth.users.id` | User identifier |
| `email` | TEXT | NOT NULL | User primary email |
| `full_name` | TEXT | NULLABLE | Display name |
| `avatar_url` | TEXT | NULLABLE | Profile picture URL |
| `role` | TEXT | NOT NULL, CHECK IN ('admin', 'broker', 'agent', 'client') | Authority tier (Default: 'client') |
| `verification_status` | VARCHAR(20) | NOT NULL, CHECK IN ('VERIFIED', 'SUSPENDED', 'PENDING') | Account lifecycle state |
| `prc_license_no` | TEXT | NULLABLE | Real Estate Agent license number |
| `prc_validity` | DATE | NULLABLE | License expiration date |
| `dhsud_accreditation_no` | TEXT | NULLABLE | Housing & Urban Development accreditation |
| `suspension_reason` | TEXT | NULLABLE | Justification for account suspension |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Modification timestamp |

## 2. `public.user_sessions` / `SessionRecord`
Server-side active session store tracked by `SessionService`.

| Field | Type | Description |
|---|---|---|
| `tokenHash` | VARCHAR(64) | SHA-256 hex digest of Bearer access token |
| `userId` | UUID | Associated user profile ID |
| `email` | TEXT | User email address |
| `role` | TEXT | Cached authority level |
| `ipAddress` | TEXT | Client network origin |
| `userAgent` | TEXT | Browser / platform footprint |
| `createdAt` | BIGINT | Milliseconds epoch of session inception |
| `lastActiveAt` | BIGINT | Milliseconds epoch of most recent request |
| `expiresAt` | BIGINT | Absolute session expiration epoch |
| `revoked` | BOOLEAN | Immediate revocation status |

## 3. `public.audit_events`
Immutable administrative audit log.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | PRIMARY KEY |
| `event_type` | TEXT | `admin.user_role_updated`, `admin.account_suspended`, etc. |
| `actor_id` | TEXT / UUID | ID of performing administrator |
| `actor_type` | TEXT | 'human' or 'system' |
| `target_id` | TEXT / UUID | ID of affected user profile |
| `target_type` | TEXT | 'user_profile' |
| `outcome` | TEXT | 'success' or 'failure' |
| `reason` | TEXT | Administrative note |
| `new_values` | JSONB | Updated attributes |
| `timestamp` | TIMESTAMPTZ | Timestamp of action |
