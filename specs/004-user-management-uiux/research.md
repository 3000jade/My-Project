# Technical Research: Stakeholder UI/UX Experience for User Management

**Feature**: `004-user-management-uiux`  
**Date**: 2026-11-11

## 1. UI Component Architecture & Token Strategy
- **Design Tokens (`DESIGN.md`)**:
  - Primary Brand: Teal `#0F766E` with soft container `#F0FDFA` and border `#CCFBF1`.
  - Accent / Urgent: Coral `#FF6B6B` with soft container `#FFE5E5` and border `#FECACA`.
  - Neutral Slate: Background `#F8FAFC`, Surface `#FFFFFF`, Divider `#E2E8F0`, Typography `#1E293B` (primary) and `#64748B` (secondary).
  - Radii & Shadows: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons/inputs, `rounded-full` for pill badges, `shadow-sm` for elevation.

## 2. Interactive Patterns & State Management
- **Executive KPI Strip**:
  - 4 lightweight stat cards positioned above the main management table.
  - Interactive click handlers: clicking "Pending Accreditation" or "Suspended" immediately applies the corresponding status filter to the table.
- **Search & Multi-Facet Filtering**:
  - Global hotkey listener: `⌘K` or `Ctrl+K` focuses the search bar.
  - Debounced async queries (250ms) to ensure smooth typing without UI freeze or excessive network traffic.
  - Role dropdown filter (`All`, `Admin`, `Broker`, `Agent`, `Client`) and Status dropdown filter (`All`, `Active`, `Suspended`).
- **Two-Step Destructive Action Modals**:
  - Accessible dialog (`@radix-ui/react-dialog` or lightweight tailored modal) with focus trapping and `Escape` key listeners.
  - Requires explicit justification text before enabling the confirmation button to prevent accidental clicks and guarantee compliance auditability.
- **Agent Accreditation Slide-out Drawer**:
  - Non-blocking side sheet (`max-w-md`) rendering PRC license number, validity date countdown, DHSUD accreditation, and verification actions.

## 3. Performance & Accessibility Standards
- **Cumulative Layout Shift (CLS)**: Zero shift by using fixed-height skeleton rows during asynchronous page or filter transitions.
- **Keyboard Navigation**: Complete tab-stop order across filters, table rows, and modals.
- **Contrast Ratios**: Verified &ge; 4.5:1 on all text-to-background combinations.
