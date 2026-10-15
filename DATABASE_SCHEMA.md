# CP_kerby Database Schema Reference

This document outlines the complete PostgreSQL database architecture running on Supabase for the CP_kerby Luxury Architectural Real Estate Platform. It serves as the canonical reference specification matching the live Supabase schema definitions and table constraints.

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
            │       ┌───────────────────┼───────────────────┬───────────────────┐
            │       ▼                   ▼                   ▼                   ▼
            │ public.property_features public.property_images public.property_media public.property_rooms
            │ (Many-to-Many Features)  (1-to-Many Images)     (1-to-Many Media)     (1-to-Many Rooms)
            │                           │
            │                           ├───────────────────┬───────────────────┐
            │                           ▼                   ▼                   ▼
            │               public.property_confidential public.property_edit_requests public.property_audit_log
            │               (1-to-1 Broker Restricted)   (1-to-Many Staged Proposals) (1-to-Many Audit Log)
            │
            ├───────────────────────────┬───────────────────────────┬───────────────────────────┐
            ▼                           ▼                           ▼                           ▼
     public.inquiries            public.appointments           public.sales              public.features
     (Client Lead capture)       (Scheduled private tours)     (Transaction ledger)      (Amenity catalog)
```

---

## 1. Profiles (`public.profiles`)
Mirrors and extends Supabase `auth.users` with user roles, contact information, credentials, and verification status.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'agent'
    CHECK (role IN ('admin', 'broker', 'agent', 'client')),
  phone text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  prc_license_no text,
  prc_validity date,
  dhsud_accreditation_no text,
  dhsud_validity date,
  verification_status varchar(20) NOT NULL DEFAULT 'VERIFIED',
  supporting_documents jsonb DEFAULT '[]'::jsonb,
  rejection_remarks text,
  experience_years integer DEFAULT 0,
  bio text,
  suspension_reason text,
  suspension_notes text,
  suspended_by uuid REFERENCES auth.users(id),
  suspended_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, **FK** (`auth.users.id` ON DELETE CASCADE) | Primary identifier matching Supabase Auth UID |
| `email` | `TEXT` | NOT NULL | User's email address |
| `full_name` | `TEXT` | | User's full display name |
| `avatar_url` | `TEXT` | | Profile photo URL |
| `role` | `TEXT` | NOT NULL, DEFAULT `'agent'`, CHECK (`role IN ('admin', 'broker', 'agent', 'client')`) | Role-Based Access Control role |
| `phone` | `TEXT` | | Contact phone number |
| `prc_license_no` | `TEXT` | | PRC license number |
| `prc_validity` | `DATE` | | Expiry date of PRC license |
| `dhsud_accreditation_no` | `TEXT` | | DHSUD accreditation number |
| `dhsud_validity` | `DATE` | | Expiry date of DHSUD accreditation |
| `verification_status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'VERIFIED'` | Consultant credential status |
| `supporting_documents` | `JSONB` | DEFAULT `'[]'::jsonb` | License scans and documentation |
| `rejection_remarks` | `TEXT` | | Remarks provided upon rejected verification |
| `experience_years` | `INTEGER` | DEFAULT `0` | Active years in real estate practice |
| `bio` | `TEXT` | | Professional summary / background |
| `suspension_reason` | `TEXT` | | Reason for account suspension |
| `suspension_notes` | `TEXT` | | Internal audit notes for suspension |
| `suspended_by` | `UUID` | **FK** (`auth.users.id`) | Admin/Broker who suspended user |
| `suspended_at` | `TIMESTAMPTZ` | | Suspension timestamp |
| `verified_by` | `UUID` | **FK** (`auth.users.id`) | Admin/Broker who verified consultant |
| `verified_at` | `TIMESTAMPTZ` | | Verification timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

---

## 2. Property Types Lookup (`public.property_types`)
Normalized reference table defining supported architectural property classifications.

```sql
CREATE TABLE public.property_types (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | **PK**, GENERATED ALWAYS AS IDENTITY | Primary identifier |
| `name` | `TEXT` | NOT NULL, UNIQUE | Canonical property type name |

---

## 3. Feature / Amenity Catalog (`public.features`)
Normalized taxonomy catalog classifying property amenities and features into distinct architectural categories.

```sql
CREATE TABLE public.features (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category text NOT NULL
    CHECK (category IN ('general', 'interior', 'exterior')),
  name text NOT NULL,
  UNIQUE (category, name)
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | **PK**, GENERATED ALWAYS AS IDENTITY | Primary identifier |
| `category` | `TEXT` | NOT NULL, CHECK (`category IN ('general', 'interior', 'exterior')`) | Category domain |
| `name` | `TEXT` | NOT NULL | Feature / amenity name |

---

## 4. Properties (`public.properties`)
Master table storing property listings, architectural specifications, location hierarchy, and status.

```sql
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tagline text,
  price numeric(15, 2) NOT NULL,
  formatted_price text,

  address text NOT NULL,
  city text NOT NULL,
  state text,
  latitude double precision,
  longitude double precision,

  beds integer NOT NULL DEFAULT 1,
  baths integer NOT NULL DEFAULT 1,
  sqft numeric(10, 2) NOT NULL,
  year_built integer,
  architectural_style text,

  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'pending', 'sold')),

  created_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),

  listing_key varchar(64) UNIQUE,
  listing_id varchar(32) UNIQUE,
  standard_status varchar(32) NOT NULL DEFAULT 'Draft',
  property_sub_type varchar(64) DEFAULT 'Residential Condominium',
  association_fee_frequency varchar(20) DEFAULT 'Monthly',

  living_area numeric(10, 2),
  living_area_units varchar(20) DEFAULT 'Square Meters',
  lot_size_area numeric(12, 2),
  lot_size_units varchar(20) DEFAULT 'Square Meters',

  bedrooms_total smallint DEFAULT 1,
  bathrooms_total_integer smallint DEFAULT 1,
  bathrooms_full smallint DEFAULT 1,
  bathrooms_half smallint DEFAULT 0,
  stories_total smallint DEFAULT 1,
  parking_total smallint DEFAULT 0,

  unparsed_address text,
  subdivision_name varchar(128),
  state_or_province varchar(64),
  postal_code varchar(20),

  public_remarks text,
  custom_reso_attributes jsonb DEFAULT '{}'::jsonb,
  list_agent_key uuid REFERENCES public.profiles(id),
  is_featured boolean DEFAULT false,
  transaction_type varchar(32) DEFAULT 'For Sale',
  property_condition varchar(32),
  parking_covered smallint DEFAULT 0,
  parking_open smallint DEFAULT 0,
  property_type_id bigint NOT NULL
    REFERENCES public.property_types(id),

  region text,
  region_psgc_code text,
  province_psgc_code text,
  city_psgc_code text,
  barangay text,
  barangay_psgc_code text,
  building_name text,

  CONSTRAINT properties_region_psgc_code_format
    CHECK (
      region_psgc_code IS NULL
      OR region_psgc_code ~ '^[0-9]{10}$'
    ),

  CONSTRAINT properties_province_psgc_code_format
    CHECK (
      province_psgc_code IS NULL
      OR province_psgc_code ~ '^[0-9]{10}$'
    ),

  CONSTRAINT properties_city_psgc_code_format
    CHECK (
      city_psgc_code IS NULL
      OR city_psgc_code ~ '^[0-9]{10}$'
    ),

  CONSTRAINT properties_barangay_psgc_code_format
    CHECK (
      barangay_psgc_code IS NULL
      OR barangay_psgc_code ~ '^[0-9]{10}$'
    )
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Primary listing identifier |
| `title` | `TEXT` | NOT NULL | Property headline/title |
| `tagline` | `TEXT` | | Editorial subtitle |
| `price` | `NUMERIC(15, 2)`| NOT NULL | Numeric listing price |
| `formatted_price` | `TEXT` | | Formatted price string (e.g. `₱28,500,000`) |
| `address` | `TEXT` | NOT NULL | Street / Unit address |
| `city` | `TEXT` | NOT NULL | City / Municipality |
| `state` | `TEXT` | | Region / State fallback |
| `latitude` | `DOUBLE PRECISION` | | Geocoded latitude coordinate |
| `longitude` | `DOUBLE PRECISION` | | Geocoded longitude coordinate |
| `beds` | `INTEGER` | NOT NULL, DEFAULT `1` | Ergonomic bedroom count |
| `baths` | `INTEGER` | NOT NULL, DEFAULT `1` | Ergonomic bathroom count |
| `sqft` | `NUMERIC(10, 2)`| NOT NULL | Total square area |
| `year_built` | `INTEGER` | | Construction completion year |
| `architectural_style` | `TEXT` | | Architectural style |
| `status` | `TEXT` | NOT NULL, DEFAULT `'available'`, CHECK (`status IN ('available', 'pending', 'sold')`) | Legacy status flag |
| `created_by` | `UUID` | **FK** (`auth.users.id` ON DELETE SET NULL) | Creator account identifier |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Record last updated timestamp |
| `listing_key` | `VARCHAR(64)` | UNIQUE | Unique RESO listing key |
| `listing_id` | `VARCHAR(32)` | UNIQUE | Public MLS ID |
| `standard_status` | `VARCHAR(32)` | NOT NULL, DEFAULT `'Draft'` | RESO standard status (`Draft`, `Active`, etc.) |
| `property_sub_type` | `VARCHAR(64)` | DEFAULT `'Residential Condominium'` | Property sub-type |
| `association_fee_frequency` | `VARCHAR(20)` | DEFAULT `'Monthly'` | HOA fee billing frequency |
| `living_area` | `NUMERIC(10, 2)`| | Usable built-up floor area |
| `living_area_units`| `VARCHAR(20)` | DEFAULT `'Square Meters'` | Floor area measurement units |
| `lot_size_area` | `NUMERIC(12, 2)`| | Land parcel lot area |
| `lot_size_units` | `VARCHAR(20)` | DEFAULT `'Square Meters'` | Lot area measurement units |
| `bedrooms_total` | `SMALLINT` | DEFAULT `1` | Formal bedroom count |
| `bathrooms_total_integer` | `SMALLINT` | DEFAULT `1` | Total bathroom count |
| `bathrooms_full` | `SMALLINT` | DEFAULT `1` | Full bathroom count |
| `bathrooms_half` | `SMALLINT` | DEFAULT `0` | Powder / half-bath count |
| `stories_total` | `SMALLINT` | DEFAULT `1` | Total number of building stories |
| `parking_total` | `SMALLINT` | DEFAULT `0` | Total parking capacity |
| `unparsed_address` | `TEXT` | | Complete unparsed address preview |
| `subdivision_name` | `VARCHAR(128)`| | Subdivision or community name |
| `state_or_province`| `VARCHAR(64)` | | Province / State |
| `postal_code` | `VARCHAR(20)` | | ZIP / Postal code |
| `public_remarks` | `TEXT` | | Public editorial remarks |
| `custom_reso_attributes`| `JSONB` | DEFAULT `'{}'::jsonb` | Extensible custom RESO attributes |
| `list_agent_key` | `UUID` | **FK** (`public.profiles.id`) | Assigned listing agent |
| `is_featured` | `BOOLEAN` | DEFAULT `false` | Featured showcase flag |
| `transaction_type` | `VARCHAR(32)` | DEFAULT `'For Sale'` | Transaction type (`For Sale`, `For Rent`) |
| `property_condition`| `VARCHAR(32)`| | Property condition (`Brand New`, `RFO`, etc.) |
| `parking_covered` | `SMALLINT` | DEFAULT `0` | Covered garage parking slots |
| `parking_open` | `SMALLINT` | DEFAULT `0` | Open driveway parking slots |
| `property_type_id`| `BIGINT` | NOT NULL, **FK** (`public.property_types.id`) | Target property type reference |
| `region` | `TEXT` | | Administrative region name |
| `region_psgc_code`| `TEXT` | CHECK (`NULL` OR `^[0-9]{10}$`) | 10-digit Region PSGC code |
| `province_psgc_code`| `TEXT` | CHECK (`NULL` OR `^[0-9]{10}$`) | 10-digit Province PSGC code |
| `city_psgc_code` | `TEXT` | CHECK (`NULL` OR `^[0-9]{10}$`) | 10-digit City PSGC code |
| `barangay` | `TEXT` | | Barangay name |
| `barangay_psgc_code`| `TEXT` | CHECK (`NULL` OR `^[0-9]{10}$`) | 10-digit Barangay PSGC code |
| `building_name` | `TEXT` | | Building or tower name |

