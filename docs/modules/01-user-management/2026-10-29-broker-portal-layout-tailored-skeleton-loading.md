---
module: 01-user-management
date: 2026-10-29
status: Complete
affected_files:
  - frontend/src/components/ui/button.jsx
  - frontend/src/components/ui/button.test.jsx
  - frontend/src/components/dashboard/DashboardLayout.jsx
  - frontend/src/components/dashboard/skeletons/index.js
  - frontend/src/components/dashboard/skeletons/PropertyDetailSkeleton.jsx
  - frontend/src/components/dashboard/skeletons/InquiryDetailSkeleton.jsx
  - frontend/src/components/dashboard/skeletons/AgentDetailSkeleton.jsx
  - frontend/src/components/dashboard/skeletons/Skeletons.test.jsx
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

# Broker Portal Layout-Tailored Skeleton Loading Suite & Button Spinners

## 1. Overview
Implemented page-specific, layout-tailored skeleton loading states across all Broker Portal consoles (`/broker/*`), aligning placeholder geometry with the actual structure of each view (headers, KPI metric strips, table rows, card grids, media galleries, and detail dossiers). Reserving spinning indicators (`Spinner` / `Loader2`) exclusively for in-flight button actions (e.g. inviting agents, saving profiles, exporting compliance logs, and dispatching forms).

## 2. Key Architecture & Deliverables
- **Shadcn UI Button Loading Primitive (`Button.jsx`):**
  - Added native `loading?: boolean` prop.
  - Automatically disables button (`disabled || loading`), flags `aria-busy="true"`, and mounts `<Spinner size="sm" className="text-current shrink-0 animate-spin mr-1.5" />`.
- **Layout-Tailored Skeletons (`components/dashboard/skeletons/`):**
  - `DashboardPageSkeleton`: Page header + 4 KPI metric cards + 2:1 split of recent listings table and activity feed.
  - `TableSkeleton`: Toolbar + column headers + configurable rows with thumbnail/avatar blocks.
  - `CardGridSkeleton`: Aspect-video cover media + spec badges + metadata rows.
  - `ProfileSkeleton`: 1:2 split of executive avatar/badge card and dual credentials configuration panels.
  - `ListSkeleton`: Stacked items with avatar/badge and multi-line text blocks.
  - `PropertyDetailSkeleton`: Breadcrumbs + Action header + 5-photo media gallery grid + 2:1 specs and pricing split.
  - `InquiryDetailSkeleton`: Breadcrumbs + Subject header + 2:1 message thread and property summary split.
  - `AgentDetailSkeleton`: Agent identity card + 4 KPI cards + Tabbed property tables.
- **Global Suspense Routing (`DashboardLayout.jsx`):**
  - Updated fallback to `<DashboardPageSkeleton />` for seamless layout continuity during route transitions.

## 3. Verification Evidence
- **Vitest Unit Suite:** All skeleton tests, button loading tests, and broker page component tests pass with 0 regressions.
- **Playwright E2E Suite (`broker-skeleton-loading.spec.ts`):** Verified network interception displaying page skeletons with `role="status"` and `.animate-pulse` before data resolution.
- **Production Build:** Vite built cleanly in under 6 seconds with 0 errors.
