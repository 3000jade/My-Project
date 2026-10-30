---
module: 02-property-listing
date: 2026-10-29
status: complete
affected_files:
  - frontend/src/components/ui/buttons/ViewPropertyButton.jsx
  - frontend/src/components/ui/buttons/ViewPropertyButton.test.jsx
  - frontend/src/components/ui/index.js
  - frontend/src/components/ui/cards/PropertyCard.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - frontend/src/pages/portals/broker/BrokerProperties.jsx
  - frontend/src/pages/portals/broker/BrokerPropertyDetail.jsx
  - frontend/src/pages/portals/broker/BrokerInquiryDetail.jsx
  - frontend/src/pages/portals/agent/AgentInquiryDetail.jsx
---

# View Property Contrast Capsule Button Implementation

## 1. Overview & User Intent

The user requested applying the specific contrast capsule button design (Architectural Teal `#0F766E` pill container with circular Modern SaaS Coral `#FF6B6B` diagonal arrow badge) directly to "View Property" and external property link action buttons across property cards, listing previews, and broker consoles.

## 2. Key Architecture & Deliverables

### A. Dedicated Component (`components/ui/buttons/ViewPropertyButton.jsx`)
- **Pill Shape:** Fully rounded container (`rounded-full`) with `#0F766E` teal background and interactive states (`hover:bg-[#115E59] active:bg-[#134E4A]`).
- **Contrast Accent Badge:** `#FF6B6B` vibrant coral circular badge hosting a white diagonal up-right arrow (`ArrowUpRight` with `stroke-[2.5]`).
- **Micro-Interaction Motion:** Hovering smoothly translates the coral badge diagonally (`group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200`).
- **Polymorphic Rendering:** Automatically renders as an accessible `<button>`, internal react-router `<Link>`, or secure external `<a>` (`rel="noopener noreferrer"`) based on `to` / `href` props.
- **Responsive Size Profiles:** Supports `size="sm"`, `size="default"`, and `size="lg"` presets.

### B. Consoles & Cards Integrated
1. **`PropertyCard.jsx`:** Upgraded card footer button to `<ViewPropertyButton onClick={handleNavigate} label="View property" />`.
2. **`BrokerCreateListings.jsx`:** Integrated `<ViewPropertyButton onClick={() => setShowPublicPreview(true)} />` in the Step 7 review card footer and mobile preview trigger.
3. **`BrokerProperties.jsx`:**
   - In Grid View cards, upgraded plain text `View Details →` to `<ViewPropertyButton size="sm" onClick={...} label="View property" />`.
4. **`BrokerPropertyDetail.jsx`:** Added top action cluster external link `<ViewPropertyButton href={`/properties/${property.id}`} target="_blank" size="sm" label="View property" />` allowing brokers to inspect the public live listing with a single click.
5. **`BrokerInquiryDetail.jsx` & `AgentInquiryDetail.jsx`:** Upgraded property preview link cards to use the contrast capsule button for swift property dossier navigation.

## 3. Verification Evidence

- **Unit Tests (`ViewPropertyButton.test.jsx`):** 4/4 tests passed.
- **Regression Unit Suites (`PropertyCard`, `BrokerProperties`, `BrokerPropertyDetail`, `BrokerInquiries`, `BrokerCreateListings`):** 22/22 tests passed.
- **Production Build:** Vite built successfully in 5.77s with 0 errors.
