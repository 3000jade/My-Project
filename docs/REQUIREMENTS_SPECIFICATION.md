# Human Shelter Realty — Master Requirements Specification (SRS)

> **Document Type:** Single Living System Requirements Specification  
> **Standards Alignment:** ISO/IEC/IEEE 29148:2018 (Requirements Engineering) & ISO/IEC 25010:2023 (System Quality Models)  
> **Status:** Active / Living Document  
> **Maintenance Rule:** All future functional and non-functional requirements must be appended or updated directly in this file.

---

## 1. Revision & Update History

| Version | Date (UTC) | Author / Role | Affected Scope | Change Description |
| :---: | :---: | :--- | :--- | :--- |
| `1.11.0` | `2026-10-28` | Antigravity AI | Module 02 (Property Listing) | Registered and implemented `FR-PL-019`: Broker Cadastral Map Refactoring featuring segmented view switcher (Table, Grid, Cadastral Map Split-View), interactive two-way synchronized property cards and Leaflet price badges, unified CadastralLocationPicker with one-click presets, and full-scale EnlargedMapModal with Approved Coral beacon anchor. Verified via Vitest unit suites (46/46 tests passed) and live Playwright MCP E2E tests. |
| `1.10.0` | `2026-10-28` | Antigravity AI | Module 03 (Agent Management) | Registered and implemented `FR-AM-005`: High-Density Command Console for Broker Agent Management (`BrokerAgents.jsx`) featuring 4-metric slim telemetry cards, one-click status pill triage filters, on-demand toggleable analytics drawer (100% full-width grid mode), Radix dropdown context menus, and verified via Vitest and Playwright E2E suites. |
| `1.9.0` | `2026-10-28` | Antigravity AI | Module 01 (User Management) | Registered and implemented `FR-UM-005`: Full-stack Account Profile & Preferences Management across Client, Agent, and Broker portals with Modern SaaS tokens, anti-tampering guards, and Playwright E2E verification. |
| `1.8.0` | `2026-10-28` | Antigravity AI | Module 02 (Property Listing) | Registered and implemented `FR-PL-018`: Inline cadastral pinpoint map and fullscreen `EnlargedMapModal` with surrounding active marketplace properties. |
| `1.7.0` | `2026-10-28` | Antigravity AI | Module 02 (Property Listing) | Updated `FR-PL-008` through `FR-PL-014` to Implemented; verified full-stack vector maps, custom pins, Street View modal, places autocomplete, cadastral picker, and commute card across all 7 pages. |
| `1.6.0` | `2026-10-28` | Antigravity AI | Module 02 (Property Listing) | Registered `FR-PL-017` for multi-criteria PropertyFilterToolbar component refactoring and price range filtering. |
| `1.5.0` | `2026-10-28` | System Architect | Module 06 (Audit Trail) | Formalized Module 06 Specification; registered `FR-AU-003` through `FR-AU-008` (Agent audit events, sensitive field sanitization, immutability guard, dual-view timeline projection, query console, forensic export) and `NFR-AUD-001` through `NFR-AUD-002`. |
| `1.4.0` | `2026-10-28` | System Architect | Module 02 (Property Listing) | Registered `FR-PL-016` (Dedicated Property Type Pre-Creation Selection Page at `/broker/properties/select-type` with Icon and Name Only). |
| `1.3.0` | `2026-10-28` | System Architect | Module 02 (Property Listing) | Registered `FR-PL-015` (Interactive Property Type Option Cards & Dynamic Conditional Intake Adaptation). |
| `1.2.0` | `2026-10-28` | System Architect | Module 02 (Property Listing) | Registered `FR-PL-008` through `FR-PL-014` (Google Maps Platform Interface & Geospatial Capabilities) and `NFR-MAP-001` through `NFR-MAP-006`. |
| `1.1.0` | `2026-10-28` | System Architect | Module 02 (Property Listing) | Registered `FR-PL-006` (Decoupled Agent Assignment Architecture) and `FR-PL-007` (shadcn/ui Refactored Consoles & Intake Studio). |
| `1.0.0` | `2026-10-28` | System Architect | Modules 01–08 | Initial baseline consolidation of functional and non-functional requirements into single-source tables. |

---

## 2. Module Index & Scope Overview

