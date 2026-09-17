# Design Specification: Property Listing View (Lamudi Architecture)

**Date:** 2026-09-18  
**Topic:** Property Listing View with Lamudi Layout & Viewing List Downstream Architecture  
**Status:** Approved by Human Partner  

---

## 1. Overview & Objective
This specification defines the architecture, user interface, component hierarchy, and downstream integration of the dedicated **Property Listing View** in the application.

The design mirrors the layout and information hierarchy of leading Philippine and Southeast Asian real estate portals (notably **Lamudi Philippines** and **PropertyGuru**), structured around the exact reference metadata for listing `cmtdur9ap00011041l5curjy2` at **Urban Deca Homes Ortigas**.

---

## 2. Reference Information & Data Contracts

### 2.1 Section 1: Listing Identification
- **Listing ID:** `cmtdur9ap00011041l5curjy2`
- **Reference Code:** `MLSPH91M99LRH7`
- **Title:** BEST ORTIGAS PASIG CONDO FOR SALE 2 BEDROOM CONDO
- **Property Type:** Residential Condominium
- **Listing Status:** For Sale
- **Unit Status:** New

### 2.2 Section 2: Pricing & Financing
- **Total Contract Price (TCP):** PHP 3,000,000
- **Promo Cash-Out:** PHP 5,000 to PHP 20,000
- **Monthly Amortization:** Starting at PHP 15,000 / month
- **Payment Methods:**
  - Cash (Spot Cash / Deferred Cash)
  - Bank Financing
  - Pag-IBIG Housing Loan
  - In-house Financing

### 2.3 Section 3: Space & Unit Specs
- **Floor Area:** 30.60 sqm
- **Bedrooms:** 2
- **Bathrooms:** 1
- **Floor Level:** 6th Floor
- **Furnishing:** Bare
- **Year Built:** 2023

### 2.4 Section 4: Geographic Location
- **Development:** Urban Deca Homes Ortigas
- **Thoroughfare:** Ortigas Avenue Extension
- **District / Barangay:** Rosario
- **City:** Pasig City
- **Region / Country:** Metro Manila (NCR), Philippines

### 2.5 Section 5: Amenities & Policies
- **Tenure:** Perpetual Ownership (Freehold)
- **Security:** 24/7 Gated Security
- **Pet Policy:** Pet-Friendly
- **Terrain / Drainage:** Flood-Free Area

### 2.6 Section 6: Contact & Brokerage
- **Listing Agent:** Jayson Canonico
- **Professional Title:** Real Estate Agent
- **Call to Action (CTA):** Direct message for free site viewing

### 2.7 Section 7: Architectural Role (Viewing List Context)
- **Primary Purpose:** Discrete listing entity that populates the Viewing List aggregate.
- **Downstream Flow:** Feeds into inspection schedule selectors, target move-in forms, and automated broker routing systems.

---

## 3. Visual Layout Architecture (Lamudi Blueprint)

The page utilizes a responsive two-column layout with a prominent header mosaic and sticky action rail:

```
+-----------------------------------------------------------------------------+
| Header & Navigation (with Viewing List Badge Counter)                       |
+-----------------------------------------------------------------------------+
| Breadcrumbs: Home > Pasig City > Rosario > Urban Deca Homes Ortigas         |
| Reference Strip: Listing ID cmtdur9ap... | MLS Ref MLSPH91M99... [Copy]     |
+-----------------------------------------------------------------------------+
| Media Mosaic:                                                               |
| [     Main Hero Photo (60%)     ] [ Thumb 1 ] [ Thumb 2 ]                   |
|                                   [ Thumb 3 ] [ Thumb 4 + View All ]        |
+-----------------------------------------------------------------------------+
| LEFT CONTENT (65% width)                  | RIGHT STICKY RAIL (35% width)   |
| 1. Title & Address Badge                  | 1. Price Card: PHP 3,000,000    |
| 2. Key Metrics Bar (2BR | 1BA | 30.6sqm)  |    - Promo Cash-Out ₱5k-₱20k    |
| 3. Financing & Mortgage Calculator:       |    - Amortization from ₱15k/mo  |
|    - Pag-IBIG vs Bank vs In-House         | 2. Viewing List Action:         |
| 4. Unit Specifications Matrix             |    - [Add to Viewing List]      |
| 5. Amenities & Policies Badges            | 3. Inspection Scheduler:        |
| 6. Development & Location Guide           |    - [Schedule Free Viewing]    |
| 7. Neighborhood Map Simulation            | 4. Broker / Agent Card:         |
|                                           |    - Jayson Canonico (Agent)    |
|                                           |    - [Direct Message Button]    |
+-----------------------------------------------------------------------------+
```

---

## 4. Component Structure & Responsibilities

1. **`frontend/src/pages/PropertyListingView.jsx`**:
   - Primary page controller. Reads `:id` from route params.
   - Resolves listing entity from `mockProperties.js` via ID or MLS Reference Code.
   - Integrates `useViewingList` state hook.
   - Renders breadcrumbs, gallery, specs, financing engine, inspection scheduler, and agent contact card.

2. **`frontend/src/components/ui/PropertyGalleryMosaic.jsx`**:
   - 5-item responsive photo mosaic with hover zoom transitions.
   - Triggers full-screen photo lightbox with Lenis scroll prevention (`data-lenis-prevent="true"`) and `w-9 h-9` white close button.

3. **`frontend/src/components/ui/FinancingCalculator.jsx`**:
   - Interactive payment estimator.
   - Switchable financing modes: Pag-IBIG Fund (default), Bank Financing, In-house Financing, Cash.
   - Computes estimated monthly payments based on loan term (10, 20, 30 years) and down payment options.

4. **`frontend/src/components/ui/InspectionScheduleModal.jsx`**:
   - Interactive scheduling drawer/modal for Section 7:
     - Date Picker (next 14 calendar days).
     - Time Slot Options (Morning 9:00 AM–11:00 AM, Afternoon 1:00 PM–3:00 PM, Sunset 4:00 PM–6:00 PM).
     - Target Move-In Window (Immediate, Within 30 Days, Within 60 Days, Flexible).
     - Full name, email, and mobile number inputs (`h-[54px]`).
     - Dispatches automated broker routing event and displays success toast.

5. **`frontend/src/hooks/useViewingList.js`**:
   - Custom hook managing the user's saved viewing list aggregate.
   - Persists state in `localStorage` under key `cp_viewing_list`.
   - Dispatches custom browser events (`viewing-list-updated`) so navbar badges update synchronously.

---

## 5. UI Guidelines Compliance (`AGENTS.md`)
- **Strict Uniform Sizing:** All input fields, select dropdowns, and primary CTA buttons have height `h-[54px]`.
- **Modals & Drawers:**
  - Backdrop: `bg-black/80 backdrop-blur-md`.
  - Spring Entrance: `type: "spring", damping: 25, stiffness: 200, scale: 0.9 -> 1, y: 100 -> 0`.
  - Scroll safety: `data-lenis-prevent="true"` attached to all scrollable modal containers.
  - Close button: `w-9 h-9 bg-white shadow-xl text-black rounded-full flex items-center justify-center`.

---

## 6. Automated Testing & Verification
- Unit & integration test suite: `frontend/src/pages/PropertyListingView.test.jsx`.
- Coverage includes:
  - Display of all discrete metadata fields from Section 1–6.
  - Financing calculator tab switching and calculation updates.
  - Viewing List aggregate addition/removal toggle.
  - Inspection booking modal flow and downstream dispatch logging.
