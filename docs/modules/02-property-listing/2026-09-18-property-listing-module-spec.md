# Module 03: Property Listing Management (`property-listings`)

**Module Identifier:** `property-listings`  
**System:** Human Shelter Realty / CP_kerby Modern SaaS Real Estate Platform  
**Status:** Active & Architecture-Verified  
**Specification References:**
- [`docs/Property_listings/01-database-schema-design.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/01-database-schema-design.md)
- [`docs/Property_listings/02-security-approval-workflow.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/02-security-approval-workflow.md)
- [`docs/Property_listings/03-backend-api-integration.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/03-backend-api-integration.md)
- [`docs/Property_listings/04-frontend-workflow-integration.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/04-frontend-workflow-integration.md)
- [`docs/Property_listings/05-system-integration-testing.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/05-system-integration-testing.md)
- [`docs/Property_listings/06-controlled-implementation.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/Property_listings/06-controlled-implementation.md)
**Verification Report:** [`docs/modules/02-property-listing/2026-09-18-property-listing-functional-verification-report.md`](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/docs/modules/02-property-listing/2026-09-18-property-listing-functional-verification-report.md)  
**Last Updated:** October 23, 2026  

---

## 1. Executive Summary & Domain Purpose

The **Property Listing Management Module (`property-listings`)** serves as the central inventory engine of the Human Shelter Realty platform. It governs the entire lifecycle of luxury residential and commercial properties from initial ingestion, cadastral georeferencing, and media staging to tiered broker approval, live public syndication, and immutable audit logging.

### 1.1 Regulatory & Real Estate Standards Compliance
- **RESO Data Dictionary 2.0 (Real Estate Standards Organization)**: Complies with standardized real estate fields, including `StandardStatus`, `ListingKey`, `ListPrice`, `PropertyType`, `PropertySubType`, `BedroomsTotal`, `BathroomsFull`, `LivingArea`, and `LotSizeArea`.
- **Philippine RESA (Republic Act No. 9646)**: Enforces statutory brokerage governance where salespersons/agents act under the direct supervision of licensed Real Estate Brokers. Agents cannot unilaterally publish or alter active inventory without broker or administrative authorization.
- **Strict Confidentiality Partitioning**: Protects sensitive seller and brokerage intelligence (lockbox access passcodes, gate codes, direct owner phone numbers, commission split structures) by physically isolating them in `public.property_confidential` guarded by Supabase Row-Level Security (RLS) and Express controller projection sanitization.

---

## 2. Multi-Stakeholder Workspaces & Role Profiles

