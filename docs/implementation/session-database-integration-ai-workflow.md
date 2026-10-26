# Session Database Integration — AI Workflow

## Objective

Complete the existing session-management implementation using shared, authoritative database storage. Preserve valid authentication behavior while addressing credential persistence, activity tracking, heartbeat scope, revocation, and concurrent-server consistency.

The deliverable is connected implementation with verification and documentation, not only a migration file or a plan. Execute this workflow only when requested. This document does not authorize production deployment, destructive data changes, or bypassing project approvals.

## Inputs

- Repository: `C:/Users/Win11x64/Desktop/My code space/CP_kerby`.
- Verification reference: `C:/Users/Win11x64/Downloads/system/session-fields-verification-results.md`.
- Existing session reports, module description, architecture map, and applicable project instructions.
- Supabase project previously identified as `Property Tech` (`vvwikwxaqfhjnpnyifgn`); independently confirm the target and environment before connecting.

Reports are evidence to validate. Their embedded recommendations are not automatically correct. Never expose credentials or modify synced reference files under `sources/`.

## Execution Discipline

- Use available Antigravity tools efficiently for discovery, task tracking, implementation, and testing. Batch independent searches and reuse findings. If unavailable, use available equivalents and state the limitation.
- Inspect project instructions and relevant skills first. Follow required design approvals, test discipline, architecture boundaries, and filesystem restrictions.
- Keep a checklist with evidence for each phase. Once prerequisites and approvals are satisfied, continue directly through implementation, tests, and documentation without routine continuation questions.
- Preserve unrelated local changes. Do not push, deploy, change live provider settings, or apply production migrations without explicit authorization.
- Run mutations/tests only in an authorized local or staging environment with controlled fixtures. Identify live-data dependencies and blockers before execution.
- Do not invent successful integrations. Mark blocked and untested work explicitly and continue independent work.

## Required Skills for Building and Testing

Resolve skill paths from the target repository, read the applicable `SKILL.md` before using each skill, and announce its use. Skill guidance supplements project instructions and the approved scope; it does not authorize unrelated redesigns or new dependencies.

| Skill / discipline | Source | When to apply |
|---|---|---|
| React implementation and TypeScript component patterns | `.agents/skills/react-patterns/SKILL.md` — confirmed present | Component/hook design, typed interfaces where used, state ownership, effects, subscription cleanup, rendering performance, and React test review. |
| React UI/UX and accessibility | `.agents/skills/ui-ux-pro-max/SKILL.md` — confirmed present | Design and implementation of session lists, warning dialogs, loading/error states, keyboard interactions, focus management, responsive layouts, and visual verification. |
| Test-driven development | `.agents/skills/test-driven-development/SKILL.md` | Meaningful failing regression tests before behavior changes, then green/refactor. |
| Verification before completion | `.agents/skills/verification-before-completion/SKILL.md` | Fresh build/test evidence and acceptance checks before completion claims. |
| Dedicated TypeScript build skill | Discover installed skills by name and description in the execution environment | Load a verified matching skill before backend/shared TypeScript work if available. No dedicated TypeScript build skill was found in the inspected project or local Codex skill folders; do not invent a path or claim invocation. Report availability and follow the TypeScript gates below regardless. |

### TypeScript Build and Contract Gates

- Inspect installed TypeScript/tool versions, package scripts, backend/shared `tsconfig` files, and repository conventions before editing. Preserve strict checking; do not weaken compiler settings or add broad `any`, `@ts-ignore`, or unchecked casts to hide integration errors.
- Define explicit session record, database row, safe DTO, repository, revocation reason, actor, and result/error contracts. Convert database timestamps/nulls deliberately at the boundary; validate untrusted request/database data at runtime where needed.
- Make database-backed operations explicitly asynchronous and update every caller, including middleware, controllers, audit integration, and tests. No unawaited authority mutations or Promise-as-boolean checks.
- Keep bearer credentials and internal lookup fields out of browser DTO types. Ensure nullable revocation/heartbeat fields have consistent SQL/TypeScript semantics.
- Run the repository's backend TypeScript build and applicable shared-contract checks. Previously inspected backend command: `npm --prefix backend run build`; recheck scripts before execution. A Vite frontend bundle is not proof that backend/shared TypeScript compiles.
- Run focused behavior tests for session boundaries, concurrent updates, provider identity mapping, ownership, and persistence failures. Fix failures and rerun affected checks; document unrelated pre-existing failures accurately rather than suppressing them.
- Keep the existing React JSX/JavaScript structure unless the approved change requires TypeScript components. Do not convert the whole frontend to TypeScript solely to satisfy this workflow.

