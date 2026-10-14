# Phase 4: Frontend UI and Workflow Integration Design Report

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Specification Reference:** `docs/Property_listings/04-frontend-workflow-integration.md`  
**Referenced Predecessors:**  
- `01-database-schema-design.md` & `01-database-inspection-and-schema-design-report.md` (Phase 1)  
- `02-security-approval-workflow.md` & `02-security-and-approval-workflow-report.md` (Phase 2)  
- `03-backend-api-integration.md` & `phase-3-backend-integration-report.md` (Phase 3)  
**Execution Phase:** Phase 4 (Analysis and Frontend Design Only — No Code/Database Alterations)  
**Status:** COMPLETE (Pending User Approval)  
**Report Date:** 2026-10-14  

---

## 1. Existing Frontend Architecture Assessment

The Human Shelter Realty frontend is a single-page application (SPA) built with React 19, Vite 8, Tailwind CSS v4, and Lucide React icons. It features role-segmented portal spaces for Agents, Brokers, and Clients wrapped in `ProtectedRoute` and `DashboardLayout`.

```
frontend/src/
├── components/
│   ├── auth/                # Security guards (ProtectedRoute.jsx)
│   ├── cms/                 # Content drawers (PropertyQuickEditDrawer.jsx)
│   ├── dashboard/           # Shared portal UI (DashboardSidebar.jsx, PageHeader.jsx, DataTable.jsx, StatusBadge.jsx, EmptyState.jsx)
│   ├── layout/              # Header.jsx, Footer.jsx, DashboardLayout.jsx
│   └── ui/                  # Design system primitives, cards, sections, and modals (PropertyDetailModal.jsx)
├── context/                 # AuthContext.jsx
├── mockData/                # Static mock fixtures (mockProperties.js, mockAgents.js)
├── pages/
│   ├── portals/
│   │   ├── agent/           # AgentProperties.jsx, AgentPropertyCreate.jsx, AgentPropertyDetail.jsx
│   │   └── broker/          # BrokerProperties.jsx, BrokerCreateListings.jsx, BrokerPropertyDetail.jsx
│   └── public/              # HomePage.jsx, PropertiesPage.jsx, PropertyDetailPage.jsx
└── services/                # API client layer (apiClient.js, propertyService.js, driveService.js)
```

### 1.1 Architectural Strengths
- **Clean Component Primitives:** High-quality shared UI components (`PageHeader`, `DataTable`, `StatusBadge`, `DashboardModal`) follow the Modern SaaS Teal-Coral palette (`#0F766E`, `#FF6B6B`, `#1E293B`) and strict 8px spacing.
- **Centralized Service Client:** `frontend/src/services/propertyService.js` centralizes data normalization (`normalizeProperty`) and API communication with Express, avoiding fragmented fetch calls.
- **Role-Based Routing:** `ProtectedRoute.jsx` verifies roles (`allowedRoles={['broker', 'admin']}`) before rendering portal layouts.

### 1.2 Critical Frontend Deficiencies & Workflow Gaps
1. **Unauthorized Creation Exposure:** 
   - `App.jsx` exposes `/agent/properties/create` mapped to `BrokerCreateListings.jsx`.
   - `AgentProperties.jsx` renders an `+ Add Listing` button leading to this route.
   - `DashboardSidebar.jsx` (lines 176–191) renders a "New Property" submenu item with a plus icon under the agent's "Properties" nav item.
2. **Direct Live Property Mutation by Agents:**
   - In `AgentPropertyDetail.jsx`, the "Edit Listing" modal directly updates `price` and `status`.
   - The "Publish / Unpublish" toggle in `AgentPropertyDetail.jsx` mutates `is_published` directly without broker oversight.
3. **Missing Proposal & Staging Interface:**
   - No interface exists for agents to stage proposed changes, review diffs, or view approval/rejection status.
4. **Missing Broker Review Drawer:**
   - `BrokerProperties.jsx` provides an inline one-click "Approve" button for new listings (`standard_status = 'Pending Approval'`), but lacks any interface to inspect field-level edit proposals, compare old vs new values, or input rejection remarks.
