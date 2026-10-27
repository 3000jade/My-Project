# Property Type Option Cards & Adaptive Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an interactive, agency-grade Option Card Selector for Property Type classification in Step 1 of the 7-Step Listing Intake & Edit Studio (`BrokerCreateListings.jsx`), with real-time conditional field adaptation in subsequent wizard steps.

**Architecture:** In Step 1 (Basic Info), replace the basic select element with a 7-card responsive option grid (`House & Lot`, `Condominium`, `Townhouse`, `Penthouse`, `Estate`, `Vacant Land / Lot`, `Commercial`), styled strictly to `design.md` design tokens (Teal `#0F766E`, Canvas `#F8FAFC`, Border `#E2E8F0`, selected ring-2). Each card encapsulates an icon, title, category badge, and concise description. Selecting a card dynamically adapts downstream steps: Condominium and Penthouse hide Lot Area and emphasize vertical specs; Vacant Land bypasses Floor Area and Room counts.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React icons, Vitest & React Testing Library, Playwright E2E.

**Spec:** `docs/modules/02-property-listing/ui-specification.md` (M02-SCR-02) and Master Living SRS (`docs/REQUIREMENTS_SPECIFICATION.md`).

## Global Constraints

- **Invariant 1 (Strict Non-Interference):** Under NO circumstances modify `frontend/src/pages/public/PropertyListingView.jsx` or `frontend/src/pages/public/PropertiesPage.jsx`.
- **Invariant 2 (Decoupled Agent Assignment):** Step 1 must NOT contain sales agent assignment controls (managed exclusively via Agent Management).
- **Design Tokens (`design.md`):** Primary Teal `#0F766E`, Hover `#115E59`, Accent Coral `#FF6B6B`, Border `#E2E8F0` / `#CBD5E1`, Background `#FFFFFF` / `#F8FAFC`.
- **Accessibility:** Cards must support keyboard navigation (`Enter` / `Space`), clear aria-selected or radio attributes, and maintain synchronized select value for test/form compatibility.
- **TDD:** Write failing tests first, verify failure, implement minimal code, and verify green.

---

