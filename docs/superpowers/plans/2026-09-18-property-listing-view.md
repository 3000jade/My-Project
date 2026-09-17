# Property Listing View (Lamudi Architecture) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Lamudi-inspired property listing view with full specification fidelity for listing `cmtdur9ap00011041l5curjy2` at Urban Deca Homes Ortigas, interactive financing calculator, Viewing List aggregate integration, and downstream inspection scheduling.

**Architecture:** Split-screen responsive layout with high-impact 5-photo media mosaic, primary specification stream (pricing, financing calculator, specs table, location, policies), and sticky right-rail action card (Viewing List aggregate controller, inspection schedule modal trigger, and direct agent inquiry box with automated broker routing).

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Vitest, React Testing Library, React Router DOM v7.

**Spec:** `docs/superpowers/specs/2026-09-18-property-listing-view-design.md`

## Global Constraints
- All form inputs, selects, and primary action buttons must maintain mathematically uniform height: `h-[54px]`.
- Modals must use `bg-black/80 backdrop-blur-md`, Framer Motion spring physics (`damping: 25`, `stiffness: 200`), `data-lenis-prevent="true"`, and standard white close button `w-9 h-9 bg-white text-black shadow-lg rounded-full flex items-center justify-center`.
- Strict TDD gate: write failing test, verify failure, implement code, verify pass, commit.

---

### Task 1: Discrete Listing Entity & Viewing List Hook

**Files:**
- Modify: `frontend/src/mockData/mockProperties.js`
- Create: `frontend/src/hooks/useViewingList.js`
- Test: `frontend/src/hooks/useViewingList.test.js`

**Interfaces:**
- Consumes: None
- Produces:
  - `useViewingList()` hook returning `{ viewingList, isInViewingList(id), toggleViewingList(property), viewingCount }`
  - Property object with `id: "cmtdur9ap00011041l5curjy2"`, `ref_code: "MLSPH91M99LRH7"`

- [x] **Step 1: Write the failing test for `useViewingList` hook**

Create `frontend/src/hooks/useViewingList.test.js`:
```javascript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewingList } from './useViewingList';

describe('useViewingList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty viewing list', () => {
    const { result } = renderHook(() => useViewingList());
    expect(result.current.viewingCount).toBe(0);
    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(false);
  });

  it('adds and toggles property in viewing list', () => {
    const { result } = renderHook(() => useViewingList());
    const mockProp = { id: 'cmtdur9ap00011041l5curjy2', title: 'Urban Deca Homes 2BR' };

    act(() => {
      result.current.toggleViewingList(mockProp);
    });

    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(true);
    expect(result.current.viewingCount).toBe(1);

    act(() => {
      result.current.toggleViewingList(mockProp);
    });

    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(false);
    expect(result.current.viewingCount).toBe(0);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useViewingList.test.js`
Expected: FAIL with "Cannot find module ./useViewingList"

- [x] **Step 3: Implement `useViewingList.js` and register discrete listing in `mockProperties.js`**

Create `frontend/src/hooks/useViewingList.js`:
```javascript
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cp_viewing_list';

export function useViewingList() {
  const [viewingList, setViewingList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewingList));
      window.dispatchEvent(new CustomEvent('viewing-list-updated', { detail: { count: viewingList.length } }));
    } catch {
      // ignore storage errors
    }
  }, [viewingList]);

  const isInViewingList = useCallback((id) => {
    return viewingList.some(item => item.id === id);
  }, [viewingList]);

  const toggleViewingList = useCallback((property) => {
    setViewingList(prev => {
      const exists = prev.some(item => item.id === property.id);
      if (exists) {
        return prev.filter(item => item.id !== property.id);
      } else {
        return [...prev, property];
      }
    });
  }, []);

  return {
    viewingList,
    viewingCount: viewingList.length,
    isInViewingList,
    toggleViewingList
  };
}
```

Add listing `cmtdur9ap00011041l5curjy2` to `frontend/src/mockData/mockProperties.js` with all 7 sections represented.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useViewingList.test.js`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/hooks/useViewingList.js frontend/src/hooks/useViewingList.test.js frontend/src/mockData/mockProperties.js
git commit -m "feat: add discrete listing entity and viewing list hook"
```

---

### Task 2: Philippine Financing & Amortization Calculator Component

**Files:**
- Create: `frontend/src/components/ui/FinancingCalculator.jsx`
- Test: `frontend/src/components/ui/FinancingCalculator.test.jsx`

**Interfaces:**
- Consumes: `{ price: 3000000, promoCashOut: "PHP 5,000 to PHP 20,000", startingAmortization: "Starting at PHP 15,000 / month" }`
- Produces: `<FinancingCalculator totalContractPrice={3000000} />`

- [x] **Step 1: Write failing test for `FinancingCalculator`**

