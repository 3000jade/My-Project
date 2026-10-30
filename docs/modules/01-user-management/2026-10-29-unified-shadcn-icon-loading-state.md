---
module: 01-user-management
date: 2026-10-29
status: Complete
affected_files:
  - frontend/src/components/ui/spinner.jsx
  - frontend/src/components/ui/spinner.test.jsx
  - frontend/src/components/ui/index.js
  - frontend/src/components/dashboard/DashboardLayout.jsx
  - frontend/src/pages/portals/broker/BrokerDashboard.jsx
  - frontend/src/pages/portals/broker/BrokerProperties.jsx
  - frontend/src/pages/portals/broker/BrokerAgents.jsx
  - frontend/src/pages/portals/broker/BrokerInquiries.jsx
  - frontend/src/pages/portals/broker/BrokerSales.jsx
  - frontend/src/pages/portals/broker/BrokerNotifications.jsx
  - frontend/src/pages/portals/broker/BrokerProfile.jsx
  - frontend/src/pages/portals/broker/BrokerAudit.jsx
  - frontend/src/pages/portals/broker/BrokerSubdivisions.jsx
  - frontend/src/pages/portals/broker/BrokerAgentDetail.jsx
  - frontend/src/pages/portals/broker/BrokerInquiryDetail.jsx
  - frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx
  - frontend/e2e/broker-skeleton-loading.spec.ts
---

# Unified Icon Loading State with Shadcn UI Spinner

## 1. Overview
Standardized all asynchronous loading states across the broker portal to use a single unified shadcn UI `Spinner` primitive backed by `lucide-react`'s `Loader2`. This eliminates inconsistent ad-hoc CSS border spinners, raw text states, and fragmented skeleton placeholders in favor of a cohesive, accessible architectural design pattern.

## 2. Key Changes
- **Shadcn UI Spinner Primitive (`frontend/src/components/ui/spinner.jsx`):**
  - Uses `lucide-react`'s `Loader2` with `cva` sizing (`sm`, `default`, `lg`, `xl`).
  - Architectural teal color `#0F766E` matching the brand identity.
  - Centered card container mode featuring `role="status"`, `aria-live="polite"`, clean border `#E2E8F0`, subtle shadow, and small rounded corners (`rounded-md`, 0.45rem preset style).
  - Uppercase tracked typography for loading labels.
- **Exported from `@/components/ui`:**
  - Registered in `frontend/src/components/ui/index.js` for clean module imports.
- **Suspense Layout Fallback:**
  - `frontend/src/components/dashboard/DashboardLayout.jsx` now renders `<Spinner centered size="xl" text="Loading portal..." className="my-16" />`.
- **Portal Pages Updated:**
  - Replaced skeleton grids and manual spinners across all 12 broker portal pages (`BrokerDashboard`, `BrokerProperties`, `BrokerAgents`, `BrokerInquiries`, `BrokerSales`, `BrokerNotifications`, `BrokerProfile`, `BrokerAudit`, `BrokerSubdivisions`, `BrokerAgentDetail`, `BrokerInquiryDetail`, `BrokerPropertyDetail`).

## 3. Verification
- **Unit Tests:**
  - `frontend/src/components/ui/spinner.test.jsx`: 3/3 passed.
  - Vitest test suite (`BrokerProperties`, `BrokerAgents`, `BrokerSubdivisions`, `BrokerAudit`): 8/8 test files passed (45/45 tests).
- **E2E Playwright Tests:**
  - `frontend/e2e/broker-skeleton-loading.spec.ts`: verified `role="status"` and `Loader2` animate-spin on network intercept.