---

## 5. Property-to-Feature Links (`public.property_features`)
Many-to-many link table associating properties with specific catalog features.

```sql
CREATE TABLE public.property_features (
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  feature_id bigint NOT NULL
    REFERENCES public.features(id),
  PRIMARY KEY (property_id, feature_id)
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `property_id` | `UUID` | **PK**, **FK** (`public.properties.id` ON DELETE CASCADE) | Referenced property |
| `feature_id` | `BIGINT` | **PK**, **FK** (`public.features.id`) | Referenced feature |

---

## 6. Property Images (`public.property_images`)
Ordered gallery photos for property listings.

```sql
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order bigint NOT NULL CHECK (display_order > 0),
  UNIQUE (property_id, display_order)
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Image record identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `image_url` | `TEXT` | NOT NULL | Direct image URL |
| `display_order` | `BIGINT` | NOT NULL, CHECK (`display_order > 0`) | Display sequence order (`1` = cover photo) |

---

## 7. Property Media (`public.property_media`)
High-resolution multimedia assets, floorplans, virtual tours, and documents.

```sql
CREATE TABLE public.property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  media_key varchar(64) NOT NULL UNIQUE
    DEFAULT ('MED-'::text || gen_random_uuid()),
  media_url text NOT NULL,
  media_category varchar(32) NOT NULL DEFAULT 'Photo'
    CHECK (
      media_category IN (
        'Photo',
        'FloorPlan',
        'Video',
        'VirtualTour',
        'Document'
      )
    ),
  order_index integer NOT NULL DEFAULT 0,
  short_description varchar(255),
  mime_type varchar(64) DEFAULT 'image/jpeg',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Media record identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `media_key` | `VARCHAR(64)` | NOT NULL, UNIQUE | Media resource key |
| `media_url` | `TEXT` | NOT NULL | Direct media asset URL |
| `media_category` | `VARCHAR(32)` | NOT NULL, DEFAULT `'Photo'`, CHECK (`category IN ('Photo', 'FloorPlan', 'Video', 'VirtualTour', 'Document')`) | Media category |
| `order_index` | `INTEGER` | NOT NULL, DEFAULT `0` | Sort order index |
| `short_description`| `VARCHAR(255)`| | Media caption / description |
| `mime_type` | `VARCHAR(64)` | DEFAULT `'image/jpeg'` | MIME content type |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Upload timestamp |

---

## 8. Property Rooms (`public.property_rooms`)
Architectural room ledger defining dimensions and levels per property.

```sql
CREATE TABLE public.property_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type varchar(64) NOT NULL
    CHECK (
      room_type IN (
        'Primary Bedroom',
        'Bedroom',
        'Bathroom',
        'Living Room',
        'Dining Room',
        'Kitchen',
        'Home Office',
        'Balcony',
        'Laundry'
      )
    ),
  room_level varchar(32) DEFAULT 'Main'
    CHECK (
      room_level IN (
        'Main',
        'Second',
        'Third',
        'Basement',
        'Penthouse',
        'Upper',
        'Lower'
      )
    ),
  room_length numeric(6, 2),
  room_width numeric(6, 2),
  room_dimensions_units varchar(16) DEFAULT 'Meters'
    CHECK (room_dimensions_units IN ('Meters', 'Feet')),
  room_features text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Room identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `room_type` | `VARCHAR(64)` | NOT NULL, CHECK constraint | Functional room type |
