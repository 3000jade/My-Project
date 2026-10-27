# Property Listing Module — UI Specification

- **Module ID:** M02
- **Module Folder:** `docs/modules/02-property-listing`
- **UI Applicability:** User-facing (Broker, Agent, and Public Property Portals)
- **Specification Status:** Approved
- **Implementation Status:** In Progress (Atomic shadcn/ui primitives deployed; component refactoring mapped)
- **Verification Status:** Pending Implementation Refactor
- **Last Updated:** 2026-10-28
- **Owner:** Frontend Architecture & Design System Team
- **Shared Design Rules:** [design.md](../../../design.md)
- **Current Module Specification:** [2026-10-27-property-listings-functions-specification.md](./2026-10-27-property-listings-functions-specification.md)
- **Scope Redefinition Record:** [2026-10-28-property-input-and-agent-assignment-scope-redefinition.md](./2026-10-28-property-input-and-agent-assignment-scope-redefinition.md)

---

## 1. Purpose and Scope

The **Property Listing Module (M02)** provides the core real estate inventory management, architectural cataloging, cadastral mapping, pricing governance, and public discovery surfaces for Human Shelter Realty.

### 1.1 In Scope
1. **Broker Property Management Console (`BrokerProperties.jsx`, `/broker/properties`):** High-density inventory ledger, proposal review drawers, publication lifecycle toggles, and status audits.
2. **Broker 7-Step Listing Intake & Edit Studio (`BrokerCreateListings.jsx`, `/broker/properties/create`, `/broker/properties/:id/edit`):** Decoupled intake wizard capturing basic information, geocoded cadastre coordinates, structural specifications, high-resolution media galleries, valuation/financial rules, and legal encumbrances.
3. **Quick Listing Modal (`CreateListingModal.jsx`):** Modal shortcut for rapid listing creation with zero agent-selection requirements.
4. **Broker Property Audit & Dossier View (`BrokerPropertyDetail.jsx`, `/broker/properties/:id`):** Full technical property dossier, audit log inspection, and confidential data access.
5. **Agent Property Portfolio Console (`AgentProperties.jsx`, `/agent/properties`):** Read-only listing directory for assigned sales agents, assignment confirmation handshake actions, and revision proposal submission.
6. **Public Property Discovery Catalog & Detail Reference (`PropertiesPage.jsx`, `PropertyListingView.jsx`):** Public viewing experience rendering corporate brokerage contact fallbacks for unassigned firm assets.
7. **Complete shadcn/ui Refactoring Blueprint:** Component-by-component architectural migration from bespoke JSX primitives to repository-owned Radix UI + Tailwind CSS v4 primitives in `frontend/src/components/ui/`.

### 1.2 Out of Scope
- Direct sales agent assignment inside Property Intake (relocated to Module 03 `03-agent-management` per approved decoupling scope).
- Runtime modifications to public listview client components (`PropertyListingView.jsx`, `PropertiesPage.jsx`) during intake refactoring (strict non-interference invariant).
- Direct seller payout transactions or conveyancing execution (governed by Module 04 `04-sales-and-reports`).

---

## 2. Roles and UI Access

| Role | View / Action | Visible / Enabled When | Enforcement Reference |
| :--- | :--- | :--- | :--- |
| **Broker / Admin** | Access `/broker/properties` (Full Ledger) | Authenticated with role `broker` or `admin` | `ProtectedRoute.jsx`, `requireRole(['broker', 'admin'])` |
| **Broker / Admin** | Create / Edit / Archive Listings (`BrokerCreateListings.jsx`) | Authenticated with role `broker` or `admin` | `property.routes.ts`, `requireRole(['broker', 'admin'])` |
| **Broker / Admin** | Publish / Unpublish Listings | Immediate toggle on active or draft inventory | `PropertyService.updatePropertyStatus` |
| **Broker / Admin** | View Confidential Dossier (Keys, Lockboxes, Seller Direct) | Authorized broker session | `PropertyService.getConfidentialData` |
| **Sales Agent** | Access `/agent/properties` (Assigned Portfolio) | Authenticated with role `agent` | `ProtectedRoute.jsx`, `requireRole(['agent', 'admin'])` |
| **Sales Agent** | Accept / Decline Assignment Handshake | Listing in `PENDING_CONFIRMATION` assigned to user | `PropertyService.confirmAssignment` |
| **Sales Agent** | Propose Property Edit Revisions | Listing assigned to agent in `ACCEPTED` status | `PropertyService.createEditProposal` |
| **Client / Public** | View Active Published Listings (`/properties`, `/properties/:id`) | Publicly accessible; unassigned listings show Corporate Desk | Public endpoint `GET /api/properties` |

---

## 3. Screen Inventory

