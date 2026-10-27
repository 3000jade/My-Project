# Property Filter Toolbar Component & Efficient Search Refactor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor property listing filtering into a dedicated, agency-grade `PropertyFilterToolbar` component conforming to `design.md` tokens, eliminating filter redundancies and introducing omni-search, status navigation tabs, faceted type/location selectors, price range filtering, and dynamic active filter chips.

**Architecture:**
1. Create `PropertyFilterToolbar.jsx` in `frontend/src/components/properties/`, extracting and unifying filtering logic into a modular component.
2. Provide a 3-tier high-efficiency filtering experience:
   - **Tier 1 (Status Tabs):** Consolidated status pill tabs with live counter badges (`All`, `Active`, `Needs Approval`, `Proposals`, `Pending Confirmation`, `Action Required`, etc.).
   - **Tier 2 (Omni-Search & Facets Toolbar):** Search input with instant clear, Property Type facet (with common type icons), Location facet, Price Range selector (Min/Max inputs & quick presets), and Sort selector.
   - **Tier 3 (Active Filter Chips Strip):** Dynamic chips for every active criterion with individual dismiss buttons, live result tally ("Showing X of Y listings"), and "Clear All" action.
3. Integrate into `BrokerProperties.jsx`, replacing the fragmented duplicate status dropdown and inline filters.
4. Support numeric price range filtering in `filteredProperties`.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React icons, Vitest, Playwright E2E.

**Spec:** `docs/modules/02-property-listing/ui-specification.md` (M02-SCR-01 & Shared Components) and Master SRS (`docs/REQUIREMENTS_SPECIFICATION.md`).

## Global Constraints

- **Invariant 1 (Strict Non-Interference):** Under NO circumstances modify `frontend/src/pages/public/PropertyListingView.jsx` or `frontend/src/pages/public/PropertiesPage.jsx`.
- **Invariant 2 (Decoupled Agent Assignment):** Filter controls must not re-introduce legacy agent selection dependencies into property intake.
- **Design Tokens (`design.md`):** Primary Teal `#0F766E`, Primary Hover `#115E59`, Slate 800 Text `#1E293B`, Slate 500 Text `#64748B`, Border `#E2E8F0`, Canvas `#F8FAFC`, Surface `#FFFFFF`.
- **TDD:** Write unit tests for `PropertyFilterToolbar` first, verify failure, implement minimal code, verify green.

---

### Task 1: Build Unit Tests for `PropertyFilterToolbar`

**Files:**
- Create: `frontend/src/components/properties/PropertyFilterToolbar.test.jsx`

**Interfaces:**
- Consumes: `PropertyFilterToolbar.jsx`
- Produces: Comprehensive test suite for search, tab selection, facet changes, price filter, active chips, and clear actions.

- [x] **Step 1: Write unit tests in `PropertyFilterToolbar.test.jsx`**

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyFilterToolbar from './PropertyFilterToolbar';

