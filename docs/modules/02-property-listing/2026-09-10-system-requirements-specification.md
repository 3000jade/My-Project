# System Requirements Specification (SRS)
## Property Listing Management Module (`property-listings`)

**System Name:** Human Shelter Realty Real Estate Platform  
**Module Identifier:** `property-listings`  
**Document Version:** 1.0.0  
**Status:** Approved & Production-Ready  
**Standard Compliance:** IEEE 830 / ISO/IEC/IEEE 29148, RESO Data Dictionary 2.0, Philippine RESA (RA 9646)  
**Date:** October 26, 2026  

---

## 1. Introduction

### 1.1 Purpose
This System Requirements Specification (SRS) document provides a complete, authoritative description of the functional, non-functional, behavioral, and architectural requirements for the **Property Listing Management Module (`property-listings`)** of the Human Shelter Realty SaaS platform. It serves as the primary technical contract for software engineers, database administrators, UI/UX designers, quality assurance testers, and real estate brokerage stakeholders.

### 1.2 Scope of the Module
The Property Listing Management module encompasses the complete operational and legal lifecycle of real estate assets within the brokerage:
- **Brokerage Ingestion & Inventory Management:** 7-step wizard-driven listing registration exclusively authorized for licensed Managing Brokers and System Administrators.
- **Cadastral Geocoding & Spatial Discovery:** Interactive map telemetry, coordinate pinpointing, and boundary visualization powered by Leaflet and OpenStreetMap/Nominatim.
- **Two-Stage Agent Proposal & Broker Approval Engine:** Secure staging workflow where sales agents propose listing modifications without mutating active production records until explicit broker review.
- **Sensitive Data Partitioning:** Physical and logical isolation of seller contact details, lockbox combinations, and commission splits in dedicated tables with Row-Level Security (RLS) enforcement.
- **Immutable Transaction Auditing:** Full historical provenance capture across property creations, updates, approvals, rejections, and status changes.
- **Omnichannel Public Syndication:** High-performance listing search, multi-faceted filtering, high-resolution media galleries, and client viewing cart/tour scheduling integrations.

### 1.3 Regulatory & Industry Compliance
1. **RESO Data Dictionary 2.0:** Standardized data fields, enumeration types, and terminology (`StandardStatus`, `ListingKey`, `ListPrice`, `PropertyType`, `PropertySubType`, `BedroomsTotal`, `BathroomsFull`, `LivingArea`, `LotSizeArea`).
2. **Philippine Real Estate Service Act (Republic Act No. 9646 / RESA):** Strict legal hierarchy where real estate salespersons/agents operate under the direct oversight and license of a registered Real Estate Broker. Sales agents are legally prohibited from publishing or modifying public inventory without broker confirmation.
3. **Data Privacy Act of 2012 (RA 10173) & Strict Confidentiality:** Zero unauthorized exposure of private client and seller data (access codes, private remarks, owner contact numbers, commission structures) to clients or unassigned agents.

### 1.4 Definitions, Acronyms, and Abbreviations
| Term | Definition |
| :--- | :--- |
| **ACID** | Atomicity, Consistency, Isolation, Durability (database transaction guarantees). |
| **Cadastral Pin** | Geographic latitude/longitude coordinates marking exact parcel boundaries and site location. |
| **DTO** | Data Transfer Object. |
| **JSONB** | Binary JSON storage format in PostgreSQL providing indexing and rapid querying. |
| **RESA (RA 9646)** | Philippine Real Estate Service Act governing the practice of real estate service. |
| **RESO** | Real Estate Standards Organization. |
| **RLS** | Row-Level Security policy in PostgreSQL restricting record access by user identity/role. |
| **RPC** | Remote Procedure Call (PostgreSQL Stored Procedure). |
| **SRS** | System Requirements Specification. |
| **Staged Proposal** | A proposed modification to a property record held in a pending state until authorized. |

---

## 2. Overall Description

