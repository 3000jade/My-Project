# Full-Stack Account Profile Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-stack, end-to-end Account Profile Edit subsystem across Data, Backend, Shared Contracts, Frontend, and Verification layers. Modernize Client, Agent, and Broker profile consoles adhering strictly to `design.md` design tokens (`#0F766E` Primary Teal, `#FF6B6B` Coral conversion CTA, `#F8FAFC` Ground, `#FFFFFF` Surface), `shadcn/ui` primitives, and RA 9646 regulatory licensing compliance. Validate all created and modified capabilities using interactive **Playwright MCP E2E browser automation tools** (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_take_screenshot`, `browser_console_messages`).

**Architecture:** Following `AGENTS.md` Section 10 (**Data → Backend → Shared Contracts → Frontend → Integrated Verification**):
1. **Data Layer:** PostgreSQL `public.profiles` schema non-destructive migration ensuring columns for client preferences (`preferred_location`, `investment_budget`) and agent licensing (`prc_license_no`, `dhsud_accreditation_no`, `firm_name`), protected by Row-Level Security (RLS) policies.
2. **Backend Layer:** Express v5 router (`/api/profile`), Zod schema validation (`updateProfileSchema`) with role-tampering defense, `ProfileService` with PostgreSQL and atomic fallback caching, and audit logging on credential changes.
3. **Shared Contracts Layer:** Universal TypeScript interfaces and DTOs in `shared/types/profile.ts` (`UserProfileDTO`, `UpdateProfilePayload`, `ClientPreferencesDTO`, `AgentLicensingDTO`).
4. **Frontend Layer:** Reusable shadcn/ui dialogs (`EditProfileDialog.jsx`, `ChangePasswordDialog.jsx`) implementing loading/empty/error states and Modern SaaS tokens, wired to unified `profileService.js`.
5. **Integrated Verification Layer (Playwright MCP + Vitest):** Backend and frontend TDD unit suites plus live interactive **Playwright MCP browser testing** across Client, Agent, and Broker journeys with DOM snapshots, console log assertion, visual screenshot capture, and persistence checks.

**Tech Stack:** Express v5, TypeScript 5.9+, Supabase PostgreSQL, React 19, Tailwind CSS v4, Radix UI / shadcn/ui, Vitest, Playwright MCP Server.

**Spec References:**
- Architecture: [`ARCHITECTURE_MAP.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/ARCHITECTURE_MAP.md)
- Engineering Rules: [`AGENTS.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/AGENTS.md)
- Design Standard: [`design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/design.md)
- Master SRS: [`docs/REQUIREMENTS_SPECIFICATION.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/REQUIREMENTS_SPECIFICATION.md) (`FR-UM-001` - `FR-UM-004`)
- Master Schema: [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/DATABASE_SCHEMA.md)

---

## 1. Global Constraints & Guardrails

- **Strict Full-Stack Architectural Flow:** Data → Backend → Shared Contracts → Frontend → Integrated Verification.
- **Authorization & Security Invariant:**
  - Enforce authorization at the backend/database boundary. A user may only update their own profile (`auth.uid() = id`).
  - Strict anti-self-elevation: Non-admin users cannot alter their own `role` or `verification_status` via `PUT /api/profile`.
- **Philippine Real Estate Compliance (RESA RA 9646 & DHSUD):**
  - Retain PRC License and DHSUD Accreditation validity checks.
- **Design Tokens (`design.md`):**
  - Primary Brand Teal: `#0F766E` (hover `#115E59`)
  - Secondary Brand Teal: `#14B8A6`
  - High-Impact Conversion Action: Coral `#FF6B6B` with Slate `#1E293B` text (5.27:1 contrast ratio)
  - Canvas Ground: `#F8FAFC`
  - Surface Container: `#FFFFFF` with `1px border border-[#E2E8F0]` and `rounded-xl`
  - Typography: Slate 800 (`#1E293B`) headings, Slate 500 (`#64748B`) muted body text
- **Component States:** Every user interface must handle loading (`Skeleton`), empty/fallback, success (`Toast`/feedback), error (`Alert`), and disabled submission states.
- **E2E Playwright MCP Protocol:** Use live MCP browser automation (`browser_navigate`, `browser_snapshot`, `browser_fill_form`, `browser_click`, `browser_take_screenshot`) to verify interactive behaviors, responsive layouts, and zero-console-error execution.