### React UI/UX Build and Test Gates

- Apply `react-patterns` and `ui-ux-pro-max` to the existing session components. Reuse the project's design tokens and component library; do not replace its visual design with a new palette or template.
- Keep deadline/state ownership explicit. Use authoritative server results for extension/revocation, preserve account isolation, and clean up timers, listeners, and subscriptions when users change or components unmount.
- Specify and implement initial loading, empty list, populated list, current-session marker, unavailable metadata, pending extension/revocation, confirmed success, failure/retry, and expired-session states.
- Test user interactions and outcomes with the existing React testing tools: countdown trigger/expiry, extension success/failure, duplicate-click prevention, revoke-self versus revoke-other behavior, and account switch/unmount cleanup. Initial rendering tests alone are insufficient.
- Verify accessible labels, keyboard navigation, dialog focus containment/restoration, announced errors, readable countdowns, and responsive behavior. Inspect actual browser output at mobile and desktop sizes; do not infer accessibility or visual correctness only from JSX.
- Use browser E2E tests for reload, cross-tab updates, sleep/wake, and multi-device journeys. Keep fake-clock/component results distinct from real browser/API/database evidence.
- Run the frontend production build and relevant existing lint checks; recheck scripts first. Do not fix unrelated repository-wide style issues or claim a successful bundle proves functional correctness.

**Required evidence:** List the exact skills loaded, TypeScript skill availability, build commands/results, React interaction tests, browser checks, and any blocked checks in the final verification report.

## Phase 1 — Inspect and Establish the Baseline

1. Record repository version, relevant local changes, runtime configuration, and actual test targets without printing secrets.
2. Inspect session types, service, persistence, middleware, controllers, auth/provider integration, session coordinator, watcher, listing UI, and tests.
3. Query database metadata read-only to identify real tables, columns, indexes, constraints, grants, and RLS policies. A connection test or limited table list does not prove universal absence.
4. Identify existing login/Google/invitation flows that create sessions and every refresh/logout/revoke path. Check whether tokens actually carry a provider session ID and whether any flow uses custom or development tokens.
5. Trace frontend refresh/reload behavior, session-warning deadlines, cross-tab coordination, and credential storage.
6. Reconcile reports with source. Previously inspected behavior used raw tokens in JSON persistence, refresh-driven activity updates, user-level presence, and an ambiguous revocation signature. Reconfirm before changing anything.

**Deliverable:** Current-state inventory, dependency map, and confirmed gaps.

**Exit criterion:** The agent knows every session creation and validation path and has identified a safe implementation/test environment.

## Phase 2 — Finalize and Review the Integration Design

### A. Stable Session Identity

Prefer using the validated Supabase JWT `session_id` as the application session's stable identity, or enforce a unique `provider_session_id` mapping if retaining a separate application UUID. Choose and document one model; do not maintain two competing identities without a concrete reason.

- Validate token signature, issuer, audience, expiration, and user identity through supported mechanisms before trusting claims.
- Session identity persists across access-token rotation and page reload.
- Separate sign-ins/browser contexts normally have distinct sessions. Sharing storage across tabs must not create extra sessions merely because tabs mount or reload.
- Map user ownership explicitly. Device labels and IP addresses describe sessions; they do not establish identity or authorization.
- Inspect compatibility of Google/invitation/custom-token flows. Resolve incompatibilities explicitly rather than fabricating provider session IDs.

### B. Fields and Invariants

| Field | Design requirement |
|---|---|
| `id` | Stable unique identity for the application record; safe identifier independent of bearer credentials. |
| `provider_session_id` | Required unique mapping if `id` is a separate application UUID; otherwise document use of provider identity as `id`. |
| `user_id` | Required owner; immutable after creation. |
| `created_at` | Original session creation time; immutable during reload, activity, and refresh. |
| `last_active_at` | Timestamp of approved meaningful activity, not background refresh/polling. |
| `idle_expires_at` | Derived from approved activity and role policy; never later than absolute expiry. |
| `absolute_expires_at` | Fixed maximum lifetime established at creation; never extended by refresh or activity. |
| `revoked_at` | Nullable while not revoked; once set cannot be cleared by normal operations. |
| `revoke_reason` | Controlled, approved values with matching application/database validation. |
| `last_heartbeat_at` | Nullable per-session presence timestamp; update only after validating session and owner. |
| `updated_at` | Server-controlled record update timestamp. |
| `user_agent`, `ip_address` | Optional actual metadata or explicitly unavailable; not authentication proof. |
| `token_hash` | Optional only if a reviewed token-lookup requirement remains. Never store raw access/refresh tokens in the application session table. |