| Screen ID | Screen / View | Route or Entry Point | Roles | Specification Anchor | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M02-SCR-01** | Broker Property Management Console | `/broker/properties` | Broker, Admin | [Section 5.1](#51-m02-scr-01-broker-property-management-console) | Ready for Refactor |
| **M02-SCR-02** | 7-Step Listing Intake & Edit Studio | `/broker/properties/create`, `/broker/properties/:id/edit` | Broker, Admin | [Section 5.2](#52-m02-scr-02-7-step-listing-intake--edit-studio) | Decoupled / Ready for Refactor |
| **M02-SCR-03** | Quick Listing Intake Modal | Global Dashboard Trigger | Broker, Admin | [Section 5.3](#53-m02-scr-03-quick-listing-intake-modal) | Decoupled / Ready for Refactor |
| **M02-SCR-04** | Broker Property Dossier & Audit View | `/broker/properties/:id` | Broker, Admin | [Section 5.4](#54-m02-scr-04-broker-property-dossier--audit-view) | Ready for Refactor |
| **M02-SCR-05** | Agent Property Portfolio & Handshake Console | `/agent/properties` | Agent, Admin | [Section 5.5](#55-m02-scr-05-agent-property-portfolio--handshake-console) | Ready for Refactor |
| **M02-SCR-06** | Public Property Detail View (Reference) | `/properties/:id` | Public, Client | [Section 5.6](#56-m02-scr-06-public-property-detail-view-reference) | Verified Stable (Invariant) |
| **M02-SCR-07** | Broker Property Type Selection Screen | `/broker/properties/select-type` | Broker, Admin | [Section 5.7](#57-m02-scr-07-broker-property-type-selection-screen) | Implemented & Verified |

---

## 4. User Journeys and Screen Transitions

```mermaid
flowchart TD
    subgraph IntakeFlow ["Intake Journey (Decoupled & Type-Selected)"]
        A1["Broker Dashboard / Ledger"] -->|Click '+ New Listing'| A1_5["M02-SCR-07: Select Property Type"]
        A1_5 -->|Click Card (Icon & Name Only)| A2["M02-SCR-02: 7-Step Studio (?type=...)"]
        A2 -->|Step 1: Title, Purpose, Type (No Agent)| A3["Step 2: Geocoded Location & PSGC"]
        A3 -->|Step 3: Specs & Cadastre| A4["Step 4: Media & Floor Plans"]
        A4 -->|Step 5: Valuation & Pricing| A5["Step 6: Legal & Encumbrances"]
        A5 -->|Step 7: Review & Final Checklist| A6["Save Unassigned Listing"]
        A6 -->|Redirects| B1["M02-SCR-01: Broker Management Console"]
    end

    subgraph AssignmentFlow ["Agent Assignment Journey (Cross-Module)"]
        B1 -->|Inventory Item Unassigned| C1["03-Agent-Management: BrokerAgentDetail"]
        C1 -->|Click '+ Assign Property'| C2["Assign Property Modal"]
        C2 -->|Confirm Assignment| C3["Status: PENDING_CONFIRMATION"]
    end

    subgraph HandshakeFlow ["Agent Handshake Journey"]
        C3 -->|Notification Dispatched| D1["M02-SCR-05: Agent Portfolio"]
        D1 -->|Review Mandate| D2{"Accept or Decline?"}
        D2 -->|Accept| D3["Status: ACCEPTED (Active Inventory)"]
        D2 -->|Decline with Reason| D4["Status: REJECTED (Action Required)"]
    end
```

| Flow ID | Entry / Preconditions | Steps and Screen IDs | Success Outcome | Failure / Recovery | Cross-Module Handoff |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M02-FLOW-01** | Broker on `/broker/dashboard` | 1. Navigate to `/broker/properties/create` (`M02-SCR-02`)<br>2. Complete 7 wizard steps without agent picker<br>3. Submit listing | Listing created with `assignment_status = 'UNASSIGNED'` and `list_agent_key = null` | Field validation errors highlighted in Step tab; draft autosaved to localStorage | Handoff to `03-agent-management` for consultant assignment |
| **M02-FLOW-02** | Broker on `/broker/properties` | 1. Filter by unassigned status (`M02-SCR-01`)<br>2. Open Quick Edit Drawer or row actions<br>3. Toggle publication status | Property status updated immediately with audit log entry | Network error displays destructive toast; status rolls back | N/A |
| **M02-FLOW-03** | Agent on `/agent/properties` | 1. View `PENDING_CONFIRMATION` banner (`M02-SCR-05`)<br>2. Inspect property specifications<br>3. Click "Accept Assignment" | Property status updates to `ACCEPTED` and active marketing begins | Error toast if network drops; retry available | Triggers in-app notification to Broker |
| **M02-FLOW-04** | Agent on `/agent/properties` | 1. Click "Decline Assignment"<br>2. Fill reason in dialog (e.g., location mismatch)<br>3. Confirm decline | Property status transitions to `REJECTED`, alerting broker | Form requires min 10 chars explanation | Alerts broker for reassignment |

---

## 5. Screen Specifications & shadcn/ui Refactoring

### 5.1 M02-SCR-01: Broker Property Management Console

- **Screen ID:** `M02-SCR-01`
- **Component File:** `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- **Route:** `/broker/properties`
- **Role Access:** Broker, Admin

#### 5.1.1 Visual Hierarchy & Tokens
- **Background Ground:** App Canvas `#F8FAFC` (`bg-background`).
- **Main Ledger Container:** Card surface `#FFFFFF` (`bg-surface`) with `#E2E8F0` hairline border (`border-border`) and `rounded-xl` geometry.
- **Header Actions:**
  - Primary Action: `Button` variant `default` (`#0F766E` Primary Teal) for `+ Create Listing`.
  - Secondary Action: `Button` variant `outline` (`#FFFFFF` surface, `#1E293B` text) for `Export CSV` / `Refresh`.

#### 5.1.2 shadcn/ui Component Refactoring Mapping

| Existing Bespoke Element | Target shadcn/ui Primitive | Implementation Path | Variant / Configuration |
| :--- | :--- | :--- | :--- |
| `DataTable.jsx` custom table | `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` | `frontend/src/components/ui/table.jsx` | High-density data ledger, sticky header, hover row highlight |
| Bespoke status badges | `Badge` | `frontend/src/components/ui/badge.jsx` | `success` (Active), `warning` (Pending Handshake), `secondary` (Unassigned), `outline` (Draft) |
| Native input search & filter bars | `Input`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | `frontend/src/components/ui/input.jsx`, `select.jsx` | `h-[40px]`, Slate border `#CBD5E1`, focus ring `#0F766E` |
| Native modal / quick actions | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | `frontend/src/components/ui/dropdown-menu.jsx` | Edit, Quick View, Reassign, Unpublish, Delete actions |
| PropertyQuickEditDrawer | `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle` | `frontend/src/components/ui/sheet.jsx` | 480px slide-out drawer on right edge |
| Delete confirmation alert | `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogAction` | `frontend/src/components/ui/alert-dialog.jsx` | Destructive red confirmation with title verification |
| Loading spinner | `Skeleton` | `frontend/src/components/ui/skeleton.jsx` | Table row pulse skeletons mimicking 6 tabular rows |

#### 5.1.3 Interaction & State Specifications
- **Default State:** Displays paginated listings table (10/25/50 per page) with thumbnails, cadastral IDs, address, price, assignment status, and quick action ellipsis.
- **Loading State:** 6-row `Skeleton` with pulsating avatar, title, and action pills.
- **Empty State:** Centered card with `Building2` icon, title *"No properties found"*, copy *"Try adjusting your search filters or add a new listing to inventory"*, and primary button *"+ Create Listing"*.
- **Error State:** In-line destructive alert banner (`Alert` variant `destructive`) with retry button.

#### 5.1.4 Acceptance Criteria
- [ ] **M02-SCR-01-AC-01:** Table renders property records matching RESO fields: `ListingKey`, `Title`, `City`, `ListPrice`, `StandardStatus`, `AssignmentStatus`.
- [ ] **M02-SCR-01-AC-02:** Clicking row actions ellipsis opens `DropdownMenu` with keyboard-accessible focus (Arrow Up/Down, Enter).
- [ ] **M02-SCR-01-AC-03:** Clicking "Quick Edit" opens `Sheet` drawer without full page reload.
- [ ] **M02-SCR-01-AC-04:** On viewports <768px, table collapses into high-density property cards with stacked attributes.

#### 5.1.5 Component Specification: PropertyFilterToolbar (`PropertyFilterToolbar.jsx`)
- **Component File:** `frontend/src/components/properties/PropertyFilterToolbar.jsx`
- **Requirement Reference:** `FR-PL-017`
- **Purpose:** Reusable, high-efficiency multi-criteria search and filter toolbar adhering to `design.md` tokens. Replaces fragmented inline dropdowns with a unified 3-tier filtering architecture.

##### 3-Tier Architecture
1. **Tier 1 (Status Navigation Pills):**
   - Horizontal pill tablist for property lifecycles (`All Listings`, `Active`, `Needs Approval`, `Proposals`, `Pending Confirmation`, `Action Required`, `Reserved`, `Sold`, `Draft`).
   - Dynamic counter badges with dual-state styling (active: Teal `#0F766E` background with white badge; inactive: transparent with `#E2E8F0` border and slate text `#64748B`).
2. **Tier 2 (Omni-Search & Faceted Controls):**
   - **Omni-Search:** Real-time text filter over titles, addresses, and reference codes with clear (`X`) button.
   - **Property Type Facet:** Dropdown facet with icon-augmented categories (`House & Lot`, `Condominium`, `Townhouse`, `Lot / Land`, `Commercial`, `Apartment`, `Villa`, `Warehouse`).
   - **Location Facet:** Dynamic district and city selector derived from inventory locations.
   - **Price Range Popover:** Expandable popover with numeric min/max inputs and quick preset buttons (`< ₱10M`, `₱10M - ₱25M`, `₱25M - ₱50M`, `₱50M+`).
   - **Sort Selector:** Quick order by newest, price ascending/descending, or alphabetical title.
3. **Tier 3 (Active Filter Chips Strip):**
   - Rendered conditionally when any non-default filter is applied.
   - Distinct dismissable chips for Search query, Property Type, Location, and Price Range with accessible `aria-label="Remove [facet] filter"`.
   - Result count indicator: *"Showing X of Y listings"*.
   - Global *"Clear all"* button resetting all active criteria simultaneously.

##### Props Interface
| Prop | Type | Description |
| :--- | :--- | :--- |
| `search` | `string` | Controlled search input value |
| `onSearchChange` | `(val: string) => void` | Search input update handler |
| `statusTab` | `string` | Active status key (`ALL`, `ACTIVE`, `NEEDS_APPROVAL`, etc.) |
| `onStatusTabChange` | `(tab: string) => void` | Status tab selection handler |
| `statusCounts` | `Record<string, number>` | Dictionary of counts per status tab |
| `selectedType` | `string` | Active property type filter (`ALL` or type name) |
| `onTypeChange` | `(type: string) => void` | Property type selection handler |
| `selectedLocation` | `string` | Active location filter (`ALL` or city/area name) |
| `onLocationChange` | `(loc: string) => void` | Location selection handler |
| `locationOptions` | `string[]` | Available unique locations for dropdown |
| `priceRange` | `{ min: string, max: string }` | Active min and max price criteria |
| `onPriceRangeChange` | `(range: { min: string, max: string }) => void` | Price range update handler |
| `sortBy` | `string` | Sort order (`newest`, `price_asc`, `price_desc`, `title_asc`) |
| `onSortByChange` | `(sort: string) => void` | Sort order change handler |
| `onResetFilters` | `() => void` | Reset all filters to default state |
| `totalCount` | `number` | Total unfiltered count of properties |
| `filteredCount` | `number` | Current filtered count of properties |

##### Design Token Adherence
- **Primary Teal:** `#0F766E` (Active tab background, active chip accents, focus rings).
- **Primary Hover:** `#115E59` (Hover states on interactive buttons).
- **Text:** Primary Slate 800 `#1E293B`, Muted Slate 500 `#64748B`.
- **Surfaces:** Card `#FFFFFF` with `#E2E8F0` hairline borders.
- **Accessibility:** Full keyboard navigability, contrast > 4.5:1, and explicit ARIA labels on all dismiss actions.

---

### 5.2 M02-SCR-02: 7-Step Listing Intake & Edit Studio

- **Screen ID:** `M02-SCR-02`
- **Component File:** `frontend/src/pages/portals/broker/BrokerCreateListings.jsx`
- **Route:** `/broker/properties/create`, `/broker/properties/:id/edit`
- **Role Access:** Broker, Admin

#### 5.2.1 Visual Hierarchy & Tokens
- **Wizard Progress Bar:** Sticky top navigation using `Tabs` / step breadcrumb indicators:
  - Completed steps: Teal `#0F766E` with checkmark icon.
  - Active step: Teal ring with bold text `#1E293B`.
  - Upcoming steps: Muted Slate `#64748B` with outline border `#E2E8F0`.
- **Form Surface:** White `#FFFFFF` card with 24px internal padding (`p-6 sm:p-8`), rounded-xl geometry, subtle shadow-xs.
- **Footer Navigation Bar:** Fixed/sticky bottom console with:
  - "Save Draft" (`Button` variant `outline`)
  - "Previous Step" (`Button` variant `ghost`)
  - "Next Step" / "Publish Listing" (`Button` variant `coral` with Slate text `#1E293B` for review step; variant `default` for intermediate steps).

#### 5.2.2 7-Step Architecture & shadcn/ui Refactoring

```text
Step 1: Basic Property Information (Listing Title, Transaction Purpose, Property Category, Description)
Step 2: Location & PSGC Cadastre (Street, Barangay, City, Province, Region, Coordinates Lat/Lng)
Step 3: Architectural Specifications (Beds, Baths, Living Area sqm, Lot Area sqm, Year Built, Features)
Step 4: Media & Digital Assets (Cover Photo, Gallery, Floor Plans PDF, Drone Video URL, 3D Virtual Tour)
Step 5: Valuation & Financials (List Price PHP, Association Fee, Real Property Tax, Commission Structure)
Step 6: Legal & Due Diligence (CCT/TCT Title Number, Tax Declaration, Encumbrance Notes, Private Remarks)
Step 7: Quality Audit & Publication Review (Completeness score, RESO compliance verification, Publish CTA)
```

| Studio Component / Section | Target shadcn/ui Primitive | Implementation Path | Variant / Configuration |
| :--- | :--- | :--- | :--- |
| Step progress header | `Tabs`, `TabsList`, `TabsTrigger` | `frontend/src/components/ui/tabs.jsx` | 7-step accessible navigation tablist with ARIA state |
| Text inputs & numbers | `Input` | `frontend/src/components/ui/input.jsx` | `h-[44px]`, numeric formatting with `font-mono` prefix `₱` |
| Textareas & descriptions | `Textarea` | `frontend/src/components/ui/textarea.jsx` | Min-height 120px, character counter at bottom right |
| Category & Type Selector | Option Cards Grid + `Select` fallback | `frontend/src/components/portals/broker/BrokerCreateListings.jsx` | 7 interactive option cards (`House & Lot`, `Condominium`, `Townhouse`, `Penthouse`, `Estate`, `Vacant Land / Lot`, `Commercial`) with Lucide icons, badges, and descriptions |
| Feature checklists | `Checkbox`, `Label` | `frontend/src/components/ui/checkbox.jsx`, `label.jsx` | 3-column grid of architectural amenities |
| Transaction type toggles | `ToggleGroup`, `ToggleGroupItem` | `frontend/src/components/ui/toggle-group.jsx` | "For Sale" vs "For Rent" pill toggle |
| Form validation alerts | `Alert`, `AlertTitle`, `AlertDescription` | `frontend/src/components/ui/alert.jsx` | In-line alerts for missing mandatory fields |
| Review step conversion CTA | `Button` (Coral) | `frontend/src/components/ui/button.jsx` | `variant="coral"` (`#FF6B6B` with `#1E293B` text at 5.27:1 contrast) |

#### 5.2.3 Interaction & Decoupled Input Rules
1. **Zero Agent Input in Step 1:** Step 1 strictly collects `title`, `transaction_type`, `property_type`, `property_sub_type`, and `description`. All sales agent selection elements are omitted.
2. **Autosave Engine:** Form state automatically persists to `localStorage` key `cp_broker_create_listing_draft` every 5 seconds of inactivity.
3. **Interactive Cadastre Geocoding:** Inputting address or moving map pin synchronizes `latitude`, `longitude`, and PSGC municipal codes.
4. **Publishing Readiness Checklist (Step 7):**
   - Title >= 10 chars.
   - List price > 0.
   - At least 1 high-resolution photo uploaded.
   - City and province populated.

#### 5.2.4 Acceptance Criteria
- [ ] **M02-SCR-02-AC-01:** Step 1 contains NO sales agent picker, selector, or agent validation requirement.
- [ ] **M02-SCR-02-AC-02:** Step 7 displays the approved Coral Review Button (`#FF6B6B` background, `#1E293B` slate text) meeting WCAG AA contrast (5.27:1).
- [ ] **M02-SCR-02-AC-03:** Form autosaves to `localStorage` without freezing main thread during large image uploads.
- [ ] **M02-SCR-02-AC-04:** Submitting Step 7 with `is_published=false` creates an unassigned draft; submitting with `is_published=true` creates an active unassigned listing.
- [x] **M02-SCR-02-AC-05:** Step 1 renders 7 property type option cards (`House & Lot`, `Condominium`, `Townhouse`, `Penthouse`, `Estate`, `Vacant Land / Lot`, `Commercial`) with dedicated icons, badges, descriptions, and active ring states; selecting `Condominium` or `Penthouse` conditionally removes Lot Area requirements in Step 3; selecting `Vacant Land / Lot` conditionally bypasses interior room specifications.

---

### 5.3 M02-SCR-03: Quick Listing Intake Modal

- **Screen ID:** `M02-SCR-03`
- **Component File:** `frontend/src/components/dashboard/CreateListingModal.jsx`
- **Trigger:** Global header action or dashboard quick-action button
- **Role Access:** Broker, Admin

#### 5.3.1 Visual Hierarchy & Tokens
- **Backdrop:** `bg-black/40 backdrop-blur-xs`.
- **Modal Surface:** `DialogContent` max-width 640px, rounded-2xl, white surface `#FFFFFF`.
- **Primary Action:** `Button` variant `default` (`#0F766E`) for "Create Listing".

#### 5.3.2 shadcn/ui Component Refactoring Mapping

| Existing Bespoke Element | Target shadcn/ui Primitive | Implementation Path | Variant / Configuration |
| :--- | :--- | :--- | :--- |
| Modal wrapper | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` | `frontend/src/components/ui/dialog.jsx` | Focus-trapped accessible dialog with close icon |
| Form inputs | `Input`, `Label` | `frontend/src/components/ui/input.jsx`, `label.jsx` | Two-column grid layout for title, price, city, type |
| Submit action | `Button` | `frontend/src/components/ui/button.jsx` | `h-[44px]` full-width or aligned right with loading spinner |

#### 5.3.3 Acceptance Criteria
- [ ] **M02-SCR-03-AC-01:** Opening modal renders focus in the `title` input.
- [ ] **M02-SCR-03-AC-02:** Escape key dismisses modal; click outside dismisses modal unless form is dirty (prompts discard confirmation).
- [ ] **M02-SCR-03-AC-03:** Submitting creates property with `agent_id = null` and navigates to the newly created listing or refreshes the ledger.

---

### 5.4 M02-SCR-04: Broker Property Dossier & Audit View

- **Screen ID:** `M02-SCR-04`
- **Component File:** `frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx`
- **Route:** `/broker/properties/:id`
- **Role Access:** Broker, Admin

#### 5.4.1 Visual Hierarchy & Tokens
- **Header Banner:** Breadcrumbs (`Breadcrumb`), status pill (`Badge`), listing title, cadastral key in `font-mono`, and quick edit trigger.
- **Tabbed Dossier:**
  - Tab 1: **Overview & Specs** (Beds, baths, living area, floor plans, valuation).
  - Tab 2: **Confidential Dossier** (Gate codes, lockbox passkeys, seller phone, commission splits).
  - Tab 3: **Assignment & Revisions History** (Consultant handshakes, edit proposals, broker reviews).
  - Tab 4: **Audit Trail** (Immutable timestamped change events from `public.property_audit_log`).

#### 5.4.2 shadcn/ui Component Refactoring Mapping

| Existing Bespoke Element | Target shadcn/ui Primitive | Implementation Path | Variant / Configuration |
| :--- | :--- | :--- | :--- |
| Dossier Tabs | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `frontend/src/components/ui/tabs.jsx` | Underline tabs with `#0F766E` active indicator |
| Confidential Cards | `Card`, `CardHeader`, `CardTitle`, `CardContent` | `frontend/src/components/ui/card.jsx` | Encrypted data cards with reveal-on-click toggle |
| Audit History Table | `Table`, `TableRow`, `TableCell` | `frontend/src/components/ui/table.jsx` | Compact monospace timestamp audit table |
| Status Pills | `Badge` | `frontend/src/components/ui/badge.jsx` | Active, Under Contract, Reserved, Closed |

#### 5.4.3 Acceptance Criteria
- [ ] **M02-SCR-04-AC-01:** Accessing Tab 2 verifies broker authentication before decrypting confidential remarks.
- [ ] **M02-SCR-04-AC-02:** Assignment status clearly displays whether the listing is `UNASSIGNED`, `PENDING_CONFIRMATION`, `ACCEPTED`, or `REJECTED`.

---

### 5.5 M02-SCR-05: Agent Property Portfolio & Handshake Console

- **Screen ID:** `M02-SCR-05`
- **Component File:** `frontend/src/pages/portals/agent/AgentProperties.jsx`
- **Route:** `/agent/properties`
- **Role Access:** Agent, Admin

#### 5.5.1 Visual Hierarchy & Tokens
- **Attention Banner:** Prominent notification card at top of page if any properties are in `PENDING_CONFIRMATION`.
  - Banner border: Amber warning `#F59E0B`.
  - Action buttons: "Accept Listing" (`Button` variant `default`) and "Decline" (`Button` variant `outline`).
- **Portfolio Grid:** High-density card grid rendering assigned properties with thumbnail, price, city, client inquiry count, and "Propose Update" CTA.

#### 5.5.2 shadcn/ui Component Refactoring Mapping

| Existing Bespoke Element | Target shadcn/ui Primitive | Implementation Path | Variant / Configuration |
| :--- | :--- | :--- | :--- |
| Handshake Banner | `Alert`, `AlertTitle`, `AlertDescription` | `frontend/src/components/ui/alert.jsx` | Warning styling with embedded CTA button group |
| Decline Dialog | `Dialog`, `DialogContent`, `DialogFooter` | `frontend/src/components/ui/dialog.jsx` | Modal prompting agent for decline reason (min 10 chars) |
| Proposal Drawer | `Sheet`, `SheetContent`, `SheetHeader` | `frontend/src/components/ui/sheet.jsx` | Edit proposal submission drawer |
| Property Cards | `Card`, `CardHeader`, `CardContent`, `CardFooter` | `frontend/src/components/ui/card.jsx` | Clean card with photo aspect ratio 16:9 |

#### 5.5.3 Acceptance Criteria
- [ ] **M02-SCR-05-AC-01:** Properties awaiting agent confirmation display prominent "Accept" and "Decline" controls.
- [ ] **M02-SCR-05-AC-02:** Clicking "Accept" sends `POST /api/properties/:id/confirm-assignment` and updates status to `ACCEPTED`.
- [ ] **M02-SCR-05-AC-03:** Clicking "Decline" opens dialog requiring reason before sending decline request.

---

### 5.6 M02-SCR-06: Public Property Detail View (Reference)

- **Screen ID:** `M02-SCR-06`
- **Component File:** `frontend/src/pages/public/PropertyListingView.jsx`
- **Route:** `/properties/:id`
- **Role Access:** Public, Client
- **Non-Interference Invariant:** **Zero code modifications permitted during intake refactor.**

#### 5.6.1 Verified Design System Alignment
- **Agent Contact Card Projection:**
  - If assigned to an agent: Renders Agent Avatar, Name, License Number, Phone, and Email.
  - If unassigned (`list_agent_key = null`): Gracefully projects **Corporate Brokerage Desk**:
    - Name: `Human Shelter Realty Desk`
    - Title: `Corporate Brokerage Desk`
    - Phone: `+63 2 8888 0000`
    - Email: `inquiries@humanshelterrealty.com`
    - Office: `Human Shelter Realty`

---

### 5.7 M02-SCR-07: Broker Property Type Selection Screen

- **Screen ID:** `M02-SCR-07`
- **Component File:** `frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.jsx`
- **Route:** `/broker/properties/select-type`
- **Role Access:** Broker, Admin

#### 5.7.1 Visual Hierarchy & Tokens
- **Header:** Standard `PageHeader` with title "Select Property Type", breadcrumbs (`Properties` -> `Select Type`), and "Back to Properties" action link.
- **Card Container:** White background `#FFFFFF`, border `#E2E8F0`, rounded-2xl geometry, `p-6 sm:p-10`.
- **Card Geometry:** Minimalist cards with **Icon and Name only** (zero description or badge clutter):
  - Card Unselected: `bg-[#F8FAFC]/50 border border-[#E2E8F0] hover:bg-white hover:border-[#0F766E] hover:shadow-md transition-all duration-200 cursor-pointer text-center`
  - Icon Badge: `w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-[#0F766E]`
  - Label: `text-sm sm:text-base font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors`

#### 5.7.2 Supported Common Classifications
1. `House & Lot` (`Home` icon)
2. `Condominium` (`Building2` icon)
3. `Townhouse` (`Building` icon)
4. `Lot / Land` (`MapPin` icon)
5. `Commercial` (`Store` icon)
6. `Apartment` (`Layers` icon)
7. `Villa` (`Palmtree` icon)
8. `Warehouse` (`Warehouse` icon)

#### 5.7.3 Interaction & Handoff
- Clicking any card navigates to `/broker/properties/create?type=${encodeURIComponent(typeName)}`.
- `BrokerCreateListings.jsx` automatically synchronizes `formData.property_type` from the URL search param on initial render.
- Completely decoupled from sales agent assignment.

---

## 6. Shared Component Architecture & Refactoring Recipes

All refactored components must use the canonical import paths and CVA bindings established in `design.md`:

```jsx
// Canonical Class Variance Authority Imports
import { cn } from "@/utils/cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
```

### Approved Brand Button Variations

```jsx
// 1. Primary Teal Brand Action
<Button variant="default">
  <Plus className="w-4 h-4 mr-2" />
  Create Listing
</Button>

// 2. Approved High-Impact Coral Conversion Action (WCAG 5.27:1 on #1E293B)
<Button variant="coral">
  <CheckCircle className="w-4 h-4 mr-2" />
  Review & Publish Listing
</Button>

// 3. Subtle Outline Ledger Action
<Button variant="outline" size="sm">
  <Filter className="w-3.5 h-3.5 mr-1.5" />
  Filters
</Button>
```

---

## 7. Responsive Breakpoints & Viewport Rules

| Viewport Range | Breakpoint | Property Ledger (`M02-SCR-01`) | Intake Wizard (`M02-SCR-02`) | Dossier (`M02-SCR-04`) |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | `< 640px` | Collapses into card view; quick actions in full-width bottom sheet | 1-column form; sticky step indicator at top; bottom full-width button | Single column stacked sections; drawer opens full screen |
| **Tablet** | `640px – 1023px` | Scrollable data table with sticky left column; compact filters | 2-column grid for basic info; full width photo uploader | 2-column layout; tabs wrap horizontally |
| **Desktop** | `>= 1024px` | Full high-density data table (all RESO columns); slide-over drawer | 2-column grid; 7-step horizontal wizard header; right-hand validation drawer | 3-column dossier layout (Specs 2 cols, Action / Audit sidebar 1 col) |

---

## 8. Accessibility & Compliance (WCAG 2.1 AA)

1. **Focus Management & Trapping:**
   - All modal dialogs (`Dialog`, `AlertDialog`) and slide-out drawers (`Sheet`) trap focus using Radix UI primitives.
   - Esc key closes open overlays and returns focus to the triggering element.
2. **Accessible Form Semantics:**
   - Every input has a corresponding `<Label htmlFor="...">`.
   - Error messages are associated via `aria-describedby="[field]-error"`.
   - Mandatory fields use `aria-required="true"`.
3. **Color Contrast:**
   - Primary Teal (`#0F766E`) against White surface: **4.54:1** (Passes WCAG AA).
   - Coral Accent (`#FF6B6B`) against Slate text (`#1E293B`): **5.27:1** (Passes WCAG AA).
   - Hairline borders (`#E2E8F0`) are purely structural and not required for 3:1 non-text contrast.
4. **Screen Reader Announcements:**
   - Step transitions in `M02-SCR-02` announce current step and total steps via `aria-live="polite"`.
   - Autosave indicators announce "Draft saved locally" via an off-screen live region.

---

## 9. Data Contracts & Service Integration

| Screen | Operation | Service Method | API Endpoint | Payload / Response |
| :--- | :--- | :--- | :--- | :--- |
| `M02-SCR-01` | Query Ledger | `propertyService.getProperties(params)` | `GET /api/properties` | Array of RESO 2.0 properties |
| `M02-SCR-01` | Filter Unassigned | `propertyService.getProperties({ unassigned: true })` | `GET /api/properties?unassigned=true` | Unassigned firm properties |
| `M02-SCR-02` | Create Listing | `propertyService.createProperty(payload)` | `POST /api/properties` | Returns `{ data: Property }` |
| `M02-SCR-02` | Update Listing | `propertyService.updateProperty(id, payload)` | `PUT /api/properties/:id` | Returns `{ data: Property }` |
| `M02-SCR-04` | Audit History | `propertyService.getAuditLogs(id)` | `GET /api/properties/:id/audit` | Array of audit change records |
| `M02-SCR-05` | Accept Mandate | `propertyService.confirmAssignment(id, 'ACCEPTED')` | `POST /api/properties/:id/confirm-assignment` | Handshake confirmation |
| `M02-SCR-05` | Decline Mandate | `propertyService.confirmAssignment(id, 'REJECTED', reason)` | `POST /api/properties/:id/confirm-assignment` | Handshake rejection with reason |

---

## 10. Module Business Rules & Dependencies

| Rule ID | Rule Summary | UI Effect | Dependent Module |
| :--- | :--- | :--- | :--- |
| **BR-PROP-01** | Philippine RESA (RA 9646) Broker Supervision | Only brokers can publish or modify live listings; agent updates require proposal approval | `01-user-management`, `02-property-listing` |
| **BR-PROP-02** | RESO Data Dictionary 2.0 Compliance | Standard status names (`Active`, `Pending`, `Closed`) and field schemas | Backend Schemas |
| **BR-PROP-03** | Decoupled Agent Assignment | Step 1 of property intake cannot prompt for or require an agent | `03-agent-management` |
| **BR-PROP-04** | Corporate Desk Fallback | Unassigned listings (`list_agent_key = null`) display firm desk contact details | Public Listing View |
| **BR-PROP-05** | Confidentiality Isolation | Passcodes, direct seller phones, and lockboxes hidden from non-broker roles | `06-audit` |

---

## 11. Acceptance & Verification Traceability

| Requirement ID | Screen IDs | Acceptance Criterion ID | Verification Method | Evidence Link | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-DECOUPLE-INTAKE** | `M02-SCR-02`, `M02-SCR-03` | `M02-SCR-02-AC-01` | Vitest Component Test | `BrokerCreateListings.test.jsx` (7 passed) | Verified |
| **REQ-CORAL-BUTTON** | `M02-SCR-02` | `M02-SCR-02-AC-02` | Visual & Contrast Check | `design.md` Section 3.1 & Appendix A | Verified (5.27:1) |
| **REQ-UNASSIGNED-PERSIST**| `M02-SCR-01`, `M02-SCR-02` | `M02-SCR-01-AC-01` | Backend Service Vitest | `property-assignment-confirmation.test.ts` (11 passed) | Verified |
| **REQ-DESK-FALLBACK** | `M02-SCR-06` | `M02-SCR-06-AC-01` | Unit Normalizer Vitest | `propertyService.test.js` (9 passed) | Verified |
| **REQ-E2E-DECOUPLING** | `M02-SCR-01`, `M02-SCR-02` | `M02-SCR-02-AC-04` | Playwright E2E Test | `property-agent-assignment-decoupling.spec.ts` (3 passed) | Verified |
| **REQ-SHADCN-TABLE-MIGRATION** | `M02-SCR-01` | `M02-SCR-01-AC-01` | Code Inspection / Vitest | Pending Code Refactor Phase | Pending |
| **REQ-SHADCN-STUDIO-TABS** | `M02-SCR-02` | `M02-SCR-02-AC-01` | Code Inspection / Vitest | Pending Code Refactor Phase | Pending |

---

## 12. Open Questions and Assumptions

| ID | Question / Assumption | Impact | Resolution |
| :--- | :--- | :--- | :--- |
| **Q-M02-01** | Should draft properties be visible to sales agents before publication? | Affects `AgentProperties.jsx` query filters | **Resolved:** Agents only see properties explicitly assigned to them after broker initiates assignment. Unassigned drafts remain exclusive to brokers/admins. |
| **Q-M02-02** | Can an unassigned property be published to the public portal? | Affects public discovery catalog | **Resolved:** Yes. Unassigned firm listings can be published as active inventory, projecting the Human Shelter Realty corporate brokerage desk contacts. |

---

## 13. Revision History

| Date | Affected Screen / Requirements | Change Description | Record Reference |
| :--- | :--- | :--- | :--- |
| `2026-10-27` | All Module 02 Functions | Initial ISO/IEC/IEEE functional specification delivered | `2026-10-27-property-listings-functions-specification.md` |
| `2026-10-28` | `M02-SCR-02`, `M02-SCR-03` | Decoupled sales agent assignment from intake; relocated assignment to Agent Management | `2026-10-28-property-input-and-agent-assignment-scope-redefinition.md` |
| `2026-10-28` | All Module 02 Screens | Established comprehensive UI specification and shadcn/ui refactoring blueprint adhering to `design.md` | `ui-specification.md` (this document) |