---

## 2. Environment Readiness Checklist

- [x] Node.js & pnpm runtime available.
- [x] Vitest testing environment installed and functioning.
- [x] Playwright MCP server connected and available (`ServerName: "playwright"`).
- [x] Shared TypeScript compiler (`pnpm tsc --noEmit`) passes cleanly.
- [x] Local frontend server (`http://localhost:5173`) and Express backend (`http://localhost:5000` / `/api`) configured.

---

## 3. Affected Files Directory Map

```text
CP_kerby/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── user_profiles_preferences_migration.sql   # [NEW] Non-destructive DB migration
│   │   ├── schemas/
│   │   │   └── profile.schema.ts                        # [MODIFY] Client preferences & anti-tampering
│   │   ├── services/
│   │   │   └── profile.service.ts                       # [MODIFY] Persistence for client/agent/broker
│   │   ├── controllers/
│   │   │   └── profile.controller.ts                    # [MODIFY] Full-stack error envelopes & validation
│   │   └── routes/
│   │       └── profile.routes.ts                        # [MODIFY] Authenticated PUT / GET routes
│   └── test files/
│       └── backend/
│           └── controllers/profile.controller.test.ts   # [NEW] Backend profile integration suite
├── shared/
│   └── types/
│       ├── profile.ts                                   # [NEW] Full-stack TypeScript contracts & DTOs
│       └── index.ts                                     # [MODIFY] Re-export profile types
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── profile/
│   │   │       ├── EditProfileDialog.jsx                # [NEW] Accessible shadcn modal for profile editing
│   │   │       ├── ChangePasswordDialog.jsx             # [NEW] Dedicated password security dialog
│   │   │       └── index.js                             # [NEW] Barrel exports
│   │   ├── services/
│   │   │   ├── profileService.js                        # [MODIFY] Unified API client for all roles
│   │   │   └── clientUserService.js                     # [MODIFY] Bridges to backend /api/profile
│   │   └── pages/
│   │       └── portals/
│   │           ├── client/
│   │           │   ├── ClientProfile.jsx                # [MODIFY] Modernized with design.md & shadcn
│   │           │   └── ClientPortalPages.test.jsx       # [MODIFY] Updated test coverage
│   │           ├── agent/
│   │           │   ├── AgentProfile.jsx                 # [MODIFY] Modernized with design.md & shadcn
│   │           │   └── AgentProfile.test.jsx            # [NEW] Unit test suite
│   │           └── broker/
│   │               ├── BrokerProfile.jsx                # [MODIFY] Modernized with design.md & shadcn
│   │               └── BrokerProfile.test.jsx           # [NEW] Unit test suite
├── tests/
│   └── e2e/
│       └── account-profile-fullstack.spec.ts            # [NEW] Playwright test script
└── docs/
    ├── DATABASE_SCHEMA.md                               # [MODIFY] Document new profile columns & RLS
    └── REQUIREMENTS_SPECIFICATION.md                    # [MODIFY] Update FR-UM revision records
```

---

## 4. Phase 1: Data Layer (PostgreSQL & RLS Policies)

### Task 1.1: Database Schema Non-Destructive Migration & Constraints

**Files:**
- Create: `backend/src/models/user_profiles_preferences_migration.sql`
- Modify: `docs/DATABASE_SCHEMA.md`

- [ ] **Step 1: Create SQL Migration Script**
  Add non-destructive column additions to `public.profiles`:
  ```sql
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS preferred_location TEXT,
    ADD COLUMN IF NOT EXISTS investment_budget TEXT,
    ADD COLUMN IF NOT EXISTS firm_name TEXT,
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "priceDrops": true}'::jsonb;
  ```
- [ ] **Step 2: Define and Enforce Row-Level Security (RLS)**
  ```sql
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR is_admin())
    WITH CHECK (auth.uid() = id OR is_admin());
  ```
- [ ] **Step 3: Update `docs/DATABASE_SCHEMA.md`**
  Record `preferred_location`, `investment_budget`, `firm_name`, and `notification_preferences` under Section 3 (Module 01 Table `public.profiles`) and Section 5 (Migration Index).