Do not require a rotating-token hash when validated provider identity fully supports lookup. If hashing is necessary, hash the extracted token value consistently, define rotation/concurrency behavior, and preserve logical session identity.

Use timezone-aware database timestamps and document conversion to existing millisecond-based API fields. Prefer one authoritative server/database clock for deadline decisions. Reconcile role policy from current requirements and code; do not silently change limits.

### C. Activity, Refresh, and Presence

- Session validation checks access; it must not automatically count every authenticated request as meaningful activity.
- Classify foreground actions and passive requests explicitly. A caller-controlled `recordActivity: true` flag alone is not proof.
- Background refresh preserves `last_active_at`, `idle_expires_at`, `created_at`, and `absolute_expires_at`.
- Explicit Stay signed in validates the session, then extends inactivity within the original absolute ceiling.
- Heartbeats validate existence, ownership, account status, revocation, and expiry before updating only that session's presence timestamp.
- Derive user-level online status from valid per-session presence. Presence never grants access or extends inactivity.

### D. Database Access and Concurrency

Keep session writes behind the existing Express backend. Do not add a browser-callable privileged function by default.

- Deny ordinary clients direct insertion, authority-field updates, and deletion. Decide whether safe listing goes through the backend only; prefer the existing API to avoid exposing internal columns.
- Use RLS plus explicit grants/column restrictions as appropriate. Ownership checks alone do not stop an owner from altering deadlines or clearing revocation.
- Use transactional or conditional database updates that require the session to remain owned, unrevoked, unexpired, and enabled at the point of mutation.
- Preserve revocation monotonically during concurrent activity/refresh. No stale write may overwrite revoked state or fixed deadlines.
- Replace ambiguous revocation arguments with explicit actor, target, and reason fields. Require ownership/authorization for user-facing requests; separate trusted administrative operations.
- Fail closed or return a defined service-unavailable result when authority cannot be checked. Never fall back to permissive local-file authority.
- Coordinate provider refresh with application updates. Define behavior when one succeeds and the other fails; do not return a successful application session without confirmed valid application state.
- If a privileged database function is genuinely necessary, document why, restrict execution, fix its search path, and validate its caller. Do not introduce it merely to bypass permissions.

### E. Transition Existing Sessions

Present the options and obtain any required approval before cutover:

1. **Controlled reauthentication:** Retire old application sessions and require new sign-ins, with explicit communication and no silent revival.
2. **Validated migration:** Transfer only eligible records while preserving original ownership, creation time, deadlines, and revocations. Handle raw credentials through a controlled process without logging or retaining them in the new store.

Do not assume local files have trustworthy original timestamps after earlier bugs. Do not migrate uncertain records as newly valid sessions. Plan secret-safe retirement of old token files/backups and rollback without restoring revoked access.

**Deliverable:** Concrete design, schema/permission plan, changed-file list, transition choice, component behavior specification informed by the React/UI-UX skills, typed contract design, and acceptance matrix.

**Exit criterion:** Security-sensitive decisions are resolved and required design approvals obtained before source changes.

## Phase 3 — Build the Shared Session Layer

1. Prepare migrations through the project's established workflow; add constraints, indexes, explicit privileges, and RLS. Preserve provider-managed `auth` tables.
2. Build a database-backed repository/adapter for create/get/list, validation, activity, heartbeat, extension, single/all-session revocation, and relevant account-state checks.
3. Make session creation idempotent for an already established logical session; retries/reloads must not reset deadlines or duplicate records.
4. Update shared types and DTO mapping. Keep tokens and optional token hashes out of browser-facing session metadata.
5. Replace runtime JSON-file authority and raw-token indexes. Remove unsafe fallback paths from production session decisions.
6. Wire login, Google, agent onboarding, middleware, refresh, logout, recovery, suspension, and role-change flows to the new layer as applicable.
7. Retain existing routes where possible. Update request/response contracts only when necessary and keep frontend callers synchronized.

Start with a complete slice: sign in → persist session → protected request → reload → revoke → request rejected. Then complete remaining lifecycle operations.