| Module ID | Module Name | Scope & Primary Boundaries |
| :---: | :--- | :--- |
| **01** | **User Management** | Authentication, authorization, RBAC, session guards, profile verification, and inactivity timeouts. |
| **02** | **Property Listing** | RESO-aligned property catalogs, photos, CAD maps, room ledgers, confidential data isolation, and approval workflows. |
| **03** | **Agent Management** | Agent rosters, DHSUD/PRC license accreditation, single-use invitation tokens, schedules, and responsibility transfers. |
| **04** | **Sales and Reports** | Sales conveyances, commission attribution, revenue analytics, and transaction reporting. |
| **05** | **Database & Data Layer** | PostgreSQL schemas, migrations, triggers, foreign key integrity, and Row-Level Security (RLS). |
| **06** | **Audit Trail** | Immutable security events, administrative audit logs, and entity change histories. |
| **07** | **Inquiry & Comms** | Lead generation, viewing appointments, follow-up queues, notifications, and client triage. |
| **08** | **AI Concierge Assistant** | Real-time chat assistant, semantic property matching, inquiry summaries, and broker escalation. |

---

## 3. Functional Requirements (FR) Specification Table

| Req ID | Module | Feature / Capability | Description & Business Rules | Actors / Roles | Priority | Status | Verification Criteria |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `FR-UM-001` | 01 User Management | Credential Authentication | Secure email/password login and token generation via Supabase Auth. | All Users | P1 | Implemented | Automated auth integration tests pass. |
| `FR-UM-002` | 01 User Management | Role-Based Access Control | Strict authorization enforcing roles: `admin`, `broker`, `agent`, `client`. | All Users | P1 | Implemented | Role guard unit tests pass; unauthorized route returns 403. |
| `FR-UM-003` | 01 User Management | Inactivity Session Expiry | Idle session expires after 15 minutes of inactivity; redirects to re-login modal. | All Users | P1 | Implemented | Session timer test and re-login Playwright scenario pass. |
| `FR-UM-004` | 01 User Management | Profile & PRC/DHSUD Validation | Agent/Broker profiles record PRC license and DHSUD accreditation with expiration dates. | Broker, Agent | P2 | Implemented | Form validation and DB constraint verification. |
| `FR-UM-005` | 01 User Management | Account Profile & Preferences Management | Full-stack profile editing (`EditProfileDialog`) across Client, Agent, and Broker portals; persists contact info, luxury real estate enclaves/budgets, firm entities, bio, and multi-channel notification flags; enforces RESA RA 9646 regulatory protections (read-only PRC/DHSUD verification badges) and backend anti-tampering against unauthorized role elevation. | Client, Agent, Broker, Admin | P1 | Implemented | Backend tests (`profile.controller.test.ts`), frontend tests (`EditProfileDialog.test.jsx`, `ClientPortalPages.test.jsx`, `AgentProfile.test.jsx`, `BrokerProfile.test.jsx`), and Playwright E2E (`account-profile.spec.ts`) pass. |
| `FR-PL-001` | 02 Property Listing | RESO Property Creation | Create and publish properties with RESO Data Dictionary attributes (price, dimensions, PSGC location). | Broker, Agent | P1 | Implemented | Property submission Playwright E2E test. |
| `FR-PL-002` | 02 Property Listing | Listing Approval Lifecycle | Agent property edits/creates default to `Draft`/`Pending Approval`; only `broker` or `admin` can activate. | Broker, Agent | P1 | Implemented | DB status lifecycle trigger `enforce_property_status_lifecycle`. |
| `FR-PL-003` | 02 Property Listing | Confidential Remarks Isolation | Lockbox codes, seller contacts, and private remarks restricted from public view via RLS. | Broker, Agent | P1 | Implemented | Query from anon role receives null/access denied. |
| `FR-PL-004` | 02 Property Listing | Multi-Category Media Synchronization | Photos, floor plans, and virtual tours stored in `property_media` and mirrored to property image arrays. | Broker, Agent | P2 | Implemented | DB trigger `sync_property_media_to_images` fires on write. |
| `FR-PL-005` | 02 Property Listing | Full-Text & Geographic Search | Filter properties by price, status, city, PSGC code, and full-text keyword indexing. | Public, Client | P1 | Implemented | GIN full-text index and client search API tests pass. |
| `FR-PL-006` | 02 Property Listing | Decoupled Agent Assignment | Excludes sales agent assignment from property listing intake; assigns exclusively via Agent Management (`M03`). | Broker, Admin | P1 | Implemented | Step 1 intake exclusion and Playwright E2E decoupling assertions. |
| `FR-PL-007` | 02 Property Listing | shadcn/ui Refactored Consoles | Module 02 consoles (`BrokerProperties`, `BrokerCreateListings`, `CreateListingModal`, `BrokerPropertyDetail`, `AgentProperties`) refactored to shadcn/ui with design.md tokens, maintaining strict non-interference with public listviews. | Broker, Agent | P1 | Implemented | Primitives test suite (6/6), Component tests (43/43), and Playwright E2E suite (3/3) pass. |
| `FR-PL-008` | 02 Property Listing | Google Maps Vector Canvas & Luxury Theme | Render high-performance vector map canvas via `@googlemaps/js-api-loader` styled with Nordic Bauhaus daylight tokens (`#FBFBF9` ground, `#0F766E` Spruce Teal) and `data-lenis-prevent="true"` scroll isolation. | Public, Client, Broker | P1 | Implemented | Vector map loads cleanly; zero tile seams; trackpad wheel zooms map without triggering page scroll. |
| `FR-PL-009` | 02 Property Listing | Advanced HTML Price Pins & Dynamic Clustering | Implement `google.maps.marker.AdvancedMarkerElement` to render custom pill-shaped price markers with dual-state styling and dynamic density clustering via `@googlemaps/markerclusterer`. | Public, Client | P1 | Implemented | Custom DOM markers display formatted prices; clicking marker highlights item; clusters expand on zoom. |
| `FR-PL-010` | 02 Property Listing | "Search As I Move" Viewport Synchronization | Debounced listener (350ms) capturing `map.getBounds()` coordinates (`north`, `south`, `east`, `west`) to query properties strictly bounded by the active camera viewport. | Public, Client | P1 | Implemented | Dragging map triggers debounced API query; property grid synchronizes with visible markers. |
| `FR-PL-011` | 02 Property Listing | Google Street View 360° Immersion | Embedded and modal Street View viewer via `google.maps.StreetViewPanorama` with pre-check coverage verification (100m radius) to prevent blank views. | Public, Client, Agent | P2 | Implemented | Verified coordinate launches 360° tour; coordinate without coverage disables button with tooltip. |
| `FR-PL-012` | 02 Property Listing | Predictive Places Autocomplete with Localized Bias | Google Places Autocomplete in search headers and listing intake modals, biased to Philippine territory (`country: 'ph'`) with priority bounds for Metro Manila & Metro Cebu. | All Users | P1 | Implemented | Typing 3+ chars displays suggestions; selecting option parses exact `lat`, `lng`, and city name. |
| `FR-PL-013` | 02 Property Listing | Commute & Proximity Analysis to Luxury Hubs | Calculate driving distances and transit durations from property to key commercial hubs (BGC, Makati CBD, NAIA T3) via backend Distance Matrix proxy. | Public, Client, Broker | P2 | Implemented | Property detail page displays interactive commute card with verified durations and distances. |
| `FR-PL-014` | 02 Property Listing | Metropolitan Cadastral & District Polygon Overlays | Render GeoJSON boundary polygons representing prime districts (BGC, Makati CBD, Ayala Alabang) with interactive hover states and inventory count tooltips. | Public, Broker | P2 | Implemented | Toggling district overlay displays boundaries; hovering illuminates corridor and reveals property count. |
| `FR-PL-015` | 02 Property Listing | Interactive Property Type Option Cards | Interactive 7-card classification grid (`House & Lot`, `Condominium`, `Townhouse`, `Penthouse`, `Estate`, `Vacant Land / Lot`, `Commercial`) with dedicated icons, badges, descriptions, and dynamic field adaptation in subsequent steps (condo hides lot area, vacant land bypasses interior rooms). | Broker, Admin | P1 | Implemented | Vitest suite (`BrokerCreateListings.test.jsx`) and Playwright E2E (`property-agent-assignment-decoupling.spec.ts`) pass. |
| `FR-PL-016` | 02 Property Listing | Dedicated Property Type Pre-Creation Selection Page | Pre-creation screen (`/broker/properties/select-type`) rendering common property types (`House & Lot`, `Condominium`, `Townhouse`, `Lot / Land`, `Commercial`, `Apartment`, `Villa`, `Warehouse`) with icon and name only; clicking card automatically pre-populates wizard with selected type. | Broker, Admin | P1 | Implemented | Vitest suites (`BrokerPropertyTypeSelect.test.jsx`, `BrokerProperties.test.jsx`, `BrokerCreateListings.test.jsx`) and Playwright E2E pass. |
| `FR-PL-017` | 02 Property Listing | Multi-Criteria Property Filter Toolbar | Reusable 3-tier filtering toolbar with omni-search, status navigation pills with dynamic counter badges, type and location facets, price range popover with presets, sort selector, and active filter chips with individual removal and global reset. | Broker, Admin | High | Active | Vitest unit suite (`PropertyFilterToolbar.test.jsx`), BrokerProperties tests (`BrokerProperties.test.jsx`), and Playwright E2E pass. |
| `FR-PL-018` | 02 Property Listing | Property Detail Pinpoint & Enlarged Map Modal | High-resolution inline pinpoint map (zoom 16–17) with floating action dock on canvas and accessible fullscreen `EnlargedMapModal` revealing full-scale marketplace inventory anchored on the current property in Approved Coral (`#FF6B6B`). | Public, Client | P1 | Implemented | Vitest suites (`EnlargedMapModal.test.jsx`, `PropertyListingView.test.jsx`) pass. |
| `FR-PL-019` | 02 Property Listing | Broker Cadastral Map Refactoring & Split-View Integration | Segmented view switcher (`Table View`, `Grid View`, `Cadastral Map View`) in `BrokerProperties.jsx` with synchronized card/marker selection and sticky Leaflet map; unified `CadastralLocationPicker` with presets (`BGC`, `Makati`, `Ortigas`, `Cebu`, `Clark`) in `BrokerCreateListings.jsx`; and Location tab with `CommuteAnalysisCard` and `EnlargedMapModal` in `BrokerPropertyDetail.jsx`. | Broker, Admin | P1 | Implemented | Vitest suites (46/46 passed), Playwright MCP E2E tests (view switcher, preset sync, enlarged modal) verified locally. |
| `FR-AM-001` | 03 Agent Management | Single-Use Invitation Pipeline | Brokers invite agents using cryptographically secure, 72-hour expiring tokens. | Broker, Admin | P1 | Implemented | Token generation, invitation validation, and claim tests pass. |
| `FR-AM-002` | 03 Agent Management | Brokerage & Team Rosters | Group agents into brokerages and specialized teams with designated team leads. | Broker, Admin | P2 | Implemented | Schema validation and roster query API checks. |
| `FR-AM-003` | 03 Agent Management | Responsibility Transfer | Transfer assigned properties and open leads between agents with an immutable audit record. | Broker, Admin | P2 | Implemented | Transfer transaction and audit trigger execution checks. |
| `FR-AM-004` | 03 Agent Management | Availability Scheduling | Record agent working hours and recurring blackout periods for tour bookings. | Agent, Broker | P2 | Implemented | Calendar slot conflict detection tests. |
| `FR-AM-005` | 03 Agent Management | High-Density Broker Agent Command Console | Operational efficiency console for `BrokerAgents.jsx` with 4-metric slim telemetry strip (`Total Agents`, `Verified Agents`, `Pending Review`, `Active Invitations`), one-click status pill triage tabs (`All`, `Pending Review`, `Verified`, `Invited`, `Suspended`), toggleable Analytics & Insights panel allowing on-demand 100% full-width roster density, Radix dropdown row context menus, and global search with `⌘K` badge and clear CTA. | Broker, Admin | P1 | Implemented | Vitest unit suite (7/7 tests passed), Playwright E2E suite (`broker-agent-management.spec.ts` 5/5 passed), and live Playwright MCP interaction verification pass. |
| `FR-SR-001` | 04 Sales & Reports | Conveyance & Deal Logging | Record closed transactions, sale amounts, closing dates, and attributed listing/selling agents. | Broker, Admin | P1 | Implemented | Sales entry creation and balance consistency verification. |
| `FR-SR-002` | 04 Sales & Reports | Revenue Analytics & Metrics | Generate monthly revenue, average deal size, agent sales leaderboard, and commission splits. | Broker, Admin | P2 | Planned | Analytics aggregation query benchmarks. |
| `FR-DB-001` | 05 Database | Schema Integrity & Cascades | Enforce foreign key relations, UUID PKs, non-null checks, and timestamp defaults on all tables. | System | P1 | Implemented | Supabase migration and schema linting tests pass. |
| `FR-DB-002` | 05 Database | PSGC Location Hierarchy | Standardize Philippine Standard Geographic Code hierarchy (Region, Province, City, Barangay). | System | P2 | Implemented | PSGC lookup table queries and foreign references validate. |
| `FR-AU-001` | 06 Audit Trail | Immutable Security Audit | Record critical events (role modifications, logins, transfers, approvals) with IP and actor metadata. | System, Admin | P1 | Implemented | Audit write permissions restricted to system/service role. |
| `FR-AU-002` | 06 Audit Trail | Property Edit Log | Retain previous and new values for every property attribute modification. | Broker, Admin | P2 | Implemented | Property update triggers write to `property_audit_log`. |
| `FR-AU-003` | 06 Audit Trail | Agent Lifecycle Audit | Record agent onboarding, accreditation renewal, status transitions, and delegations in `agent_audit_events`. | Broker, Admin | P2 | Implemented | Status transition workflow and database triggers pass. |
| `FR-AU-004` | 06 Audit Trail | Sensitive Field Sanitization | Recursively scrub passwords, session tokens, cookies, and credentials from audit payloads before persistence. | System | P1 | Implemented | Payload sanitization unit tests pass with zero secret leakage. |
| `FR-AU-005` | 06 Audit Trail | Append-Only Immutability Guard | Enforce append-only store; revoke UPDATE/DELETE via RLS and reject API mutation attempts with HTTP 403. | System, All | P1 | Implemented | API tamper test & PostgreSQL permission verification pass. |
| `FR-AU-006` | 06 Audit Trail | Dual-Audience Activity Timeline | Project public milestones to clients while isolating staff dossier notes and operational reasons to internal roles. | Client, Agent, Broker | P2 | Implemented | Timeline projection tests verify confidential event omission. |
| `FR-AU-007` | 06 Audit Trail | Filtered Audit Query Console | Broker/Admin query engine filtering audit events by brokerage, inquiry, actor, event type, and outcome. | Broker, Admin | P2 | Implemented | Query filter tests pass with role-based access enforcement. |
| `FR-AU-008` | 06 Audit Trail | Forensic Compliance Export | Generate authorized audit log export package, recording an immutable `audit.exported` entry for self-auditing. | Broker, Admin | P2 | Implemented | Export endpoint integration test and audit trail check pass. |
| `FR-IN-001` | 07 Inquiry & Comms | Lead Capture Form | Prospective buyers submit inquiries with contact info, tour preferences, and property reference. | Public, Client | P1 | Implemented | Anonymous submission check and inquiry insertion test. |
| `FR-IN-002` | 07 Inquiry & Comms | Viewing Appointment Scheduling | Book property viewing slots, validate agent availability, and send confirmation emails/alerts. | Client, Agent | P1 | Implemented | Appointment booking workflow and conflict checks. |
| `FR-IN-003` | 07 Inquiry & Comms | Lead Triage & Follow-up Queue | Assign incoming inquiries to agents, manage inquiry statuses (`new`, `contacted`, `scheduled`, `closed`). | Broker, Agent | P2 | Implemented | Lead assignment and status transition tests. |
| `FR-AI-001` | 08 AI Concierge | Conversational Inquiry Assistant | Real-time chat widget providing contextual property answers using knowledge embeddings. | Public, Client | P2 | Implemented | Conversational roundtrip response verification. |
| `FR-AI-002` | 08 AI Concierge | Lead Conversation Summarization | Generate structured client preference summaries and route to broker dashboard for agent follow-up. | System, Broker | P2 | Implemented | Summary generation test and `inquiry_ai_summaries` insertion. |