Create `frontend/src/components/ui/FinancingCalculator.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FinancingCalculator from './FinancingCalculator';

describe('FinancingCalculator', () => {
  it('renders TCP, promo cash-out, and default Pag-IBIG amortization starting at ₱15,000', () => {
    render(<FinancingCalculator totalContractPrice={3000000} promoCashOut="₱5,000 - ₱20,000" startingAmortization="₱15,000 / month" />);
    
    expect(screen.getByText(/₱3,000,000/i)).toBeInTheDocument();
    expect(screen.getByText(/₱5,000 - ₱20,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Pag-IBIG Housing Loan/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Financing/i)).toBeInTheDocument();
    expect(screen.getByText(/In-house Financing/i)).toBeInTheDocument();
  });

  it('switches calculation when selecting Bank Financing tab', () => {
    render(<FinancingCalculator totalContractPrice={3000000} promoCashOut="₱5,000 - ₱20,000" startingAmortization="₱15,000 / month" />);
    
    const bankTab = screen.getByRole('button', { name: /Bank Financing/i });
    fireEvent.click(bankTab);
    expect(screen.getByText(/Est. Monthly Amortization/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/FinancingCalculator.test.jsx`
Expected: FAIL with "Cannot find module ./FinancingCalculator"

- [x] **Step 3: Implement `FinancingCalculator.jsx`**

Create `frontend/src/components/ui/FinancingCalculator.jsx` with tabs (Pag-IBIG, Bank, In-House, Cash), down payment selector (0%, 5%, 10%, 20%), term slider/selector (10, 15, 20, 30 years), strict `h-[54px]` inputs, and clear payment breakdown.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/FinancingCalculator.test.jsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/ui/FinancingCalculator.jsx frontend/src/components/ui/FinancingCalculator.test.jsx
git commit -m "feat: add Philippine mortgage and amortization calculator component"
```

---

### Task 3: Inspection Schedule & Move-in Selector Modal (Section 7)

**Files:**
- Create: `frontend/src/components/ui/InspectionScheduleModal.jsx`
- Test: `frontend/src/components/ui/InspectionScheduleModal.test.jsx`

**Interfaces:**
- Consumes: `isOpen`, `onClose`, `property` (`id`, `ref_code`, `title`, `agent`)
- Produces: `<InspectionScheduleModal isOpen={isOpen} onClose={handleClose} property={property} onScheduleSuccess={handleSuccess} />`

- [x] **Step 1: Write failing test for `InspectionScheduleModal`**

Create `frontend/src/components/ui/InspectionScheduleModal.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InspectionScheduleModal from './InspectionScheduleModal';

