# CP_kerby Database Schema Map

This document outlines the complete PostgreSQL database architecture running on Supabase for the CP_kerby Luxury Architectural Real Estate Platform. The schema strictly conforms to the **RESO Data Dictionary 2.0** standard with Row Level Security (RLS), PostGIS geospatial support, and security isolation for confidential broker data.

---

## Entity Relationship Overview

```
                      auth.users
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
      public.profiles             public.properties
      (id = auth.uid)             (created_by = auth.uid, list_agent_key = assigned agent)
            │                           │
            │                           ├────────────────────────┬────────────────────────┐
            │                           ▼                        ▼                        ▼
            │               public.property_confidential public.property_media  public.property_rooms
            │               (1-to-1 Broker Restricted)   (1-to-Many Media)     (1-to-Many Rooms)
            │                           │
            │                           ├─────────────────────────────────────────────────┐
            │                           ▼                                                 ▼
            │               public.property_edit_requests                     public.property_audit_log
            │               (1-to-Many Staged Proposals;                      (1-to-Many Immutable Audit Log)
            │                Single Pending Constraint)
            │
            ├───────────────────────────┬───────────────────────────┐
            ▼                           ▼                           ▼
   public.inquiries            public.appointments          public.notifications
   (Lead capture)              (Scheduled private tours)   (Real-time user alerts)
```

---

## 1. Profiles (`public.profiles`)
Mirrors and extends Supabase `auth.users` with user roles, contact information, and avatar metadata. Populated automatically via the `on_auth_user_created` trigger.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, **FK** (`auth.users.id` ON DELETE CASCADE) | Primary identifier matching Supabase Auth UID |
| `email` | `TEXT` | NOT NULL | User's email address |
| `full_name` | `TEXT` | | User's full display name |
| `avatar_url` | `TEXT` | | Profile photo URL |
| `role` | `TEXT` | NOT NULL, DEFAULT `'agent'`, CHECK (`role IN ('admin', 'broker', 'agent', 'client')`) | Role-Based Access Control (RBAC) role |
| `phone` | `TEXT` | | Contact telephone number |
| `prc_license_no` | `TEXT` | | Professional Regulation Commission real estate license number |
| `prc_validity` | `DATE` | | Expiry date of PRC license |
| `dhsud_accreditation_no` | `TEXT` | | Department of Human Settlements & Urban Development accreditation |
| `dhsud_validity` | `DATE` | | Expiry date of DHSUD accreditation |
| `verification_status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'VERIFIED'`, CHECK (`verification_status IN ('VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED')`) | Consultant credential verification & lifecycle status |
| `supporting_documents` | `JSONB` | DEFAULT `'[]'::jsonb` | Uploaded credential scans and license certificates |
| `rejection_remarks` | `TEXT` | | Reason/remarks provided by broker upon rejecting verification |
| `experience_years` | `INTEGER` | DEFAULT `0` | Number of years of active real estate practice |
| `bio` | `TEXT` | | Professional consultant summary / background |
| `suspension_reason` | `TEXT` | | Reason recorded when consultant account is suspended |
| `suspension_notes` | `TEXT` | | Internal audit notes for account suspension |
| `suspended_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Broker or administrator who executed suspension |
| `suspended_at` | `TIMESTAMPTZ` | | Timestamp of account suspension |
| `verified_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Broker or administrator who approved credentials |
| `verified_at` | `TIMESTAMPTZ` | | Timestamp of credential verification approval |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last profile update timestamp |

### Row Level Security (RLS) Policies
- **SELECT:** Public profiles are viewable by anyone (`true`).
- **INSERT:** Users can only insert their own profile (`auth.uid() = id`).
- **UPDATE:** Users can update their own profile, or administrators/brokers can update status and credential details.

---

