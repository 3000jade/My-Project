# Session Fields — Implementation Verification and Risk Report

**Inspection date:** October 23, 2026 (Asia/Shanghai)  
**Application:** CP_kerby  
**Database:** Supabase project `Property Tech` (`vvwikwxaqfhjnpnyifgn`)  
**Method:** Live schema-only SELECT query and read-only source inspection.  
**Scope:** `last_active_at`, `absolute_expires_at`, `revoked_at`, `revoke_reason`, `last_heartbeat_at`, and optional `token_hash`.

## 1. Outcome and Limitations

The application has partial support for the six field responsibilities, but they are not implemented as a shared database-backed session model.

- The schema query returned `auth.sessions`, but no session-named table under `public`, including no `public.user_sessions`.
- The application service persists records to `backend/data/sessions.json`, with in-memory lookup maps. The inspection did not open that file or retrieve credentials.
- Four responsibilities have camelCase fields in the application record. Presence uses a user-level memory map rather than a session heartbeat field. Token hashing appears in migration design only.
- A migration file is evidence of a proposed schema, not of deployment or runtime integration.
- No sign-ins, state-changing requests, migration applications, application fixes, or runtime tests were performed for this report. Only this report artifact was created.
- Findings identify source behavior and risks; exploitability, deployed grants, actual record contents, and concurrent-server behavior remain unverified. No commit equivalence to earlier reports was established.

## 2. Field Checklist

| Field | Intended purpose | Live application DB column | Existing application function | Assessment |
|---|---|---|---|---|
| `last_active_at` | Last approved meaningful activity; drives inactivity policy. | Not found in a public session table. | `lastActiveAt` initialized by `createSession`; updated by `validateSession`, `extendSession`, and `rotateSession`. | Partially aligned: refresh updates activity and non-heartbeat requests count as activity. |
| `absolute_expires_at` | Fixed maximum deadline for one logical sign-in. | Not found. Provider table has `not_after`, whose configured semantics were not verified here. | `absoluteExpiresAt` created from role limits, checked on validation/extension/rotation, and retained during rotation. | Present in source/file-backed design; distributed durability unverified. |
| `revoked_at` | Timestamp permanently terminating a session. | Not found. | `revokedAt` written on single/all-session revocation and checked by validation/extension/rotation. | Present in source/file-backed design; cross-process consistency remains a risk. |
| `revoke_reason` | Explain why a session was terminated. | Not found. | `revokeReason` stored alongside revocation; defaults and caller-provided strings are accepted. | Present; no enforced reason enumeration found in inspected type/service. |
| `last_heartbeat_at` | Last valid presence signal for a particular session, distinct from activity. | Not found. | `presenceStore: Map<userId, timestamp>`, `recordHeartbeat`, and `isUserOnline`; 60-second presence TTL. | Partial equivalent only: per-user, memory-only, also updated by non-heartbeat operations. |
| `token_hash` | Optional non-reversible token lookup without storing raw bearer credentials. | Not found. | Migration declares unique required `token_hash`; runtime record instead includes `token` and uses `sessionsByToken`. | Proposed, not implemented in the inspected runtime. |

Supabase `auth.sessions.refreshed_at` is not proof of meaningful user activity. Provider-internal refresh-token fields are not substitutes for an application access-token lookup hash. Do not alter the managed `auth` schema to add these application fields.

## 3. Existing Functions and Evidence

Source paths below are rooted at `C:/Users/Win11x64/Desktop/My code space/CP_kerby`.

| Function | Existing behavior | Evidence |
|---|---|---|
| `createSession` | Creates opaque ID, initializes activity/deadlines, stores bearer token, and saves record. | `backend/src/services/session.service.ts:176` |
| `validateSession` | Rejects disabled/revoked/expired sessions; updates activity and idle deadline for non-heartbeat requests. | `backend/src/services/session.service.ts:255`, `:267` |
| `extendSession` | Explicit activity extension, capped by absolute expiry. | `backend/src/services/session.service.ts:309` |
| `rotateSession` | Retains record/absolute deadline; replaces bearer token and updates activity/idle deadline. | `backend/src/services/session.service.ts:336`, `:352` |
| `recordHeartbeat` | Writes user presence first; returns true for an unknown session; otherwise validates without idle extension. | `backend/src/services/session.service.ts:400` |
| `revokeSession` | Resolves exact identifier, optionally checks owner, writes timestamp/reason, and saves. Its overloaded arguments require care. | `backend/src/services/session.service.ts:418` |
| `revokeAllUserSessions` | Loads persisted records, revokes matching user sessions, saves, and invokes audit service. | `backend/src/services/session.service.ts:483` |
| Persistence | Reads/merges local records, serializes whole records, renames a temporary file, with copy fallback; write failures are logged rather than propagated. | `backend/src/services/session.service.ts:49`, `:78`, `:91`, `:99` |
| Request middleware | Passes header-derived heartbeat flag to validation and checks provider-user ownership. | `backend/src/middleware/auth.middleware.ts:33`, `:46`, `:84` |
| Record contract | Defines activity, absolute expiry, optional revocation timestamp/reason, and raw token; no heartbeat/hash field. | `shared/types/inquiry.ts:167` |
| Proposed DB design | Declares five of the six fields; omits heartbeat timestamp. | `backend/src/models/user_sessions_migration.sql:12` |

## 4. Findings and Risks

### SF-01 — High: Raw bearer tokens are included in file persistence

The record includes `token`, and persistence serializes the full records. This exposes credentials if the file, backups, or host are accessed improperly. Removing credentials from the session-list response does not eliminate this separate storage risk.