---

## 4. Non-Functional Requirements (NFR) Specification Table

| Req ID | Characteristic (ISO 25010) | Requirement Description | Target Metric / Benchmark | Verification Method | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| `NFR-SEC-001` | **Security** | Row-Level Security (RLS) enabled on 100% of public database tables. | Zero unauthenticated writes or cross-tenant reads. | PostgreSQL policy audit script and permission tests. | Active |
| `NFR-SEC-002` | **Security** | Inactive session token invalidation. | Inactivity timeout forced at 15 minutes. | Automated session timer and redirect test suite. | Active |
| `NFR-SEC-003` | **Security** | License & Credential document isolation. | PRC/DHSUD proof documents accessible only by broker/admin. | Storage bucket RLS access test. | Active |
| `NFR-AUD-001` | **Security** | Non-repudiation & event immutability. | Zero modification or deletion of historical audit logs across all roles. | Automated API tamper tests (`PATCH`/`DELETE` rejection) & PostgreSQL RLS checks. | Active |
| `NFR-AUD-002` | **Security** | Automated sensitive credential redaction. | 0 occurrences of passwords, session tokens, or API secrets in stored audit JSON diffs. | Automated payload sanitization scan with sensitive key test suites. | Active |
| `NFR-PERF-001`| **Performance** | Property catalog search response time. | Filtered search returns in `< 250ms` (p95) for 10,000 listings. | Load testing script & GIN/B-tree index EXPLAIN analysis. | Active |
| `NFR-PERF-002`| **Performance** | Media asset delivery and compression. | Page visual complete `< 1.8s`; images served in WebP/AVIF. | Lighthouse performance audit score `>= 90`. | Active |
| `NFR-REL-001` | **Reliability** | Zero transactional data loss during property edits or agent assignments. | ACID compliance across multi-table operations. | Database transaction tests with simulated failures. | Active |
| `NFR-REL-002` | **Reliability** | Audit event delivery guarantee. | 100% of administrative and state transitions logged. | Automated reconciliation check between entities & audit table. | Active |
| `NFR-USE-001` | **Usability** | Design token & responsive UI consistency across mobile and desktop. | Compliance with `docs/implementation/design.md` tokens. | Playwright responsive viewport visual regression tests. | Active |
| `NFR-USE-002` | **Accessibility** | Color contrast and accessible form controls. | WCAG 2.1 AA compliance (contrast ratio `>= 4.5:1`). | Automated axe-core / Playwright accessibility scan. | Active |
| `NFR-MNT-001` | **Maintainability**| Strict end-to-end TypeScript contracts. | Zero `any` casts in shared contracts; strict null checks. | `pnpm tsc --noEmit` returns exit code 0. | Active |
| `NFR-MAP-001` | **Performance** | Initial vector map canvas render time. | First Vector Tile Render `< 500ms` on broadband connections. | Playwright trace & Chrome DevTools Performance Profiler. | Active |
| `NFR-MAP-002` | **Performance** | Marker rendering frame rate under load. | 60 FPS scrolling and panning with 250+ visible markers. | Marker clusterer stress benchmark with synthetic data. | Active |
| `NFR-MAP-003` | **Security** | Protection of Google Maps Platform API credentials. | Client key domain-restricted; server APIs proxied via backend gateway with IP restrictions. | Security audit inspection; zero server keys in client bundle. | Active |
| `NFR-MAP-004` | **Fault Tolerance**| Graceful fallback when Google Maps API fails or offline. | Render elegant fallback card or Leaflet fallback; zero unhandled JS exceptions. | Simulated script load failure in Vitest/Playwright tests. | Active |
| `NFR-MAP-005` | **Accessibility** | Keyboard navigability and ARIA screen reader compliance. | Map markers and HUD buttons navigable via `Tab`/`Enter`; markers provide descriptive `aria-label`. | Automated axe-core accessibility audit & keyboard traversal. | Active |
| `NFR-MAP-006` | **Cost Governance**| Server-side caching for external API queries. | Places Autocomplete, Geocoding, and Commute responses cached in backend memory for 5 minutes (`CACHE_TTL_MS = 300,000`). | Backend unit tests validating cache hits on identical queries. | Active |

---

## 5. Requirements Maintenance & Change Protocol

Whenever a new module, feature, or enhancement is introduced:
1. **Assign a Sequential ID:** Next available ID in the corresponding module (e.g., `FR-PL-006` or `NFR-PERF-003`).
2. **Update Priority & Status:** Set priority (`P1` - Critical, `P2` - High, `P3` - Medium) and status (`Planned`, `In Progress`, `Implemented`).
3. **Record in Revision History:** Add an entry to Section 1 detailing the modified requirements and author.
4. **Preserve Compatibility:** Do not delete or repurpose existing requirement IDs to maintain historical traceability.
