# Agent Management Remediation Implementation Plan

> **For agentic workers:** Use the repository's `executing-plans` skill to implement this plan task by task. Use `subagent-driven-development` only when delegation is explicitly authorized. Track execution using the checkboxes below.

**Goal:** Bring agent management to a verifiable standard for secure access, confidential onboarding, durable administration, and accurate broker screens.

**Architecture:** Keep the React screens and Express service layers. Make Supabase the authoritative store for identity, eligibility, and lifecycle state; use restricted server-side operations for transitions and private Drive storage for credential files. Remove operational dependence on mock records and process-local caches.

**Tech stack:** React, Express, TypeScript, Supabase/PostgreSQL, Google Drive, Zod, Vitest, and the repository's existing Playwright tooling.

**Evidence:** [Agent management evaluation](./agent-management-evaluation.md), repository `docs/agent-management.md`, and `docs/superpowers/specs/2026-10-14-agent-management-module-design.md`.

**Repository:** `C:/Users/Win11x64/Desktop/My code space/CP_kerby`

**Status:** Proposed plan. No implementation or deployment is included in this deliverable. When approved for repository adoption, place it at `docs/superpowers/plans/2026-10-14-agent-management-remediation.md`.

## Global constraints

- Keep this work local and confidential; do not push, publish, send invitations, or change live accounts during development verification.
- Preserve existing routes and the roster → dossier → editor navigation unless a task explicitly adds an API route.
- Follow repository layer responsibilities and shared-contract conventions. Use existing dependencies before adding packages.
- Follow the repository design standards: teal `#0F766E`, coral `#FF6B6B`, canvas `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, standard 8px radius, 8px spacing system, and the documented WCAG 2.2 AA requirement.
- Write behavioral regression tests first, observe a meaningful failure, implement, then rerun. A test-runner error does not satisfy the failing-test step.
- Use test identities, isolated database fixtures, and private test files. Disable real email delivery and never load production secrets into test runs.
- Before implementation, obtain the repository-required approval for the proposed authentication, schema, API, business-rule, and UI changes. This plan makes that scope reviewable; it does not authorize those changes.
- Treat the existing documentation's guarantees as acceptance targets to verify, not established facts.

## Proposed product decisions

These defaults make the plan executable. Confirm them as part of implementation approval.

| Topic | Proposed rule |
|---|---|
| Public signup | Creates `client` only. Explicit agent/broker/admin role requests receive 400. |
| Agent enrollment | Requires a valid invitation; invitations to existing accounts receive 409 until a separate account-linking flow exists. |
| Role authority | Server-controlled profile role. User-editable metadata never grants access. |
| Brokerage scope | Confirm whether the deployment is single-brokerage. If multiple brokerages share it, implement membership scoping before dossier access can be accepted. |
| Suspension | Blocks agent listing creation/edit/publication and new lead assignment. Retain historical ownership and records. |
| Credential expiry | Blocks restricted operations immediately when either required credential has expired or is missing. Do not silently rewrite verification history. |
| License/document edits | Move VERIFIED agents to PENDING for a new review and record the reason. Ordinary contact/bio edits do not revoke verification. |
| Rejected applications | Authenticated applicant may replace private documents and resubmit to PENDING; the registration token remains consumed. |
| Bank/tax/commission/access-tier fields | Exclude from this remediation's editable contract. Remove misleading sample values and show unavailable controls as read-only explanations. Adding financial processing requires separate scope. |
| Completeness | Required: identity name, contact details, photo, both credentials with valid dates and evidence, and government ID. Optional background and tax fields do not reduce the score. Completeness and approval remain separate concepts. |

## Work sequence and release gates

| Phase | Tasks | Exit gate |
|---|---|---|
| Baseline | 1 | Tests execute reliably with isolated fixtures. |
| Security | 2–4 | Forged sessions, privileged public signup, unauthorized dossiers, and public credential reads are denied. |
| Integrity | 5–7 | Invitations cannot replay; failures do not claim success; state survives reload/restart. |
| Product completion | 8–9 | Editor and indicators match persisted data. |
| Acceptance | 10 | HTTP/browser acceptance, accessibility checks, builds, and documentation agree. |

Do not release partial remediation while P0/P1 acceptance checks remain unresolved. Tasks 2 and 3 precede any new sensitive endpoints. Task 5 precedes the final onboarding integration tests.

## File responsibilities

Existing files retain their responsibilities: middleware authenticates and authorizes; schemas validate input; controllers map HTTP; services enforce rules; models contain migrations; frontend services expose API calls; pages render state.

Proposed additions:

| File | Responsibility |
|---|---|
| `shared/types/agent.ts` | Verification state, invitation state, dossier/edit contracts, metric definitions. |
| `backend/src/services/agentEligibility.service.ts` | One authoritative policy for restricted agent operations. |
| `backend/src/services/agentCredentials.service.ts` | Private credential upload/read authorization and metadata. |
| `backend/src/routes/agentCredentials.routes.ts` | Invitation-bound upload and authenticated private document reads. |
| `backend/src/controllers/agentCredentials.controller.ts` | Credential HTTP handlers. |
| `backend/src/models/agent_management_integrity_migration.sql` | Invitation claims, unique token digests, private document metadata, audit events, and atomic database functions. |
| `frontend/src/services/agentCredentialsService.js` | Private credential API integration. |
| `frontend/src/components/agents/AgentCompleteness.jsx` | Render server-derived completeness and missing-item reasons. |
| `test files/backend/services/agentEligibility.service.test.ts` | Eligibility policy regression cases. |
| `test files/backend/services/agentCredentials.service.test.ts` | Document confidentiality and ownership cases. |
| `test files/backend/controllers/agent-management.http.test.ts` | Real router/middleware/service integration against isolated fixtures. |
| `frontend/e2e/agent-management.spec.js` | Browser acceptance workflow, using existing runner conventions verified in Task 1. |

## Task 1 — Establish a reproducible baseline

**Files:** Existing backend/frontend test configuration and agent tests; new `shared/types/agent.ts`; existing `shared/types/index.ts`.

**Deliverable:** Tests do not depend on a seeded `agent-3`, external services, or shared state between cases.

- [x] Inspect current runner configuration and resolve the temporary SSR file errors found in the evaluation. Record runtime versions and the commands that reproduce the baseline; change configuration only when the failure is reproduced.
- [x] Inject or mock the repository/database and email boundaries in unit tests. Create explicit fixtures per test and reset them afterward. Run live database behavior only against an isolated integration database.
- [x] Replace implicit seed assumptions with explicit setup. Keep the existing RBAC assertion that missing eligibility data denies creation.
- [x] Define the shared lifecycle contract and export it from `shared/types/index.ts`:

```ts
export type AgentVerificationStatus =
  'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';