describe('InspectionScheduleModal', () => {
  const mockProperty = {
    id: 'cmtdur9ap00011041l5curjy2',
    ref_code: 'MLSPH91M99LRH7',
    title: 'BEST ORTIGAS PASIG CONDO FOR SALE 2 BEDROOM CONDO',
    agent: { name: 'Jayson Canonico', title: 'Real Estate Agent' }
  };

  it('renders modal with date selector, time slots, and move-in timeline', () => {
    render(<InspectionScheduleModal isOpen={true} onClose={() => {}} property={mockProperty} />);
    
    expect(screen.getByText(/Schedule Free Site Viewing/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Move-In Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Assigned Agent: Jayson Canonico/i)).toBeInTheDocument();
  });

  it('dispatches schedule callback when form submitted', () => {
    const handleSuccess = vi.fn();
    render(<InspectionScheduleModal isOpen={true} onClose={() => {}} property={mockProperty} onScheduleSuccess={handleSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '09171234567' } });
    
    const submitBtn = screen.getByRole('button', { name: /Confirm Viewing Schedule/i });
    fireEvent.click(submitBtn);

    expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({
      listing_id: 'cmtdur9ap00011041l5curjy2',
      reference_code: 'MLSPH91M99LRH7'
    }));
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/InspectionScheduleModal.test.jsx`
Expected: FAIL

- [x] **Step 3: Implement `InspectionScheduleModal.jsx`**

Implement adhering to AGENTS.md UI standards:
- `bg-black/80 backdrop-blur-md`
- Spring motion physics
- `data-lenis-prevent="true"`
- Close button `w-9 h-9 bg-white text-black rounded-full`
- Form fields with uniform `h-[54px]` height
- Move-in window options: Immediate, Within 30 Days, Within 60 Days, Flexible

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/InspectionScheduleModal.test.jsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/ui/InspectionScheduleModal.jsx frontend/src/components/ui/InspectionScheduleModal.test.jsx
git commit -m "feat: add inspection schedule and move-in selector modal"
```

---

### Task 4: Lamudi-Style Media Mosaic Gallery Component

**Files:**
- Create: `frontend/src/components/ui/PropertyGalleryMosaic.jsx`
- Test: `frontend/src/components/ui/PropertyGalleryMosaic.test.jsx`

**Interfaces:**
- Consumes: `images: string[]`, `title: string`
- Produces: `<PropertyGalleryMosaic images={property.images} title={property.title} />`

- [x] **Step 1: Write failing test for `PropertyGalleryMosaic`**

Create `frontend/src/components/ui/PropertyGalleryMosaic.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PropertyGalleryMosaic from './PropertyGalleryMosaic';

describe('PropertyGalleryMosaic', () => {
  const images = [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
    'https://example.com/img3.jpg',
    'https://example.com/img4.jpg',
    'https://example.com/img5.jpg'
  ];

  it('renders mosaic images and view all photos button', () => {
    render(<PropertyGalleryMosaic images={images} title="Urban Deca Homes" />);
    expect(screen.getByRole('button', { name: /View All Photos/i })).toBeInTheDocument();
  });

  it('opens lightbox modal when clicking view all photos', () => {
    render(<PropertyGalleryMosaic images={images} title="Urban Deca Homes" />);
    fireEvent.click(screen.getByRole('button', { name: /View All Photos/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/PropertyGalleryMosaic.test.jsx`
Expected: FAIL

- [x] **Step 3: Implement `PropertyGalleryMosaic.jsx`**

Implement 5-photo mosaic layout with responsive mobile fallback, lightbox viewer adhering to Lenis scroll protection and spring animation.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/PropertyGalleryMosaic.test.jsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/ui/PropertyGalleryMosaic.jsx frontend/src/components/ui/PropertyGalleryMosaic.test.jsx
git commit -m "feat: add Lamudi-style property gallery mosaic and lightbox"
```

---

### Task 5: Property Listing View Page & Application Routing Integration

**Files:**
- Create: `frontend/src/pages/PropertyListingView.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/pages/PropertyListingView.test.jsx`

**Interfaces:**
- Consumes: Route params `:id`, `mockProperties`, `useViewingList`, `FinancingCalculator`, `InspectionScheduleModal`, `PropertyGalleryMosaic`
- Produces: Complete page at `/properties/:id` and `/listing/:id`

- [x] **Step 1: Write failing test for `PropertyListingView`**

Create `frontend/src/pages/PropertyListingView.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PropertyListingView from './PropertyListingView';

describe('PropertyListingView', () => {
  it('renders complete listing reference details for cmtdur9ap00011041l5curjy2', () => {
    render(
      <MemoryRouter initialEntries={['/properties/cmtdur9ap00011041l5curjy2']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    // Section 1: Identification
    expect(screen.getByText(/BEST ORTIGAS PASIG CONDO FOR SALE 2 BEDROOM CONDO/i)).toBeInTheDocument();
    expect(screen.getByText(/MLSPH91M99LRH7/i)).toBeInTheDocument();
    expect(screen.getByText(/cmtdur9ap00011041l5curjy2/i)).toBeInTheDocument();

    // Section 2: Pricing
    expect(screen.getAllByText(/₱3,000,000/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/₱5,000 to ₱20,000/i)).toBeInTheDocument();

    // Section 3: Space Specs
    expect(screen.getByText(/30.60 sqm/i)).toBeInTheDocument();
    expect(screen.getByText(/6th Floor/i)).toBeInTheDocument();
    expect(screen.getByText(/Bare/i)).toBeInTheDocument();
    expect(screen.getByText(/2023/i)).toBeInTheDocument();

    // Section 4: Geographic Location
    expect(screen.getByText(/Urban Deca Homes Ortigas/i)).toBeInTheDocument();
    expect(screen.getByText(/Ortigas Avenue Extension/i)).toBeInTheDocument();
    expect(screen.getByText(/Rosario/i)).toBeInTheDocument();
    expect(screen.getByText(/Pasig City/i)).toBeInTheDocument();

    // Section 5: Amenities & Policies
    expect(screen.getByText(/Perpetual Ownership/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 Gated Security/i)).toBeInTheDocument();
    expect(screen.getByText(/Pet-Friendly/i)).toBeInTheDocument();
    expect(screen.getByText(/Flood-Free Area/i)).toBeInTheDocument();

    // Section 6: Contact & Brokerage
    expect(screen.getByText(/Jayson Canonico/i)).toBeInTheDocument();
    expect(screen.getByText(/Real Estate Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct message for free site viewing/i)).toBeInTheDocument();

    // Section 7: Viewing List Aggregate CTA
    expect(screen.getByRole('button', { name: /Add to Viewing List/i })).toBeInTheDocument();
  });

  it('toggles viewing list state when clicking Add to Viewing List', () => {
    render(
      <MemoryRouter initialEntries={['/properties/cmtdur9ap00011041l5curjy2']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyListingView />} />
        </Routes>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Add to Viewing List/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /In Viewing List/i })).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/PropertyListingView.test.jsx`
Expected: FAIL

- [x] **Step 3: Implement `PropertyListingView.jsx` and integrate route in `App.jsx`**

Implement `frontend/src/pages/PropertyListingView.jsx`:
- Full 2-column layout.
- Copy reference code badge with toast.
- All 7 Sections visually presented in high-polish Lamudi format.
- Interactive agent message dispatcher simulating automated broker routing.
- Schedule inspection drawer launcher.
- Integrate routes `<Route path="/properties/:id" element={<PropertyListingView />} />` and `<Route path="/listing/:id" element={<PropertyListingView />} />` in `App.jsx`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/PropertyListingView.test.jsx`
Expected: PASS

- [x] **Step 5: Run full test suite & commit**

```bash
npm test
git add frontend/src/pages/PropertyListingView.jsx frontend/src/pages/PropertyListingView.test.jsx frontend/src/App.jsx
git commit -m "feat: complete Lamudi property listing view with viewing list integration"
```