The property listing module delivers tailored capabilities and views across all four user personas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE CAPABILITY MATRIX                          │
├──────────────────────┬──────────────┬──────────────┬───────────┬───────┤
│ Functional Dimension │ Public/Client│ Sales Agent  │ Broker    │ Admin │
├──────────────────────┼──────────────┼──────────────┼───────────┼───────┤
│ Public Discovery & Search │    YES   │     YES      │    YES    │  YES  │
│ Interactive Cadastral Map │    YES   │     YES      │    YES    │  YES  │
│ Book Physical/Virtual Tour│    YES   │     YES      │    YES    │  YES  │
│ Save to Viewing List/Cart │    YES   │     YES      │    YES    │  YES  │
│ View Assigned Properties  │     NO   │     YES      │    YES    │  YES  │
│ Propose Listing Edits     │     NO   │     YES      │    YES    │  YES  │
│ In-Place 7-Step Creation  │     NO   │   Restricted │    YES    │  YES  │
│ Direct Live Inventory Edit│     NO   │     NO       │    YES    │  YES  │
│ Approve/Reject Proposals  │     NO   │     NO       │    YES    │  YES  │
│ Access Confidential Codes │     NO   │ Assigned Only│ Firm-Wide │ Global│
│ View Immutable Audit Logs │     NO   │     NO       │ Firm-Wide │ Global│
│ Emergency Status Override │     NO   │     NO       │    YES    │  YES  │
└──────────────────────┴──────────────┴──────────────┴───────────┴───────┘
```

### 2.1 Public & Client Persona (`client` / Anonymous)
- **Primary Objective**: Intuitive discovery, high-fidelity media inspection, and inquiry initiation.
- **Key UI Interfaces**:
  - **Public Listing Portal (`/properties`, `PropertyListingView.jsx`)**: Comprehensive property showcase displaying architectural photography (`ListingHeroGallery`, `PropertyGalleryMosaic`), verified specs, location telemetry, and public agent cards.
  - **Cadastral Pin & Interactive Map (`PropertyMap.jsx`)**: Dynamic Leaflet map rendering cluster markers, boundary radiuses, and neighborhood amenities using OpenStreetMap/Nominatim coordinates.
  - **Client Viewing List (`useViewingList.js`)**: Real-time bookmarking system allowing users to compile a viewing cart and schedule visits.
  - **Inspection Schedule Drawer (`InspectionScheduleModal.jsx`)**: Modal allowing buyers to select preferred dates and time slots for physical walkthroughs or virtual Zoom consultations.
- **Security Guardrails**:
  - Zero access to confidential backend columns (`property_confidential`, `lockbox_code`, `private_remarks`, `commission_split`).
  - Read-only access restricted strictly to listings where `standard_status = 'Active'`.

### 2.2 Sales Agent Persona (`agent`)
- **Primary Objective**: Manage assigned listings, track client interest, and submit proposed updates to listing data.
- **Key UI Interfaces**:
  - **Agent Portfolio View (`/portal/agent/properties`, `AgentProperties.jsx`)**: Filtered inventory view displaying only listings assigned to the agent (`list_agent_key = auth.uid()`).
  - **Agent Property Detail (`AgentPropertyDetail.jsx`)**: High-density operational view displaying client inquiry counts, scheduled appointments, and current listing status.
  - **7-Section "Propose Changes" Drawer (`PropertyQuickEditDrawer.jsx`)**: Intuitive form enabling the agent to propose revisions to title, pricing, remarks, amenities, and specs.
- **Workflow & Business Rules**:
  - **Creation Restriction**: Standard agents cannot directly create or publish new listings. The `+ Add Listing` button is hidden to prevent unvetted inventory from reaching production.
  - **Staged Proposal Workflow**: Agent edits are saved into `public.property_edit_requests` with status `PENDING`. The live property record in `public.properties` remains untouched until approval.
  - **Concurrency Guard**: Partial unique index `idx_single_pending_request_per_property` prevents multiple conflicting pending proposals for the same property.
  - **Self-Approval Prevention**: Agents are prevented by both Express middleware (`requireRole(['broker', 'admin'])`) and PostgreSQL RPC checks from approving or rejecting their own proposals.

### 2.3 Managing Broker Persona (`broker`)
- **Primary Objective**: Supervise firm inventory, create new high-value listings, review agent change requests, and govern transaction status.
- **Key UI Interfaces**:
  - **Broker Property Portal (`/portal/broker/properties`, `BrokerProperties.jsx`)**: Master firm portfolio table with status tabs (`All`, `Active`, `Draft`, `Pending Approval`, `Under Contract`, `Sold`), search, and sorting.
  - **In-Place 7-Step Listing Wizard (`BrokerCreateListings.jsx`)**: Comprehensive in-place wizard enabling end-to-end property registration without full-page reloads:
    1. *Basic Details*: Title, property type, sub-type, transaction type, assigned agent.
    2. *Cadastral Location*: Street address, city, postal code, interactive Leaflet draggable cadastral pin, latitude/longitude capture.
    3. *Dimensions & Specifications*: Bedrooms, bathrooms, parking spaces, interior living area (sqm), total lot area (sqm), year built, architectural style.
    4. *Financial & Carrying Terms*: Clean list price and currency (unnecessary fields `original_list_price`, `association_fee`, `tax_annual_amount`, `list_price_currency` excluded from UI but preserved in database).
    5. *Curated Features & Amenities*: Luxury interior finishes, structural amenities, smart home technology, and neighborhood infrastructure.
    6. *Media & Confidential Governance*: Google Drive/cloud media integration, lockbox codes, direct seller phone, internal commission split (stored in `public.property_confidential`).
    7. *Publication Readiness Checklist & Audit*: Real-time checklist validating 5 quality gates (title length, price, cadastral pin, description, media) before permitting one-click publication.
  - **Broker Property Detail & Quick Edit (`BrokerPropertyDetail.jsx`)**: Direct editing, status transition controls (`Active`, `Reserved`, `Sold`, `Withdrawn`), and confidential notes.
  - **Side-by-Side Review Drawer**: Diff viewer presenting original vs proposed values with one-click `Approve` or `Reject` (with mandatory reason).

### 2.4 System Administrator Persona (`admin`)
- **Primary Objective**: System-wide oversight, cross-brokerage quality audit, and emergency intervention.
- **Key UI Interfaces**:
  - **Global Inventory Oversight (`/portal/admin/properties`)**: Complete multi-brokerage visibility.
  - **Immutable Audit Log Viewer (`public.property_audit_log`)**: Chronological audit trail showing actor ID, timestamp, before/after JSON snapshots, and decision remarks.
  - **Superuser Override**: Ability to immediately unpublish, reassign, or restore listings across any firm.

---

## 3. Data Architecture & Schema Relationships

```
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE ENTITY RELATIONSHIPS                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────────┐         1:1         ┌───────────────────┐ │
│   │   public.properties    ├────────────────────►│property_          │ │
│   │   (Authoritative DDL)  │                     │confidential       │ │
│   └───┬────────────────┬───┘                     │(Lockbox & Splits) │ │
│       │ 1:N            │ 1:N                     └───────────────────┘ │
│       │                │                                               │
│       ▼                ▼                                               │
│ ┌───────────────┐  ┌────────────────────────┐                          │
│ │property_media │  │property_edit_requests  │                          │
│ │(Photos, Video)│  │(Agent Staged Proposals)│                          │
│ └───────────────┘  └───────────┬────────────┘                          │
│                                │ Triggers stored proc                  │
│                                ▼                                       │
│                    ┌────────────────────────┐                          │
│                    │  property_audit_log    │                          │
│                    │  (Immutable History)   │                          │
│                    └────────────────────────┘                          │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Primary Entities
1. **`public.properties`**: Authoritative entity storing public and operational real estate data (title, description, price, bedrooms, bathrooms, living area, lot size, address, cadastral latitude/longitude, status, assigned agent).
2. **`public.property_confidential`**: Partitioned confidential entity (`property_id` PK/FK) storing internal gate codes, lockbox passcodes, owner contact info, and broker commission percentages. Accessible only to authorized roles via RLS.
3. **`public.property_edit_requests`**: Staged modification ledger. Captures `agent_id`, `property_id`, `original_snapshot` (JSONB), `proposed_changes` (JSONB), `request_status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), and broker review notes.
4. **`public.property_audit_log`**: Immutable audit record generated upon every creation, update, approval, or rejection. Captures `property_id`, `actor_id`, `action`, `old_values`, `new_values`, and timestamps.

### 3.2 Key Stored Procedures (PL/pgSQL)
- **`public.apply_property_edit_request(p_request_id, p_broker_id, p_notes)`**:
  - Enforces `SECURITY DEFINER` with strict caller role validation (`broker` or `admin`).
  - Acquires row lock (`FOR UPDATE`) on the target property.
  - Applies proposed JSONB fields to `public.properties`.
  - Updates request status to `APPROVED`.
  - Inserts record into `public.property_audit_log`.
  - Commits atomically within an ACID transaction.
- **`public.reject_property_edit_request(p_request_id, p_broker_id, p_rejection_reason)`**:
  - Updates request status to `REJECTED` with mandatory rejection explanation.
  - Records the rejection event in `public.property_audit_log`.
  - Leaves the production listing completely unaltered.

---

## 4. RESTful API Surface & Endpoint Contracts

All property routes follow RESTful architecture under `/api/properties` and `/api/property-edit-requests`:

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/properties` | Public / All | Returns paginated, filtered active listings with confidential fields redacted. |
| **`GET`** | `/api/properties/:id` | Public / All | Returns full listing details. Redacts confidential data for anonymous/client users. |
| **`POST`** | `/api/properties` | `broker`, `admin` | Ingests new 7-step property payload. Validates via Zod and inserts into DB. |
| **`PUT`** | `/api/properties/:id` | `broker`, `admin` | Direct update of live property records. Agents are forbidden (403). |
| **`POST`** | `/api/properties/:id/edit-requests` | `agent` (assigned) | Submits staged modification proposal for broker approval. |
| **`GET`** | `/api/property-edit-requests` | `broker`, `admin`, `agent` | Lists pending/historical edit requests (filtered by agent for agents). |
| **`POST`** | `/api/property-edit-requests/:id/approve` | `broker`, `admin` | Triggers atomic stored procedure to merge changes and audit log. |
| **`POST`** | `/api/property-edit-requests/:id/reject` | `broker`, `admin` | Rejects proposal with mandatory review remarks. |

---

## 5. UI/UX & Design System Alignment

In adherence to the **Human Shelter Realty Modern SaaS UI/UX Design System**:
- **Palette**: Slate Alabaster Ground (`#F8FAFC`), Surface Elevation (`#FFFFFF`), Primary Brand Teal (`#0F766E`, hover `#115E59`), Conversion Accent Coral (`#FF6B6B`), Ink (`#1E293B`, `#64748B`).
- **Geometry & Spacing**: Standard 8px border radius (`rounded-lg`), strict 8px spatial grid, and subtle hairline borders (`1px border-[#E2E8F0]`).
- **Interactive Map**: Leaflet OpenStreetMap canvas with custom SVG markers, draggable pins, zoom controls, and reverse geocoded lat/long coordinates.
- **Responsive Layout**: High-density grid on desktop (`grid-cols-12`), collapsing seamlessly to single-column card stacks on mobile viewports.