5. **Form Field Leaks in Creation Studio:**
   - `BrokerCreateListings.jsx` Section 4 renders inputs for HOA dues (`associationFee`), frequency (`associationFeeFrequency`), and property tax (`taxAnnualAmount`), and tracks initial price (`originalListPrice`), violating confirmed field exclusions.

---

## 2. Current Page and Component Inventory

| File Path | Component Name | Primary Responsibility | Reusability in Target Workflow | Required Modifications |
| :--- | :--- | :--- | :---: | :--- |
| `src/pages/portals/agent/AgentProperties.jsx` | `AgentProperties` | Displays inventory of properties assigned to the agent. | **High** | • Remove `+ Add Listing` button.<br>• Add `Pending Edit Request` badge to row specs.<br>• Add "View Proposals" sub-tab. |
| `src/pages/portals/agent/AgentPropertyDetail.jsx` | `AgentPropertyDetail` | Detail view of an assigned property for the agent. | **High** | • Replace "Edit Listing" modal with "Propose Changes" drawer.<br>• Remove direct "Publish / Unpublish" toggle button.<br>• Add "Pending Review" banner if a proposal is active. |
| `src/pages/portals/agent/AgentPropertyCreate.jsx` | `AgentPropertyCreate` | Legacy standalone creation form for agents. | **None (Deprecate)** | • Remove component and delete route. Agents are not permitted to create listings. |
| `src/pages/portals/broker/BrokerCreateListings.jsx` | `BrokerCreateListings` | 7-section studio for listing creation and broker editing. | **High** | • Omit 4 excluded pricing/tax inputs from Section 4.<br>• Reuse section layout patterns for agent proposal studio. |
| `src/pages/portals/broker/BrokerProperties.jsx` | `BrokerProperties` | Master inventory table for brokers with tab filtering. | **High** | • Enhance "Needs Approval" tab to display staged edit proposals.<br>• Add "Review Proposal" side drawer with side-by-side diff. |
| `src/components/cms/PropertyQuickEditDrawer.jsx` | `PropertyQuickEditDrawer` | Slide-over drawer for rapid property attribute edits. | **Moderate** | • Adapt layout for the broker Proposal Review Drawer. |
| `src/components/dashboard/DashboardSidebar.jsx` | `DashboardSidebar` | Global portal navigation bar. | **High** | • Remove "New Property" submenu item for the `agent` role. |
| `src/services/propertyService.js` | `propertyService` | API communication layer. | **High** | • Add `submitEditRequest`, `getEditRequests`, `approveEditRequest`, `rejectEditRequest`. |

---

## 3. Agent Interface Gap Analysis

### 3.1 Prohibited Creation Controls
- **Gap:** `AgentProperties.jsx` lines 96–100 render:
  ```jsx
  <Link to="/agent/properties/create" className="... bg-[#E76F51]">
    <span className="material-symbols-outlined text-[16px]">add</span>
    Add Listing
  </Link>
  ```
- **Correction:** Remove this action button entirely. Gating ensures only brokers and administrators create listings.

### 3.2 Unauthorized Direct Editing Controls
- **Gap:** `AgentPropertyDetail.jsx` lines 64–84 render:
  ```jsx
  <button onClick={() => setShowEditModal(true)}>Edit Listing</button>
  <button onClick={togglePublished}>Publish / Unpublish Listing</button>
  ```
  The edit modal allows directly saving price and status to local/persisted state without broker approval.
- **Correction:** 
  1. Remove the direct publish toggle.
  2. Replace "Edit Listing" with **"Propose Changes"** (`Submit for Approval`).
  3. If an active proposal exists (`request_status === 'PENDING'`), display an amber status alert:  
     `"⚠️ An edit proposal is currently awaiting broker review. Further proposals are locked until review is complete."`

---

## 4. Broker and Administrator Interface Gap Analysis

### 4.1 Missing Proposal Review Interface
- **Gap:** `BrokerProperties.jsx` provides an inline `handleInlineApprove` button that transitions `standard_status` to `'Active'`. However, this only handles property creation approvals. There is no mechanism to view field-level staged proposals submitted by agents.
- **Correction:** In `BrokerProperties.jsx`, enhance the `Needs Approval` tab to present two clear categories:
  1. **New Listings Pending Activation** (newly drafted listings awaiting publication).
  2. **Agent Edit Proposals** (staged field modifications on existing listings).