## 1B. Agent Invitations (`public.agent_invitations`)
Single-use tokenized onboarding pipeline for licensed property consultants.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Primary record identifier |
| `email` | `TEXT` | NOT NULL | Target recipient email address |
| `token` | `VARCHAR(64)` | UNIQUE, NOT NULL | Single-use 32-byte cryptographic hex token |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pending'`, CHECK (`status IN ('pending', 'used', 'revoked', 'expired')`) | Invitation lifecycle status |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now() + interval '72 hours'` | Invitation expiry timestamp (72-hour sliding window) |
| `invited_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Broker or administrator who created the invitation |
| `full_name` | `TEXT` | | Optional pre-filled invitee full name |
| `phone` | `TEXT` | | Optional pre-filled invitee contact number |
| `role` | `TEXT` | NOT NULL, DEFAULT `'agent'` | Target onboarding role |
| `broker_agency` | `TEXT` | | Agency or brokerage branch |
| `message` | `TEXT` | | Personalized invitation message sent via email |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last status update timestamp |

### Row Level Security (RLS) Policies
- **ALL:** Admins and Brokers can manage all invitations.
- **SELECT (Anon):** Public token verification for active pending invitations (`status = 'pending' AND expires_at > now()`).

---

## 2. Property Types Lookup (`public.property_types`)
Normalized reference table defining supported architectural categories.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | **PK** | Unique numeric identifier |
| `name` | `TEXT` | NOT NULL, UNIQUE | Canonical type name (e.g. `Residential Condominium`, `Single Family Residence`, `Townhouse`, `Villa / Estate`, `Commercial`) |
| `description` | `TEXT` | | Detailed architectural definition |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |

---

## 2B. Properties (`public.properties`)
Master registry for all architectural properties and luxury listings conforming to RESO Data Dictionary 2.0.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Primary record identifier |
| `title` | `TEXT` | NOT NULL | Property headline/title |
| `tagline` | `TEXT` | | Short editorial subtitle |
| `price` | `NUMERIC(15, 2)`| NOT NULL | Numeric listing price |
| `formatted_price` | `TEXT` | | Pre-formatted display price (e.g. `₱28,500,000`) |
| `address` | `TEXT` | NOT NULL | Street address line |
| `city` | `TEXT` | NOT NULL | City / Municipality (e.g. `Makati City`, `Taguig`) |
| `state` | `TEXT` | | Region / State (e.g. `Metro Manila`) |
| `latitude` | `DOUBLE PRECISION` | | Geographical latitude coordinate |
| `longitude` | `DOUBLE PRECISION` | | Geographical longitude coordinate |
| `beds` | `INTEGER` | NOT NULL, DEFAULT `1` | Ergonomic bedroom count |
| `baths` | `INTEGER` | NOT NULL, DEFAULT `1` | Ergonomic bathroom count |
| `sqft` | `NUMERIC(10, 2)`| NOT NULL | Total area in square units |
| `year_built` | `INTEGER` | | Construction completion year |
| `architectural_style` | `TEXT` | | Design ethos (e.g. `Nordic Modern`, `Bauhaus Minimalist`) |
| `status` | `TEXT` | NOT NULL, DEFAULT `'available'`, CHECK (`status IN ('available', 'pending', 'sold')`) | High-level status flag |
| `created_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Creator account identifier |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last modified timestamp |
| `listing_key` | `VARCHAR(64)` | UNIQUE | Machine-readable unique RESO key (e.g. `KEY-...`) |
| `listing_id` | `VARCHAR(32)` | UNIQUE | Public MLS ID (e.g. `MLS-8123A`) |
| `standard_status` | `VARCHAR(32)` | NOT NULL, DEFAULT `'Draft'` | RESO 2.0 lifecycle status |
| `property_sub_type` | `VARCHAR(64)` | DEFAULT `'Residential Condominium'` | Architectural subtype (e.g. `Penthouse`, `Villa`, `Townhouse`) |
| `association_fee_frequency` | `VARCHAR(20)` | DEFAULT `'Monthly'` | HOA frequency (`Monthly`, `Quarterly`, `Annually`) |
| `living_area` | `NUMERIC(10, 2)`| | Usable gross built-up floor area |
| `living_area_units`| `VARCHAR(20)` | DEFAULT `'Square Meters'` | Unit of area (`Square Meters`, `Square Feet`) |
| `lot_size_area` | `NUMERIC(12, 2)`| | Land parcel footprint area |
| `lot_size_units` | `VARCHAR(20)` | DEFAULT `'Square Meters'` | Unit of land area |
| `bedrooms_total` | `SMALLINT` | DEFAULT `1` | RESO formal bedroom count |
| `bathrooms_total_integer` | `SMALLINT` | DEFAULT `1` | Total full and half bath count |
| `bathrooms_full` | `SMALLINT` | DEFAULT `1` | Complete baths with shower/tub |
| `bathrooms_half` | `SMALLINT` | DEFAULT `0` | Powder rooms / half-baths |
| `stories_total` | `SMALLINT` | DEFAULT `1` | Number of levels or floors |
| `parking_total` | `SMALLINT` | DEFAULT `0` | Total vehicle capacity |
| `unparsed_address` | `TEXT` | | Raw or combined address line |
| `subdivision_name` | `VARCHAR(128)`| | Subdivision, enclave, or building development |
| `state_or_province`| `VARCHAR(64)` | | RESO province / state |
| `postal_code` | `VARCHAR(20)` | DEFAULT `'1000'` | ZIP / Postal code |
| `public_remarks` | `TEXT` | | Public editorial narrative description |
| `custom_reso_attributes`| `JSONB` | DEFAULT `'{}'::jsonb` | Extensible RESO attributes & vendor metadata |
| `list_agent_key` | `UUID` | **FK** (`public.profiles.id`) | Assigned licensed broker / agent |
| `is_featured` | `BOOLEAN` | DEFAULT `FALSE` | Featured hero showcase flag |
| `transaction_type` | `VARCHAR(32)` | DEFAULT `'For Sale'` | Listing contract type |
| `property_condition`| `VARCHAR(32)`| | Physical condition (e.g. `Ready for Occupancy`, `Pre-Selling`) |
| `parking_covered` | `SMALLINT` | DEFAULT `0` | Covered garage bays |
| `parking_open` | `SMALLINT` | DEFAULT `0` | Open driveway slots |
| `property_type_id`| `BIGINT` | NOT NULL, **FK** (`public.property_types.id`) | Foreign key to architectural property type lookup |

