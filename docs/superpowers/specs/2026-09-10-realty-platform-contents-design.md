# Realty Platform Architecture & Content Specification

> **Status:** Approved Specification  
> **Date:** 2026-09-10  
> **Classification:** Architectural Design Document  
> **Aesthetic Token Matrix:** *Monolith & Void* (Teal `#174849` / `#266F71`, Specular Amber `#FB8E5D`, Obsidian `#071313`, Doppelrand concentric borders, uniform 54px controls)

---

## 1. Executive Summary

This document specifies the end-to-end content hierarchy, interactive modules, and architectural layout for the **EstateElite Realty Platform**. The system is organized into three distinct tiers:
1. **🏠 Core Navigation Pages** (Homepage, Property Listing Search with MLS/Map, Exclusive Listings, Neighborhood Guides, About & Team).
2. **📈 Lead Generation & Value Content** (Free Home Valuation Tool, Real Estate Blog, Client Testimonials).
3. **⚙️ Functional Content & Legal Compliance** (Contextual Contact Forms, Fair Housing, MLS Disclaimers, Licensing Disclosures).

---

## 2. 🏠 Core Navigation Pages

### 2.1 Homepage
* **Visual Anchor (Static "In Progress" Placeholder):**
  - High-resolution static architectural photography canvas (e.g., modern twilight estate or architectural sketch render) replacing heavy/unbuffered live video.
  - Overlay with a subtle, luxury-grade status indicator: `[ IN PROGRESS • ARCHITECTURAL PREVIEW ]` rendered in microscopic tracked monospace (`tracking-[0.25em] text-[11px] font-bold`) encased in a glassmorphic pill badge (`bg-white/10 backdrop-blur-md border border-white/20`).
  - Ambient radial gradients: Deep Pine Teal (`#174849`/30%) and Sunset Amber (`#FB8E5D`/20%) creating specular depth behind the headline.
* **Header & Scroll Tracking:**
  - Standard 80px header that automatically hides when scrolling down past the visual anchor.
  - Manual summon button on the top-right that shifts sticky content down by 80px.
  - Auto-hide re-engages if user scrolls more than 50px away from the trigger position.
* **Advanced Search Box (Sentinel-Tracked):**
  - Uniform `h-[54px]` inputs, dropdowns, and search buttons.
  - Dual-state transition via hidden sentinel element (`getBoundingClientRect` tracking):
    - Floating State: `rounded-[2.5rem]` with concentric `p-2.5` double-bezel padding.
    - Sticky State: At exactly 80px header offset, loses its border radius (`rounded-0`) and dynamically widens to span edge-to-edge.
* **Dual Buyer & Seller Directives:**
  - *Buyer Action:* "Explore Verified Inventory" $\rightarrow$ links to `/properties` (Map & MLS).
  - *Seller Action:* "Request Instant Home Valuation" $\rightarrow$ links to `/valuation` (CMA Tool).

---

### 2.2 Property Listing Search (Interactive Map & MLS)
* **Real-Time MLS Filter Bar (`h-[54px]`):**
  - Geographic Selector: Region, Province, City / District keyword.
  - Price Range: Interactive dual-handle range slider with active inventory distribution histogram.
  - Bed & Bath: Pill toggle selectors (`1+`, `2+`, `3+`, `4+`, `5+`).
  - Property Typology: Single Family, Duplex Estate, Sky Penthouse, Commercial Lot.
  - Status Indicators: `Active MLS`, `Pending`, `Price Improved`, `Exclusive Mandate`.
* **Split Map & List Experience:**
  - **Interactive Map View:** Interactive canvas displaying customized price pins, cluster markers, and neighborhood boundary polygons with school rating overlay toggles.
  - **Virtualized Grid View:** High-performance responsive grid powered by `@tanstack/react-virtual` preventing DOM bloat during large dataset browsing.

---

### 2.3 Exclusive Listings (Agency Flagship Portfolio)
* **High-Definition Galleries:**
  - Editorial horizontal gallery cards showcasing agency-exclusive estates.
  - Architectural metadata tags: Gross Floor Area, Lot Size, Solar Orientation, Milled Finishes, Architect of Record.
* **Cinematic Video Walkthroughs:**
  - Modal-based 4K video player with ambient theater glow and spatial audio controls.
* **Instant Property Inspection Modal:**
  - **Backdrop:** `bg-black/80 backdrop-blur-md`.
  - **Entrance Physics:** Framer Motion spring (`type: spring`, `damping: 25`, `stiffness: 200`, `scale: 0.9 -> 1.0`, `y: 100 -> 0`).
  - **Lenis Native Scroll Isolation:** Internal scroll container tagged with `data-lenis-prevent="true"` to prevent parent page scroll hijacking.
  - **Close Button:** Floating `w-9 h-9` solid white circle (`bg-white shadow-xl text-[20px] text-gray-900`) positioned top-right over imagery.

---

