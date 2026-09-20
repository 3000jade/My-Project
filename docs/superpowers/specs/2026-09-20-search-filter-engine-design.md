# Architectural Design Specification: Advanced Search & Filter Engine

**Date:** 2026-09-20
**Topic:** Search and Filter Engine Refactor
**Classification:** Architectural

## 1. Overview and Purpose
This document outlines the architectural restructuring of the CP_kerby search and filter subsystem. The goal is to evolve the current monolithic filter setup into a modular, high-performance, full-stack hybrid engine capable of handling deep, Philippine-specific real estate market attributes (Pag-IBIG, Freehold, Flood-free, etc.). The design prioritizes sub-millisecond facet reactivity, fluid layout constraints, strict design system alignment, and intelligent zero-result recovery algorithms.

## 2. Architecture & Data Source Strategy
The system adopts a **Full-Stack Hybrid with Reactive Client Cache** approach:
- **Client-Side Indexing:** An advanced React hook (`usePropertyFilterEngine`) maintains local indexing over loaded property records to calculate real-time facet tallies and execute marginal gain analyses instantly.
- **Backend API Integration:** The engine synchronizes with the backend via `/api/properties` using extended deep query parameters, and introduces a new lightweight `GET /api/properties/count` endpoint optimized for retrieving raw result counts without payload overhead (critical for the mobile drawer's dynamic action button).

## 3. Data Contracts (`shared/types/property.ts`)
The `PropertyItem` interface and corresponding mock/database schemas will be expanded to encompass rigorous Philippine market niches:
- **`transactionType`**: 'For Sale' | 'For Rent' | 'Pre-Selling'
- **`propertySubClass`**: 'Condominium' | 'Single-Family House & Lot' | 'Townhouse' | 'Villa' | 'Vacant Lot' | 'Office Space' | 'Commercial Lot' | 'Warehouse'
- **`furnishing`**: 'Fully Furnished' | 'Semi-Furnished' | 'Bare / Unfurnished'
- **`floorLevel`**: 'Low' | 'Mid' | 'High' | 'Penthouse'
- **`financingTerms`**: Array of 'Pag-IBIG' | 'Bank' | 'In-House' | 'Assume Balance' | 'Rent-to-Own'
- **`communityRules`**: Array of 'Pet-Friendly' | 'Balcony' | 'Maid Room' | 'Flood-Free'
- **`tenureType`**: 'Perpetual / Freehold' | 'Leasehold' | 'Clean Title'

## 4. Component Architecture

### 4.1 First-Order Bar (`FirstOrderBar.jsx`)
Acts as the primary, above-the-fold interface, orchestrating core components while strictly maintaining a uniform `h-[54px]` size.
- **Transaction Mode Segment:** Toggle pills for Sale/Rent/Pre-Selling.
- **Location & Sub-Classification Select:** Grouped dropdown separating Residential and Commercial/Land categories.
- **Price Range Dual Slider Popover:** Replaces basic price selects. Integrates an interactive range slider, PHP numeric text inputs, and quick-select preset chips (e.g., `< ₱3M`). Implements a 300ms–400ms debounce before applying constraints to the engine.
- **Bedroom Chips:** Immediate toggle pills (Studio, 1, 2, 3, 4, 5+).
- **Sticky Sentinel Integration:** Transitions to edge-to-edge width and removes rounded corners (`border-radius: 0`) precisely when intersecting the 80px scroll offset.

### 4.2 Deep Filters Drawer (`AllFiltersModal.jsx`)
- **UI Physics:** Enters via Framer Motion spring physics (`type: spring, damping: 25, stiffness: 200`) accompanied by a heavy backdrop blur (`bg-black/80 backdrop-blur-md`).
- **Scroll Isolation:** Container strictly features `data-lenis-prevent="true"`.
- **Dynamic Facets:** Every checkbox and multi-select pill (e.g., Bathrooms, Parking, Pet-Friendly) reads from the engine's real-time tallies, rendering exact match counts directly within its label `(142)`.
- **Action Footer:** "Clear All" link alongside a dynamic "Show X Properties" primary submit button.

### 4.3 Algorithmic Empty-State Recovery (`FilterEmptyState.jsx`)
Replaces the main property grid when active filters yield zero results.
- **Constraint Impact Heuristic (Marginal Gain Analysis):** The engine tests omitting each active constraint against the dataset. The filter whose removal recovers the highest number of properties is determined as the "tightest filter".
- **One-Click Reset:** A prominent button automatically offering to clear the calculated tightest filter (e.g., `[ x ] Clear price ceiling (Recovers 45 properties)`).
- **Loosening Suggestions:** Dynamic action chips offering adjacent search expansions (e.g., *+ Expand budget*, *+ Include adjacent locations*).

## 5. Directory Mapping & File Changes
- `shared/types/property.ts`: Extend `PropertyItem` interface.
- `backend/src/controllers/property.controller.ts`: Add parsing for new query parameters; add `/count` endpoint logic.
- `backend/src/services/property.service.ts`: Implement advanced filters and count logic.
- `frontend/src/mockData/mockProperties.js`: Enrich sample properties with new specification fields.
- `frontend/src/hooks/usePropertyFilterEngine.js`: [NEW] Central state, debounce, facet, and heuristic algorithms.
- `frontend/src/components/ui/AdvancedSearchBox.jsx`: Refactor into modular orchestrator.
- `frontend/src/components/ui/FirstOrderBar.jsx`: [NEW] Primary UI bar.
- `frontend/src/components/ui/AllFiltersModal.jsx`: [NEW] Spring-animated modal drawer.
- `frontend/src/components/ui/FilterEmptyState.jsx`: [NEW] Empty state recovery UI.

## 6. Testing & Validation
- **Vitest Unit Tests:** The `usePropertyFilterEngine` hook will be fully unit-tested to ensure accurate debounce timing, correct facet calculation across array constraints, and proper tightest-filter logic generation.
- **Component Tests:** Interaction testing for First-Order debouncing and Modal Lenis scroll isolation.
- **Backend Tests:** Verify the `/count` endpoint returns accurate tally aggregates without fetching full payloads.