### 2.1 Product Perspective & Context
The Property Listing Management module is the central inventory core of the Human Shelter Realty platform. It interfaces directly with user identity (`auth-rbac`), media asset storage (`integrations-google`), geocoding services (`maps-geocoding`), client lead generation (`inquiries-leads`), and showing tours (`appointments-tours`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SYSTEM ARCHITECTURE CONTEXT                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │   Client Portal /   │                 │   Broker & Agent       │   │
│   │   Public Showcase   │                 │   Management Portals   │   │
│   └──────────┬──────────┘                 └───────────┬────────────┘   │
│              │ (REST/JSON)                            │ (REST/JSON)    │
│              ▼                                        ▼                │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │       Node.js / Express API Gateway (`/api/properties`)        │   │
│   │     - JWT Role-Based Access Control Middleware                 │   │
│   │     - Zod Schema Validation & Data Sanitization                │   │
│   │     - Projection Sanitization (Confidential Redaction)         │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│              ┌────────────────────┴────────────────────┐               │
│              ▼                                         ▼               │
│   ┌────────────────────────┐              ┌────────────────────────┐   │
│   │  OpenStreetMap API     │              │  Supabase PostgreSQL   │   │
│   │  (Geocoding/Nominatim) │              │  - Row-Level Security  │   │
│   └────────────────────────┘              │  - Stored Procedures   │   │
│                                           │  - Partitioned Tables  │   │
│                                           └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stakeholder Role Profiles & Access Matrix
The system strictly enforces four distinct user personas:

| Capability Dimension | Public / Client (`client`) | Sales Agent (`agent`) | Managing Broker (`broker`) | System Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Active Listings** | Allowed | Allowed | Allowed | Allowed |
| **Interactive Cadastral Map** | Allowed | Allowed | Allowed | Allowed |
| **Book Tours / Add to Viewing Cart**| Allowed | Allowed | Allowed | Allowed |
| **View Assigned Property Detail** | Denied | Assigned Only | Firm-Wide | System-Wide |
| **Direct Listing Creation** | Denied | **Denied** (Enforced) | Allowed | Allowed |
| **Direct Live Listing Update** | Denied | **Denied** (Enforced) | Allowed | Allowed |
| **Submit Edit Proposal** | Denied | Assigned Only | Allowed | Allowed |
| **Approve / Reject Edit Proposals** | Denied | **Denied** (Enforced) | Allowed | Allowed |
| **Access Confidential Data** | Denied | Assigned Only | Firm-Wide | System-Wide |
| **Audit Log Inspection** | Denied | Denied | Firm-Wide | System-Wide |
| **Emergency Status Override** | Denied | Denied | Allowed | Allowed |

### 2.3 Operating Environment & Technical Dependencies
- **Client Tier:** Modern web browsers (Chromium 110+, Firefox 110+, Safari 16+, Edge) executing React 19 SPA bundled via Vite 7.
- **Application Server:** Node.js (v20+ LTS) running Express 4.x with TypeScript 5.9+.
- **Database Engine:** Supabase PostgreSQL 15+ with `pgcrypto`, `uuid-ossp`, and JSONB operators.
- **Mapping & GIS:** Leaflet 1.9+ with OpenStreetMap tiles and reverse geocoding via Nominatim API.
- **Design Tokens:** Tailwind CSS v4 adhering to the Human Shelter Realty Design System.

### 2.4 Design System Constraints & Brand Tokens
The UI must strictly implement the design tokens defined in `AGENTS.md`:
- **Base Canvas:** Slate Alabaster Ground (`#F8FAFC`).
- **Surface Elevation:** Pure White (`#FFFFFF`) with 1px border (`#E2E8F0`).
- **Primary Brand:** Teal (`#0F766E`), Hover (`#115E59`), Active (`#14B8A6`).
- **Conversion Accent:** Coral (`#FF6B6B`).
- **Typographic Ink:** Slate 800 (`#1E293B`), Slate 500 Muted (`#64748B`).
- **Border Radii:** Standard 8px (`rounded-lg`) for all inputs, cards, and modal dialogs.
- **Spatial Rhythm:** Strict 8px increment grid (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Accessibility:** Minimum WCAG 2.2 AA contrast ratio ($\ge 4.5:1$).

---

## 3. Specific Functional Requirements (FR)

### 3.1 Feature Group 1: Property Listing Ingestion & Creation (Broker/Admin)

#### FR-1.1: Role-Gated Creation Access
- **Description:** Only users possessing the `broker` or `admin` role shall have the authority and UI affordance to create new listings.
- **Behavior:**
  - For `agent` and `client` roles, all `+ Create Listing` and `+ Add Property` buttons shall be hidden from the DOM.
  - Backend POST requests to `/api/properties` originating from `agent` or unauthenticated tokens must be rejected with HTTP 403 Forbidden.

#### FR-1.2: In-Place 7-Step Listing Wizard
- **Description:** The property creation interface shall be an in-place multi-step wizard (`BrokerCreateListings.jsx`) that preserves state without page reloads.
- **Detailed Step Breakdown:**
  1. **Step 1: Core Essentials & Agent Assignment:**
     - Fields: Listing Title, Transaction Type (`For Sale`, `For Rent`), Property Type (`Residential`, `Commercial`, `Land`), Property Subtype (`Condominium`, `Single Family Home`, `Townhouse`, `Penthouse`), Assigned Agent Selector (dropdown populated from active brokerage agents).
     - Validation: Title minimum 10 characters, max 140 characters; all step fields mandatory.
  2. **Step 2: Cadastral Location & Georeferencing:**
     - Fields: Street Address, Barangay/District, City, Province, Postal Code, Latitude, Longitude.
     - Controls: Integrated interactive Leaflet map with draggable cadastral pin, live reverse-geocoding lookup via Nominatim, manual latitude/longitude numerical input synchronization.
  3. **Step 3: Dimensions, Layout & Structural Specifications:**
     - Fields: Bedrooms Total (integer $\ge 0$), Bathrooms Total (decimal/half-bath support $\ge 0$), Parking Spaces ($\ge 0$), Living Area (sqm, float $> 0$), Lot Size Area (sqm, float $\ge 0$), Year Built (valid year $\le$ current year + 2), Architectural Style (dropdown).
  4. **Step 4: Financial Valuation & Carrying Terms:**
     - Fields: List Price (positive numeric, formatted with localized currency separators), Price Per SQM (dynamically calculated: $\text{List Price} / \text{Living Area}$), Currency Code (default `PHP`).
     - Scope Exclusions: The form intentionally excludes `original_list_price`, `association_fee`, `tax_annual_amount`, and `list_price_currency` to prevent input clutter, while preserving these columns in the database for external MLS ingestion.
  5. **Step 5: Curated Amenities & Architectural Highlights:**
     - Categories: Interior Finishes (Hardwood floors, marble counters, high ceilings), Outdoor Amenities (Private pool, balcony, landscaped garden), Security & Utilities (24/7 concierge, backup generator, smart lock).
     - Storage: Normalized string array within JSONB payload.
  6. **Step 6: Media Gallery & Confidential Intelligence:**
     - Public Assets: Primary hero photograph, gallery image URLs, virtual tour URL (Matterport/YouTube), architectural blueprint PDF link.
     - Confidential Assets: Physical lockbox code, gate access passcodes, direct owner legal name and phone number, internal commission split agreement percentage. Stored in isolated entity `property_confidential`.
  7. **Step 7: Pre-Publication Quality Gate & Audit Review:**
     - Real-Time Readiness Checklist validating 5 gates:
       1. Title length $\ge 10$ characters.
       2. List price $> 0$.
       3. Valid cadastral latitude/longitude coordinates pinned.
       4. Detailed description $\ge 50$ characters.
       5. At least 3 high-resolution images uploaded.
     - Action: Single-click publish to `Active` status or save as `Draft`.

---

### 3.2 Feature Group 2: Cadastral Geocoding & Mapping Services

#### FR-2.1: Interactive Map Georeferencing
- **Description:** Property geographic positioning must use authoritative WGS-84 coordinates.
- **Behavior:**
  - Interactive Leaflet map container rendering OpenStreetMap tiles.
  - Draggable marker updating internal latitude and longitude state within 8 decimal points precision.
  - Search input with debounce (400ms) calling Nominatim API to locate addresses, centering map and positioning marker automatically upon address selection.
  - Public viewports shall display fuzzy neighborhood perimeter circles when exact street pin is withheld by broker request.

---

### 3.3 Feature Group 3: Staged Agent Proposal Workflow (`property_edit_requests`)

#### FR-3.1: Staged Modification Confinement
- **Description:** Sales agents assigned to a property (`list_agent_key = auth.uid()`) are strictly prohibited from directly updating live listings. They must submit changes as staged proposals.
- **Behavior:**
  - The agent opens the 7-section edit drawer (`PropertyQuickEditDrawer.jsx`).
  - Upon submission, the API constructs a new record in `public.property_edit_requests`:
    - `request_status`: Set to `PENDING`.
    - `original_snapshot`: JSONB snapshot of target properties columns at the time of submission.
    - `proposed_changes`: JSONB containing only the delta fields modified by the agent.
  - The live `public.properties` record remains completely unaltered and active.

#### FR-3.2: Pending Concurrency Guard
- **Description:** A property may have at most one unresolved `PENDING` edit proposal at any given moment.
- **Behavior:**
  - Enforced via partial unique index `idx_single_pending_request_per_property` on `property_edit_requests(property_id) WHERE request_status = 'PENDING'`.
  - If an agent attempts to submit a second proposal while one is pending, the system returns HTTP 409 Conflict with descriptive message: `"A pending modification request already exists for this property. Await broker review before submitting further revisions."`

#### FR-3.3: Self-Approval Prevention
- **Description:** The system must guarantee that no user can approve their own submitted change request.
- **Enforcement:**
  - Express middleware verifies caller has `broker` or `admin` role.
  - PostgreSQL stored procedure `apply_property_edit_request` evaluates `IF p_broker_id = v_request.agent_id THEN RAISE EXCEPTION 'Agents cannot approve their own listing proposals';`.

---

### 3.4 Feature Group 4: Broker Review, Diff Comparison & Stored Procedure Execution

#### FR-4.1: Side-by-Side Visual Diff Drawer
- **Description:** Managing Brokers shall be provided with a side-by-side diff drawer displaying original values alongside proposed modifications with highlighted variances.
- **Behavior:**
  - Render original versus proposed data across text, numerical values, images, and amenities.
  - Provide a single-click `Approve Changes` CTA and a `Reject with Feedback` CTA.

#### FR-4.2: Atomic Stored Procedure Approval (`apply_property_edit_request`)
- **Description:** Approving an edit proposal must execute as an ACID transactional stored procedure to eliminate partial states or race conditions.
- **Execution Rules:**
  - Function: `public.apply_property_edit_request(p_request_id UUID, p_broker_id UUID, p_notes TEXT)`
  - Acquires exclusive row lock on target property (`SELECT ... FROM public.properties WHERE id = v_prop_id FOR UPDATE;`).
  - Verifies broker credentials and status `PENDING`.
  - Merges `proposed_changes` directly into `public.properties`.
  - Updates `request_status` to `APPROVED` and records `reviewed_by` and `reviewed_at`.
  - Automatically writes an entry into `public.property_audit_log`.

#### FR-4.3: Stored Procedure Rejection (`reject_property_edit_request`)
- **Description:** Rejecting an edit proposal must capture mandatory feedback while leaving live inventory pristine.
- **Execution Rules:**
  - Function: `public.reject_property_edit_request(p_request_id UUID, p_broker_id UUID, p_rejection_reason TEXT)`
  - Enforces non-empty rejection reason ($\ge 5$ characters).
  - Updates request status to `REJECTED`.
  - Inserts event into `public.property_audit_log`.
  - Leaves target property in `public.properties` completely untouched.

---

### 3.5 Feature Group 5: Confidential Data Isolation & Protection

#### FR-5.1: Physical Table Partitioning
- **Description:** Highly sensitive operational real estate data shall be physically segregated from public inventory tables into `public.property_confidential`.
- **Partitioned Fields:**
  - `lockbox_code`: Combination/passcode to physical key safe.
  - `gate_code`: Security gate access code.
  - `owner_name`, `owner_phone`, `owner_email`: Seller identity and private contacts.
  - `private_remarks`: Non-public brokerage notes.
  - `commission_split_agent`: Contractual agent commission percentage.
  - `commission_split_broker`: Firm commission retention percentage.

#### FR-5.2: Defense-in-Depth Sanitization
- **Description:** Confidential data is guarded at both the database level and application gateway level.
- **Enforcement:**
  - **Database Level:** PostgreSQL Row-Level Security (RLS) policies permit `SELECT` on `property_confidential` only if `auth.uid()` matches the assigned agent or user role is `broker` or `admin`.
  - **Controller Level:** All public `/api/properties` endpoints execute projection sanitization, permanently omitting confidential columns from API JSON responses for unauthenticated and `client` callers.

---

### 3.6 Feature Group 6: Immutable Transaction Auditing

#### FR-6.1: Audit Trail Logging (`property_audit_log`)
- **Description:** Every state change affecting a property record must produce an immutable audit log entry.
- **Logged Attributes:**
  - `property_id`: Target property identifier.
  - `actor_id`: UUID of the authenticated user performing the action.
  - `action`: `CREATE`, `UPDATE`, `SUBMIT_PROPOSAL`, `APPROVE_PROPOSAL`, `REJECT_PROPOSAL`, `STATUS_CHANGE`, `ARCHIVE`.
  - `old_values`: JSONB snapshot before modification.
  - `new_values`: JSONB snapshot after modification.
  - `reason_or_notes`: Broker review notes or rejection explanation.
  - `timestamp`: UTC timestamp with timezone.
- **Immutability:** Database grants shall restrict `UPDATE` and `DELETE` on `property_audit_log` to maintain an tamper-evident ledger.

---

### 3.7 Feature Group 7: Public Catalog, Filtering & Client Engagement

#### FR-7.1: Multi-Facet Search & Dynamic Filtering
- **Description:** Public and client users shall be able to query active listings with sub-100ms response times.
- **Filter Parameters:**
  - Transaction Type (`For Sale`, `For Rent`).
  - Property Type & Subtype.
  - Price Range (`min_price`, `max_price`).
  - Bedroom & Bathroom counts ($\ge N$).
  - City / Neighborhood / Province keywords.
  - Sorting: Price (Ascending/Descending), Newest Listings, Living Area.

#### FR-7.2: Client Viewing Cart & Tour Booking
- **Description:** Buyers can curate properties into a persistent viewing list (`useViewingList.js`) and schedule physical or virtual showings via `InspectionScheduleModal.jsx`.

---

## 4. External Interface Requirements & API Contracts

### 4.1 RESTful API Endpoint Surface

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | Public / All | Returns paginated, filtered active listings with confidential attributes redacted. |
| `GET` | `/api/properties/:id` | Public / All | Returns complete listing details. Sanitizes confidential data for unprivileged clients. |
| `POST` | `/api/properties` | `broker`, `admin` | Ingests new 7-step property payload. Validates via Zod schema and inserts to DB. |
| `PUT` | `/api/properties/:id` | `broker`, `admin` | Direct update of live property records. Returns HTTP 403 for agents. |
| `POST` | `/api/properties/:id/edit-requests` | `agent` (assigned) | Submits staged modification proposal for broker approval. |
| `GET` | `/api/property-edit-requests` | `broker`, `admin`, `agent` | Lists pending and historical edit requests (filtered to assigned records for agents). |
| `GET` | `/api/property-edit-requests/:id` | `broker`, `admin`, `agent` | Fetches single edit request with original vs proposed JSON snapshots. |
| `POST` | `/api/property-edit-requests/:id/approve` | `broker`, `admin` | Invokes stored procedure to atomically merge changes into live property record. |
| `POST` | `/api/property-edit-requests/:id/reject` | `broker`, `admin` | Rejects proposal with mandatory reason; live property record remains untouched. |

### 4.2 Standard API Request/Response Payloads

#### Ingest Property (`POST /api/properties`)
```json
{
  "title": "Forbes Park Modern Minimalist Villa",
  "transaction_type": "For Sale",
  "property_type": "Residential",
  "property_subtype": "Single Family Home",
  "list_price": 185000000,
  "bedrooms_total": 5,
  "bathrooms_total": 6,
  "parking_spaces": 4,
  "living_area": 680.5,
  "lot_size_area": 1200.0,
  "year_built": 2024,
  "street_address": "14 Cambridge Circle, Forbes Park",
  "city": "Makati City",
  "province": "Metro Manila",
  "postal_code": "1219",
  "latitude": 14.542841,
  "longitude": 121.036728,
  "list_agent_key": "8b5f3a12-6e21-4f11-9a28-e4b77f123456",
  "amenities": ["Infinity Pool", "Smart Home Automation", "Wine Cellar", "Solar Arrays"],
  "media_urls": [
    "https://storage.googleapis.com/hsr-assets/forbes-hero.jpg",
    "https://storage.googleapis.com/hsr-assets/forbes-interior.jpg"
  ],
  "confidential": {
    "lockbox_code": "9842",
    "gate_code": "#5512",
    "owner_name": "Maria Corazon",
    "owner_phone": "+639171234567",
    "commission_split_agent": 3.0,
    "commission_split_broker": 2.0
  }
}
```

#### Submit Edit Proposal (`POST /api/properties/:id/edit-requests`)
```json
{
  "proposed_changes": {
    "list_price": 179000000,
    "description": "Updated listing description reflecting newly negotiated price reduction.",
    "amenities": ["Infinity Pool", "Smart Home Automation", "Wine Cellar", "Solar Arrays", "Sauna"]
  },
  "submission_notes": "Seller agreed to 6M price cut to expedite closing before Q4."
}
```

---

## 5. Data & Database Architecture

### 5.1 Entity-Relationship Model (PostgreSQL DDL)

```sql
-- 1. Master Properties Entity
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_key VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(140) NOT NULL,
    description TEXT NOT NULL,
    standard_status VARCHAR(32) NOT NULL DEFAULT 'Draft'
        CHECK (standard_status IN ('Draft', 'Active', 'Pending', 'Under Contract', 'Sold', 'Withdrawn', 'Closed')),
    transaction_type VARCHAR(32) NOT NULL
        CHECK (transaction_type IN ('For Sale', 'For Rent', 'Commercial Lease')),
    property_type VARCHAR(64) NOT NULL,
    property_subtype VARCHAR(64) NOT NULL,
    list_price NUMERIC(15, 2) NOT NULL CHECK (list_price >= 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
    bedrooms_total INT NOT NULL DEFAULT 0 CHECK (bedrooms_total >= 0),
    bathrooms_total NUMERIC(4, 1) NOT NULL DEFAULT 0 CHECK (bathrooms_total >= 0),
    parking_spaces INT NOT NULL DEFAULT 0 CHECK (parking_spaces >= 0),
    living_area NUMERIC(10, 2) NOT NULL CHECK (living_area > 0),
    lot_size_area NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (lot_size_area >= 0),
    year_built INT CHECK (year_built >= 1800 AND year_built <= 2100),
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    list_agent_key UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Partitioned Confidential Intelligence Entity
CREATE TABLE public.property_confidential (
    property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
    lockbox_code VARCHAR(64),
    gate_code VARCHAR(64),
    owner_name VARCHAR(150),
    owner_phone VARCHAR(32),
    owner_email VARCHAR(150),
    private_remarks TEXT,
    commission_split_agent NUMERIC(5, 2) CHECK (commission_split_agent >= 0 AND commission_split_agent <= 100),
    commission_split_broker NUMERIC(5, 2) CHECK (commission_split_broker >= 0 AND commission_split_broker <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Staged Modification Proposals Entity
CREATE TABLE public.property_edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    request_status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    original_snapshot JSONB NOT NULL,
    proposed_changes JSONB NOT NULL,
    submission_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Concurrency Guard: Enforce max 1 PENDING proposal per property
CREATE UNIQUE INDEX idx_single_pending_request_per_property 
ON public.property_edit_requests (property_id) 
WHERE request_status = 'PENDING';

-- 4. Immutable Audit Ledger
CREATE TABLE public.property_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    action VARCHAR(64) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 5.2 Transactional Approval Stored Procedure
```sql
CREATE OR REPLACE FUNCTION public.apply_property_edit_request(
    p_request_id UUID,
    p_broker_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
    v_prop RECORD;
    v_result JSONB;
BEGIN
    -- 1. Fetch and validate edit request
    SELECT * INTO v_req
    FROM public.property_edit_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edit request % not found', p_request_id;
    END IF;

    IF v_req.request_status <> 'PENDING' THEN
        RAISE EXCEPTION 'Edit request is not PENDING (current status: %)', v_req.request_status;
    END IF;

    -- 2. Anti-Self Approval Guard
    IF v_req.agent_id = p_broker_id THEN
        RAISE EXCEPTION 'Agents are legally prohibited from approving their own listing proposals';
    END IF;

    -- 3. Lock property row FOR UPDATE to prevent race conditions
    SELECT * INTO v_prop
    FROM public.properties
    WHERE id = v_req.property_id
    FOR UPDATE;

    -- 4. Apply proposed modifications
    UPDATE public.properties
    SET
        title = COALESCE((v_req.proposed_changes->>'title'), title),
        description = COALESCE((v_req.proposed_changes->>'description'), description),
        list_price = COALESCE((v_req.proposed_changes->>'list_price')::NUMERIC, list_price),
        bedrooms_total = COALESCE((v_req.proposed_changes->>'bedrooms_total')::INT, bedrooms_total),
        bathrooms_total = COALESCE((v_req.proposed_changes->>'bathrooms_total')::NUMERIC, bathrooms_total),
        parking_spaces = COALESCE((v_req.proposed_changes->>'parking_spaces')::INT, parking_spaces),
        living_area = COALESCE((v_req.proposed_changes->>'living_area')::NUMERIC, living_area),
        lot_size_area = COALESCE((v_req.proposed_changes->>'lot_size_area')::NUMERIC, lot_size_area),
        amenities = CASE 
            WHEN v_req.proposed_changes ? 'amenities' THEN (v_req.proposed_changes->'amenities')
            ELSE amenities 
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_req.property_id;

    -- 5. Update request status to APPROVED
    UPDATE public.property_edit_requests
    SET
        request_status = 'APPROVED',
        reviewed_by = p_broker_id,
        review_notes = p_notes,
        reviewed_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- 6. Insert into immutable audit ledger
    INSERT INTO public.property_audit_log (
        property_id, actor_id, action, old_values, new_values, review_notes
    ) VALUES (
        v_req.property_id, p_broker_id, 'APPROVE_PROPOSAL',
        v_req.original_snapshot, v_req.proposed_changes, p_notes
    );

    v_result := jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'property_id', v_req.property_id,
        'status', 'APPROVED'
    );

    RETURN v_result;
END;
$$;
```

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Security & Access Control
- **NFR-SEC-1 (Zero Trust Redaction):** Confidential properties columns must never be transmitted over public network sockets or rendered in public client DOMs.
- **NFR-SEC-2 (Row-Level Security):** PostgreSQL RLS must be activated and enforced on `properties`, `property_confidential`, `property_edit_requests`, and `property_audit_log`.
- **NFR-SEC-3 (Sanitization & Anti-Injection):** All inbound payloads must pass through Zod strict validation schemas and parameter-bound SQL queries.

### 6.2 Performance & Responsiveness
- **NFR-PERF-1 (Public Catalog Latency):** Filtered property search queries on `/api/properties` must execute in $\le 100\text{ms}$ at p95 with 10,000 active listings using indexing on `(standard_status, city, list_price)`.
- **NFR-PERF-2 (Asset Loading):** Property gallery photography must deliver responsive WebP variants, loading hero images within $\le 1.2\text{s}$ over 4G connections.
- **NFR-PERF-3 (Map Rendering):** Map pin clusters must render smoothly at 60 FPS without UI jank.

### 6.3 Data Integrity & Concurrency
- **NFR-INT-1 (ACID Guarantees):** Proposal approvals and inventory transitions must occur within atomic database transactions with explicit row-level locking (`FOR UPDATE`).
- **NFR-INT-2 (Audit Immutability):** Records in `public.property_audit_log` cannot be deleted or updated by any application-level credentials.

### 6.4 Usability & Accessibility
- **NFR-USA-1 (WCAG 2.2 AA Compliance):** All UI components must achieve a minimum color contrast ratio of $4.5:1$ against the `#F8FAFC` base canvas and `#FFFFFF` cards.
- **NFR-USA-2 (Screen Reader Accessibility):** All form inputs, icon buttons, and interactive map triggers must feature explicit `aria-label`, `aria-describedby`, and valid keyboard tab indices.

---

## 7. Verification & Traceability Matrix

| Requirement ID | Requirement Description | Database Entity / DDL | Backend Component / Service | Frontend UI Interface |
| :--- | :--- | :--- | :--- | :--- |
| **FR-1.1** | Role-gated creation restriction | `public.properties` | `auth.middleware.ts` (`requireRole(['broker','admin'])`) | `BrokerCreateListings.jsx` (Hidden for Agent) |
| **FR-1.2** | 7-step in-place creation wizard | `public.properties` | `property.controller.ts:create` | `BrokerCreateListings.jsx` (Steps 1-7) |
| **FR-2.1** | Cadastral geocoding & mapping | `latitude`, `longitude` | `nominatim.service.ts` | `PropertyMap.jsx`, `CadastralPinModal.jsx` |
| **FR-3.1** | Staged agent edit proposal | `property_edit_requests` | `property.controller.ts:proposeEdit` | `PropertyQuickEditDrawer.jsx` |
| **FR-3.2** | Single pending proposal guard | `idx_single_pending_request` | PostgreSQL Partial Unique Index | Client UI Conflict Alert Banner |
| **FR-3.3** | Anti-self approval guard | `apply_property_edit_request` | PL/pgSQL Exception Trigger | Broker Action Confirmation Drawer |
| **FR-4.1** | Side-by-side proposal diff view | `original_snapshot`, `proposed`| `property.controller.ts:getProposal` | `BrokerProposalDiffModal.jsx` |
| **FR-4.2** | Stored procedure approval | `apply_property_edit_request` | `property.service.ts:approveProposal` | `BrokerProperties.jsx` Approval CTA |
| **FR-4.3** | Rejection with feedback | `reject_property_edit_request`| `property.service.ts:rejectProposal` | Rejection Reason Modal |
| **FR-5.1** | Confidential data isolation | `property_confidential` | Projection Redaction Middleware | Detail View Gate (Restricted to Broker) |
| **FR-6.1** | Immutable transaction audit | `property_audit_log` | Stored Procedure Auto-Trigger | `AdminAuditLogView.jsx` |
| **FR-7.1** | Public search & filtering | `public.properties` Indexes | `property.service.ts:search` | `PropertyListingView.jsx`, `FilterSidebar.jsx`|
| **FR-7.2** | Client viewing cart & tour booking | `public.appointments` | `appointment.controller.ts` | `InspectionScheduleModal.jsx`, `useViewingList`|