---

## 5. Phase 2: Backend API & Validation Layer

### Task 2.1: Zod Schema & Anti-Tampering Validation

**Files:**
- Modify: `backend/src/schemas/profile.schema.ts`
- Create: `test files/backend/controllers/profile.controller.test.ts`

- [ ] **Step 1: Write failing backend integration test in `profile.controller.test.ts`**
  - Test `GET /api/profile` returns current user profile with all fields.
  - Test `PUT /api/profile` updates contact information and client preferences.
  - Test anti-tampering: Passing `role: 'admin'` or `verification_status: 'VERIFIED'` from a client/agent session is rejected or sanitized.
- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm vitest run "test files/backend/controllers/profile.controller.test.ts"`
- [ ] **Step 3: Update `profile.schema.ts`**
  Add `preferred_location`, `investment_budget`, `notification_preferences` to `updateProfileSchema`. Enforce strict input sanitization.
- [ ] **Step 4: Update `profile.service.ts` & `profile.controller.ts`**
  - Implement full database upsert in `ProfileService.updateProfile` matching the updated schema.
  - Ensure regular users cannot modify `role` or `verification_status`.
  - Maintain in-memory / disk snapshot synchronization for offline/dev resilience.
- [ ] **Step 5: Run backend tests to confirm passing**
  Run: `pnpm vitest run "test files/backend/controllers/profile.controller.test.ts"`

---

## 6. Phase 3: Shared Contracts Layer

### Task 3.1: Universal TypeScript Interfaces & DTOs

**Files:**
- Create: `shared/types/profile.ts`
- Modify: `shared/types/index.ts`

- [ ] **Step 1: Define TypeScript contracts in `shared/types/profile.ts`**
  Define `UserProfileDTO`, `UpdateProfilePayload`, `NotificationPreferences`, `ClientPreferencesDTO`, `AgentLicensingDTO`.
- [ ] **Step 2: Export from `shared/types/index.ts`**
- [ ] **Step 3: Verify TypeScript compiler**
  Run: `pnpm tsc --noEmit` (Must return exit code 0).

---

## 7. Phase 4: Frontend Presentation Layer (`design.md` & `shadcn/ui`)

### Task 4.1: Reusable `EditProfileDialog` & `ChangePasswordDialog` Components

**Files:**
- Create: `frontend/src/components/profile/EditProfileDialog.jsx`
- Create: `frontend/src/components/profile/ChangePasswordDialog.jsx`
- Create: `frontend/src/components/profile/EditProfileDialog.test.jsx`
- Create: `frontend/src/components/profile/index.js`

- [ ] **Step 1: Write failing component test for `EditProfileDialog.test.jsx`**
  - Verify modal opens/closes cleanly.
  - Verify render of form fields with labels and pre-filled data.
  - Verify Coral `#FF6B6B` button (`variant="coral"`) triggers `onSave` with payload.
- [ ] **Step 2: Run test to confirm failure**
  Run: `pnpm vitest run frontend/src/components/profile/EditProfileDialog.test.jsx`
- [ ] **Step 3: Implement `EditProfileDialog.jsx`**
  - Compose using shadcn `@/components/ui/dialog`, `Input`, `Label`, `Textarea`, `Button`.
  - Apply `design.md` tokens: `#0F766E` focus rings, `#FF6B6B` primary save button with `#1E293B` text, `#E2E8F0` borders.
  - Handle loading spinner (`saving`), field error messages, and disabled button state during in-flight requests.
- [ ] **Step 4: Implement `ChangePasswordDialog.jsx`**
- [ ] **Step 5: Verify unit tests pass**
  Run: `pnpm vitest run frontend/src/components/profile/EditProfileDialog.test.jsx`

### Task 4.2: Client Portal Profile Modernization (`ClientProfile.jsx`)

**Files:**
- Modify: `frontend/src/services/clientUserService.js`
- Modify: `frontend/src/pages/portals/client/ClientProfile.jsx`
- Modify: `frontend/src/pages/portals/client/ClientPortalPages.test.jsx`