export type AgentRestrictedOperation =
  'create_listing' | 'edit_listing' | 'publish_listing' | 'receive_lead';
```

- [x] Run the four existing invitation/registration/RBAC/lifecycle suites. Record assertion failures separately from loading failures. Establish working frontend agent test commands too.

**Verification commands:** From `backend`, `npm test -- "../test files/backend/services/invitation.service.test.ts" "../test files/backend/services/agentRegistration.service.test.ts" "../test files/backend/services/agent-verification-rbac.test.ts" "../test files/backend/services/agent-management-lifecycle.e2e.test.ts"`. From `frontend`, `npm test -- src/pages/portals/broker/BrokerAgents.test.jsx src/pages/portals/broker/BrokerAgentDetail.test.jsx src/pages/portals/broker/BrokerAgentEdit.test.jsx`. Confirm configured include paths before interpreting “no tests found.”

**Acceptance:** All selected suites load. No baseline failure is hidden or removed merely to get a green result.

## Task 2 — Close authentication and public role assignment bypasses

**Modify:** `backend/src/middleware/auth.middleware.ts`, `role.middleware.ts`, `schemas/auth.schema.ts`, `services/auth.service.ts`, `controllers/auth.controller.ts`, `frontend/src/services/apiClient.js`.

**Test:** Existing auth middleware/controller/register tests.

**Interface:** `requireAuth` attaches a validated identity with a server-controlled role; `requireRole` reads that role only.

- [x] Add failing tests for fabricated `dev-mock-jwt-token-broker`, `token-google-<id>`, missing profile, user metadata containing `role: 'broker'`, and ordinary registration with `role: 'agent'` or `role: 'broker'`.
- [x] Run those tests and confirm the access/role assertions fail under current behavior.
- [x] Remove prefix-based authentication. Verify Supabase sessions and load the authoritative profile. Reject invalid sessions with 401, unavailable authorization data with 503, and valid sessions without permissions with 403.
- [x] Remove metadata/default-agent fallback from `requireRole`. Restrict signup validation and service assignment:

```ts
// Replace the role property in registerSchema.
role: z.literal('client').optional().default('client')