### Database Triggers & Rules
1. **Status Lifecycle Guard (`trg_enforce_property_status`):** Ensures only users with `broker` or `admin` roles can transition a listing's `standard_status` to `'Active'`.
2. **Media Array Synchronization (`trg_sync_property_media`):** Automatically aggregates `media_url` entries of category `'Photo'` from `property_media` directly into `properties.images`.

### Row Level Security (RLS) Policies
- **SELECT:** Publicly viewable if `standard_status = 'Active'`. Creators, assigned agents, brokers, and admins can view non-active listings.
- **INSERT:** Restricted strictly to authorized Brokers and Administrators (`EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))`). Real estate agents CANNOT directly insert property records.
- **UPDATE / DELETE:** Restricted strictly to Brokers and Administrators. Real estate agents cannot mutate live property listings directly; they must submit edit proposals via `public.property_edit_requests`.

---

## 3. Property Confidential (`public.property_confidential`)
One-to-one secure extension of `properties`. Holds private broker comments, showing protocols, and lockbox combinations. **Strictly locked down by RLS**; anonymous and public client queries are unconditionally denied.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `property_id` | `UUID` | **PK**, **FK** (`public.properties.id` ON DELETE CASCADE) | Links 1-to-1 with a parent listing |
| `private_remarks` | `TEXT` | | Internal confidential broker notes |
| `showing_instructions`| `TEXT` | | Rules, gate access protocols, and inspection requirements |
| `lockbox_type` | `VARCHAR(64)` | | Lockbox hardware (e.g. `MasterLock Dial`, `Digital Keypad`) |
| `lockbox_location` | `TEXT` | | Physical placement of lockbox |
| `lockbox_code` | `TEXT` | | Access pin / gate pass |
| `buyer_agency_compensation` | `VARCHAR(64)` | | Commission split rate (e.g. `3.0% Co-Broke`) |
| `seller_direct_phone` | `VARCHAR(32)` | | Property owner private telephone |
| `seller_direct_email` | `VARCHAR(128)`| | Property owner private email |
| `expiration_date` | `DATE` | | Listing contract expiration date |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

### Row Level Security (RLS) Policies
- **ALL Actions (SELECT, INSERT, UPDATE, DELETE):** Restricted exclusively to authenticated users whose `public.profiles.role` is `'agent'`, `'broker'`, or `'admin'`.