| `room_level` | `VARCHAR(32)` | DEFAULT `'Main'`, CHECK constraint | Architectural floor level |
| `room_length` | `NUMERIC(6, 2)`| | Length dimension |
| `room_width` | `NUMERIC(6, 2)`| | Width dimension |
| `room_dimensions_units` | `VARCHAR(16)` | DEFAULT `'Meters'`, CHECK (`'Meters'`, `'Feet'`) | Measurement unit |
| `room_features` | `TEXT[]` | DEFAULT `'{}'::text[]` | Array of specific room features |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |

---

## 9. Confidential Property Information (`public.property_confidential`)
One-to-one secure extension of `properties` storing private broker showing instructions and lockbox details.

```sql
CREATE TABLE public.property_confidential (
  property_id uuid PRIMARY KEY
    REFERENCES public.properties(id) ON DELETE CASCADE,
  private_remarks text,
  showing_instructions text,
  lockbox_type varchar(64),
  lockbox_location text,
  lockbox_code text,
  buyer_agency_compensation varchar(64),
  seller_direct_phone varchar(32),
  seller_direct_email varchar(128),
  expiration_date date,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `property_id` | `UUID` | **PK**, **FK** (`public.properties.id` ON DELETE CASCADE) | Links 1-to-1 with a parent listing |
| `private_remarks` | `TEXT` | | Private broker notes |
| `showing_instructions`| `TEXT` | | Access and showing instructions |
| `lockbox_type` | `VARCHAR(64)` | | Lockbox hardware type |
| `lockbox_location` | `TEXT` | | Location of lockbox |
| `lockbox_code` | `TEXT` | | Gate pass / lockbox combination |
| `buyer_agency_compensation` | `VARCHAR(64)` | | Commission split rate |
| `seller_direct_phone` | `VARCHAR(32)` | | Owner direct contact phone |
| `seller_direct_email` | `VARCHAR(128)`| | Owner direct contact email |
| `expiration_date` | `DATE` | | Listing contract expiration date |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

---

## 10. Property Edit Requests (`public.property_edit_requests`)
Staged workflow for agent listing modification proposals submitted for broker/admin approval.

```sql
CREATE TABLE public.property_edit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_status varchar(32) NOT NULL DEFAULT 'PENDING'
    CHECK (
      request_status IN (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'CONFLICT'
      )
    ),
  proposed_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_version integer NOT NULL DEFAULT 1,
  agent_notes text,
  reviewed_by uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Proposal identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Target property identifier |