// AuthService.signUp must assign client regardless of request metadata.
const assignedRole = 'client';
```

- [x] Remove automatic fake broker token injection from the frontend. Keep demo fixtures in explicit test/demo providers instead of authenticating them through production routes.
- [x] Test real broker/admin sessions, client denial, and expired sessions. Verify profile roles cannot be changed by ordinary clients through database policies or other profile endpoints.

**Acceptance:** Forged tokens receive 401; metadata manipulation cannot grant broker privileges; public agent/broker registration receives 400; invited onboarding remains available.

## Task 3 — Restrict dossier access

**Modify:** `backend/src/routes/agent.routes.ts`, `controllers/agent.controller.ts`, `services/agent.service.ts`; profile policies in the appropriate additive migration.

**Test:** Existing agent controller tests plus `agent-management.http.test.ts`.

**Interface:** Administrative roster/detail APIs require authorized broker/admin access. Self-service profile responses use a separate minimal contract and do not expose other agents' dossier data.

- [x] Add failing HTTP tests for a client reading the roster, an agent reading another agent's dossier, and a broker requesting an unrelated brokerage record if multi-brokerage is confirmed.
- [x] Require broker/admin role on administrative reads and verify target records are agents. Enforce brokerage membership in database queries if applicable; do not rely on a frontend route guard.
- [x] Select response fields explicitly. Exclude raw invitation tokens, private file URLs, and fields outside the authorized contract.
- [x] Verify any public directory or self-profile consumer still receives its approved minimal fields through its existing appropriate endpoint. Update consumers rather than loosening the administrative route.
- [x] Run denial and authorized-access tests through middleware, not controller substitutes alone.

**Acceptance:** Unauthorized roles receive 403. Out-of-scope or non-agent IDs receive a consistent 404. No sensitive dossier response is accessible through an unrestricted alternate endpoint.

## Task 4 — Add private, invitation-authorized credential uploads

**Create:** Credential service/controller/routes and frontend service listed above.

**Modify:** `AgentRegisterPage.jsx`, `BrokerAgentDetail.jsx`, `backend/src/services/googleDrive.service.ts`, API route registration, integrity migration.

**Test:** `agentCredentials.service.test.ts`, existing onboarding page tests, HTTP tests.

**Proposed API:** `POST /api/agent-credentials/upload` accepts a multipart file and invitation token; after registration the same route requires an authenticated applicant and their agent ID. `GET /api/agent-credentials/:documentId/content` requires applicant-self or authorized broker/admin permission.

- [x] Add failing tests for anonymous uploads without a token, expired/revoked tokens, invalid MIME/size, another agent's document read, and requests to set public sharing.
- [x] Extend the storage adapter with an explicit visibility option. Preserve public property-media behavior; credential calls always select private visibility and never request `type: 'anyone'`.
- [x] Enforce server-side document kinds (`prc`, `dhsud`, `government_id`), PDF/JPEG/PNG MIME/signature validation, 10 MB per file, maximum six attachments per application, and upload rate limiting. Clean up rejected or abandoned uploads using a recorded ownership/expiry record.
- [x] Persist internal document ID, storage file ID, kind, owner/invitation ID, upload time, and MIME/size. Registration accepts internal document IDs only and verifies ownership; it does not trust arbitrary `webViewLink` values.
- [x] Stream authorized reads through the backend. Return an internal view URL to the UI; do not store or display publicly shareable links.
- [x] Add an operator inventory step for existing credential files. In an approved environment, identify module-owned files and remove `anyone` permissions; do not modify property-media permissions. Report every file that cannot be privatized.

**Acceptance:** A logged-out invited candidate can upload required evidence. Unauthorized reads fail. Real test files remain private even when their underlying Drive link is known.

## Task 5 — Make invitation consumption and registration durable

**Modify:** `invitation.service.ts`, `agentRegistration.service.ts`, invitation/auth controllers and schemas, integrity migration.

**Test:** Invitation and registration tests; lifecycle and HTTP tests.

**Database design:** Store SHA-256 token digests for new invitations. Add `registration_attempt_id`, `claim_expires_at`, and a persisted provisioning-attempt record. Use an atomic claim function and finalize profile/token state in one database transaction. Supabase Auth provisioning is external to that transaction, so recovery must be explicit.

- [x] Add failing tests for two simultaneous submissions, resend of a used/revoked invitation, duplicate active invitations, existing account email, auth failure, profile failure, and retry after a partially completed attempt.
- [x] Normalize email, reject existing accounts with 409, and serialize invitation issuance for the same email in a database function. Add a partial unique index for pending invitations after explicitly expiring old pending rows; keep expired records for history.
- [x] Replace lookup-then-consume with an atomic claim. The database function must require pending, unexpired, and unclaimed state and return exactly one claimed row. An illustrative condition is:

```sql
UPDATE public.agent_invitations
SET registration_attempt_id = p_attempt_id,
    claim_expires_at = now() + interval '10 minutes'