- [ ] **Step 1: Update `clientUserService.js`**
  Bridge `getClientProfile` and `updateClientProfile` to `apiClient.get('/profile?role=client')` and `apiClient.put('/profile?role=client')`.
- [ ] **Step 2: Refactor `ClientProfile.jsx`**
  - Modernize layout using shadcn `Card`, `Badge`, and `Button`.
  - Connect `EditProfileDialog` for contact info and investment preferences (`preferredLocation`, `investmentBudget`).
  - Connect `ChangePasswordDialog` for in-situ credential update.
- [ ] **Step 3: Verify client unit tests pass**
  Run: `pnpm vitest run frontend/src/pages/portals/client/ClientPortalPages.test.jsx`

### Task 4.3: Sales Agent Portal Profile Modernization (`AgentProfile.jsx`)

**Files:**
- Modify: `frontend/src/pages/portals/agent/AgentProfile.jsx`
- Create: `frontend/src/pages/portals/agent/AgentProfile.test.jsx`

- [ ] **Step 1: Write failing test in `AgentProfile.test.jsx`**
  - Verify rendering of agent data, institutional authority badge, completeness bar, and PRC/DHSUD accreditation cards.
- [ ] **Step 2: Refactor `AgentProfile.jsx`**
  - Replace bespoke modal with `EditProfileDialog`.
  - Style with `design.md` tokens: Spruce Teal `#0F766E` header accents, Emerald `#10B981` status badges.
  - Connect PRC License No., PRC Validity, DHSUD Accreditation No., DHSUD Validity, Years of Experience, Bio.
- [ ] **Step 3: Verify agent unit tests pass**
  Run: `pnpm vitest run frontend/src/pages/portals/agent/AgentProfile.test.jsx`

