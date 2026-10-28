# Antigravity AI Agent Development Workflow

## 1. Purpose and Workflow

Use specification-led development for new modules, new features, enhancements, bug fixes, and design updates.

**Inspect → Check Readiness → /grill-me → Specify → /plan → Approve When Required → Implement → Verify → Document → Deliver Locally**

Scale the process to the task. Preserve existing user work and functionality outside the approved scope.

## 2. Task Classification

| Task | Required approach |
|---|---|
| New module | Module specification, full-stack plan, implementation, and verification |
| New feature | Feature requirements within the existing module, implementation, and regression verification |
| Enhancement | Define changed behavior and compatibility requirements |
| Bug fix | Reproduce, diagnose, fix, and verify against regression |
| Design update | Apply `design.md` and verify visual and interaction behavior |
| Specification only | Deliver requirements and applicable architecture documentation without implementation |

Every new module or feature requires `/grill-me` and `/plan`.

Small fixes may proceed without the feature interview and planning commands unless ambiguous, substantial, or crossing an approval boundary.

## 3. Inspect Before Editing

Read the applicable sources:

- Project and directory-level agent instructions.
- `ARCHITECTURE_MAP.md`.
- `docs/REQUIREMENTS_SPECIFICATION.md` (Master Living Requirements).
- `docs/DATABASE_SCHEMA.md` (Master Living Schema & RLS Registry).
- Relevant module `INDEX.md`, current specification, and latest change records.
- Existing implementation, shared components, services, and contracts.
- Authentication, authorization, validation, and data-access rules.
- Project configuration, scripts, and tests.
- Repository status and pre-existing changes.

Identify confirmed facts, assumptions, dependencies, and unresolved decisions.

Never reset, overwrite, or discard unrelated user work.

## 4. Required Guidance, Commands, and Skills

Select guidance based on the actual requirements.

| Requirement | Required resource |
|---|---|
| Every new module or feature | `/grill-me` and `/plan` |
| UI, layout, styling, or interaction changes | `design.md` |
| TypeScript implementation or refactoring | Configured TypeScript skill |
| Supabase functionality | Supabase skill |
| PostgreSQL schema, queries, or performance | Supabase PostgreSQL best-practices skill |
| Browser verification | Playwright and applicable configured testing guidance |

Discover the actual installed commands and skill locations. Read applicable skill instructions before dependent work.

Do not assume a command exists, invent an invocation, or claim a command ran when it did not.

**Strict prerequisite:** If a required command or skill is unavailable, stop all task work, report what is missing, and wait until it is available. Do not substitute an equivalent process.

A skill is required only when relevant to the task.

## 5. Environment Readiness

Before implementation, confirm that required verification can run. Include the readiness findings in `/plan`.

Check applicable prerequisites:

- Dependencies and project scripts.
- Local application services.
- Local database and migration tooling.
- Test accounts for relevant roles.
- Controlled test data.
- Playwright browser installation and configuration.
- Required environment configuration, without exposing secrets.

**If required verification cannot run, stop all task work.** Report the blocker, the prerequisite needed, and the current task status. Wait until the environment is ready.

Do not bypass required checks or mark the work complete.

Distinguish an unavailable check from an executable check that reports a failure. Executable failures enter diagnosis and repair.

For specification-only tasks, apply readiness and verification requirements to the document deliverable; runtime tests are not required unless part of the requested scope.

## 6. Requirements Interview: `/grill-me`

Use `/grill-me` for every new module or feature. Scale interview depth to uncertainty.

- Clear feature: briefly confirm assumptions and acceptance criteria.
- Complex feature: examine workflows, edge cases, dependencies, and tradeoffs.
- Small fix: interview only when ambiguity requires it.

Inspect the project before asking questions that existing code or documentation can answer.

Resolve consequential decisions before finalizing the plan:

- Business rules and status transitions.
- Roles and permissions.
- Data ownership and visibility.
- Scope and exclusions.
- Acceptance criteria.

Do not silently infer consequential product decisions.

Record minor assumptions and decide routine implementation details independently. Avoid repeating questions already answered.

## 7. Specifications

Use these references where applicable:

- ISO/IEC/IEEE 29148:2018 — requirements engineering.
- ISO/IEC/IEEE 42010:2022 — architecture descriptions.
- ISO/IEC 25010:2023 — product-quality requirements.

Describe documentation as standards-aligned unless conformance has been assessed.

### New Module

Specify:

- Purpose, scope, exclusions, stakeholders, and roles.
- Functional requirements and user journeys.
- Business rules and permissions.
- Data requirements and external interfaces.
- UI behavior and applicable design constraints.
- Measurable quality requirements.
- Dependencies and cross-module effects.
- Acceptance criteria and verification methods.
- Assumptions and unresolved decisions.

### Feature in an Existing Module

Read the current module specification first.

Specify:

- Existing behavior and proposed behavior.
- Added, changed, or superseded requirements.
- Affected roles and user journeys.
- Data, API, UI, and business-rule changes.
- Compatibility with existing records and consumers.
- Cross-module effects.
- Acceptance criteria and regression scenarios.
- Migration or rollout needs.

Small additions update the module specification directly. Substantial features also receive a separate feature specification.

Reference unchanged requirements rather than duplicating them. Preserve existing requirement IDs.

### Master Requirements Maintenance (`docs/REQUIREMENTS_SPECIFICATION.md`)

Whenever requirements are added, updated, or deprecated:
1. **Assign Sequential ID:** Use standard prefixes (`FR-<MODULE>-XXX` for functional, `NFR-<CATEGORY>-XXX` for non-functional).
2. **Update Status:** Keep the requirement lifecycle current (`Planned` → `In Progress` → `Implemented` / `Active`).
3. **Record Revision:** Add an entry to Section 1 (Revision History) in `docs/REQUIREMENTS_SPECIFICATION.md` summarizing the addition or change.
4. **Preserve IDs:** Never delete or reassign existing IDs to maintain audit traceability.

Maintain traceability:

**Requirement → Acceptance criterion → Test or verification evidence**

## 8. Implementation Planning: `/plan`

After resolving consequential requirements, use `/plan` to produce an actionable plan.

Include:

- Intended outcome and task scope.
- Applicable guidance and skills.
- Requirements and acceptance criteria.
- Affected files or implementation areas.
- Frontend, backend, contracts, and data changes.
- Permissions and cross-module effects.
- Ordered implementation steps.
- Verification commands and Playwright scenarios.
- Environment readiness and existing failures requiring repair.
- Risks, assumptions, and rollback approach.
- Explicit approval boundaries.

Present the plan before implementation.

For specification-only tasks, plan and deliver the documentation work without implementing application code or applying database changes.

## 9. Conditional Autonomy and Approval

Proceed after presenting the plan when requirements are settled and no approval boundary is crossed.

Wait for explicit approval when the implementation plan includes:

- Database changes.
- Permission changes.
- Breaking API changes.
- Work beyond the user's requested scope.

Itemize each approval-requiring change and its effect. Preparing a specification or proposal does not authorize executing the proposed changes.

Once approved, implement and test the agreed local changes without repeatedly requesting permission.

### Database Boundary

Present schema, migration, constraint, access-policy, and other database changes in the plan.

After approval, implement and test locally.

Applying migrations to shared or production environments requires separate explicit approval. Approval of a local implementation plan does not authorize remote migration execution.

### Design Boundary

Apply `design.md` to relevant work.

For this workflow, the conditional approval rules in this section replace blanket requirements to obtain approval before every visual edit. Preserve all applicable design standards and functional protections.

## 10. Full-Stack Implementation

Follow `ARCHITECTURE_MAP.md` and existing project conventions.

Implement complete working capabilities through the necessary layers:

**Data → Backend → Shared Contracts → Frontend → Integrated Verification**

For each capability:

1. Define acceptance checks.
2. Add a failing behavior test where applicable.
3. Implement data constraints and access policies.
4. Implement server-side validation, authorization, and business rules.
5. Define or update shared TypeScript contracts.
6. Connect existing frontend services and reusable components.
7. Handle applicable loading, empty, success, error, and disabled states.
8. Verify the integrated behavior.

Enforce authorization at the backend or database boundary. UI visibility alone is insufficient.

Avoid unnecessary dependencies and unrelated refactoring.

## 11. Verification