WHERE token_digest = p_token_digest
  AND status = 'pending'
  AND expires_at > now()
  AND registration_attempt_id IS NULL
RETURNING id, email;
```

- [x] Restrict function execution to the backend service role. Create and track a new Auth user only after claiming. Never reuse an existing user's ID from `listUsers` or overwrite its role.
- [x] Finalize profile, private attachment ownership, audit event, and invitation `used` state in one database function conditioned on the same attempt ID. Return success only after finalization commits.
- [x] On failure, record whether Auth creation occurred. Retry finalization idempotently for that same attempt or compensate by deleting only the newly created user. Do not release an unresolved claim merely because its lease elapsed; reconcile the attempt first.
- [x] Resend only pending/expired invitations with no in-progress attempt. Rotate the raw token/digest and invalidate the old link. Used/revoked invitations return 409; a new authorized issuance is a separate action.
- [x] Record email delivery as queued/sent/failed. Return “invitation created; delivery failed” when appropriate instead of claiming delivery succeeded. Ensure copy-link access is broker-authorized; keep raw tokens out of logs and persistent browser state. Migrate legacy tokens through an explicit replacement policy before removing plaintext columns.

**Acceptance:** Exactly one concurrent registration wins. Failed provisioning does not yield a success response or silently lose the candidate's application. Resend never revives an old link. All persisted state survives restart.

## Task 6 — Enforce eligibility and auditable status transitions

**Create:** `agentEligibility.service.ts` and its tests; immutable audit-event table/function in the integrity migration.

**Modify:** Agent service/schema; property controller/service/routes; inquiry assignment entry points; applicant credential resubmission endpoint.

**Interface:**

```ts
type EligibilityResult =
  | { allowed: true }
  | { allowed: false; reason: 'MISSING_PROFILE' | 'UNVERIFIED' |
      'EXPIRED_CREDENTIAL' | 'INCOMPLETE_CREDENTIAL' };