### 2.4 Neighborhood Guides
* **Curated District Profiles:** Detailed pages for premier enclaves (Makati CBD, Bonifacio Global City, Alabang Hills, Forbes Park, New Manila).
* **Intelligence Matrix:**
  - **Academic Institutions:** Public/Private school ratings, student-to-teacher ratios, and distance matrix.
  - **Walkability & Transit:** Walk Score, Transit Score, and peak commute times to major financial centers.
  - **Lifestyle & Culture:** Michelin dining clusters, private healthcare, athletic clubs, and parks.
  - **Market Dynamics:** Historical price per square meter charts, 5-year capital appreciation, and average Days on Market (DOM).

---

### 2.5 About & Team Page
* **Corporate Heritage:** Narrative history of the firm, transaction track record ($500M+ career volume), and executive manifesto.
* **Agent & Partner Directory:**
  - Professional headshots with active broker credentials (PRC license, REBAP registration, NAR membership).
  - Direct advisory contact channels (WhatsApp, direct wire, verified email).
  - Specialization focus areas: Land Acquisition, Ultra-Prime Residential, Off-Market Syndication.

---

## 3. 📈 Lead Generation & Value Content

### 3.1 Free Home Valuation Tool (Comparative Market Analysis - CMA)
* **Interactive 2-Step Funnel:**
  - **Step 1 (Property Specification):** Street address, property classification, estimated floor area, bedrooms/bathrooms, and recent architectural upgrades.
  - **Step 2 (Valuation Engine):** Instant algorithmic preliminary valuation range (Low, Expected, High) calculated against recent comparable MLS sales.
* **Lead Ingestion & Broker Routing:**
  - Submission automatically generates a high-priority inquiry in `/broker/inquiries` and assigns it to the designated neighborhood listing specialist.
  - Dispatches a branded PDF Comparative Market Analysis brief to the seller's email.

---

### 3.2 Real Estate Blog & Market Intelligence
* **Editorial Categories:**
  - *Buyer & Seller Playbooks:* Escrow milestones, tax considerations (Capital Gains Tax, Documentary Stamp Tax), and staging strategies.
  - *Mortgage & Financial Advisory:* Interest rate trendlines, private banking facilities, and yield models.
  - *Quarterly Market Reports:* Downloadable macroeconomic whitepapers analyzing luxury real estate cycles.
* **SEO Infrastructure:** Structured JSON-LD schema (`RealEstateAgent`, `Article`, `FAQPage`) targeting regional search intent.

---

### 3.3 Client Testimonials & Social Proof
* **Social Proof Assets:**
  - Verified client quotes with verified acquisition context (e.g., *"Secured confidential duplex in 21 days with 4.5% below-market negotiation"*).
  - Video testimonials featuring past sellers and investors.
  - Transaction case studies detailing complex zoning approvals and estate settlements.

---

## 4. ⚙️ Functional Content & Legal Compliance

### 4.1 Contextual Quick-Fill Contact Forms
* **Placement Strategy:**
  - Bottom of each property detail modal ("Schedule Confidential Inspection").
  - Sticky sidebar on neighborhood guides and market reports ("Inquire with District Specialist").
  - Dedicated `/contact` page with interactive agent matching and tour booking calendar.
* **Uniform Control Sizing:** All text inputs, phone masks, and submit buttons adhere to strict `h-[54px]` sizing.

### 4.2 Regulatory Compliance & Disclosures
* **MLS IDX Compliance:** Official MLS disclaimer, real-time inventory timestamp, and data accuracy indemnification.
* **Equal Housing Opportunity:** Fair Housing graphic emblem and anti-discrimination charter.
* **Privacy & Data Security:** GDPR and Philippine Data Privacy Act (Republic Act 10173) compliance terms for customer lead protection.
* **Brokerage Credentials:** Registered corporate entity name, official brokerage license numbers, and principal office address permanently anchored in the global footer.

---

## 5. Architectural Implementation Guidelines

| Component / Feature | Technical Rule |
| :--- | :--- |
| **Global Scrolling** | `lenis/react` with `lerp: 0.08` and `smoothWheel: true` |
| **Internal Modal Scrolls** | Must include `data-lenis-prevent="true"` attribute |
| **Control Heights** | Exactly `h-[54px]` for all inputs, dropdowns, and buttons |
| **Header Offset** | Exactly `80px` sticky top offset |
| **Sticky Transitions** | Sentinel-based `getBoundingClientRect` calculation; remove `rounded` on sticky |
| **Modal Animation** | Framer Motion spring: `damping: 25`, `stiffness: 200`, `y: 100 -> 0`, `scale: 0.9 -> 1.0` |
| **Close Button** | `w-9 h-9 bg-white text-[20px] rounded-full shadow-xl` |
| **Color Tokens** | Deep Pine Teal (`#174849`), Amber Specular (`#FB8E5D`), Obsidian (`#071313`) |