### 4.2 Shared Administrator Workflow
- Administrators share the same review requirements as brokers. Creating duplicate admin pages is unnecessary. Both roles will utilize the enhanced `BrokerProperties.jsx` review drawer, scoped by administrative permissions.

---

## 5. Proposed Agent Edit Form Design (7-Section Architecture)

The Agent Edit Form will be presented as a dedicated, focused editing workspace or full-height slide-over drawer accessible from `AgentPropertyDetail.jsx`. It will reuse the proven 7-section structure from `BrokerCreateListings.jsx`, pre-filled with the current approved property values.

```
┌────────────────────────────────────────────────────────────────────────┐
│ AGENT PROPOSE EDITS: VILLA BELLA VISTA (MLS-8123A)                     │
│ [Notice: Changes submitted here require broker approval before publish]│
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 1: BASIC INFORMATION                                           │
│ • Property Title (Text input, max 100 chars, counter)                  │
│ • Tagline (Subtitle)                                                   │
│ • Property Type (Dropdown: Condominium, Villa, House & Lot, Penthouse) │
│ • Architectural Subtype & Transaction Type (For Sale / For Rent)       │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 2: LOCATION & CADASTRE                                         │
│ • Street Address, Subdivision / Building Name, City                    │
│ • Province / State, Postal Code                                        │
│ • Coordinates (Latitude, Longitude)                                    │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 3: PRICING (Excludes the 4 restricted fields)                  │
│ • Listing Price (Numeric input with auto-formatted PHP display)        │
│ • [EXCLUDED: original_list_price, association_fee,                     │
│              tax_annual_amount, list_price_currency]                   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 4: PROPERTY SPECIFICATIONS                                     │
│ • Bedrooms & Bathrooms (Segmented counter steppers)                    │
│ • Floor Area (sqm) & Lot Area (sqm)                                    │
│ • Year Built, Stories, Property Condition                              │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 5: FEATURES & AMENITIES                                        │
│ • Amenity Multi-Select Badges (Pool, Smart Home, Security, Solar, etc.)│
│ • Interior & Exterior Highlights                                       │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 6: DESCRIPTION & MEDIA ASSETS                                  │
│ • Public Narrative / Editorial Remarks                                 │
│ • Image Gallery Reordering & Google Drive Photo Uploads                │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 7: PROPOSAL JUSTIFICATION & SUBMISSION                         │
│ • Agent Business Remarks (Mandatory rationale for broker, e.g. price)  │
│ • Visual Change Summary: Displays exact fields modified                │
│ • ACTION: [Cancel]  [Submit for Approval ➔]                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Proposed Request Tracking Interface (Agent View)

To allow agents to monitor the progress of their proposals, an **"Edit Proposals"** tracking table will be integrated into the Agent portal (as a sub-tab in `AgentProperties.jsx` or a drawer from `AgentPropertyDetail.jsx`).

| Column Header | UI Rendering | Data Source |
| :--- | :--- | :--- |
| **Property** | Thumbnail + Property Title + Location | `property.title`, `property.mainImage` |
| **Request ID** | Monospace chip (e.g. `REQ-8123A`) | `property_edit_requests.id` |
| **Submitted Date**| Calendar date + Relative time (`"Today"`, `"2 days ago"`) | `property_edit_requests.created_at` |
| **Modified Fields**| Pill badges (e.g. `[Price]`, `[Public Remarks]`, `[Images]`) | Extracted keys from `proposed_changes` |
| **Status** | Status badge: `PENDING` (Amber), `APPROVED` (Emerald), `REJECTED` (Rose) | `property_edit_requests.request_status` |
| **Reviewer Notes**| Truncated remarks with click-to-expand tooltip | `property_edit_requests.review_notes` |
| **Actions** | `View Comparison` (Opens diff drawer); `Cancel Request` (if PENDING) | Modal triggers |

---

## 7. Proposed Approval Review Interface (Broker & Admin View)

Integrated directly into `BrokerProperties.jsx`, opening as a focused **"Proposal Review Drawer"** when a broker clicks on a pending request.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ REVIEW AGENT PROPOSAL: REQ-8123A                                            [X] │
│ Property: Forbes Park Pavilion | Submitted by: Elena Rossi (Today at 10:14 AM) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FIELD-LEVEL COMPARISON LEDGER:                                                  │
│                                                                                 │
│ Field Name        Current Approved Value          Proposed Agent Value          │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ Price             ₱340,000,000                    ₱325,000,000 (-4.4%) [Coral]  │
│ Public Remarks    "Timeless architectural..."     "Price reduced. Motivated..." │
│ Bedrooms          6 Beds                          6 Beds (Unchanged)            │
│ Status            Active                          Active (Unchanged)            │
│                                                                                 │
│ Agent Justification:                                                            │
│ "Seller authorized a ₱15M price reduction to accelerate closing this quarter."  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CONCURRENCY / CONFLICT CHECK:                                                   │
│ [✓] Clean: No concurrent updates have occurred since proposal submission.       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ BROKER REVIEW REMARKS:                                                          │
│ [ Optional notes on approval; mandatory rationale on rejection .............. ]│
├─────────────────────────────────────────────────────────────────────────────────┤
│ ACTIONS:                                                                        │
│ [Decline Proposal (Reject)]                       [Approve & Publish Changes ➔] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Component Reuse Recommendations

| New / Enhanced Feature | Candidate Component for Reuse | Reuse Rationale & Customization |
| :--- | :--- | :--- |
| **Agent Proposal Studio** | `BrokerCreateListings.jsx` | Reuse the 7-section form architecture, styling baselines, counters, and image uploader. Wrap submit button in `Submit for Approval` logic. |
| **Proposal Review Drawer** | `PropertyQuickEditDrawer.jsx` | Reuse drawer backdrop, slide-over animation, header chrome, and status pill styling. Replace form inputs with side-by-side diff ledger. |
| **Request Tracking Table** | `DataTable.jsx` | Reuse column sorting, pagination, and empty states. |
| **Status Indicators** | `StatusBadge.jsx` | Extend with explicit tokens for `PENDING` (Amber pulse), `APPROVED` (Emerald), and `REJECTED` (Rose). |
| **Rejection Modal** | `DashboardModal.jsx` | Reuse for prompt dialog requiring broker to enter rejection reason before submitting. |

---

## 9. API Integration Dependencies (`propertyService.js`)

To support the frontend workflows, `frontend/src/services/propertyService.js` must be expanded with the following client methods:

```javascript
// Proposed client methods to append to propertyService.js:

