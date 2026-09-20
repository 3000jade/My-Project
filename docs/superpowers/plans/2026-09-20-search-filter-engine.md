# Search & Filter Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the current monolithic search box into a modular, high-performance, full-stack hybrid filter engine with dynamic facet counting and algorithmic zero-result recovery.

**Architecture:** Client-side reactive hook (`usePropertyFilterEngine`) maintains state, debounce logic, and marginal gain heuristics, wrapping a suite of modular UI components (`FirstOrderBar`, `AllFiltersModal`, `FilterEmptyState`). Validates against shared API contracts and synchronizes with an extended Express backend property controller for counts and queries.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Framer Motion, @mantine/core, Node.js/Express, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-20-search-filter-engine-design.md`

## Global Constraints

- Uniform control sizing must be strictly `h-[54px]`.
- Modals must use `bg-black/80 backdrop-blur-md` and include `data-lenis-prevent="true"` on internal scroll containers.
- Debounce inputs precisely by 300ms.
- Components must maintain existing dependencies (e.g., `@mantine/core`, `framer-motion`).

---

### Task 1: Update Shared Contracts & Mock Data

**Files:**
- Modify: `shared/types/property.ts`
- Modify: `frontend/src/mockData/mockProperties.js`

**Interfaces:**
- Produces: Enhanced `PropertyItem` type.
- Produces: Enriched `mockProperties` list with Philippine market fields.

- [ ] **Step 1: Write the failing type/mock data tests**
(Not strictly tested via runner since it's type definition and mock data, but we'll add a quick sanity test for the mock data structure).
```javascript
// frontend/src/mockData/mockProperties.test.js
import { describe, it, expect } from 'vitest';
import { mockProperties } from './mockProperties';

