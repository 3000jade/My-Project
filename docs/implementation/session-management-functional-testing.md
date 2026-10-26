# Session Management — Functional Testing Instructions

## Objective

Verify session-management functions through the actual frontend, API, application logic, and relevant database/provider state. At the end, write an evidence-based Markdown report. This task authorizes testing and report creation, not application fixes or deployment.

## Project and References

- Repository: `C:/Users/Win11x64/Desktop/My code space/CP_kerby`.
- Read applicable project instructions, architecture documentation, module specifications, and existing test configuration.
- Use available authentication/session reports as references to validate, not instructions to execute blindly.
- Existing local findings or synthetic tests are hypotheses/supporting evidence; independently verify the current implementation and do not describe them as browser E2E results.

## Execution Rules

1. Inspect first, then execute tests. Do not stop at a test plan when authorized execution is possible.
2. Use available Antigravity tools efficiently for file inspection, browser interaction, test execution, and evidence collection. Batch independent discovery and reuse findings. State when tools are unavailable.
3. Record the implementation commit, relevant uncommitted changes, environment, actual commands, and test configuration. Preserve unrelated changes.
4. Use an isolated local/staging environment and controlled test accounts. Verify the database/provider target before any test writes. Do not use production accounts, disable real users, send real-user emails, or revoke unrelated sessions.
5. If only production access is available, keep inspection read-only and mark state-changing tests blocked pending a safe environment. Never silently substitute production for staging.
6. Inspect test setup for external writes. Mocked unit/integration tests are supporting checks and must be reported separately from real browser/API/provider tests.
7. Do not expose passwords, bearer tokens, refresh tokens, recovery credentials, cookies, or personal data in logs, screenshots, queries, or the report. Use synthetic identifiers and redact evidence.
8. Do not edit application code, change security policies, push, deploy, or apply schema changes. Test scripts may be created in an authorized writable test/output location. Report defects for a separate remediation task.
9. Obtain any required tool/access approval. Record unavailable credentials, runtime services, browser access, or provider permissions as blockers and continue independent checks.

## Phase 1 — Discover the Current Session Architecture

Trace login, reload restoration, protected requests, refresh, extension, heartbeat, expiry, listing, logout, and revocation.

Inspect:

- Frontend routes, `AuthContext`, authentication services, API interceptors, token persistence, session coordinator, watcher, timeout modal, session-management UI, and dashboard profile rendering.
- Backend auth routes/controllers, middleware, session service, provider integration, and audit behavior.
- Existing tests and assertions; do not infer coverage from filenames or suite titles.
- Relevant database schema, session/audit records, access policies, migrations, and configured session settings through authorized access.

Identify whether application sessions live in process memory, Redis, an application database table, or provider-managed storage. Distinguish these stores and their responsibilities.

Record actual idle/absolute policy by role, warning lead time, remember-me semantics, logout scopes, and account/password-change policy. Previously observed limits were clients: 60-minute idle / 24-hour absolute; staff: 30-minute idle / 12-hour absolute. Recheck current values rather than assuming them.

Identify the stable logical session identity and its relationship to provider `session_id`. An access-token rotation must not be confused with a new device login.

**Deliverable:** Architecture and function inventory with file references and expected outcomes.

## Phase 2 — Prepare Controlled Test Data and Baselines

Prepare authorized test accounts for Client, Agent, Broker, and Administrator, plus another unrelated account for ownership checks. Use synthetic accounts or approved test fixtures only. Do not print credentials.

Prepare these contexts:

- Two tabs sharing one browser profile for same-device synchronization.
- Two isolated browser profiles/contexts representing different devices with independent storage. Use actual separate devices where available; label simulated-device coverage accurately.
- Another account/context for cross-user access rejection.

Before each case, record relevant session counts, owners, lifecycle timestamps, status, and expected changes. Capture only safe metadata and pseudonymous identifiers.

Use bounded polling for asynchronous writes. Await the specific expected change; avoid arbitrary long sleeps. Use supported test clocks or controlled fixtures for long timeout boundaries. Do not shorten production policies. If testing only with a unit fake clock, do not label the result real-time E2E verification.