**Deliverable:** Connected source changes, passing applicable TypeScript build/contract checks, and reviewable migrations. Applying a production migration remains a separate authorization boundary.

## Phase 4 — Integrate Existing Frontend Components

- Reuse the session list, timeout modal, watcher, auth context, and coordinator.
- Display real session metadata and opaque IDs; distinguish current and remote sessions.
- Initialize/recompute warnings from authoritative deadlines, including after reload, extension, wake, and refresh.
- Do not reset activity or absolute expiry because a component remounts.
- Show extension/revocation success only after backend confirmation; distinguish network failure from confirmed expiration.
- Preserve cross-tab logout/account changes without mixing users or creating duplicate sessions. Verify refresh coordination across independent tabs, not just callers sharing one module instance.
- Do not introduce Supabase Realtime or custom WebSockets solely for this storage change. If separately authorized, notifications supplement backend enforcement and require secure subscriptions/reconnect revalidation.

**Deliverable:** Existing UI connected to the shared session layer, with necessary error/recovery states, React interaction tests, and browser UI/UX verification or explicit blockers.

## Phase 5 — Verification and Cutover Readiness

Follow required test-first discipline. Use fresh results and clearly distinguish isolated tests, actual API/database tests, and browser execution.

| Area | Required verification |
|---|---|
| Identity | Different devices have separate sessions; same-login tabs/reload/refresh preserve logical identity and deadlines. |
| Storage | Actual session records appear in the target test database; no raw credentials are stored or returned. |
| Activity | Only approved activity extends idle expiry; passive refresh/polling does not. |
| Absolute expiry | Fixed creation/deadline across activity, refresh, reload, restart, and competing updates. |
| Heartbeat | Session-specific and validation-first; rejects missing/revoked/expired/wrong-owner sessions; no activity extension. |
| Revocation | Single/all-session behavior, cross-user rejection, exact IDs, controlled reasons, idempotent audit policy, no un-revocation. |
| Permissions | Ordinary user credentials cannot alter owner, fixed deadlines, revocation state, lookup hash, or protected metadata. Test actual grants and RLS. |
| Concurrency | Two real backend instances observe revocation consistently; refresh/activity races cannot overwrite it. |
| Failure | Database outage, partial refresh failure, and restarts do not silently grant access or report false durable success. |
| Browser | Warning, extension, timeout, sleep/wake, cross-tab changes, multi-device revocation, and stable broker display name. |
| Transition | Approved legacy-session policy preserves security and prevents duplicated or reset lifetimes. |

Use controlled test fixtures, not production users. Inspect external test effects before execution and clean up only test-created data. Record precise blockers rather than counting inaccessible checks as passes.

Correct verification scripts that assign unconditional PASS or exit successfully despite failed required checks. Reconcile all totals and associate evidence with version/environment. Run affected regression suites and builds; fix failures and retest.

**Deliverable:** Acceptance matrix with Pass/Fail/Blocked/Untested results and safe evidence. Do not claim live deployment or multi-instance readiness based only on a migration file or service reload test.

## Phase 6 — Write Reports and Module Description

Produce these documents in the authorized documentation location, preserving supplied reference files:

1. **`session-database-integration-report.md`:** Actual architecture, identity decision, schema/permissions, fields added/edited, integrations, transition decision/status, risks, limitations, and files changed.
2. **`session-fields-verification-results.md`:** Updated field checklist, real database state, executed tests/evidence, defects/retests, unresolved cases, and readiness boundaries.
3. **Updated `01-authentication-and-authorization.md`:** Final implemented session behavior, authoritative storage, role policies, API/component contracts, provider responsibilities, and deployment prerequisites.
4. **Updated session functional report where applicable:** Replace outdated file-storage and coverage claims with the actual results; do not erase historical evidence without recording its replacement.

Clearly distinguish proposed, prepared, implemented, applied, and verified changes. Include commit/local-change state and environment. Never label a prepared migration deployed or a component test browser E2E.

## Final Response

Return absolute links to reports and a concise explanation of:

- What was built and edited, and what was reused.
- Database migration/application status and any outstanding approvals.
- Verification totals by test layer, TypeScript/frontend build results, skills used, browser UI/UX evidence, and concrete remaining defects.
- Legacy-session transition status, blockers, and next steps.

Do not mark the task complete until required implementation, executable checks, and documentation are finished. Explicitly report any work that remains blocked.