Run applicable project checks:

- Type checking.
- Linting.
- Unit tests.
- API and integration tests.
- Database and access-policy tests.
- Build.
- Playwright E2E tests.

### UI Features

Use Playwright to verify:

- The main user journey.
- Relevant input validation.
- Role-specific access.
- Persistence after reload.
- Applicable failure and recovery behavior.
- Relevant desktop and mobile layouts.
- Related existing journeys.

Prefer accessible role and label locators, observable assertions, and automatic waiting over fixed delays.

Use controlled accounts and test data. Retain useful failure traces or screenshots.

### Backend-Only Changes

Use API, integration, database, and authorization tests as appropriate.

Run related E2E tests when user journeys could be affected.

### Design Changes

Verify applicable `design.md` requirements, including responsive layout, keyboard access, focus visibility, contrast, feedback, and visual consistency.

Capture before-and-after screenshots where available.

### Existing Failures

Record existing failures and include their repair in the plan.

If repair expands the requested scope, obtain approval before proceeding with that expansion.

Do not conceal existing failures or report failed checks as passed. If required checks cannot execute, follow the stop-all-work rule.

Record verification results as passed, failed, skipped, or unavailable. Skipped or unavailable required checks do not satisfy completion.

## 12. Documentation

Maintain documentation under:

`docs/modules/<module>/`

Keep:

- `INDEX.md` as the module entry point.
- A clearly identified current module specification.
- Separate specifications for substantial features.
- Dated implementation and verification records.

Dated change records must include YAML frontmatter:

- `module`
- `date`
- `status`
- `affected_files`

After implementation:

1. Update the module specification to describe delivered behavior.
2. Record changed contracts, permissions, data, and dependencies.
3. Link requirements to verification evidence.
4. Record approved scope changes and remaining limitations.
5. Register documents in `INDEX.md`.

### Master Living Documents Maintenance

In addition to module-level documentation under `docs/modules/<module>/`:

1. **Schema Updates (`docs/DATABASE_SCHEMA.md`):**
   - Whenever any database table, column, constraint, foreign key, index, trigger, function, or RLS policy is created, modified, or migrated:
     - Update the target table in Section 3 of `docs/DATABASE_SCHEMA.md`.
     - Update the RLS Policy Registry in Section 4 and Migration Index in Section 5.
     - Add a record to the Schema Revision History in Section 1.

2. **Requirements Updates (`docs/REQUIREMENTS_SPECIFICATION.md`):**
   - Whenever new features, business rules, or non-functional constraints (security, performance, usability) are created or changed:
     - Add or edit the corresponding row in the Functional (FR) or Non-Functional (NFR) requirements table.
     - Add a record to the SRS Revision History in Section 1.

For cross-module features, maintain one primary specification and link it from each affected module.

## 13. Completion: Verified Local Delivery

A development task is complete when:

- Implementation meets the agreed requirements.
- Required tests and checks pass.
- Existing failures included in the agreed scope are resolved.
- `docs/DATABASE_SCHEMA.md` is updated if any schema, table, RLS, or migration changed.
- `docs/REQUIREMENTS_SPECIFICATION.md` is updated if any functional or non-functional behavior changed.
- Module specifications, dated change records, and `INDEX.md` are updated.
- Verification evidence is recorded.
- Final changes and repository status have been reviewed.

Do not declare completion while required verification is unavailable or acceptance criteria remain unmet.

Deliver a concise report containing:

**Delivered behavior → Changes → Verification evidence → Limitations**

Use clear task statuses:

- **Complete — verified locally:** Implementation, required checks, and documentation are finished.
- **Blocked — environment unavailable:** Required verification cannot run; all task work stops.
- **Blocked — required command or skill unavailable:** A strict prerequisite is missing; all task work stops.
- **Awaiting approval:** A change crosses an approval boundary.
- **Incomplete — verification failed:** Checks ran and found unresolved failures.

Local delivery does not require deployment or a further acceptance gate.

For specification-only tasks, completion means the requested specification is delivered, consequential decisions are resolved, and its requirements and traceability have been reviewed. Do not claim implementation or runtime verification.

Pushing, publishing branches, applying shared or production migrations, and deploying require explicit user authorization.