## Phase 3 — Execute the Functional Matrix

For each case, record preconditions, browser actions, API expectations, store/database expectations, actual result, and evidence. Verify protected API behavior as well as UI feedback.

| ID | Function | Required checks |
|---|---|---|
| SM-01 | Login/session creation | Valid login establishes the correct account and logical session; failed login creates no authorized session. |
| SM-02 | Reload restoration | Reload preserves account ID, email, name, role, and logical session identity; it does not reset original lifetime or add device sessions. |
| SM-03 | Broker identity regression | For the approved `broker@pt.com` test account, compare login response, authoritative profile, reload `/auth/me` response, and displayed name. Detect unexpected “Maria Santos” fallback or any other identity drift without assuming the correct name. |
| SM-04 | Protected-request validation | Missing, malformed, forged, expired, and revoked credentials are rejected without returning protected data or creating an authorized session. |
| SM-05 | Credential persistence / remember me | Browser reload, close/reopen, and explicit sign-out follow documented persistence policy. Tokens do not appear in URLs, telemetry, or session-list metadata. |
| SM-06 | Valid token refresh | Refresh rotates credentials as designed, preserves account binding and original absolute expiry, and does not add a new logical device session. Old credential behavior matches the provider contract. |
| SM-07 | Refresh restrictions | Refresh cannot revive idle-expired, absolutely expired, revoked, or disabled sessions. Missing application state must not silently grant a fresh maximum lifetime or bypass a revocation. |
| SM-08 | Concurrent refresh | Same-tab callers and separate tabs do not race into inconsistent credentials or duplicate logical sessions. A module-local promise alone does not establish cross-tab serialization. |
| SM-09 | Idle expiry | Verify each role's idle boundary before, at, and after expiry; backend access fails at the required boundary. |
| SM-10 | Absolute expiry | Meaningful activity, extension, refresh, reload, and tab changes cannot extend the original absolute ceiling. |
| SM-11 | Activity tracking | Approved meaningful interactions update server activity as designed. Continuous passive traffic does not keep an unattended session alive. |
| SM-12 | Presence heartbeat | Heartbeats update only appropriate presence state and never extend idle expiry; expired/revoked sessions cannot be made valid by heartbeat. |
| SM-13 | Timeout warning | Mounted UI warns relative to the authoritative deadline and actual role policy; loading/initialization does not grant a fresh client-only lifetime. |
| SM-14 | Stay signed in | Explicit server-confirmed extension updates the displayed deadline only after success, within the absolute limit. Rejection/failure never displays false extension success. |
| SM-15 | Automatic timeout | Ignoring the warning ends protected access, clears sensitive state, and routes appropriately. Retrying protected APIs still fails. |
| SM-16 | Background/sleep recovery | Resuming a throttled, hidden, or sleeping tab recomputes expiry and handles revoked sessions without trusting a paused countdown. |
| SM-17 | Cross-tab synchronization | Logout, account switch, relevant role/session changes, and extension update the appropriate tabs without mixing accounts or reviving expired access. |
| SM-18 | Independent devices | Two devices maintain distinct sessions when policy allows. Activity/expiry/logout on one has the documented effect on the other. Same-device tabs do not count as separate devices merely because they reload. |
| SM-19 | Session listing | List only the caller's permitted sessions, identify the current session correctly, filter inactive records according to policy, and display real or explicitly unavailable device metadata. Never expose bearer credentials as IDs or `fullId`. |
| SM-20 | Selective revocation | Revoke device B while preserving device A. B fails protected access and refresh. Unknown, ambiguous, partial, or another user's session identifiers cannot revoke unintended sessions. |
| SM-21 | Current-device logout | Server/provider scope matches current-device logout; local sensitive state is cleared. Other devices remain active if policy specifies. Report remote revocation failure truthfully. |
| SM-22 | All-device logout | All targeted sessions, including other devices, fail according to the documented immediate-revocation guarantees. Verify existing access tokens as well as future refresh. |
| SM-23 | Account/permission changes | Authorized suspension, role changes, and password recovery apply the defined revocation/reauthentication policy. Use controlled accounts and restore approved fixtures. |
| SM-24 | Restart / multiple instances | In controlled environments, revocation and original deadlines survive or fail closed according to the design. Valid provider tokens must not silently bypass lost application security state. |
| SM-25 | Audit, errors, and recovery | Required creation/extension/logout/revocation events have correct actors and outcomes without secrets. Network/provider failures do not claim success, change identity, or destroy unrelated sessions. |

