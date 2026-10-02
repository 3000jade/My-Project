# CP_kerby Database Schema Map

This document outlines the current PostgreSQL database architecture, running on Supabase, based on the RESO Data Dictionary 2.0 standard.

## 1. Profiles (auth.users extension)
Manages user identity and access control.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK, FK** (auth.users) | Primary identifier, maps to Supabase Auth |
| `email` | `TEXT` | NOT NULL | User's email address |
| `full_name` | `TEXT` | | User's full name |
| `avatar_url` | `TEXT` | | Profile picture URL |
| `role` | `TEXT` | Default: 'agent' | `admin`, `broker`, `agent`, or `client` |
| `phone` | `TEXT` | | Contact number |

## 2. Properties (RESO 2.0 Standard)
Master table for all real estate listings. Publicly viewable when status is 'Active'.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | Primary identifier |
| `listing_key` | `VARCHAR(64)` | UNIQUE | Unique RESO key |
| `listing_id` | `VARCHAR(32)` | UNIQUE | MLS ID |
| `title` | `TEXT` | NOT NULL | Property headline/title |
| `standard_status` | `VARCHAR(32)` | Default: 'Draft' | `Draft`, `Active`, `Pending`, `Closed` |
| `property_type` | `TEXT` | NOT NULL | e.g. Condominium, Estate, Villa |
| `transaction_type`| `VARCHAR(32)`| Default: 'For Sale'| e.g. For Sale, For Rent |
| `property_condition`| `VARCHAR(32)`| | e.g. Pre-selling, RFO, Bare Shell |
| `price` | `NUMERIC` | NOT NULL | Listing price |
| `address`, `city`, `state` | `TEXT` | | Location data |
| `subdivision_name`, `postal_code` | `VARCHAR` | | Expanded Location data |
| `latitude`, `longitude` | `NUMERIC(10, 7)` | | Map coordinates |
| `beds`, `bedrooms_total` | `INTEGER` | | Count of legal bedrooms |
| `baths`, `bathrooms_full`, `bathrooms_half` | `INTEGER` | | Full and half (powder) baths |
| `living_area`, `sqft` | `NUMERIC` | | Floor area (Gross Built-Up Area) |
| `lot_size_area` | `NUMERIC` | | Footprint of the land parcel |
| `parking_total`, `parking_covered`, `parking_open` | `INTEGER` | | Covered vs open parking |
| `stories_total` | `INTEGER` | | Number of floors/levels |
| `features`, `images` | `TEXT[]` | | Array of tags and photo URLs |
| `list_agent_key` | `UUID` | **FK** (profiles.id)| Agent managing the listing |
| `created_by` | `UUID` | **FK** (auth.users)| User who created the listing |

## 3. Property Confidential
1-to-1 extension of properties. Stores internal broker notes. **Protected by strict Row Level Security (RLS)**; denies all public access.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `property_id` | `UUID` | **PK, FK** (properties)| Links 1-to-1 with a property |
| `private_remarks` | `TEXT` | | Internal broker notes |
| `showing_instructions`| `TEXT` | | Rules for touring |
| `lockbox_code` | `TEXT` | | Gate/Door access code |
| `buyer_agency_compensation` | `VARCHAR(64)` | | Co-broke commission split |
| `seller_direct_phone` | `VARCHAR(32)` | | Owner contact info |

## 4. Property Media
Tracks high-res assets linked to a listing. 
*Note: A database trigger automatically syncs the main `properties.images` array whenever photos are added here.*
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | Media file identifier |
| `property_id` | `UUID` | **FK** (properties)| Property the media belongs to |
| `media_url` | `TEXT` | NOT NULL | File URL |
| `media_category` | `VARCHAR(32)`| Default: 'Photo' | `Photo`, `Video`, `FloorPlan`, `VirtualTour` |
| `order_index` | `INTEGER` | Default: 0 | Sort order (0 = Hero Cover) |

## 5. Property Rooms
Standard residential ledger mapping specific rooms to properties.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | Room identifier |
| `property_id` | `UUID` | **FK** (properties)| Property the room belongs to |
| `room_type` | `VARCHAR(64)`| | e.g. Primary Bedroom, Kitchen, Balcony |
| `room_level` | `VARCHAR(32)`| | e.g. Main, Second, Basement |
| `room_length`, `room_width` | `NUMERIC` | | Dimensions |

## 6. Inquiries (Lead Capture)
Captures leads from the public website.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | Inquiry identifier |
| `property_id` | `UUID` | **FK** (properties)| Property inquired about (optional) |
| `name`, `email`, `phone` | `TEXT` | NOT NULL | Lead contact info |
| `message` | `TEXT` | NOT NULL | Client's request |
| `type` | `TEXT` | Default: 'general' | `general`, `tour`, `offer` |
| `status` | `TEXT` | Default: 'new' | `new`, `contacted`, `scheduled`, `closed`|

## 7. Appointments
Tracks scheduled private showings and calendar events.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | Appointment identifier |
| `property_id` | `UUID` | **FK** (properties)| Property to be shown |
| `agent_id` | `UUID` | **FK** (profiles.id)| Agent assigned to the showing |
| `client_name`, `email`| `TEXT` | NOT NULL | Client info |
| `appointment_time` | `TIMESTAMPTZ`| NOT NULL | Scheduled date/time |
| `status` | `TEXT` | Default: 'requested'| `requested`, `confirmed`, `completed` |

## 8. Sales (Conveyance)
Tracks closed property deals and revenue.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | **PK** | Ledger identifier |
| `property_id` | `TEXT` | | Reference to sold property |
| `client_name` | `TEXT` | | Buyer name |
| `agent_id` | `TEXT` | | Reference to selling agent |
| `property_value` | `NUMERIC` | | Final sale price |
| `status` | `TEXT` | Default: 'PENDING'| `PENDING`, `COMPLETED`, `CANCELLED` |

## 9. Notifications
System alerts for users in the dashboard.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | **PK** | Notification identifier |
| `title`, `message` | `TEXT` | NOT NULL | Alert content |
| `type` | `TEXT` | NOT NULL | `inquiry`, `verification`, `sale` |
| `user_id` | `UUID` | **FK** (auth.users) | Target user |
| `is_read` | `BOOLEAN` | Default: false | Read receipt state |