---

## 4. Property Media (`public.property_media`)
High-resolution media assets conforming to the RESO Media Resource standard.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Media record identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `media_key` | `VARCHAR(64)` | UNIQUE, NOT NULL, DEFAULT `('MED-' \|\| gen_random_uuid())` | RESO unique media key |
| `media_url` | `TEXT` | NOT NULL | Direct CDN / Supabase Storage URL |
| `media_category` | `VARCHAR(32)` | NOT NULL, DEFAULT `'Photo'`, CHECK (`media_category IN ('Photo', 'FloorPlan', 'Video', 'VirtualTour', 'Document')`) | Asset classification |
| `order_index` | `INTEGER` | NOT NULL, DEFAULT `0` | Sequence sort order (`0` = hero cover) |
| `short_description`| `VARCHAR(255)`| | Caption or label (e.g. `Living Area & Lanai`) |
| `mime_type` | `VARCHAR(64)` | DEFAULT `'image/jpeg'` | MIME content type |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Upload timestamp |

### Indexes
- `idx_property_media_lookup` on `(property_id, order_index ASC)`

### Row Level Security (RLS) Policies
- **SELECT:** Publicly viewable by anyone (`true`).
- **MANAGEMENT (INSERT, UPDATE, DELETE):** Authenticated agents, brokers, and administrators.

---