| `agent_id` | `UUID` | NOT NULL, **FK** (`public.profiles.id` ON DELETE CASCADE) | Proposing agent identifier |
| `request_status` | `VARCHAR(32)` | NOT NULL, DEFAULT `'PENDING'`, CHECK constraint | Lifecycle status (`PENDING`, `APPROVED`, etc.) |
| `proposed_changes` | `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Proposed delta key-values |
| `original_snapshot`| `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Baseline listing state snapshot |
| `base_version` | `INTEGER` | NOT NULL, DEFAULT `1` | Concurrency version counter |
| `agent_notes` | `TEXT` | | Proposing agent's rationale notes |
| `reviewed_by` | `UUID` | **FK** (`public.profiles.id` ON DELETE SET NULL) | Reviewing broker/admin identifier |
| `reviewed_at` | `TIMESTAMPTZ` | | Review decision timestamp |
| `review_notes` | `TEXT` | | Reviewer remarks |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last status change timestamp |

---

## 11. Property Audit History (`public.property_audit_log`)
Immutable append-only audit trail recording every change applied to listings.

```sql
CREATE TABLE public.property_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  request_id uuid
    REFERENCES public.property_edit_requests(id) ON DELETE SET NULL,
  actor_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type varchar(32) NOT NULL
    CHECK (
      action_type IN (
        'CREATED',
        'EDIT_APPROVED',
        'EDIT_REJECTED',
        'DIRECT_UPDATE',
        'STATUS_CHANGE',
        'MEDIA_UPDATE',
        'DELETED'
      )
    ),
  changed_fields text[] NOT NULL DEFAULT '{}'::text[],
  previous_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Audit entry identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Referenced property |
| `request_id` | `UUID` | **FK** (`public.property_edit_requests.id` ON DELETE SET NULL)| Associated proposal reference |
| `actor_id` | `UUID` | **FK** (`public.profiles.id` ON DELETE SET NULL) | User who executed the mutation |
| `action_type` | `VARCHAR(32)` | NOT NULL, CHECK constraint | Action classification |
| `changed_fields` | `TEXT[]` | NOT NULL, DEFAULT `'{}'::text[]` | Array of modified column names |
| `previous_data` | `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Pre-mutation state snapshot |
| `new_data` | `JSONB` | NOT NULL, DEFAULT `'{}'::jsonb` | Post-mutation state snapshot |
| `audit_notes` | `TEXT` | | Optional audit remarks |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Immutable audit timestamp |

