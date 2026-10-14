---
id: "page-<slug>"
page: "<Exact page name>"
module: "<Module name>"
status: "draft" # draft | validated | approved | implemented
scope: "single-page"
design_reference: "design.md"
schema_references: [] # Populate using verified actual file paths
implementation_references: [] # Populate using verified actual file paths
last_validated: null # Set date only after actual inspection
---

# <Page Name> | Page-Specific Mockdown Specification

> **Purpose:** Describe one page's supported data, approved features, UI layout, actions, and acceptance criteria. This is a *specification*, not permission to edit the application.
>
> **Mandatory sequence:** INSPECT → VALIDATE → PROPOSE → APPROVAL → WRITE/UPDATE PAGE SPEC → VERIFY. Application implementation requires its own explicit approval.
>
> **Global references:** Follow `design.md` for the Soft Minimalist SaaS theme and the project's existing agent rules (e.g. `AGENTS.md`, if present). Do not duplicate global design tokens here.

## 1. Context

| Attribute | Value |
|---|---|
| Page | `<Page name>` |
| Goal | `<What the user accomplishes>` |
| Authorized roles | `<Verified roles and permissions; otherwise NOT VERIFIED>` |
| Existing route | `<Verified path; otherwise NOT VERIFIED>` |
| Existing component | `<Verified file path; otherwise NOT VERIFIED>` |
| Related pages | `<Links by navigation only, not additional scope>` |

**User task:** `<One-sentence job-to-be-done>`

## 2. Schema & Implementation Validation

**Evidence requirements:** Inspect actual database schema/migrations or generated DB types, application validation schemas, API/controller/service code, frontend components, and authorization policies where available. A Zod field alone proves only validation-schema definition, **not** database persistence or API support.

| Feature / data | Exact source path + field / function | Evidence level | Notes / gaps |
|---|---|---|---|
| `<Field or feature>` | `<Path and symbol or NOT VERIFIED>` | `VERIFIED / PARTIAL / PROPOSED / NOT VERIFIED` | `<Limitations>` |

**Data contract**
- Data source: `<Verified endpoint/query/service; otherwise NOT VERIFIED>`
- Data shape: `<Exact response fields/types; otherwise NOT VERIFIED>`
- Pagination/count source: `<Verified contract; otherwise NOT VERIFIED>`
- Authorization: `<Verified rule/policy; otherwise NOT VERIFIED>`
- Source of truth for conflicting fields: `<Document decision or unresolved>`

**Open validation gaps:**
- [ ] `<Missing evidence>`

**Status meanings:**
- **VERIFIED:** Confirmed in relevant inspected source(s), with evidence.
- **PARTIAL:** Supporting definition exists, but integration or behavior is unconfirmed.
- **PROPOSED:** Desired feature, not approved or implemented.
- **NOT VERIFIED:** Not enough evidence; do not assume support.

## 3. Feature Scope

**In scope (page only):**
- `<Verified or approved page capability>`

**Out of scope:**
- Unrelated pages, modules, database migrations, authentication changes, business-logic changes, and new features not separately approved.

**Dependencies / proposed changes requiring approval:**
- `<Required dependency and its impact; or None identified>`

**No mock data:** Never create dummy records, fake counts, pretend API responses, or fabricated agents/prices/statuses. Empty-state designs may use generic instructional text only. Dynamic figures must come from verified real queries.

## 4. Layout & Visual Structure

Describe structure, **not imaginary data**. Use the global `design.md` tokens and reusable components.

| Region | Contents | Desktop behavior | Mobile behavior |
|---|---|---|---|
| Header | `<Title, description, verified actions>` | `<Alignment>` | `<Stack/wrap>` |
| Primary area | `<Table/form/details>` | `<Grid/layout>` | `<Adaptation>` |
| Secondary area | `<Only when needed>` | `<Placement>` | `<Placement or hidden if safe>` |
| Footer | `<Pagination/actions when supported>` | `<Placement>` | `<Placement>` |