**Recommendation:** Choose a reviewed lookup design using validated provider session identity or a server-computed token hash. Avoid raw access/refresh tokens in application session storage. Keep the stable logical ID independent from rotating credentials. Existing raw-token files/backups need a controlled transition plan.

**Verification needed:** Safe inspections proving persistence, logs, and DTOs contain no raw credentials; valid requests resolve correctly after refresh/reload/restart.

### SF-02 — High: Shared authoritative persistence is not implemented

The service uses a local read/merge/write file rather than database transactions. Cached records can remain stale because reads reload on a miss, while writes can overwrite a newer on-disk record with an older cached copy. Separate hosts need not share the file. A successful rename does not establish transactional cross-worker consistency. Persistence errors are swallowed, allowing callers to proceed without confirmed durable writes.

**Recommendation:** Implement a shared authoritative store with concurrency-safe updates, monotonic revocation, preserved original absolute deadlines, and defined failure behavior. Test actual backend instances rather than only service reinitialization.

**Verification needed:** Concurrent revoke/activity/refresh tests, real restart tests, and storage-failure scenarios. A revoked session must not be resurrected or receive a new lifetime.

### SF-03 — Medium: Refresh counts as meaningful activity

`rotateSession` sets `lastActiveAt = nowMs` and advances idle expiry. General non-heartbeat requests also update activity. This conflicts with the proposed activity definition if refresh and passive polling are meant to leave inactivity unchanged.

**Recommendation:** Define approved activity sources explicitly. Preserve activity during background refresh unless the request carries separately verified meaningful activity. Classify polling and heartbeat paths consistently; do not trust an arbitrary client activity claim as sufficient security authority.

**Verification needed:** An unattended browser with successful background refresh/polling still expires at its original inactivity deadline; explicit activity extends idle expiry only within the absolute ceiling.

### SF-04 — Medium: Heartbeat state is not session-specific or validation-first

The presence map is keyed by user, disappears on restart, and is updated by other operations. `recordHeartbeat` updates presence before validating and returns true when no session is found. This is a service-level observation; authenticated middleware may prevent some invalid HTTP calls.

**Recommendation:** Decide whether presence is per-user aggregate or per-session. Validate session existence, ownership, account state, and expiry before recording a heartbeat. Store `last_heartbeat_at` per session only if required; derive aggregate presence from valid sessions. Presence must not authorize access or extend idle expiry.

**Verification needed:** Device A heartbeat does not falsify device B's last heartbeat; invalid/revoked/expired session heartbeats cannot mark that session active or return a misleading success.

### SF-05 — High if deployed with broad UPDATE grants: Proposed ownership policy permits excessive mutations

The migration's authenticated UPDATE policy checks only `user_id = auth.uid()`. It does not restrict writes to revocation fields. If authenticated clients receive broad UPDATE privileges, an owner could potentially change deadlines, revocation state, or other authority fields. The table is absent in the inspected public schema, so this is a deployment-design risk, not a demonstrated current endpoint vulnerability.

**Recommendation:** Keep session-authority writes in authorized server operations, or enforce narrowly limited database functions/column privileges and immutable-field rules. Ownership alone is insufficient. Never let clients clear `revoked_at` or alter lifetime/owner/hash fields.

**Verification needed:** Test with actual non-admin user credentials and grants, proving forbidden field updates fail and authorized revocation succeeds.

### SF-06 — Medium: Revocation reason and ownership interfaces need stricter contracts

`revokeReason` is an arbitrary string, and `revokeSession` overloads a second argument as either user identity or reason. An incorrect caller can accidentally omit the intended ownership check; actual exposed endpoint exploitability was not tested.

**Recommendation:** Use explicit named parameters, mandatory actor/owner checks for user-facing operations, and a controlled reason enum. Separate trusted internal revocation from user requests. Retain the original revocation timestamp/reason on repeated calls according to the audit policy.

**Verification needed:** Cross-user rejection, unambiguous invocation, allowed reason validation, and idempotent repeat revocation with consistent audit records.

## 5. Required Follow-Up Verification

| Check | Expected outcome | Current evidence |
|---|---|---|
| Meaningful activity | Updates activity and idle deadline only for approved actions. | Source partly conflicts; runtime untested. |
| Background refresh | Rotates credentials without refreshing inactivity by itself. | Source conflict identified; runtime untested. |
| Absolute lifetime | Creation/absolute timestamps survive reload, refresh, restart, and concurrent writes. | Source support; distributed execution untested. |
| Revocation | Blocks requests, refresh, extension, and heartbeat with persistent state. | Source support and persistence risks; runtime untested. |
| Heartbeat | Validated, correctly scoped, does not alter activity/idle deadline. | Partial user-level memory implementation. |
| Token confidentiality | No raw credentials in DTOs, application persistence, or logs. | File-serialization risk identified in source. |
| DB integration | Actual deployed table and service reads/writes match the approved schema. | Public session table absent; runtime uses files. |
| User permissions | Clients cannot extend deadlines, un-revoke, or alter owner/hash. | Proposed policy needs review; live table absent. |

## 6. Recommended Order and Final Assessment

1. Decide the stable provider/application session mapping and whether token hashing is necessary.
2. Review the proposed schema and field-level authorization before any deployment.
3. Implement durable shared authority and secret-safe lookup in a separate authorized task.
4. Separate meaningful activity from refresh/presence and define strict revocation interfaces.
5. Execute isolated service tests, authorized API/database tests, and browser/device journeys; update the report with actual results.

**Conclusion:** The six responsibilities are not fully implemented in the database. Existing source provides partial application behavior, but raw-token persistence, nontransactional storage, refresh-driven activity, and proposed write permissions require attention. This inspection is not a runtime pass or production-readiness sign-off.