---

## 12. Inquiries (`public.inquiries`)
Customer inquiry and lead-capture records.

```sql
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid
    REFERENCES public.properties(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  preferred_date date,
  type text NOT NULL DEFAULT 'general'
    CHECK (type IN ('general', 'tour', 'offer')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Inquiry identifier |
| `property_id` | `UUID` | **FK** (`public.properties.id` ON DELETE SET NULL) | Targeted property |
| `name` | `TEXT` | NOT NULL | Inquirer full name |
| `email` | `TEXT` | NOT NULL | Inquirer email |
| `phone` | `TEXT` | | Inquirer contact number |
| `message` | `TEXT` | NOT NULL | Inquiry message body |
| `preferred_date` | `DATE` | | Preferred tour date |
| `type` | `TEXT` | NOT NULL, DEFAULT `'general'`, CHECK (`'general'`, `'tour'`, `'offer'`) | Inquiry type |
| `status` | `TEXT` | NOT NULL, DEFAULT `'new'`, CHECK (`'new'`, `'contacted'`, `'scheduled'`, `'closed'`) | Inquiry status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Inquiry timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

---

## 13. Appointments (`public.appointments`)
Scheduled private tours and property inspection appointments.

```sql
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid
    REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  appointment_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (
      status IN (
        'requested',
        'confirmed',
        'completed',
        'cancelled'
      )
    ),
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Appointment identifier |
| `property_id` | `UUID` | NOT NULL, **FK** (`public.properties.id` ON DELETE CASCADE) | Inspected property |
| `agent_id` | `UUID` | **FK** (`public.profiles.id` ON DELETE SET NULL) | Conducting agent |
| `client_name` | `TEXT` | NOT NULL | Client full name |
| `client_email` | `TEXT` | NOT NULL | Client email |
| `client_phone` | `TEXT` | | Client contact number |
| `appointment_time` | `TIMESTAMPTZ`| NOT NULL | Scheduled inspection timestamp |
| `status` | `TEXT` | NOT NULL, DEFAULT `'requested'`, CHECK constraint | Appointment status |
| `notes` | `TEXT` | | Tour notes |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Booking timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Last update timestamp |

