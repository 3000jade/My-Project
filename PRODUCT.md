# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Prospective Buyers & Clients:** High-intent residential and luxury property seekers in the Philippines browsing verified listings, exploring interactive subdivision master plans, comparing multi-unit condo coordinates, saving properties, and booking private tours or inquiries.
- **Licensed Real Estate Agents (`agent`):** Field practitioners managing assigned property listings, triaging client inquiries, maintaining availability calendars, confirming site inspections, and tracking sales commissions.
- **Principal Brokers & Administrators (`broker`, `admin`):** Brokerage operators overseeing full property and subdivision lot inventories, onboarding and verifying agent credentials (PRC/DHSUD), authoring multi-step property listings, editing interactive cadastral subdivision maps, and auditing platform-wide sales and security logs.

## Product Purpose

Human Shelter Realty (`CP_kerby`) is a full-stack Philippine architectural and residential real estate platform that unifies public property discovery with role-gated Broker, Agent, and Client operational portals. Success means buyers discover and inquire on verified listings with zero spatial or pricing ambiguity, while brokers and agents manage inventory, subdivision master plans, and client pipelines from a single high-trust workspace.

## Positioning

Unlike generic listing classifieds, the platform pairs **RESO-aligned Philippine property data** (PSA PSGC regions/provinces/cities/barangays, title status, cadastral coordinates) with an integrated **Cadastral Subdivision Map Editor & Multi-Property Map Studio**, strict PRC/DHSUD agent verification gates, and direct broker-to-agent inquiry and appointment orchestration.

## Operating Context

- **Public Marketplace (`/`, `/properties`, `/properties/:id`, `/subdivisions/:id/map`):** Split-screen and grid property search with Google Maps / Leaflet fallback, multi-unit building drawers, commute analysis, financing/valuation calculators, and AI concierge chat.
- **Agent Workspace (`/agent/*`):** Operational dashboard for assigned properties, inquiry response, appointment scheduling, availability slots, and sales records.
- **Broker & Admin Workspace (`/broker/*`, `/admin/*`):** 7-step property listing creation wizard, interactive subdivision polygon/lot editor (`SubdivisionMapEditor`), multi-property coordinate studio (`BrokerMultiPropertyMapStudio`), agent credential review & invitations, and audit logs.
- **Client Portal (`/client/*`):** Saved properties, active inquiry threads, and profile/session management.

## Capabilities and Constraints

- **Architecture:** React 19 + Vite 8 + Tailwind CSS v4 frontend communicating exclusively with an Express 5 + TypeScript backend and Supabase (PostgreSQL + Auth) plus Google Drive media storage and Google Maps / Nominatim geocoding.
- **Manual Transaction Integrity:** Property availability (`Available`, `Reserved`, `Sold`, `Draft`) and sales records are explicitly controlled by authorized brokers/agents—never inferred automatically from UI clicks.
- **Map Stacking Isolation:** Interactive map canvases (Google Maps and Leaflet/Geoman) must remain isolated at `z-index: 0` so they never bleed over sticky navigation headers, drawers, or modals.

## Brand Commitments

- **Brand Identity:** Human Shelter Realty — Soft Minimalist SaaS & Architectural Real Estate Ledger.
- **Core Palette:** Primary Spruce Teal (`#0F766E`, hover `#115E59`), Conversion Coral (`#FF6B6B` always paired with dark `#1E293B` text), Slate Alabaster Canvas (`#F8FAFC`), Pure White Surface (`#FFFFFF`), and Slate Hairline Borders (`#E2E8F0`).
- **Typography:** `Inter` / `Figtree Variable` for UI and display hierarchy, paired with `JetBrains Mono` for PHP currency figures, lot areas (`sqm`), and cadastral coordinates.

## Evidence on Hand

- Production UI component library in `frontend/src/components/ui/` (cards, maps, modals, search bar, sections).
- PSA PSGC Philippine geographic dataset in `frontend/src/data/geo/` (`regions.json`, `provinces.json`, `cities.json`, `barangays.json`, `zipcodes.json`).
- Hero architectural illustration in `frontend/src/assets/House_Herosection.svg`.
- Do not fabricate unverified customer testimonials, fake regulatory certifications, or unbacked investment return claims.

## Product Principles

1. **Spatial & Financial Truth First:** Every listing and subdivision lot surfaces verifiable location coordinates, floor/lot area in `sqm`, and transparent PHP pricing before decorative storytelling.
2. **Role-Scoped Clarity:** Public pages persuade through calm architectural framing; Broker and Agent portals prioritize scannable tabular density, rapid filtering, and unambiguous status badges.
3. **Strict Trust Boundaries:** Agent onboarding, credential verification, and listing publication enforce explicit broker approval and audit logging.
4. **Progressive Map Resilience:** Map experiences seamlessly fall back between Google Maps JS API and open-source Leaflet without breaking coordinate picking or polygon rendering.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast compliance across all surfaces (specifically dark `#1E293B` ink on `#FF6B6B` Coral accents and `>= 4.5:1` for secondary metadata).
- Minimum `44px × 44px` touch targets on mobile/coarse viewports, full keyboard focus-visible rings (`#0F766E`), and mandatory `prefers-reduced-motion` fallbacks.