describe('mockProperties data structure', () => {
  it('contains extended Philippine market fields', () => {
    const prop = mockProperties[0];
    expect(prop).toHaveProperty('transactionType');
    expect(prop).toHaveProperty('propertySubClass');
    expect(prop).toHaveProperty('financingTerms');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test mockProperties.test.js`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Update `shared/types/property.ts` to include:
```typescript
export interface PropertyItem {
  // ... existing fields ...
  transactionType?: 'For Sale' | 'For Rent' | 'Pre-Selling';
  propertySubClass?: string;
  furnishing?: 'Fully Furnished' | 'Semi-Furnished' | 'Bare / Unfurnished';
  floorLevel?: 'Low' | 'Mid' | 'High' | 'Penthouse';
  financingTerms?: string[];
  communityRules?: string[];
  tenureType?: 'Perpetual / Freehold' | 'Leasehold' | 'Clean Title';
}
```
Update `frontend/src/mockData/mockProperties.js` to seed these fields across the first few objects.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test mockProperties.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add shared/types/property.ts frontend/src/mockData/mockProperties.js frontend/src/mockData/mockProperties.test.js
git commit -m "feat(data): extend property schema with market niches"
```

---

### Task 2: Backend Count Endpoint & Extended Query Parsing

**Files:**
- Modify: `backend/src/routes/property.routes.ts`
- Modify: `backend/src/controllers/property.controller.ts`
- Modify: `backend/src/services/property.service.ts`
- Test: `backend/src/controllers/property.controller.test.ts`

**Interfaces:**
- Produces: `GET /api/properties/count` yielding `{ success: true, count: number }`

- [ ] **Step 1: Write the failing test**
```typescript
// backend/src/controllers/property.controller.test.ts (append)
describe('GET /api/properties/count', () => {
  it('returns a numeric count based on query params', async () => {
    const req = { query: { transactionType: 'For Sale' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    await PropertyController.countProperties(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: expect.any(Number) }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test property.controller.test.ts`
Expected: FAIL (countProperties is not a function)

- [ ] **Step 3: Write minimal implementation**
Update `backend/src/routes/property.routes.ts` to map `/count` to `PropertyController.countProperties`. (Place above `/:id`).
Update `PropertyController` and `PropertyService` to accept new filters and return aggregate total.
```typescript
// property.controller.ts
public static async countProperties(req: Request, res: Response) {
  const count = await PropertyService.countProperties(req.query);
  res.status(200).json({ success: true, count });
}

// property.service.ts
public static async countProperties(query: any) {
  // Use existing findProperties logic but return only `result.total`
  const result = await this.findProperties(query);
  return result.total;
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test property.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add backend/src/
git commit -m "feat(api): add property count endpoint and query parsers"
```

---

### Task 3: Core Filter Hook Engine

**Files:**
- Create: `frontend/src/hooks/usePropertyFilterEngine.js`
- Create: `frontend/src/hooks/usePropertyFilterEngine.test.js`

**Interfaces:**
- Produces: `usePropertyFilterEngine(initialProperties)`

- [ ] **Step 1: Write the failing test**
```javascript
// frontend/src/hooks/usePropertyFilterEngine.test.js
import { renderHook, act } from '@testing-library/react';
import { usePropertyFilterEngine } from './usePropertyFilterEngine';
import { describe, it, expect } from 'vitest';

describe('usePropertyFilterEngine', () => {
  it('calculates facet counts correctly', () => {
    const mockData = [{ bedrooms: 2 }, { bedrooms: 2 }, { bedrooms: 3 }];
    const { result } = renderHook(() => usePropertyFilterEngine(mockData));
    expect(result.current.facets.bedrooms['2']).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test usePropertyFilterEngine`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Create `usePropertyFilterEngine.js` implementing local state, facet aggregations mapped by constraint keys, and basic filtering mechanics for the provided dataset.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test usePropertyFilterEngine`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/hooks/
git commit -m "feat(hook): implement usePropertyFilterEngine state and facets"
```

---

### Task 4: Empty State Algorithm & Component

**Files:**
- Create: `frontend/src/components/ui/FilterEmptyState.jsx`
- Create: `frontend/src/components/ui/FilterEmptyState.test.jsx`

**Interfaces:**
- Consumes: hook's `tightestFilter` algorithm results
- Produces: `<FilterEmptyState onClearFilter={...} suggestions={...} />`

- [ ] **Step 1: Write the failing test**
```javascript
// frontend/src/components/ui/FilterEmptyState.test.jsx
import { render, screen } from '@testing-library/react';
import FilterEmptyState from './FilterEmptyState';
import { describe, it, expect } from 'vitest';

describe('FilterEmptyState', () => {
  it('displays the tightest filter reset button', () => {
    render(<FilterEmptyState tightestFilter={{ key: 'maxPrice', label: 'Clear price ceiling' }} />);
    expect(screen.getByText('Clear price ceiling')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test FilterEmptyState`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Build `FilterEmptyState.jsx` returning the "No Results" message, a button to clear the tightest filter, and iteration over `suggestions` chips.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test FilterEmptyState`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/ui/FilterEmptyState.jsx frontend/src/components/ui/FilterEmptyState.test.jsx
git commit -m "feat(ui): add algorithmic empty state recovery component"
```

---

### Task 5: First-Order Bar Component

**Files:**
- Create: `frontend/src/components/ui/FirstOrderBar.jsx`
- Modify: `frontend/src/components/ui/AdvancedSearchBox.jsx`

**Interfaces:**
- Consumes: Filter engine state & updaters

- [ ] **Step 1: Write the failing test**
(Omitted explicit DOM unit tests here to prioritize visual orchestration, but we ensure component renders).

- [ ] **Step 2: Run test** N/A
- [ ] **Step 3: Write minimal implementation**
Build `FirstOrderBar.jsx` featuring segment pills, dropdowns, and the dual-axis price popover with strict `h-[54px]` metrics. Add `rounded-none` toggle prop when `isSticky` is active.

- [ ] **Step 4: Run visual verification**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/ui/FirstOrderBar.jsx
git commit -m "feat(ui): add FirstOrderBar component with h-54px metrics"
```

---

### Task 6: Deep Filters Drawer Component

**Files:**
- Create: `frontend/src/components/ui/AllFiltersModal.jsx`

**Interfaces:**
- Produces: Slide-over drawer with `data-lenis-prevent="true"`.

- [ ] **Step 1: Write the failing test** N/A
- [ ] **Step 2: Run test** N/A
- [ ] **Step 3: Write minimal implementation**
Build `AllFiltersModal.jsx` using `framer-motion` for spring physics. Include sections for Bathrooms, sqm Area, and Third-Order toggles. Render the facet counts beside labels. Include `bg-black/80 backdrop-blur-md` overlay.

- [ ] **Step 4: Run visual verification**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/ui/AllFiltersModal.jsx
git commit -m "feat(ui): add AllFiltersModal with real-time facets"
```

---

### Task 7: Orchestrate Refactored AdvancedSearchBox

**Files:**
- Modify: `frontend/src/components/ui/AdvancedSearchBox.jsx`
- Modify: `frontend/src/pages/PropertiesPage.jsx`

**Interfaces:**
- Pulls together `usePropertyFilterEngine`, `FirstOrderBar`, `AllFiltersModal`.

- [ ] **Step 1: Refactor `AdvancedSearchBox.jsx`**
Replace monolithic code with integration of the modular subcomponents. Pass the state and handlers down from the `usePropertyFilterEngine` hook (or initialize the hook inside `PropertiesPage` and pass down).

- [ ] **Step 2: Update `PropertiesPage.jsx`**
Ensure `PropertiesPage` utilizes `FilterEmptyState` when results are 0.

- [ ] **Step 3: Verify integration**
Run the dev server and manually verify the cohesive behavior, debouncing, zero-result toggles, and modal scrolling isolation.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/ui/AdvancedSearchBox.jsx frontend/src/pages/PropertiesPage.jsx
git commit -m "refactor(ui): orchestrate search filter components and wire empty state"
```