/**
 * Submit an edit proposal for an assigned property (Agent)
 */
async submitEditRequest(propertyId, payload) {
  const response = await apiClient.post(`/properties/${propertyId}/edit-requests`, payload);
  return response.data;
},

/**
 * Retrieve edit requests (Filtered by status or property)
 */
async getEditRequests(params = {}) {
  const response = await apiClient.get('/property-edit-requests', { params });
  return response.data;
},

/**
 * Retrieve single edit request detail with full snapshot
 */
async getEditRequestDetail(requestId) {
  const response = await apiClient.get(`/property-edit-requests/${requestId}`);
  return response.data;
},

/**
 * Approve a pending edit request (Broker / Admin)
 */
async approveEditRequest(requestId, reviewNotes = '') {
  const response = await apiClient.post(`/property-edit-requests/${requestId}/approve`, { reviewNotes });
  return response.data;
},

/**
 * Reject a pending edit request with remarks (Broker / Admin)
 */
async rejectEditRequest(requestId, rejectionReason) {
  const response = await apiClient.post(`/property-edit-requests/${requestId}/reject`, { rejectionReason });
  return response.data;
},

/**
 * Cancel own pending edit request (Agent)
 */
async cancelEditRequest(requestId) {
  const response = await apiClient.post(`/property-edit-requests/${requestId}/cancel`);
  return response.data;
}
```

---

## 10. Navigation and Role-Visibility Changes

### 10.1 Sidebar Modifications (`DashboardSidebar.jsx`)
- **For `agent` role:**
  - Remove `<NavLink to="/agent/properties/create">New Property</NavLink>`.
  - Add sub-navigation item: `My Edit Proposals` (`/agent/properties/proposals`).
- **For `broker` and `admin` roles:**
  - Retain `All Properties` and `New Property`.
  - Add badge counter to `Properties` reflecting total `Needs Approval` count (new listings + edit proposals).

### 10.2 App Router Modifications (`App.jsx`)
- **Remove:** `<Route path="properties/create" element={<BrokerCreateListings />} />` from `/agent`.
- **Add:** `<Route path="properties/:id/propose-edits" element={<AgentProposeEdits />} />` under `/agent` (protected for `agent`).

---

## 11. Frontend Testing Plan (Vitest & React Testing Library)

| Test Case | Target Component | Verification Objective |
| :--- | :--- | :--- |
| **TC-F1: Agent Creation Gating** | `AgentProperties.test.jsx` | Assert "+ Add Listing" button is **NOT** present in the DOM for agent role. |
| **TC-F2: Route Protection** | `App.test.jsx` | Attempting to navigate to `/agent/properties/create` redirects to `/agent/properties` or renders 403. |
| **TC-F3: Form Field Exclusions** | `BrokerCreateListings.test.jsx` | Assert inputs for `associationFee`, `associationFeeFrequency`, `taxAnnualAmount`, and `originalListPrice` are **NOT** rendered in Section 4. |
| **TC-F4: Proposal Submission** | `AgentProposeEdits.test.jsx` | Submitting form calls `propertyService.submitEditRequest` with diff payload and displays pending feedback without altering live view. |
| **TC-F5: Staged Review Rendering** | `BrokerProperties.test.jsx` | Clicking pending proposal in table opens side-by-side comparison drawer displaying old vs new values. |
| **TC-F6: Approval Execution** | `PropertyReviewDrawer.test.jsx` | Clicking "Approve & Publish" invokes `propertyService.approveEditRequest`, displays success toast, and refreshes inventory. |
| **TC-F7: Rejection Execution** | `PropertyReviewDrawer.test.jsx` | Attempting to reject without remarks is disabled; submitting with remarks calls `rejectEditRequest` and updates badge to REJECTED. |

---

## 12. Recommended Implementation Sequence

Upon approval, execution will proceed through 4 disciplined steps:

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: SERVICE LAYER & ROUTING CLEANUP                                │
│ • Append edit request methods to frontend/src/services/propertyService.js
│ • Remove /agent/properties/create route from frontend/src/App.jsx      │
│ • Remove "New Property" submenu item for agents in DashboardSidebar.jsx│
├────────────────────────────────────────────────────────────────────────┤
│ STEP 2: AGENT PROPOSAL WORKFLOW INTEGRATION                            │
│ • Remove "+ Add Listing" button from AgentProperties.jsx               │
│ • In AgentPropertyDetail.jsx, replace "Edit Listing" modal with        │
│   "Propose Changes" workflow                                           │
│ • Add pending proposal banner to AgentPropertyDetail.jsx               │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 3: BROKER PROPOSAL REVIEW DRAWER                                  │
│ • Omit 4 excluded pricing/tax inputs from BrokerCreateListings.jsx     │
│ • Build Proposal Review Drawer in BrokerProperties.jsx                 │
│ • Connect Approve / Reject actions with real API client and toasts     │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 4: VERIFICATION & TEST SUITE EXECUTION                            │
│ • Run unit tests: npx vitest run                                       │
│ • Run full production build: npm run build                             │
│ • Verify mobile and desktop responsiveness                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Completion Status & Stop Gate

In strict accordance with Section 20 and 21 of `docs/Property_listings/04-frontend-workflow-integration.md`:
- **Phase 4 frontend workflow analysis and design are complete.**
- **No source code files have been modified.**
- **No React pages, components, or routes have been altered or deleted.**
- **Execution has stopped to await user review and approval before proceeding to implementation.**