// AgentEligibilityService.evaluate(agentId, operation, now)
// returns Promise<EligibilityResult>; database outages throw a service error.
```

- [x] Add failing tests for missing profiles, PENDING/REJECTED/SUSPENDED, expired/missing PRC or DHSUD validity, credential boundary dates, and database outages across each restricted operation.
- [x] Load eligibility from persistent data. Deny absent/incomplete records. Define expiry as the end of the specified validity date in Asia/Manila, rather than browser-local midnight.
- [x] Apply the policy at server mutation boundaries, including lead assignment. Preserve historical records and existing agent visibility needed for self-service remediation.
- [x] Require rejection remarks and suspension reason. Allow PENDING → VERIFIED/REJECTED/SUSPENDED; REJECTED → PENDING/SUSPENDED; VERIFIED → PENDING/SUSPENDED; SUSPENDED → PENDING after an authorized reinstatement. Approval from suspended state requires a fresh review.
- [x] Append an audit event containing actor, target, prior/new states, reason, timestamp, and changed credential fields. Write state and event atomically; ordinary users cannot update/delete history.
- [x] Credential replacement moves verified agents to PENDING and rejected applicants can resubmit to PENDING. Validate completeness and validity at approval. Update the UI actions to reflect allowed transitions.

**Acceptance:** Suspension and expiry consistently block the defined actions. Every decision has durable history. Credentials can be corrected without reusing a consumed invitation.

## Task 7 — Stop false-success responses and remove operational caches

**Modify:** `backend/src/services/agent.service.ts`, `invitation.service.ts`, registration service, agent controller; `frontend/src/services/agentService.js`; agent pages.

**Test:** Backend service/controller tests; frontend service and editor/dossier tests.

- [x] Add failing tests for Supabase returned errors, thrown errors, valid empty results, unknown IDs, and failed approval/edit requests.
- [x] Check every persistence result and remove process-local roster/invitation state from production paths. Use dependency injection for test fixtures.
- [x] Preserve server error classification: 404 missing target, 409 conflicting lifecycle operation, 400 invalid input, 503 unavailable persistence. Do not return a modified object before a confirmed commit.
- [x] Remove frontend mutation fallbacks and mock replacement of valid empty lists. Keep errors visible and fields unchanged; show success only on confirmed server responses:

```js
async updateAgentProfile(id, payload) {
  const response = await apiClient.put(`/agents/${id}`, payload);
  return normalizeAgent(response.data);
  // apiClient rejects failed requests; do not manufacture a saved record.
}
```

- [x] Refetch committed state after a mutation or use the complete returned DTO. Add reload/restart tests for saved profile, verification status, and attachments.

**Acceptance:** Failed saves never display success or navigate away. A real empty roster remains empty. Immediate and subsequent dossiers contain the same documents and state.

## Task 8 — Complete the supported editor contract

**Modify:** `BrokerAgentEdit.jsx`, `BrokerAgentDetail.jsx`, profile schema/service, shared agent contracts, photo upload integration.

**Test:** Existing edit/detail tests and browser acceptance.

- [ ] Add failing tests for all supported field changes, photo replacement/removal, unknown agent, required fields, invalid date, failed save, and unsaved navigation.
- [ ] Support name, phone, bio, avatar, location/territory, experience, and both license numbers/dates. Add the location column through the additive migration. Keep login email and role read-only in this scope.
- [ ] Remove invented banking/tax/birthdate/gender/commission values. Hide or clearly disable unsupported fields and explain their availability without presenting sample data as the agent's record.
- [ ] Connect Change Photo to an authenticated upload with file validation. Use `avatar: null` to remove it; update the Zod contract and DTO to support null. Use an initials placeholder when no photo exists.
- [ ] Use strict date validation and nonnegative integer experience. Preserve explicit zero rather than replacing it with a default. Put field-level validation beside controls and focus the first invalid field.
- [ ] Display missing/not-found/loading failures explicitly, prevent saving an unloaded record, and guard leaving a dirty form. Maintain user input when saving fails.
- [ ] Route credential changes through Task 6's re-review transaction and explain that consequence before submission.

**Acceptance:** Each supported edit survives reload. Unsupported fields cannot imply successful editing. Removing a photo works. Credential changes visibly return the agent to review.

## Task 9 — Replace sample indicators and align invitation actions

**Modify:** Agent service/DTO, `BrokerAgents.jsx`, `BrokerAgentDetail.jsx`, invitation frontend service; create completeness component.

**Test:** Roster/detail/invitation tests and HTTP metric tests.

- [ ] Add failing fixtures for zero agents/invitations, rejected agents, no assigned listings, incomplete credentials, and differing assigned/open/closed record states.
- [ ] Aggregate metrics from actual property, inquiry, appointment, and sale relationships. Use existing schema names confirmed during implementation. Count distinct records to avoid join multiplication; define closed deals and total sales value consistently.
- [ ] Derive roster and dossier listing counts from the same assignment definition. Remove sample-listing substitution and static recent activities; source activities from recorded events.
- [ ] Remove fabricated historical trends/sparklines until a real previous-period dataset exists. Return unavailable values explicitly; do not label missing data as zero.
- [ ] Calculate completeness on the server using the required-item policy. Return `completedRequired`, `totalRequired`, `percent`, and item-specific missing/expired reasons. Optional fields do not affect percent.
- [ ] Map backend `used` to the display label Accepted while filtering on `used`. Represent revoked invitations, remove the forced minimum invited count, and distinguish registered agents from invitation records in chart totals.
- [ ] Implement authorized invitation detail, resend, revoke, and replacement-link actions. After token hashing, a persisted plaintext token is not available for Copy Link: issue a replacement through the authorized rotation operation with an explicit confirmation, or allow copying only the newly issued link from the current response.
- [ ] Make CSV export reflect real filtered data; escape CSV fields and neutralize spreadsheet formula prefixes in user-entered strings.

**Acceptance:** Counts reconcile between roster, dossier, and backend fixtures. Empty/unavailable states are accurate. Accepted/revoked entries have correct actions; View opens meaningful details.

## Task 10 — Validate, document, and prepare a controlled release

**Modify:** `docs/agent-management.md`, existing design specification where it conflicts with approved behavior; create browser/HTTP acceptance tests.

- [ ] Exercise the full workflow through HTTP and browser: authorized invite → logged-out private upload → registration → broker inspection → rejection → applicant correction → approval → permitted listing action → suspension → denied restricted action → reviewed reinstatement.
- [ ] Include unauthorized roles, forged tokens, replay/concurrent submission, expired links/licenses, failed email delivery, database failure, failed saves, private document reads, and empty states. Use an isolated database to validate actual RLS/function grants and race behavior.
- [ ] Keep direct service tests as unit tests; label HTTP/database/browser suites precisely. Do not call controller substitutes full end-to-end evidence.
- [ ] Verify desktop and 375px mobile layouts, keyboard operation, visible focus, modal focus trapping/restoration, accessible control names, error/status announcements, and measured text contrast. Respect reduced motion.
- [ ] Run `npm test` and `npm run build` in backend and frontend. Run the browser suite with the existing local Playwright runner, for example `npx --no-install playwright test e2e/agent-management.spec.js` from frontend after confirming its configuration. Record exact commands, exit codes, counts, and any remaining environment limitations.
- [ ] Update documentation to describe implemented restrictions, recovery behavior, expiry semantics, private upload/read APIs, supported editor fields, metric definitions, audit history, and actual test coverage. Remove unsupported “guarantees.”
- [ ] Prepare an additive migration dry run and a local change review. Verify existing profiles are preserved; do not blanket-mark legacy agents verified. Produce an explicit legacy-credential review queue and impact summary.
- [ ] Prepare rollout order: database functions/policies → backend → frontend → legacy private-file permission remediation → acceptance smoke checks. Deploy only with explicit authorization for the target environment.
- [ ] Define rollback: disable affected mutations and preserve audit/provisioning records; roll back compatible UI/API changes if necessary. Never restore forged-token authentication, privileged public signup, or public credential sharing as a rollback method.

**Release acceptance:** No P0/P1 findings remain; all selected tests execute and pass; fresh build evidence is recorded; private reads and denied role operations are verified in the target staging environment; every editable field and dashboard indicator matches the approved contract.

## Review checkpoints

- [ ] **Before implementation:** Approve the product rules, migration/API scope, brokerage model, and proposed UI behavior.
- [ ] **After security tasks:** Review denied-access evidence and credential privacy checks before proceeding to broad feature completion.
- [ ] **After integrity tasks:** Review concurrency, failure recovery, and reload/restart results.
- [ ] **Before release:** Review the final diff, migration impact, acceptance report, and updated documentation. Separate environment failures from assertion failures.

Each task should finish with a focused local review and, where repository policy and user authorization allow, a local commit. No remote publication is part of this plan.
