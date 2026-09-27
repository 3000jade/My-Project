# Broker Interface & Supabase Master Schema Integration Design Spec

**Date:** 2026-09-26  
**Status:** Approved  
**Author:** Staff Product Designer & Design Systems Architect  
**Architecture:** Nordic Modern Architectural & Bauhaus Precision  
**Target Schema:** `backend/src/models/supabase_schema.sql` (RESO Data Dictionary 2.0 Master PostgreSQL DDL)

---

## 1. Executive Summary & Goals

This specification details the structural and visual refactor of the **Broker Property Listing Interface** to natively integrate with the PostgreSQL master schema defined in [`backend/src/models/supabase_schema.sql`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/backend/src/models/supabase_schema.sql).

### Core Goals:
1. **Executive Authority & Approval Workflows:** Implement a dedicated "Needs Approval" workflow queue (`standard_status = 'Pending Approval'`) enabling brokers to inspect and activate agent submissions with a 1-click action or batch approval (`standard_status = 'Active'`), enforcing the `trg_enforce_property_status` database rule.
2. **High-Density 6-Column Executive Ledger:** Enrich [`BrokerProperties.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerProperties.jsx) with clean cadastral sub-labels (MLS ID, assigned agent chip, HOA monthly carrying costs, and living area dimensions in $\text{m}^2$/$\text{sq ft}$) while preserving strict WCAG AAA daylight contrast.
3. **Multi-Table Data Capture in Studio:** Expand [`BrokerPropertyEditStudio.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/pages/portals/broker/BrokerPropertyEditStudio.jsx) using a 5-Accordion Progressive Disclosure hierarchy covering `public.properties`, `public.property_confidential`, and `public.property_media` with quiet 600ms auto-save telemetry and local draft stash.
4. **High-Velocity Quick Edit Drawer:** Upgrade [`PropertyQuickEditDrawer.jsx`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/frontend/src/components/cms/PropertyQuickEditDrawer.jsx) with 1-click status transitions, price adjustment, agent assignment, and association dues without opening the full studio.
5. **Dual-Mode Architectural Live Preview:** Equip the studio's 45% right pane with an interactive in-place unit switcher ($\text{m}^2 \leftrightarrow \text{sq ft}$) and a CAD Blueprint / Floorplan inspection tab mirroring public listing capabilities.

---

## 2. Two-Way Field Mapping & Schema Contracts

```
┌─────────────────────────────────┐           ┌───────────────────────────────────┐
│ FRONTEND FLAT ERGONOMIC STATE   │ ◄───────► │ SUPABASE POSTGRESQL TABLES        │
├─────────────────────────────────┤           ├───────────────────────────────────┤
│ title, tagline, price           │           │ public.properties                 │
│ standardStatus, status          │           │ - title, tagline, price           │
│ livingArea, livingAreaUnits     │           │ - standard_status, status         │
│ bedrooms, bathrooms, stories    │           │ - living_area, living_area_units  │
│ address, city, subdivisionName  │           │ - beds, baths, stories_total      │
│ associationFee, feeFrequency    │           │ - address, city, subdivision_name │
│ listAgentKey, createdBy         │           │ - association_fee, fee_frequency  │
├─────────────────────────────────┤           ├───────────────────────────────────┤
│ buyerBrokerCommission           │ ◄───────► │ public.property_confidential      │
│ privateRemarks, lockboxCode     │           │ - buyer_agency_compensation       │
│ showingInstructions             │           │ - private_remarks, lockbox_code   │
├─────────────────────────────────┤           ├───────────────────────────────────┤
│ coverImage, galleryImages       │ ◄───────► │ public.property_media             │
│ floorPlanUrl, mediaCategory     │           │ - media_url, media_category       │
└─────────────────────────────────┘           └───────────────────────────────────┘
```

### Data Normalization & Adapter Functions:
- **`toApiPayload(formData)`**: Converts UI state to structured backend payload (Zod `createPropertySchema` compliant).
- **`normalizeProperty(dbRow)`**: Normalizes PostgreSQL row/API envelope into UI-safe objects with defaults.

---

## 3. Component Architecture & UI Interactions

### A. Broker Inventory Workspace (`BrokerProperties.jsx`)
- **Status Filter Tabs:**
  - `All Listings` ($N$)
  - `Needs Approval` ($M$, with amber badge `bg-amber-100 text-amber-900 border-amber-300`)
  - `Active`
  - `Under Contract`
  - `Closed`
- **Table Columns (6 Columns):**
  1. `Property`: Cover photo (`w-11 h-11 rounded-lg`) + Title + MLS ID (`MLS-XXXX`) + Agent chip
  2. `Location`: City + Subdivision name (`subdivision_name`)
  3. `Financials`: Price (`₱XXX.XM`) in `Geist Mono` bold + Monthly Dues (`+₱X,XXX/mo HOA`)
  4. `Dimensions`: Living Area (`XXX m²` / `sq ft`) + Beds/Baths (`Xb • Yba`)
  5. `Status`: `StatusBadge` (`Pending Approval`, `Active`, `Under Contract`, `Closed`, `Draft`)
  6. `Actions`: 1-Click "Approve" (if Pending Approval) + Quick Edit icon + Studio link icon
- **Batch Actions:** Multi-select floating bar with "Approve Selected" (`standard_status = 'Active'`) and "Set Under Contract".

### B. Split-Screen Studio (`BrokerPropertyEditStudio.jsx`)
- **Left Pane (55%):**
  - **Top Viewport:** Title, Tagline, Price, Currency (`PHP`/`USD`), Status badge, Agent selector, Cover photo.
  - **Toolbar Auto-Save:** `Saved (Slate)` $\rightarrow$ `Saving... (Amber pulse)` $\rightarrow$ `Saved just now (Emerald)`.
  - **5 Collapsible Accordions:**
    1. *Physical Dimensions & Specs*: Living Area, Units, Lot Size, Bedrooms, Bathrooms, Stories, Style.
    2. *Location & Cadastre*: Address, Subdivision, City, State/Province, Postal Code.
    3. *Carrying Costs & HOA*: Association Fee, Frequency, Annual Tax, Original List Price.
    4. *Broker Confidential & Co-Broke*: Buyer Broker Commission, Lockbox Code, Showing Instructions, Private Remarks.
    5. *Media Assets & Blueprints*: Floorplan CAD upload, 3D Virtual Tour URL, Gallery photos.
- **Right Pane (45%):**
  - Live architectural presentation preview card.
  - In-place unit switcher ($\text{m}^2 \leftrightarrow \text{sq ft}$).
  - Photo $\leftrightarrow$ CAD Blueprint toggle.

### C. Quick Edit Slide-Over Drawer (`PropertyQuickEditDrawer.jsx`)
- Fast-tune Status (Approve/Activate, Under Contract, Sold, Draft).
- Numeric Price input with live formatted currency preview.
- Assigned Agent dropdown.
- Association dues input.
- Private Remarks snippet.
- Direct link button: "Open Full Split-Screen Studio".

---

## 4. Verification & Testing Strategy

- Automated Vitest test suite (`npm test -- --run`):
  - `BrokerProperties.test.jsx`: Verify KPI metrics, approval tab filtering, 1-click approval actions, search, and table columns.
  - `PropertyListingView.test.jsx`: Verify public listing view, unit switcher, CAD toggle, and tour booking.
- Production build verification (`npm run build`).