### Task 4.4: Broker Portal Profile Modernization (`BrokerProfile.jsx`)

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProfile.jsx`
- Create: `frontend/src/pages/portals/broker/BrokerProfile.test.jsx`

- [ ] **Step 1: Refactor `BrokerProfile.jsx`**
  - Upgrade with shadcn `Card`, `Button` (`variant="coral"` for Edit CTA), and `EditProfileDialog`.
- [ ] **Step 2: Verify broker unit tests pass**
  Run: `pnpm vitest run frontend/src/pages/portals/broker/BrokerProfile.test.jsx`

---

## 8. Phase 5: Live Interactive E2E Verification via Playwright MCP

In accordance with user requirement and **AGENTS.md Section 11**, execute live interactive end-to-end verification of all created and modified profile functions using the **Playwright MCP Server tools**.

### Task 5.1: Live Playwright MCP Client Profile Verification

- [ ] **Step 1: Navigate to Client Profile in browser**
  - Call `call_mcp_tool(ServerName: "playwright", ToolName: "browser_navigate", Arguments: { url: "http://localhost:5173/portal/client/profile" })`
  - Call `browser_snapshot()` to assert presence of User Name, Email, Phone, Preferred Location, and Investment Budget cards.
- [ ] **Step 2: Open and interact with `EditProfileDialog`**
  - Call `browser_click(selector: "button:has-text('Edit Profile')")`
  - Call `browser_snapshot()` to verify modal visibility and form field focus.
  - Call `browser_fill_form` with updated data:
    ```json
    {
      "elements": [
        {"selector": "input[name='phone']", "value": "+63 917 888 9900"},
        {"selector": "input[name='preferredLocation']", "value": "Ayala Alabang & Makati CBD"},
        {"selector": "input[name='investmentBudget']", "value": "₱80,000,000 - ₱150,000,000"}
      ]
    }
    ```
- [ ] **Step 3: Submit and capture visual proof**
  - Call `browser_click(selector: "button:has-text('Save Changes')")` (Coral button).
  - Call `browser_take_screenshot(filename: "client-profile-updated.png")` to verify visual tokens, Coral styling, and toast feedback.
- [ ] **Step 4: Verify persistence after reload**
  - Call `browser_navigate(url: "http://localhost:5173/portal/client/profile")`
  - Call `browser_snapshot()` to confirm new phone and investment budget persist after full page refresh.
- [ ] **Step 5: Verify zero console errors**
  - Call `browser_console_messages()` to ensure no uncaught React exceptions or hydration mismatches.

### Task 5.2: Live Playwright MCP Sales Agent Profile & Licensing Verification

- [ ] **Step 1: Navigate to Agent Profile in browser**
  - Call `browser_navigate(url: "http://localhost:5173/portal/agent/profile")`
  - Call `browser_snapshot()` to verify completeness progress bar, institutional authority badge, and PRC/DHSUD cards.
- [ ] **Step 2: Edit PRC and DHSUD Credentials**
  - Call `browser_click(selector: "button:has-text('Edit Profile')")`
  - Call `browser_fill_form` updating `prc_license_no` to `"PRC-REB-0039912"` and `bio` to `"Premier luxury estate specialist."`
  - Call `browser_click(selector: "button:has-text('Save Changes')")`
- [ ] **Step 3: Visual & Persistence Verification**
  - Call `browser_take_screenshot(filename: "agent-profile-updated.png")`
  - Call `browser_navigate(url: "http://localhost:5173/portal/agent/profile")`
  - Call `browser_snapshot()` to assert updated PRC license and bio persist.

### Task 5.3: Live Playwright MCP Broker Profile Verification

- [ ] **Step 1: Navigate to Broker Profile in browser**
  - Call `browser_navigate(url: "http://localhost:5173/portal/broker/profile")`
  - Call `browser_snapshot()` to verify broker credentials and firm name.
- [ ] **Step 2: Edit Firm Name & Contact**
  - Call `browser_click(selector: "button:has-text('Edit Profile')")`
  - Call `browser_fill_form` with updated `firm_name`: `"Precision Trust Luxury Estates Group"`.
  - Call `browser_click(selector: "button:has-text('Save Changes')")`
- [ ] **Step 3: Visual & Persistence Verification**
  - Call `browser_take_screenshot(filename: "broker-profile-updated.png")`
  - Call `browser_navigate(url: "http://localhost:5173/portal/broker/profile")`
  - Call `browser_snapshot()` to confirm persistence.

### Task 5.4: Automated Test Scripts & Build Checks

- [ ] **Step 1: Run all Vitest suites**
  Run: `pnpm test`
- [ ] **Step 2: Run headless Playwright test suite**
  Run: `pnpm exec playwright test tests/e2e/account-profile-fullstack.spec.ts`
- [ ] **Step 3: Execute TypeScript and Vite build verification**
  Run: `pnpm tsc --noEmit && pnpm run build`

---

## 9. Master Documentation & Requirements Maintenance

**Files:**
- Modify: `docs/REQUIREMENTS_SPECIFICATION.md`
- Modify: `docs/DATABASE_SCHEMA.md`
- Modify: `docs/modules/01-user-management/INDEX.md`
- Create: `docs/modules/01-user-management/2026-10-28-account-profile-fullstack-implementation.md`

- [ ] **Step 1: Update `docs/REQUIREMENTS_SPECIFICATION.md`**
  Update Revision History to document full-stack account profile edit capabilities.
- [ ] **Step 2: Update `docs/DATABASE_SCHEMA.md`**
  Record migration file, new columns on `public.profiles`, and RLS policy in the registry.
- [ ] **Step 3: Document dated module log in `docs/modules/01-user-management/`**
  Create `2026-10-28-account-profile-fullstack-implementation.md` with YAML frontmatter, embedding Playwright MCP test evidence and screenshots, and register in `INDEX.md`.

---

## 10. Explicit Approval Boundaries

In accordance with **AGENTS.md Section 9 (Conditional Autonomy and Approval)**:

| Item | Approval Status | Description / Impact |
| :--- | :---: | :--- |
| **Database Changes** | **AWAITING APPROVAL** | Non-destructive column additions to `public.profiles` (`preferred_location`, `investment_budget`, `firm_name`, `notification_preferences`) and RLS policy verification. |
| **Backend & Shared Contracts** | **APPROVED SCOPE** | Enforces ownership rule (`auth.uid() = id OR is_admin()`) with anti-self-elevation and type contracts. |
| **Frontend UI/UX** | **APPROVED SCOPE** | Refactors existing portals using approved `design.md` tokens and shadcn/ui primitives. |
| **Playwright MCP Verification** | **APPROVED SCOPE** | Live interactive browser testing and visual screenshot generation. |