### Task 1: Add Failing Unit Tests for Option Cards & Step Adaptation

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx`

**Interfaces:**
- Consumes: `BrokerCreateListings.jsx`
- Produces: Failing test assertions for property type option cards and conditional spec adaptation.

- [ ] **Step 1: Write failing tests in `BrokerCreateListings.test.jsx`**

Add tests for:
1. Rendering the 7 property type option cards with their labels, badges, and descriptions in Step 1.
2. Clicking a property type card updates selection and toggles visual active ring state.
3. Verifying conditional adaptation: selecting `Condominium` or `Penthouse` hides `Lot Area` in Section 3; selecting `Vacant Land / Lot` hides `Floor Area` and `Bedrooms`.

```jsx
  it('renders all 7 property type option cards with badges and descriptions in Step 1', () => {
    renderComponent();

    const expectedTypes = [
      'House & Lot',
      'Condominium',
      'Townhouse',
      'Penthouse',
      'Estate',
      'Vacant Land / Lot',
      'Commercial'
    ];

    expectedTypes.forEach(type => {
      expect(screen.getByRole('button', { name: new RegExp(type, 'i') })).toBeInTheDocument();
    });
  });

  it('selects a property type card and activates conditional adaptations in Section 3', () => {
    renderComponent();

    // Select Condominium card
    const condoCard = screen.getByRole('button', { name: /Condominium/i });
    fireEvent.click(condoCard);

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText('Specifications')[0]);

    // Lot Area must be hidden for Condominium
    expect(screen.queryByLabelText(/Lot Area \*/i)).not.toBeInTheDocument();
    // Floor Area must be present
    expect(screen.getByPlaceholderText(/e\.g\. 450/i)).toBeInTheDocument();
  });

  it('adapts Section 3 for Vacant Land / Lot by hiding interior room fields', () => {
    renderComponent();

    // Select Vacant Land / Lot
    const landCard = screen.getByRole('button', { name: /Vacant Land \/ Lot/i });
    fireEvent.click(landCard);

    // Navigate to Step 3 (Specifications)
    fireEvent.click(screen.getAllByText('Specifications')[0]);

    // Floor area should not be rendered for land
    expect(screen.queryByPlaceholderText(/e\.g\. 450/i)).not.toBeInTheDocument();
    // Land informational notice should be visible
    expect(screen.getByText(/Vacant Land listing selected/i)).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`
Expected: FAIL because option card buttons are not yet implemented in `BrokerCreateListings.jsx`.

- [ ] **Step 3: Commit test suite additions**

```bash
git add frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx
git commit -m "test(broker): add unit tests for property type option cards and conditional adaptation"
```

---

### Task 2: Implement Property Type Option Cards and Conditional Tuning in `BrokerCreateListings.jsx`

**Files:**
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx:580-600`
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx:1704-1706`
- Modify: `frontend/src/pages/portals/broker/BrokerCreateListings.jsx:1826-1845`

**Interfaces:**
- Consumes: Lucide React icons (`Home`, `Building2`, `Building`, `Sparkles`, `Trees`, `MapPin`, `Store`, `CheckCircle2`)
- Produces: Interactive Option Card grid and refined conditional states (`isCondo`, `isLand`).

- [ ] **Step 1: Define `PROPERTY_TYPE_CONFIGS` array**

```jsx
const PROPERTY_TYPE_CONFIGS = [
  {
    id: 'House & Lot',
    label: 'House & Lot',
    badge: 'Residential Enclave',
    description: 'Single-family detached or duplex home within a private or subdivision enclave.',
    icon: Home,
    isLand: false,
    isCondo: false,
  },
  {
    id: 'Condominium',
    label: 'Condominium',
    badge: 'Vertical Living',
    description: 'High-rise or mid-rise residential unit, studio, or loft with shared building amenities.',
    icon: Building2,
    isLand: false,
    isCondo: true,
  },
  {
    id: 'Townhouse',
    label: 'Townhouse',
    badge: 'Urban Multi-Level',
    description: 'Multi-level attached urban residential unit with dedicated garage access.',
    icon: Building,
    isLand: false,
    isCondo: false,
  },
  {
    id: 'Penthouse',
    label: 'Penthouse',
    badge: 'Luxury Sky Residence',
    description: 'Top-tier luxury residence featuring expansive private terraces and panoramic vistas.',
    icon: Sparkles,
    isLand: false,
    isCondo: true,
  },
  {
    id: 'Estate',
    label: 'Estate',
    badge: 'Compound & Villa',
    description: 'Expansive private compound or country villa with sprawling landscaped grounds.',
    icon: Trees,
    isLand: false,
    isCondo: false,
  },
  {
    id: 'Vacant Land / Lot',
    label: 'Vacant Land / Lot',
    badge: 'Cadastral Parcel',
    description: 'Subdivision residential building lot, commercial parcel, or raw acreage.',
    icon: MapPin,
    isLand: true,
    isCondo: false,
  },
  {
    id: 'Commercial',
    label: 'Commercial',
    badge: 'Commercial & Retail',
    description: 'Office building, retail storefront, warehouse, or mixed-use commercial space.',
    icon: Store,
    isLand: false,
    isCondo: false,
  },
];
```

- [ ] **Step 2: Update conditional flags for `isCondo` and `isLand`**

```jsx
const isCondo = formData.property_type === 'Condominium' || formData.property_type === 'Penthouse';
const isLand = formData.property_type === 'Vacant Land / Lot' || formData.property_type === 'Land';
```

- [ ] **Step 3: Replace Step 1 Property Type dropdown with Option Cards Grid**

Render the responsive grid in Step 1:
```jsx
<div className="space-y-3 md:col-span-2">
  <div className="flex items-center justify-between">
    <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block">
      Property Type Classification <span className="text-[#FF6B6B]">*</span>
    </label>
    <span className="text-xs text-[#64748B]">
      Selected: <strong className="text-[#0F766E]">{formData.property_type}</strong>
    </span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5" role="radiogroup" aria-label="Property Type Classification">
    {PROPERTY_TYPE_CONFIGS.map(config => {
      const Icon = config.icon;
      const isSelected = formData.property_type === config.id;

      return (
        <button
          key={config.id}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => {
            setIsDirty(true);
            setFormData({ ...formData, property_type: config.id });
          }}
          className={`relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 ${
            isSelected
              ? 'bg-teal-50/40 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
              : 'bg-white border-[#E2E8F0] hover:border-[#0F766E]/50 hover:bg-slate-50/60 shadow-2xs'
          }`}
        >
          {isSelected && (
            <div className="absolute top-3 right-3 text-[#0F766E]">
              <CheckCircle2 className="w-4 h-4 fill-[#0F766E] text-white" />
            </div>
          )}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-teal-50 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {config.badge}
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
                {config.label}
              </div>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>
        </button>
      );
    })}
  </div>

  {/* Hidden synchronized select for full accessibility & form automation compatibility */}
  <select
    aria-label="Property Type Classification Select"
    value={formData.property_type}
    onChange={e => {
      setIsDirty(true);
      setFormData({ ...formData, property_type: e.target.value });
    }}
    className="sr-only"
  >
    {PROPERTY_TYPE_CONFIGS.map(c => (
      <option key={c.id} value={c.id}>{c.label}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `npm run test --prefix frontend -- BrokerCreateListings.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add frontend/src/pages/portals/broker/BrokerCreateListings.jsx
git commit -m "feat(broker): implement property type option cards and adaptive conditional intake"
```

---

### Task 3: Comprehensive Regression Testing

**Files:**
- Test all related broker suite components

- [ ] **Step 1: Run Vitest regression suite**

Run: `npm run test --prefix frontend -- BrokerProperties BrokerCreateListings BrokerPropertyDetail primitives DataTable`
Expected: All suites pass (43+ tests).

- [ ] **Step 2: Run Playwright E2E decoupling spec**

Run: `powershell -Command "cd frontend; npx playwright test property-agent-assignment-decoupling.spec.ts"`
Expected: All tests pass.

---

### Task 4: Documentation & Master Registries Maintenance

**Files:**
- Modify: `docs/modules/02-property-listing/ui-specification.md`
- Modify: `docs/REQUIREMENTS_SPECIFICATION.md`
- Create: `docs/modules/02-property-listing/2026-10-28-property-type-option-cards-verification.md`
- Modify: `docs/modules/02-property-listing/INDEX.md`

- [ ] **Step 1: Update UI Specification for M02-SCR-02**
Document the 7 Property Type Option Cards and dynamic conditional fields.

- [ ] **Step 2: Update Master Requirements Specification**
Add `FR-LIST-018: Interactive Property Type Option Cards` and revision record.

- [ ] **Step 3: Create dated verification record**
Record all Vitest and Playwright test outcomes, zero public listview diff verification.

- [ ] **Step 4: Commit documentation updates**

```bash
git add docs/modules/02-property-listing/ docs/REQUIREMENTS_SPECIFICATION.md
git commit -m "docs(property-listing): register property type option cards specification and verification evidence"
```