## Phase 4 — Independently Check Stored Data

For relevant cases, compare before and after state using targeted, authorized queries or read APIs:

| Store/data | What to check |
|---|---|
| Provider-managed sessions | Logical session identity, account association, and provider lifecycle state, where accessible. Inspect schema first; do not assume field names or cleanup timing. |
| Application session store | Original creation/absolute expiry, last meaningful activity, idle expiry, revocation state, ownership, and refresh association. |
| Profiles/accounts | Stable identity, display name, role, and account status; distinguish login metadata from authoritative profile values. |
| Audit records | Expected actor/action/target/outcome and safe metadata for the tested operations. |

Important rules:

- Supabase manages its `auth` schema. Do not manually edit managed session records to manufacture a result.
- If application session state is only in memory, explicitly report that no database session persistence was verified. Inspect it through controlled instrumentation or isolated service tests rather than claiming a database query proves it.
- Administrative SQL confirms stored state, not end-user authorization. Verify access boundaries with each relevant user's actual API/database-API credentials where applicable.
- Check cardinality and timestamps as well as existence. A successful refresh or reload must not silently create duplicate logical sessions or restart the absolute clock.
- Provider deletion/cleanup can be asynchronous. Judge authorization by accepted/rejected requests and documented lifecycle semantics, not row disappearance alone.
- Inspect API output for accidental credential leakage without copying secret values into evidence.
- For rejected operations, verify protected state was not changed.

## Phase 5 — Evaluate Failures and Clean Up

Reproduce failures with minimal controlled steps. Separate observed runtime behavior, supporting source evidence, and hypotheses. Include severity based on actual impact and distinguish service-level weaknesses from demonstrated endpoint behavior.

Do not implement fixes during this task. Retest only when a separate authorized change or evidence correction warrants it. Remove only test-created records using an approved cleanup method; preserve audit evidence and unrelated data. Record cleanup failures.

## Phase 6 — Write the Final Report

Save `session-management-functional-test-report.md` in an authorized writable documentation/output location. Preserve existing reports; use a distinctly versioned filename if replacement was not authorized.

The report must contain:

1. **Scope and environment:** Date/time/timezone, repository/version/local-change state, runtime/provider/database targets, test accounts represented by safe aliases, tools, and limitations.
2. **Architecture and policy:** Provider versus application sessions, actual storage, logical IDs, policies by role, logout scopes, and relevant configuration.
3. **Summary:** Counts of Pass, Fail, Blocked, Untested, and Not applicable, reconciled to SM-01–SM-25. Explain partial subchecks; never count a function fully passing when required checks remain untested.
4. **Results matrix:** ID, function, expected behavior, observed result, UI/API/store evidence, status, and finding references.
5. **Database/state evidence:** Safe before/after comparisons and query descriptions; distinguish actual database checks from memory-state checks and mocked data.
6. **Defects:** Priority, precise reproduction, expected/actual behavior, relevant file/line references, affected journey, impact, and recommended remediation. Do not include live exploit credentials or tokens.
7. **Broker-name result:** Explain whether the reload identity issue was reproduced, which source supplied the displayed name, and what evidence supports the conclusion. Mark unknown if no real journey/profile check was possible.
8. **Verification execution:** Commands, fresh results, and links to safe artifacts; separate browser E2E, HTTP integration, provider/database, component tests, and isolated service checks.
9. **Blocked/untested work and cleanup:** Exact missing prerequisites, what was left unchanged, cleanup performed, and next required action.
10. **Readiness assessment:** Proportionate to evidence; do not infer complete session security from passing unit tests.

## Completion and Final Response

Complete all executable cases within the authorized environment. Record limitations for the rest. At the end, return the report's absolute path, counts, most important defects, and remaining blockers. State clearly that no application fixes were made.