---

## 14. Sales (`public.sales`)
Flat transaction ledger records recording completed and pending property sales.

```sql
CREATE TABLE public.sales (
  id text PRIMARY KEY,
  property_id text NOT NULL,
  property_title text NOT NULL,
  property_location text NOT NULL,
  client_name text NOT NULL,
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  sale_date text NOT NULL,
  property_value numeric(15, 2) NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | **PK** | Sale record identifier |
| `property_id` | `TEXT` | NOT NULL | Associated property ID |
| `property_title` | `TEXT` | NOT NULL | Property title |
| `property_location` | `TEXT` | NOT NULL | Property location |
| `client_name` | `TEXT` | NOT NULL | Purchasing client name |
| `agent_id` | `TEXT` | NOT NULL | Transacting agent ID |
| `agent_name` | `TEXT` | NOT NULL | Transacting agent display name |
| `sale_date` | `TEXT` | NOT NULL | Transaction date string |
| `property_value` | `NUMERIC(15, 2)`| NOT NULL | Final agreed sale amount |
| `status` | `TEXT` | NOT NULL, DEFAULT `'PENDING'`, CHECK (`'COMPLETED'`, `'PENDING'`, `'CANCELLED'`) | Sale closing status |
| `notes` | `TEXT` | DEFAULT `''` | Transaction remarks |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `timezone('utc', now())` | Record timestamp |
