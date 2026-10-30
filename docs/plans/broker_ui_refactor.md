# Plan: Broker Portal UI/UX Refactor

**Goal**
- Refactor all broker‑portal UI components (`frontend/src/pages/portals/broker/*.jsx`) to use the latest **shadcn‑ui** version, adopt new components, and apply the project’s Modern SaaS design tokens (Teal #0F766E, Coral #FF6B6B).
- Implement a **single‑column responsive layout with cards**, dark‑mode support, and WCAG AA‑compliant accessibility.
- Introduce new interaction patterns: **modal dialogs, drawers, toast notifications, and inline editing**.
- Deliver immediate full deployment to all broker users.

---

## Required Skills & Tools
- **shadcn‑ui** (skill) – upgrade package, review component library.
- **tailwind‑design‑system** (skill) – ensure tokens are applied.
- **playwright** (MCP) – update/extend E2E tests for broker pages.
- **axe‑core** (npm package) – run accessibility audit.
- **visual‑regression** tooling (e.g., `@percy/cli` or `chromatic`).
- **verification‑before‑completion** (skill) – enforce running checks before claiming completion.
- **npm / yarn** – package management.
- **git** – version control.

---

## Affected Files (excluding tests)
```
frontend/src/pages/portals/broker/BrokerAgentDetail.jsx
frontend/src/pages/portals/broker/BrokerAgentEdit.jsx
frontend/src/pages/portals/broker/BrokerAgents.jsx
frontend/src/pages/portals/broker/BrokerAppointments.jsx
frontend/src/pages/portals/broker/BrokerAudit.jsx
frontend/src/pages/portals/broker/BrokerCreateListings.jsx
frontend/src/pages/portals/broker/BrokerDashboard.jsx
frontend/src/pages/portals/broker/BrokerInquiries.jsx
frontend/src/pages/portals/broker/BrokerInquiryDetail.jsx
frontend/src/pages/portals/broker/BrokerInviteAgent.jsx
frontend/src/pages/portals/broker/BrokerNotifications.jsx
frontend/src/pages/portals/broker/BrokerProfile.jsx
frontend/src/pages/portals/broker/BrokerProperties.jsx
frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx
frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.jsx
frontend/src/pages/portals/broker/BrokerReports.jsx
frontend/src/pages/portals/broker/BrokerSales.jsx
```

---

## Implementation Steps
1. **Upgrade shadcn‑ui**
   - `npm install @shadcn/ui@latest` (or yarn equivalent).
   - Run the library’s migration script (`npx shadcn-ui@latest upgrade`) to pull in new component files.
   - Commit the bump.
2. **Apply Design Tokens**
   - Verify `tailwind.config.ts` contains the Modern SaaS tokens (Teal, Coral).
   - Update any custom utility classes to reference the new token names.
3. **Add New Interaction Patterns**
   - Import `Dialog`, `Drawer`, `Toast`, `Editable` components from shadcn‑ui.
   - Replace existing modal‑like implementations with `Dialog`.
   - Use `Drawer` for side‑panel navigation where appropriate.
   - Integrate `useToast` for feedback messages.
   - Convert inline‑edit fields to `Editable` components.
4. **Layout Refactor**
   - Replace existing two‑column grids with a **single‑column card layout** using `Card` component.
   - Ensure responsive breakpoints (`sm`, `md`, `lg`) collapse to a full‑width card on mobile.
   - Add `dark:` variants for all Tailwind classes to enable dark‑mode.
5. **Accessibility Enhancements**
   - Add appropriate `aria‑` attributes to new components.
   - Ensure color contrast meets WCAG AA (use Tailwind’s `contrast-*` utilities where needed).
6. **Update Playwright E2E Tests**
   - For each broker page, add/adjust selectors to target the new component structure (e.g., `data-testid="broker-card"`).
   - Add tests for the new interaction patterns (dialog open/close, drawer navigation, toast appearance, inline edit save).
7. **Visual Regression Capture**
   - Run the visual‑regression tool on all broker pages before and after changes; save “before” screenshots in `docs/reports/visual-regression/before/` and “after” in `.../after/`.
8. **Run Verification Suite**
   - `npm run lint && npm run typecheck`
   - `npm run test:unit`
   - `npm run test:e2e` (Playwright) – ensure all broker tests pass.
   - `npx axe-cli "http://localhost:3000/portal/broker/**"` – confirm WCAG AA.
   - Verify visual‑regression diff passes the acceptance threshold.
9. **Commit & Push**
   - Create a feature branch `feat/broker-ui-refactor`.
   - Commit changes with a descriptive message.
   - Open a PR for review.
10. **Deployment**
    - After PR approval, merge to `main` and let the CI/CD pipeline deploy to production (full rollout, no feature flag).

---

## Verification Commands (to be executed after implementation)
```bash
# 1. Lint & Type checking
npm run lint
npm run typecheck

# 2. Unit tests
npm run test:unit

# 3. Playwright E2E suite (broker pages)
npm run test:e2e -- --grep "Broker"

# 4. Accessibility audit (WCAG AA)
npx axe-cli "http://localhost:3000/portal/broker/**" --threshold=AA

# 5. Visual regression diff
npm run visual:diff
```

---

## Risks & Mitigations
- **Breaking UI due to component API changes** – Mitigate by running the library’s upgrade script and reviewing the generated migration guide.
- **Dark‑mode CSS conflicts** – Use Tailwind’s `dark:` utilities consistently; test in both themes.
- **Test flakiness after layout changes** – Update selectors to use stable `data-testid` attributes.
- **Accessibility regressions** – Run axe‑core after every UI change; fix any violations immediately.

---

## Approval Requirements
No database, permission, or API changes are involved. The only required approval is the standard code‑review sign‑off. **Proceed** once the team reviews the plan.

---

**Next Action**
- Please confirm you approve this implementation plan so I can begin the refactor.

*If you would like any adjustments to the plan, let me know now.*