**Design notes:** Soft Minimalist SaaS, restrained teal/coral, off-white canvas, white surfaces, subtle borders, comfortable 8px-based spacing, 8px standard radius, Inter typography, accessible contrast. Use existing project breakpoints when possible.

## 5. Components, Fields & Actions

### Page components
| Component | Purpose | Existing/reusable component | Evidence / state |
|---|---|---|---|
| `<Name>` | `<Purpose>` | `<Verified path or TBD>` | `<VERIFIED etc.>` |

### Fields (if this page contains inputs)
| Label | Exact schema path | Type/control | Required? | Validation / conditional rule | Support |
|---|---|---|---|---|---|
| `<Label>` | `<Exact path>` | `<Input>` | `<Per existing schema; distinguish UI proposals>` | `<Existing rule>` | `<Status>` |

### Buttons and actions
| Label | User action | Existing handler/route | Permission / disabled condition | Feedback | Support |
|---|---|---|---|---|---|
| `<Button>` | `<Behavior>` | `<Verified path or NOT VERIFIED>` | `<Rule>` | `<Loading/success/error>` | `<Status>` |

**Rule:** Do not add an action button merely because it looks useful. Every visible control must have a defined and authorized behavior, or be explicitly identified as a proposed (nonfunctional) design element during review.

## 6. UX Behavior & Page States

- **Initial/load:** `<How real data is requested; loading/skeleton behavior>`
- **Empty:** `<Truthful message and only supported actions>`
- **No search results:** `<Filter reset if supported>`
- **Error:** `<Readable message, recovery/retry if supported>`
- **Success:** `<Accurate confirmation after server success>`
- **Input validation:** `<Existing rules; server validation remains authoritative>`
- **Navigation / unsaved state:** `<Existing behavior or proposal>`
- **Keyboard/accessibility:** `<Labels, logical order, focus states, relevant WCAG 2.2 AA checks>`
- **Responsive:** `<Desktop/tablet/mobile behavior and overflow handling>`
- **Security/privacy:** `<Only authorized users; no confidential information in public views>`

Only describe supported behavior as active. Label unsupported behavior **PROPOSED**.

## 7. Acceptance Criteria & Verification

### Specification checks
- [ ] Exactly one page is documented; no unrelated page requirements.
- [ ] Referenced code paths and symbols were verified; unknowns are explicitly labeled.
- [ ] Database, Zod, API, and UI evidence are distinguished.
- [ ] Every field has a traceable source or PROPOSED status.
- [ ] Every visible action has a defined outcome and permission rule.
- [ ] No mock data, fake counters, or fabricated examples are mandated.
- [ ] Global design standards are referenced instead of duplicated.
- [ ] Any conflicts and necessary migrations are identified but not silently implemented.
- [ ] Page-spec creation or update was approved before writing this file.

### Implementation checks (only after separate approval)
- [ ] UI uses existing shared components where suitable.
- [ ] Real data retrieval, empty, loading, success, and error cases were exercised.
- [ ] Existing routes, access rules, business logic, and other pages remain intact.
- [ ] Responsive and keyboard interactions were tested where possible.
- [ ] Available lint/typecheck/build/tests run; failures/unrun checks reported accurately.
- [ ] Changed files and rollback approach documented.

### Required approval handoff
Before writing/updating this page file, present: (1) evidence inventory, (2) feature support matrix, (3) proposed layout and controls, (4) exact affected documentation files, (5) unresolved gaps and risks. **STOP and request approval.** After the document is approved and verified, obtain a **separate explicit approval** before implementing application changes.

**Validation outcome:** `<PENDING / PARTIAL / VERIFIED>`
**Approved by:** `<User approval reference or PENDING>`
**Implementation status:** `<NOT STARTED / APPROVED / IN PROGRESS / VERIFIED>`
