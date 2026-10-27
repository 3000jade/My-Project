# Property Type Selection Page & Minimalist Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated pre-creation Property Type Selection Page (`/broker/properties/select-type`) featuring clean "icon and name only" cards for common property types, leading smoothly into the 7-Step Listing Intake Studio pre-configured with the chosen classification.

**Architecture:** 
1. Build `BrokerPropertyTypeSelect.jsx` at `/broker/properties/select-type`, rendering a high-end minimalist grid of 8 common property types (`House & Lot`, `Condominium`, `Townhouse`, `Lot / Land`, `Commercial`, `Apartment`, `Villa`, `Warehouse`), with Lucide icon and name only.
2. Route '+ New Listing' in `BrokerProperties.jsx` to `/broker/properties/select-type`.
3. Clicking a type navigates to `/broker/properties/create?type=<SelectedType>`, which automatically initializes `formData.property_type`.
4. Streamline property type cards in Step 1 of `BrokerCreateListings.jsx` to follow the minimalist "icon and name only" format for consistent visual harmony.

**Tech Stack:** React 19, React Router v7, Tailwind CSS v4, Lucide React icons, Vitest, Playwright E2E.

**Spec:** `docs/modules/02-property-listing/ui-specification.md` (M02-SCR-07: Property Type Selection Page) and Master Living SRS (`docs/REQUIREMENTS_SPECIFICATION.md`).

## Global Constraints

- **Invariant 1 (Strict Non-Interference):** Under NO circumstances modify `frontend/src/pages/public/PropertyListingView.jsx` or `frontend/src/pages/public/PropertiesPage.jsx`.
- **Invariant 2 (Decoupled Agent Assignment):** The selection page and creation wizard must NOT contain sales agent assignment controls.
- **Design Tokens (`design.md`):** Primary Teal `#0F766E`, Hover `#115E59`, Border `#E2E8F0` / `#CBD5E1`, Background `#FFFFFF` / `#F8FAFC`. Minimalist cards: Icon and Name ONLY.
- **TDD:** Write failing tests, verify failure, implement code, verify green.

---

### Task 1: Create Unit Tests for `BrokerPropertyTypeSelect` and Selection Flow

**Files:**
- Create: `frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.test.jsx`
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx`

**Interfaces:**
- Consumes: `BrokerPropertyTypeSelect.jsx`
- Produces: Test suite validating rendering of the 8 common types, icon-and-name structure, back button, and navigation.

- [ ] **Step 1: Write unit tests in `BrokerPropertyTypeSelect.test.jsx`**

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerPropertyTypeSelect from './BrokerPropertyTypeSelect';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>
  };
});

describe('BrokerPropertyTypeSelect - Property Type Selection Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BrokerPropertyTypeSelect />
      </BrowserRouter>
    );
  };

  it('renders breadcrumbs, title, and all 8 common property type options', () => {
    renderComponent();

    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
    expect(screen.getByText(/Choose the category of property you want to list/i)).toBeInTheDocument();

    const commonTypes = [
      'House & Lot',
      'Condominium',
      'Townhouse',
      'Lot / Land',
      'Commercial',
      'Apartment',
      'Villa',
      'Warehouse'
    ];

    commonTypes.forEach(type => {
      expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
    });
  });

  it('navigates to creation studio with query parameter when a property type is clicked', () => {
    renderComponent();

    const condoBtn = screen.getByRole('button', { name: 'Condominium' });
    fireEvent.click(condoBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/broker/properties/create?type=Condominium');
  });

  it('renders back navigation button to return to properties ledger', () => {
    renderComponent();
    const backBtn = screen.getByText('Back to Properties');
    expect(backBtn).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --prefix frontend -- BrokerPropertyTypeSelect.test.jsx`
Expected: FAIL (Component not yet created).

- [ ] **Step 3: Commit initial test**

```bash
git add frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.test.jsx
git commit -m "test(broker): add test suite for property type selection screen"
```

---

### Task 2: Build `BrokerPropertyTypeSelect.jsx` Component

**Files:**
- Create: `frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.jsx`
- Modify: `frontend/src/App.jsx` (Register route `/broker/properties/select-type`)

**Interfaces:**
- Consumes: Lucide React icons (`Home`, `Building2`, `Building`, `MapPin`, `Store`, `Layers`, `Palmtree`, `Warehouse`, `ArrowLeft`)
- Produces: `BrokerPropertyTypeSelect` component export.

- [ ] **Step 1: Implement `BrokerPropertyTypeSelect.jsx`**

```jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, Building2, Building, MapPin, 
  Store, Layers, Palmtree, Warehouse, 
  ArrowLeft 
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';

export const COMMON_PROPERTY_TYPES = [
  { id: 'House & Lot', name: 'House & Lot', icon: Home },
  { id: 'Condominium', name: 'Condominium', icon: Building2 },
  { id: 'Townhouse', name: 'Townhouse', icon: Building },
  { id: 'Lot / Land', name: 'Lot / Land', icon: MapPin },
  { id: 'Commercial', name: 'Commercial', icon: Store },
  { id: 'Apartment', name: 'Apartment', icon: Layers },
  { id: 'Villa', name: 'Villa', icon: Palmtree },
  { id: 'Warehouse', name: 'Warehouse', icon: Warehouse },
];

export default function BrokerPropertyTypeSelect() {
  const navigate = useNavigate();

  const handleSelectType = (typeName) => {
    navigate(`/broker/properties/create?type=${encodeURIComponent(typeName)}`);
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16">
      <PageHeader
        title="Select Property Type"
        subtitle="Choose the category of property you want to list. You can refine specific architectural details in the intake studio."
        breadcrumbs={[
          { label: 'Properties', to: '/broker/properties' },
          { label: 'Select Type' }
        ]}
        actions={
          <Link
            to="/broker/properties"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Properties</span>
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-lg mx-auto mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
            What type of property are you listing?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
            Select an asset type to tailor the specifications, room arrangements, and cadastral requirements.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {COMMON_PROPERTY_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                aria-label={type.name}
                onClick={() => handleSelectType(type.name)}
                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 hover:bg-white hover:border-[#0F766E] hover:shadow-md transition-all duration-200 cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-[#0F766E] transition-all duration-200 mb-4">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="text-sm sm:text-base font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Route in `frontend/src/App.jsx`**
Import `BrokerPropertyTypeSelect` and declare:
`<Route path="properties/select-type" element={<BrokerPropertyTypeSelect />} />`

- [ ] **Step 3: Run unit tests to verify they pass**

Run: `npm run test --prefix frontend -- BrokerPropertyTypeSelect.test.jsx`
Expected: PASS

- [ ] **Step 4: Commit component implementation**

```bash
git add frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.jsx frontend/src/pages/portals/broker/BrokerPropertyTypeSelect.test.jsx frontend/src/App.jsx
git commit -m "feat(broker): implement dedicated property type selection page"
```

---

### Task 3: Connect Entry Points and Auto-Select in `BrokerCreateListings.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.jsx` (Update "+ New Listing" link to `/broker/properties/select-type`)
- Modify: `frontend/src/pages/portals/broker/BrokerDashboard.jsx` (Update "+ New Listing" link)
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx` (Auto-load `type` query param, streamline Step 1 to icon and name only)
- Modify: `frontend/src/pages/portals/broker/BrokerProperties.test.jsx` (Update test expectations)

- [ ] **Step 1: Read query param in `BrokerCreateListings.jsx`**

```javascript
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || location.state?.propertyType;

  useEffect(() => {
    if (typeParam && !isEditing) {
      setFormData(prev => ({
        ...prev,
        property_type: typeParam
      }));
    }
  }, [typeParam, isEditing]);
```

- [ ] **Step 2: Streamline Step 1 Option Cards to Icon and Name Only**
Update Step 1 Option Cards grid to render `Icon` and `Name` only (clean, focused, uncluttered):
```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Property Type Classification">
  {COMMON_PROPERTY_TYPES.map(config => {
    const Icon = config.icon;
    const isSelected = formData.property_type === config.id;
    return (
      <button
        key={config.id}
        type="button"
        role="button"
        aria-label={config.name}
        aria-pressed={isSelected}
        onClick={() => {
          setIsDirty(true);
          setFormData({ ...formData, property_type: config.id });
        }}
        className={`relative p-4 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 ${
          isSelected
            ? 'bg-teal-50/60 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
            : 'bg-white border-[#E2E8F0] hover:border-[#0F766E]/50 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-[#0F766E] text-white'
              : 'bg-slate-100 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
          {config.name}
        </span>
      </button>
    );
  })}
</div>
```

- [ ] **Step 3: Update "+ New Listing" link in `BrokerProperties.jsx` and `BrokerDashboard.jsx`**
Update links from `/broker/properties/create` to `/broker/properties/select-type`.

- [ ] **Step 4: Update test assertions in `BrokerProperties.test.jsx` & `BrokerCreateListings.test.jsx`**

- [ ] **Step 5: Run full Vitest suite**

Run: `npm run test --prefix frontend -- BrokerProperties BrokerPropertyTypeSelect BrokerCreateListings BrokerPropertyDetail primitives DataTable`
Expected: PASS (All tests passing)

---

### Task 4: Playwright E2E Verification & Documentation

**Files:**
- Modify: `frontend/e2e/property-agent-assignment-decoupling.spec.ts`
- Modify: `docs/modules/02-property-listing/ui-specification.md` (Add M02-SCR-07)
- Modify: `docs/REQUIREMENTS_SPECIFICATION.md` (Update FR-PL-015 / add FR-PL-016)
- Create: `docs/modules/02-property-listing/2026-10-28-property-type-selection-page-verification.md`
- Modify: `docs/modules/02-property-listing/INDEX.md`

- [ ] **Step 1: Run Playwright E2E verification**

Run: `powershell -Command "cd frontend; npx playwright test property-agent-assignment-decoupling.spec.ts"`
Expected: PASS

- [ ] **Step 2: Update master documentation & registries**

- [ ] **Step 3: Commit documentation & deliver local report**