describe('PropertyFilterToolbar Component', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    statusTab: 'ALL',
    onStatusTabChange: vi.fn(),
    statusCounts: {
      all: 25,
      active: 15,
      needsApproval: 3,
      proposals: 2,
      pendingConfirmation: 1,
      actionRequired: 1,
      reserved: 2,
      sold: 1,
      draft: 0
    },
    selectedType: 'ALL',
    onTypeChange: vi.fn(),
    selectedLocation: 'ALL',
    onLocationChange: vi.fn(),
    locationOptions: ['Makati', 'BGC, Taguig', 'Alabang, Muntinlupa'],
    priceRange: { min: '', max: '' },
    onPriceRangeChange: vi.fn(),
    sortBy: 'newest',
    onSortByChange: vi.fn(),
    onResetFilters: vi.fn(),
    totalCount: 25,
    filteredCount: 25
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders omni-search input and status pill tabs with counts', () => {
    render(<PropertyFilterToolbar {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search properties/i)).toBeInTheDocument();
    expect(screen.getByText('All Listings')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input and clears on X button click', () => {
    const onSearchChange = vi.fn();
    render(<PropertyFilterToolbar {...defaultProps} search="Modern Villa" onSearchChange={onSearchChange} />);

    const clearBtn = screen.getByLabelText(/clear search/i);
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('calls onStatusTabChange when clicking a status tab', () => {
    const onStatusTabChange = vi.fn();
    render(<PropertyFilterToolbar {...defaultProps} onStatusTabChange={onStatusTabChange} />);

    fireEvent.click(screen.getByText('Active'));
    expect(onStatusTabChange).toHaveBeenCalledWith('ACTIVE');
  });

  it('renders active filter chips when filters are applied and allows removing chips', () => {
    const onTypeChange = vi.fn();
    const onResetFilters = vi.fn();

    render(
      <PropertyFilterToolbar
        {...defaultProps}
        selectedType="Condominium"
        onTypeChange={onTypeChange}
        onResetFilters={onResetFilters}
        filteredCount={8}
        totalCount={25}
      />
    );

    expect(screen.getByText(/showing 8 of 25 listings/i)).toBeInTheDocument();
    expect(screen.getByText('Type: Condominium')).toBeInTheDocument();

    const removeTypeChipBtn = screen.getByLabelText(/remove type filter/i);
    fireEvent.click(removeTypeChipBtn);
    expect(onTypeChange).toHaveBeenCalledWith('ALL');

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllBtn);
    expect(onResetFilters).toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --prefix frontend -- PropertyFilterToolbar.test.jsx`
Expected: FAIL (Component not yet created).

- [x] **Step 3: Commit initial test suite**

```bash
git add frontend/src/components/properties/PropertyFilterToolbar.test.jsx
git commit -m "test(properties): add unit test suite for PropertyFilterToolbar"
```

---

### Task 2: Implement `PropertyFilterToolbar.jsx` Component

**Files:**
- Create: `frontend/src/components/properties/PropertyFilterToolbar.jsx`

**Interfaces:**
- Consumes: Lucide React icons (`Search`, `X`, `ChevronDown`, `SlidersHorizontal`, `ArrowUpDown`, `DollarSign`, `MapPin`, `Building2`, `Filter`)
- Uses: `COMMON_PROPERTY_TYPES` from `BrokerPropertyTypeSelect.jsx`
- Produces: Fully functional `PropertyFilterToolbar` component.

- [x] **Step 1: Write `PropertyFilterToolbar.jsx`**

Implement:
1. Status pill tabs with counts and badges.
2. Omni-search input with instant clear.
3. Property Type dropdown facet with common type icons.
4. Location dropdown facet.
5. Price Range popover or dropdown (with inputs for Min Price, Max Price, and quick presets: `< ₱10M`, `₱10M - ₱25M`, `₱25M - ₱50M`, `₱50M+`).
6. Sort By selector (Newest, Price: Low to High, Price: High to Low, Title: A-Z).
7. Active filter chips strip rendering only when filters are active, with live result counter and "Clear All".

- [x] **Step 2: Run unit test to verify it passes**

Run: `npm run test --prefix frontend -- PropertyFilterToolbar.test.jsx`
Expected: PASS

- [x] **Step 3: Commit component implementation**

```bash
git add frontend/src/components/properties/PropertyFilterToolbar.jsx
git commit -m "feat(properties): implement PropertyFilterToolbar component with omni-search, facets, and active chips"
```

---

### Task 3: Integrate `PropertyFilterToolbar` into `BrokerProperties.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.test.jsx`

**Interfaces:**
- Consumes: `PropertyFilterToolbar` in `BrokerProperties`
- Adds: `priceRange` state `{ min: '', max: '' }` and connects to `filteredProperties` useMemo.

- [x] **Step 1: Add price range state and integrate in `BrokerProperties.jsx`**

```javascript
const [priceRange, setPriceRange] = useState({ min: '', max: '' });
```

Update `filteredProperties`:
```javascript
// Price Range Filter
let matchesPrice = true;
if (priceRange.min !== '') {
  matchesPrice = matchesPrice && (p.price_raw || 0) >= Number(priceRange.min);
}
if (priceRange.max !== '') {
  matchesPrice = matchesPrice && (p.price_raw || 0) <= Number(priceRange.max);
}
```

- [x] **Step 2: Replace inline status tabs and search bar with `<PropertyFilterToolbar />`**

Replace lines 954-1110 with `<PropertyFilterToolbar ... />`.

- [x] **Step 3: Run Vitest regression suite**

Run: `npm run test --prefix frontend -- PropertyFilterToolbar BrokerProperties BrokerCreateListings BrokerPropertyTypeSelect BrokerPropertyDetail primitives DataTable`
Expected: PASS (All test files passing).

- [x] **Step 4: Commit integration changes**

```bash
git add frontend/src/pages/portals/broker/BrokerProperties.jsx frontend/src/pages/portals/broker/BrokerProperties.test.jsx
git commit -m "refactor(broker): replace inline property filters with PropertyFilterToolbar"
```

---

### Task 4: Playwright E2E Verification & Documentation

**Files:**
- Modify: `frontend/e2e/property-agent-assignment-decoupling.spec.ts`
- Modify: `docs/modules/02-property-listing/ui-specification.md`
- Modify: `docs/REQUIREMENTS_SPECIFICATION.md` (Register `FR-PL-017`)
- Create: `docs/modules/02-property-listing/2026-10-28-property-filter-toolbar-verification.md`
- Modify: `docs/modules/02-property-listing/INDEX.md`

- [x] **Step 1: Run Playwright E2E verification**

Run: `powershell -Command "cd frontend; npx playwright test property-agent-assignment-decoupling.spec.ts"`
Expected: PASS

- [x] **Step 2: Invariant audit**

Verify `git diff HEAD -- frontend/src/pages/public/PropertyListingView.jsx frontend/src/pages/public/PropertiesPage.jsx` is empty.

- [x] **Step 3: Update documentation and registries**

- [x] **Step 4: Commit documentation & deliver local report**