## 5. Property Rooms (`public.property_rooms`)
Architectural room ledger defining dimensions and levels per property.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Room identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `room_type` | `VARCHAR(64)` | NOT NULL, CHECK (`room_type IN ('Primary Bedroom', 'Bedroom', 'Bathroom', 'Living Room', 'Dining Room', 'Kitchen', 'Home Office', 'Balcony', 'Laundry')`) | Room function |
| `room_level` | `VARCHAR(32)` | DEFAULT `'Main'`, CHECK (`room_level IN ('Main', 'Second', 'Third', 'Basement', 'Penthouse', 'Upper', 'Lower')`) | Architectural floor level |
| `room_length` | `NUMERIC(6, 2)`| | Length measurement |
| `room_width` | `NUMERIC(6, 2)`| | Width measurement |
| `room_dimensions_units` | `VARCHAR(16)` | DEFAULT `'Meters'`, CHECK (`room_dimensions_units IN ('Meters', 'Feet')`) | Dimension scale |
| `room_features` | `TEXT[]` | DEFAULT `'{}'` | Room amenities (e.g. `Dual Vanity`, `Walk-in Closet`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |

### Indexes
- `idx_property_rooms_property_id` on `(property_id)`

### Row Level Security (RLS) Policies
- **SELECT:** Publicly viewable by anyone (`true`).
- **MANAGEMENT:** Authenticated agents, brokers, and administrators.

---

## 6. Inquiries (`public.inquiries`)
Lead capture and inquiries generated through public listing pages.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Inquiry record identifier |
| `property_id` | `UUID` | **FK** (`public.properties.id` ON DELETE SET NULL) | Linked property (optional) |
| `name` | `TEXT` | NOT NULL | Client full name |
| `email` | `TEXT` | NOT NULL | Client contact email |
| `phone` | `TEXT` | | Client telephone number |
| `message` | `TEXT` | NOT NULL | Inquirer's message or brief |
| `preferred_date`| `DATE` | | Preferred date for private viewings |
| `type` | `TEXT` | NOT NULL, DEFAULT `'general'`, CHECK (`type IN ('general', 'tour', 'offer')`) | Inquiry category |
| `status` | `TEXT` | NOT NULL, DEFAULT `'new'`, CHECK (`status IN ('new', 'contacted', 'scheduled', 'closed')`) | Lead management lifecycle |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last status update timestamp |

### Row Level Security (RLS) Policies
- **INSERT:** Publicly accessible (`true`).
- **SELECT / UPDATE:** Authenticated agents, brokers, and administrators.

---

## 7. Appointments (`public.appointments`)
Private showing schedules and broker calendar bookings.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Appointment record identifier |
| `property_id` | `UUID` | **FK** (`public.properties.id` ON DELETE CASCADE) | Scheduled listing |
| `agent_id` | `UUID` | **FK** (`public.profiles.id` ON DELETE SET NULL) | Assigned hosting agent |
| `client_name` | `TEXT` | NOT NULL | Client full name |
| `client_email`| `TEXT` | NOT NULL | Client contact email |
| `client_phone`| `TEXT` | | Client telephone number |
| `appointment_time` | `TIMESTAMPTZ` | NOT NULL | Scheduled appointment timestamp |
| `status` | `TEXT` | NOT NULL, DEFAULT `'requested'`, CHECK (`status IN ('requested', 'confirmed', 'completed', 'cancelled')`) | Appointment workflow status |
| `notes` | `TEXT` | | Broker / client appointment instructions |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Request timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

### Row Level Security (RLS) Policies
- **INSERT:** Publicly accessible (`true`) to allow client booking from property pages.
- **SELECT:** Assigned agent, or brokers/admins.
- **UPDATE:** Agents, brokers, and administrators.

---

## 8. Sales Conveyance (`public.sales`)
Closed transactions and transaction ledger for sales velocity tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | **PK** | Conveyance ledger identifier (e.g. `SLS-2026-001`) |
| `property_id` | `TEXT` | NOT NULL | Target property identifier |
| `property_title` | `TEXT` | NOT NULL | Property name snapshot |
| `property_location` | `TEXT` | NOT NULL | Geographic location snapshot |
| `client_name` | `TEXT` | NOT NULL | Buyer / grantee name |
| `agent_id` | `TEXT` | NOT NULL | Closing agent identifier |
| `agent_name` | `TEXT` | NOT NULL | Closing agent display name |
| `sale_date` | `TEXT` | NOT NULL | Closing date (ISO or formatted string) |
| `property_value` | `NUMERIC(15, 2)`| NOT NULL | Contract transacted price |
| `status` | `TEXT` | NOT NULL, DEFAULT `'PENDING'`, CHECK (`status IN ('COMPLETED', 'PENDING', 'CANCELLED')`) | Settlement status |
| `notes` | `TEXT` | DEFAULT `''` | Conveyance notes |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Record creation timestamp |

### Row Level Security (RLS) Policies
- **ALL Actions (SELECT, INSERT, UPDATE):** Authenticated users.

---

## 9. Notifications (`public.notifications`)
In-app notifications for agent and broker portals.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | **PK** | Notification identifier (e.g. `ntf-101`) |
| `title` | `TEXT` | NOT NULL | Alert title |
| `message` | `TEXT` | NOT NULL | Alert body text |
| `type` | `TEXT` | NOT NULL, CHECK (`type IN ('inquiry', 'verification', 'appointment', 'sale', 'property')`) | Notification category |
| `related_record` | `TEXT` | | Reference ID of linked entity |
| `timestamp` | `TEXT` | DEFAULT `'Recent'` | Display time pill |
| `is_read` | `BOOLEAN` | NOT NULL, DEFAULT `false` | Read status |
| `role` | `TEXT` | DEFAULT `'broker'` | Target role audience |
| `user_id` | `UUID` | **FK** (`auth.users.id` ON DELETE CASCADE) | Direct recipient user (optional) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Timestamp |

### Row Level Security (RLS) Policies
- **ALL Actions (SELECT, INSERT, UPDATE):** Authenticated users.

---

## 10. Agent Property Edit Requests (`public.property_edit_requests`)
Staging table for agent-initiated listing modification proposals requiring licensed broker or administrative review prior to publication.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique edit request identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target listing to modify |
| `agent_id` | `UUID` | NOT NULL, **FK** (`auth.users.id` ON DELETE CASCADE) | Proposing agent user ID |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'PENDING'`, CHECK (`status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`) | Proposal lifecycle status |
| `proposed_changes` | `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Delta payload of proposed modifications |
| `original_snapshot`| `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Point-in-time snapshot of property fields before edit |
| `agent_notes` | `TEXT` | | Agent rationale and justification for broker review |
| `reviewed_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Broker or administrator who reviewed the request |
| `reviewed_at` | `TIMESTAMPTZ` | | Timestamp of approval or rejection |
| `review_notes` | `TEXT` | | Broker approval remarks or instructions |
| `rejection_reason` | `TEXT` | | Mandatory explanation when proposal is declined |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last status change timestamp |

### Indexes & Constraints
- `idx_property_edit_requests_property` on `(property_id)`
- `idx_property_edit_requests_agent` on `(agent_id)`
- `idx_property_edit_requests_status` on `(status)`
- **Partial Unique Constraint (`idx_single_pending_request_per_property`):**
  ```sql
  CREATE UNIQUE INDEX idx_single_pending_request_per_property 
  ON public.property_edit_requests (property_id) 
  WHERE status = 'PENDING';
  ```
  Guarantees that no property can have more than one active pending edit proposal simultaneously.

### Row Level Security (RLS) Policies
- **SELECT:**
  - Brokers and Admins can view all proposals.
  - Agents can view proposals they submitted (`agent_id = auth.uid()`) or for listings assigned to them (`EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_edit_requests.property_id AND p.list_agent_key = auth.uid()))`.
- **INSERT:**
  - Authenticated Agents, Brokers, and Admins can propose edits for listings assigned to them or within their firm. Proposals are created with status `'PENDING'`.
- **UPDATE:**
  - Brokers and Admins can approve or reject proposals (`status IN ('APPROVED', 'REJECTED')`).
  - Proposing Agents can cancel their own pending proposals (`status = 'CANCELLED' WHERE agent_id = auth.uid() AND status = 'PENDING'`).

---

## 11. Property Audit Log (`public.property_audit_log`)
Immutable append-only audit trail recording every change applied to `public.properties`, including approved agent proposals, direct broker edits, and publication transitions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique audit entry identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Modified property reference |
| `action` | `VARCHAR(50)` | NOT NULL | Action tag (`PROPOSAL_APPROVED`, `DIRECT_UPDATE`, `CREATED`, etc.) |
| `changed_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Actor who authorized or executed the mutation |
| `changes` | `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Delta dictionary of modified field key-value pairs |
| `previous_state` | `JSONB` | | Full pre-mutation record state |
| `new_state` | `JSONB` | | Full post-mutation record state |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Immutable audit timestamp |

### Indexes
- `idx_property_audit_log_property` on `(property_id)`
- `idx_property_audit_log_created_at` on `(created_at DESC)`

### Row Level Security (RLS) Policies
- **SELECT:** Restricted to authorized Brokers and Administrators (`role IN ('broker', 'admin')`).
- **INSERT / UPDATE / DELETE:** Immutable. Direct user INSERT, UPDATE, and DELETE are strictly disabled (`false`). Inserts occur exclusively via SECURITY DEFINER stored procedures or administrative database triggers.

---

## 12. Transactional Stored Procedures

### `apply_property_edit_request(p_request_id UUID, p_reviewer_id UUID, p_notes TEXT)`
Executes the atomic promotion of an approved proposal to the live listing record.
- **Security:** `SECURITY DEFINER` (executes with elevated credentials to enforce RLS consistency).
- **Execution Steps:**
  1. Verifies that `p_request_id` exists and has `status = 'PENDING'`.
  2. Dynamically extracts `proposed_changes` JSONB and merges new values into `public.properties`.
  3. Updates `public.property_edit_requests` status to `'APPROVED'`, setting `reviewed_by = p_reviewer_id`, `reviewed_at = now()`, and `review_notes = p_notes`.
  4. Inserts an immutable row into `public.property_audit_log` with `action = 'PROPOSAL_APPROVED'`, before/after snapshots, and reviewer ID.
  5. If any step fails, the entire transaction rolls back.

### `reject_property_edit_request(p_request_id UUID, p_reviewer_id UUID, p_reason TEXT)`
Declines an agent edit proposal with mandatory reviewer remarks.
- **Security:** `SECURITY DEFINER`.
- **Execution Steps:**
  1. Validates that `p_request_id` exists and is `'PENDING'`.
  2. Enforces non-empty `p_reason`.
  3. Updates `public.property_edit_requests` status to `'REJECTED'`, setting `reviewed_by = p_reviewer_id`, `reviewed_at = now()`, and `rejection_reason = p_reason`.
  4. Leaves `public.properties` entirely unmodified.

