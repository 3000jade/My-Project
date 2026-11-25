# Design Rules, Common Labels, High-UX Motion & Lint Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the upgraded design rulebook (`DESIGN.md`, `AGENTS.md`), shared plain-English label dictionary, reusable `framer-motion` presets, responsive 8-point layout wrappers, and non-blocking ESLint design guardrails across `frontend/`.

**Architecture:**
1. Pure JS constants/helpers in `frontend/src/constants/uiLabels.js` standardize everyday labels and context-aware field visibility.
2. `frontend/src/lib/motion.js` provides GPU-only `framer-motion` presets and an `<AppMotionProvider>` wrapping `<MotionConfig reducedMotion="user">`.
3. `frontend/src/components/ui/layout/LayoutPrimitives.jsx` provides `PageContainer`, `SectionStack`, `BentoGrid`, `BentoMain`, and `BentoRail` enforcing the 8-point grid, breakpoints, and `min-w-0` overflow safety.
4. `frontend/eslint-rules/design-guardrails.js` implements 6 custom ESLint rules wired into `frontend/eslint.config.js` as `warn` across `frontend/src/**/*.{js,jsx}`.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, Framer Motion (`framer-motion`), ESLint 10 (`eslint/config`), Vitest + React Testing Library (`jsdom`).

**Spec:** [2026-11-26-design-rules-and-guardrails-design.md](../specs/2026-11-26-design-rules-and-guardrails-design.md)

## Global Constraints

- **8-Point Spacing Grid:** All padding, margins, and gaps must use multiples of `8px` (`4px` half-step allowed only for inline icon-to-text pairs and compact badge interiors). No arbitrary bracket pixel values like `p-[13px]` or `gap-[19px]`.
- **Approved Palette Only:** Only use `DESIGN.md` Section 2 tokens and mapped Tailwind Slate/Teal/Emerald/Amber/Red equivalents. White text (`#FFFFFF`) on Coral (`#FF8559`).
- **One Common Label per Field:** No slash-separated labels (e.g., `Price / Rent`). Show only contextually relevant fields.
- **Reduced Motion & Focus Rings:** All animations must respect `prefers-reduced-motion: reduce`; `outline-none` must always pair with `focus-visible:ring-*`.
- **Vitest Test Location:** `frontend/vite.config.js` only discovers tests matching `tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`. All unit tests MUST be placed in `frontend/tests/`.

---

## File Structure

| Action | Path | Responsibility |
| :--- | :--- | :--- |
| Create | `frontend/src/constants/uiLabels.js` | Standard plain-English action/status labels & context helpers |
| Create | `frontend/tests/uiLabels.test.js` | Unit tests for `uiLabels.js` |
| Create | `frontend/src/lib/motion.js` | Standard `framer-motion` presets & `AppMotionProvider` |
| Create | `frontend/tests/motion.test.jsx` | Unit tests for `motion.js` presets & `AppMotionProvider` |
| Create | `frontend/src/components/ui/layout/LayoutPrimitives.jsx` | `PageContainer`, `SectionStack`, `BentoGrid`, `BentoMain`, `BentoRail` |
| Create | `frontend/tests/layoutPrimitives.test.jsx` | Unit tests for layout wrappers & responsive classes |
| Create | `frontend/eslint-rules/design-guardrails.js` | Custom ESLint plugin with 6 non-blocking design guardrail rules |
| Create | `frontend/tests/designGuardrails.test.js` | ESLint `RuleTester` tests for all 6 rules |
| Modify | `frontend/eslint.config.js` | Enable `design-guardrails` plugin as `warn` across `src/**/*.{js,jsx}` |
| Modify | `DESIGN.md` | Add common labels/context, motion presets, layout wrappers, and guardrail references |
| Modify | `AGENTS.md` | Add quick Guardrails checklist referencing `uiLabels.js`, `motion.js`, `LayoutPrimitives.jsx`, and `npm run lint` |

---

### Task 1: Shared Common Label Dictionary (`uiLabels.js`)

**Files:**
- Create: `frontend/src/constants/uiLabels.js`
- Test: `frontend/tests/uiLabels.test.js`

**Interfaces:**
- Produces:
  - `ACTION_LABELS`: `{ save, cancel, delete, edit, add, search, filter, clearFilters, retry, back, next, publish, signIn }`
  - `STATUS_LABELS`: `{ available, pendingReview, reserved, sold, rented, draft, archived }`
  - `getPriceLabel(transactionType: string): string`
  - `getListingContextFlags(propertyType: string): { showRooms: boolean, showFloorArea: boolean }`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/uiLabels.test.js`:

```js
import { describe, expect, it } from 'vitest';
import {
  ACTION_LABELS,
  STATUS_LABELS,
  getPriceLabel,
  getListingContextFlags,
} from '../src/constants/uiLabels.js';

describe('uiLabels', () => {
  it('exposes plain-English action and status labels without slashes', () => {
    for (const label of Object.values(ACTION_LABELS)) {
      expect(typeof label).toBe('string');
      expect(label).not.toContain('/');
    }
    for (const label of Object.values(STATUS_LABELS)) {
      expect(typeof label).toBe('string');
      expect(label).not.toContain('/');
    }
    expect(ACTION_LABELS.save).toBe('Save Changes');
    expect(ACTION_LABELS.signIn).toBe('Sign In');
    expect(STATUS_LABELS.pendingReview).toBe('Pending Review');
  });

  it('returns context-aware price labels', () => {
    expect(getPriceLabel('rent')).toBe('Monthly Rent');
    expect(getPriceLabel('For Rent')).toBe('Monthly Rent');
    expect(getPriceLabel('foreclosure')).toBe('Foreclosure Price');
    expect(getPriceLabel('sale')).toBe('Selling Price');
    expect(getPriceLabel()).toBe('Selling Price');
  });

  it('hides indoor room fields for vacant lots', () => {
    expect(getListingContextFlags('Vacant Lot')).toEqual({
      showRooms: false,
      showFloorArea: false,
    });
    expect(getListingContextFlags('lot')).toEqual({
      showRooms: false,
      showFloorArea: false,
    });
    expect(getListingContextFlags('House and Lot')).toEqual({
      showRooms: true,
      showFloorArea: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`: `npx vitest run tests/uiLabels.test.js`
Expected: FAIL because `../src/constants/uiLabels.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/constants/uiLabels.js`:

```js
export const ACTION_LABELS = Object.freeze({
  save: 'Save Changes',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  search: 'Search',
  filter: 'Filter',
  clearFilters: 'Clear Filters',
  retry: 'Retry',
  back: 'Back',
  next: 'Next',
  publish: 'Publish',
  signIn: 'Sign In',
});

export const STATUS_LABELS = Object.freeze({
  available: 'Available',
  pendingReview: 'Pending Review',
  reserved: 'Reserved',
  sold: 'Sold',
  rented: 'Rented',
  draft: 'Draft',
  archived: 'Archived',
});

export function getPriceLabel(transactionType = '') {
  const normalized = String(transactionType).trim().toLowerCase();
  if (normalized.includes('rent') || normalized.includes('lease')) {
    return 'Monthly Rent';
  }
  if (normalized.includes('foreclosure')) {
    return 'Foreclosure Price';
  }
  return 'Selling Price';
}

export function getListingContextFlags(propertyType = '') {
  const normalized = String(propertyType).trim().toLowerCase();
  const isLandOnly =
    normalized === 'lot' ||
    normalized === 'vacant lot' ||
    normalized.includes('vacant lot') ||
    normalized.includes('raw land');

  return {
    showRooms: !isLandOnly,
    showFloorArea: !isLandOnly,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `frontend/`: `npx vitest run tests/uiLabels.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/constants/uiLabels.js frontend/tests/uiLabels.test.js; if ($?) { git commit -m "feat(ui): add shared plain-English label dictionary and context helpers" }
```

---

### Task 2: High-UX Motion Presets & Reduced-Motion Provider (`motion.js`)

**Files:**
- Create: `frontend/src/lib/motion.js`
- Test: `frontend/tests/motion.test.jsx`

**Interfaces:**
- Produces:
  - `MOTION_DURATIONS`: `{ fast: 0.15, normal: 0.22, spring: 0.26 }`
  - `fadeSlideReveal`: `{ initial, animate, exit, transition }`
  - `tapFeedback`: `{ whileTap, transition }`
  - `stepSpring`: `{ type: 'spring', stiffness: 380, damping: 32 }`
  - `REDUCED_MOTION_TRANSITION`: `{ duration: 0 }`
  - `AppMotionProvider({ children })`: React component wrapping `<MotionConfig reducedMotion="user">`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/motion.test.jsx`:

```jsx
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MOTION_DURATIONS,
  fadeSlideReveal,
  tapFeedback,
  stepSpring,
  REDUCED_MOTION_TRANSITION,
  AppMotionProvider,
} from '../src/lib/motion.js';

describe('motion presets', () => {
  it('defines standard durations and GPU-only properties', () => {
    expect(MOTION_DURATIONS).toEqual({
      fast: 0.15,
      normal: 0.22,
      spring: 0.26,
    });
    expect(fadeSlideReveal.initial).toEqual({ opacity: 0, y: 8 });
    expect(fadeSlideReveal.animate).toEqual({ opacity: 1, y: 0 });
    expect(tapFeedback.whileTap).toEqual({ scale: 0.98 });
    expect(stepSpring.type).toBe('spring');
    expect(REDUCED_MOTION_TRANSITION).toEqual({ duration: 0 });
  });

  it('renders children inside AppMotionProvider', () => {
    render(
      <AppMotionProvider>
        <span>Motion Ready</span>
      </AppMotionProvider>
    );
    expect(screen.getByText('Motion Ready')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`: `npx vitest run tests/motion.test.jsx`
Expected: FAIL because `../src/lib/motion.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/lib/motion.js` (note: since it uses JSX for `AppMotionProvider`, name it `frontend/src/lib/motion.jsx` or use `React.createElement` in `.js` — using `React.createElement(MotionConfig, { reducedMotion: 'user' }, children)` keeps the `.js` extension cleanly without JSX transform issues in plain `.js` files):

```js
import React from 'react';
import { MotionConfig } from 'framer-motion';

export const MOTION_DURATIONS = Object.freeze({
  fast: 0.15,
  normal: 0.22,
  spring: 0.26,
});

export const fadeSlideReveal = Object.freeze({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: MOTION_DURATIONS.normal, ease: [0.22, 1, 0.36, 1] },
});

export const tapFeedback = Object.freeze({
  whileTap: { scale: 0.98 },
  transition: { duration: MOTION_DURATIONS.fast },
});

export const stepSpring = Object.freeze({
  type: 'spring',
  stiffness: 380,
  damping: 32,
});

export const REDUCED_MOTION_TRANSITION = Object.freeze({
  duration: 0,
});

export function AppMotionProvider({ children }) {
  return React.createElement(MotionConfig, { reducedMotion: 'user' }, children);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `frontend/`: `npx vitest run tests/motion.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/lib/motion.js frontend/tests/motion.test.jsx; if ($?) { git commit -m "feat(ui): add standard framer-motion presets and AppMotionProvider" }
```

---

### Task 3: Responsive 8-Point Layout & Breakpoint Primitives (`LayoutPrimitives.jsx`)

**Files:**
- Create: `frontend/src/components/ui/layout/LayoutPrimitives.jsx`
- Test: `frontend/tests/layoutPrimitives.test.jsx`

**Interfaces:**
- Produces:
  - `PageContainer({ variant = 'portal', className, children, ...props })`
  - `SectionStack({ gap = '6', className, children, ...props })` (`gap`: `'4' | '6' | '8'`)
  - `BentoGrid({ className, children, ...props })`
  - `BentoMain({ className, children, ...props })`
  - `BentoRail({ className, children, ...props })`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/layoutPrimitives.test.jsx`:

```jsx
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PageContainer,
  SectionStack,
  BentoGrid,
  BentoMain,
  BentoRail,
} from '../src/components/ui/layout/LayoutPrimitives.jsx';

describe('LayoutPrimitives', () => {
  it('renders public and portal PageContainer variants with DESIGN.md classes', () => {
    const { rerender } = render(
      <PageContainer variant="public" data-testid="page">
        Public Content
      </PageContainer>
    );
    expect(screen.getByTestId('page')).toHaveClass('max-w-[1440px]', 'px-4', 'md:px-6', 'lg:px-8');

    rerender(
      <PageContainer variant="portal" data-testid="page">
        Portal Content
      </PageContainer>
    );
    expect(screen.getByTestId('page')).toHaveClass('w-full', 'min-w-0', 'p-4', 'md:p-6', 'lg:p-8');
  });

  it('renders SectionStack with 8-pt gap steps and min-w-0', () => {
    render(
      <SectionStack gap="4" data-testid="stack">
        <span>Item</span>
      </SectionStack>
    );
    expect(screen.getByTestId('stack')).toHaveClass('flex', 'flex-col', 'gap-4', 'min-w-0');
  });

  it('renders BentoGrid, BentoMain, and BentoRail with 12-col responsive layout', () => {
    render(
      <BentoGrid data-testid="bento">
        <BentoMain data-testid="main">Main</BentoMain>
        <BentoRail data-testid="rail">Rail</BentoRail>
      </BentoGrid>
    );
    expect(screen.getByTestId('bento')).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-6');
    expect(screen.getByTestId('main')).toHaveClass('lg:col-span-8', 'min-w-0');
    expect(screen.getByTestId('rail')).toHaveClass('lg:col-span-4', 'min-w-0', 'flex', 'flex-col', 'gap-6');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`: `npx vitest run tests/layoutPrimitives.test.jsx`
Expected: FAIL because `LayoutPrimitives.jsx` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/ui/layout/LayoutPrimitives.jsx`:

```jsx
import React from 'react';
import { cn } from '@/lib/utils';

const PAGE_VARIANTS = {
  public: 'max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 min-w-0',
  portal: 'w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8',
};

const STACK_GAPS = {
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

export function PageContainer({ variant = 'portal', className, children, ...props }) {
  return (
    <div className={cn(PAGE_VARIANTS[variant] ?? PAGE_VARIANTS.portal, className)} {...props}>
      {children}
    </div>
  );
}

export function SectionStack({ gap = '6', className, children, ...props }) {
  return (
    <div className={cn('flex flex-col min-w-0', STACK_GAPS[String(gap)] ?? STACK_GAPS['6'], className)} {...props}>
      {children}
    </div>
  );
}

export function BentoGrid({ className, children, ...props }) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoMain({ className, children, ...props }) {
  return (
    <div className={cn('lg:col-span-8 min-w-0', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoRail({ className, children, ...props }) {
  return (
    <div className={cn('lg:col-span-4 min-w-0 flex flex-col gap-6', className)} {...props}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `frontend/`: `npx vitest run tests/layoutPrimitives.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/ui/layout/LayoutPrimitives.jsx frontend/tests/layoutPrimitives.test.jsx; if ($?) { git commit -m "feat(ui): add responsive 8-point LayoutPrimitives wrappers" }
```

---

### Task 4: Automated ESLint Design Guardrails (`design-guardrails.js` + `eslint.config.js`)

**Files:**
- Create: `frontend/eslint-rules/design-guardrails.js`
- Modify: `frontend/eslint.config.js:1-47`
- Test: `frontend/tests/designGuardrails.test.js`

**Interfaces:**
- Produces: ESLint plugin object `{ rules: { 'no-arbitrary-tailwind-values', 'no-unapproved-hex-colors', 'no-slash-labels', 'no-raw-html-controls', 'no-unpaired-outline-none', 'require-reduced-motion-safe' } }`.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/designGuardrails.test.js`:

```js
import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import designGuardrails from '../eslint-rules/design-guardrails.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('design-guardrails ESLint rules', () => {
  it('flags arbitrary Tailwind pixel/rem values except documented tokens', () => {
    ruleTester.run('no-arbitrary-tailwind-values', designGuardrails.rules['no-arbitrary-tailwind-values'], {
      valid: [
        { code: '<div className="p-4 gap-6 max-w-[1440px] min-h-[44px]" />' },
      ],
      invalid: [
        {
          code: '<div className="p-[13px] text-[15px]" />',
          errors: [{ messageId: 'arbitraryValue' }],
        },
      ],
    });
  });

  it('flags unapproved hex colors in className or style', () => {
    ruleTester.run('no-unapproved-hex-colors', designGuardrails.rules['no-unapproved-hex-colors'], {
      valid: [
        { code: '<div className="bg-[#0F766E] text-[#1E293B]" />' },
      ],
      invalid: [
        {
          code: '<div className="bg-[#333333]" />',
          errors: [{ messageId: 'unapprovedHex' }],
        },
      ],
    });
  });

  it('flags slash-separated labels in JSX text and label/placeholder props', () => {
    ruleTester.run('no-slash-labels', designGuardrails.rules['no-slash-labels'], {
      valid: [
        { code: '<label>Selling Price</label>' },
        { code: '<span placeholder="Search properties" />' },
        { code: '<span>3 / 5</span>' },
      ],
      invalid: [
        {
          code: '<label>Price / Rent</label>',
          errors: [{ messageId: 'slashLabel' }],
        },
        {
          code: '<input placeholder="City / Municipality" />',
          errors: [{ messageId: 'slashLabel' }],
        },
      ],
    });
  });

  it('flags raw button/input/select outside components/ui', () => {
    ruleTester.run('no-raw-html-controls', designGuardrails.rules['no-raw-html-controls'], {
      valid: [
        { code: '<Button>Save Changes</Button>' },
        { code: '<button>Internal</button>', filename: 'src/components/ui/button.jsx' },
      ],
      invalid: [
        {
          code: '<button>Save Changes</button>',
          filename: 'src/pages/portals/broker/BrokerDashboard.jsx',
          errors: [{ messageId: 'rawControl' }],
        },
      ],
    });
  });

  it('flags outline-none without paired focus-visible:ring-', () => {
    ruleTester.run('no-unpaired-outline-none', designGuardrails.rules['no-unpaired-outline-none'], {
      valid: [
        { code: '<div className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" />' },
      ],
      invalid: [
        {
          code: '<div className="outline-none" />',
          errors: [{ messageId: 'unpairedOutlineNone' }],
        },
      ],
    });
  });

  it('flags animate- classes or motion. elements without reduced-motion safety', () => {
    ruleTester.run('require-reduced-motion-safe', designGuardrails.rules['require-reduced-motion-safe'], {
      valid: [
        { code: '<div className="motion-safe:animate-pulse" />' },
        { code: 'import { MotionConfig, motion } from "framer-motion"; <MotionConfig reducedMotion="user"><motion.div /></MotionConfig>;' },
      ],
      invalid: [
        {
          code: '<div className="animate-bounce" />',
          errors: [{ messageId: 'missingReducedMotion' }],
        },
        {
          code: '<motion.div animate={{ opacity: 1 }} />',
          errors: [{ messageId: 'missingReducedMotion' }],
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`: `npx vitest run tests/designGuardrails.test.js`
Expected: FAIL because `../eslint-rules/design-guardrails.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/eslint-rules/design-guardrails.js`:

```js
const APPROVED_HEX_COLORS = new Set([
  '#F8FAFC', '#0F172A', '#FFFFFF', '#1E293B', '#F1F5F9', '#334155',
  '#E2E8F0', '#CBD5E1', '#475569', '#64748B', '#94A3B8',
  '#0F766E', '#14B8A6', '#115E59', '#0D9488', '#CCFBF1', '#134E4A',
  '#FF8559', '#F07144', '#F87171',
  '#ECFDF5', '#15803D', '#10B981', '#064E3B', '#6EE7B7', '#34D399',
  '#FFFBEB', '#B45309', '#F59E0B', '#78350F', '#FCD34D', '#FBBF24',
  '#FEF2F2', '#DC2626', '#EF4444', '#7F1D1D', '#FCA5A5',
  '#EFF6FF', '#1D4ED8', '#3B82F6', '#1E3A8A', '#93C5FD', '#60A5FA',
  '#FEE2E2',
]);

const ALLOWED_ARBITRARY_TOKENS = new Set([
  'max-w-[1440px]',
  'min-h-[44px]',
  'min-w-[44px]',
  'sm:text-[28px]',
]);

const ARBITRARY_RE = /(?:^|\s)([a-z0-9:-]*-\[\d+(?:\.\d+)?(?:px|rem|em)\])(?=\s|$)/gi;
const HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const SLASH_LABEL_RE = /\b[A-Za-z]{2,}\s*\/\s*[A-Za-z]{2,}\b/;
const RAW_CONTROLS = new Set(['button', 'input', 'select']);
const LABEL_PROPS = new Set(['label', 'placeholder', 'title', 'aria-label']);

function getStaticString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'JSXExpressionContainer') return getStaticString(node.expression);
  return null;
}

export default {
  rules: {
    'no-arbitrary-tailwind-values': {
      meta: {
        type: 'suggestion',
        messages: {
          arbitraryValue: 'Avoid arbitrary Tailwind value "{{token}}". Use DESIGN.md 8-point spacing, typography, or radius tokens.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            let match;
            ARBITRARY_RE.lastIndex = 0;
            while ((match = ARBITRARY_RE.exec(value)) !== null) {
              const token = match[1];
              if (!ALLOWED_ARBITRARY_TOKENS.has(token)) {
                context.report({ node, messageId: 'arbitraryValue', data: { token } });
                break;
              }
            }
          },
        };
      },
    },

    'no-unapproved-hex-colors': {
      meta: {
        type: 'suggestion',
        messages: {
          unapprovedHex: 'Hex color "{{hex}}" is not in DESIGN.md Section 2. Use semantic color tokens instead.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className' && node.name?.name !== 'style') return;
            const value = getStaticString(node.value);
            if (!value) return;
            const matches = value.match(HEX_RE) || [];
            for (const hex of matches) {
              if (!APPROVED_HEX_COLORS.has(hex.toUpperCase())) {
                context.report({ node, messageId: 'unapprovedHex', data: { hex } });
                break;
              }
            }
          },
        };
      },
    },

    'no-slash-labels': {
      meta: {
        type: 'suggestion',
        messages: {
          slashLabel: 'Avoid slash-separated label "{{text}}". Use one plain-English label driven by context.',
        },
      },
      create(context) {
        return {
          JSXText(node) {
            const text = node.value?.trim();
            if (text && SLASH_LABEL_RE.test(text) && !text.includes('http')) {
              context.report({ node, messageId: 'slashLabel', data: { text } });
            }
          },
          JSXAttribute(node) {
            if (!LABEL_PROPS.has(node.name?.name)) return;
            const value = getStaticString(node.value);
            if (value && SLASH_LABEL_RE.test(value) && !value.includes('http')) {
              context.report({ node, messageId: 'slashLabel', data: { text: value } });
            }
          },
        };
      },
    },

    'no-raw-html-controls': {
      meta: {
        type: 'suggestion',
        messages: {
          rawControl: 'Use shadcn/ui components from @/components/ui/ instead of raw <{{tag}}>.',
        },
      },
      create(context) {
        const filename = (context.filename || '').replace(/\\/g, '/');
        if (filename.includes('/components/ui/')) return {};
        return {
          JSXOpeningElement(node) {
            const name = node.name?.name;
            if (typeof name === 'string' && RAW_CONTROLS.has(name)) {
              context.report({ node, messageId: 'rawControl', data: { tag: name } });
            }
          },
        };
      },
    },

    'no-unpaired-outline-none': {
      meta: {
        type: 'suggestion',
        messages: {
          unpairedOutlineNone: 'Never use outline-none without pairing focus-visible:ring-* for keyboard accessibility.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            if (/\b(?:focus:)?outline-none\b/.test(value) && !value.includes('focus-visible:ring-')) {
              context.report({ node, messageId: 'unpairedOutlineNone' });
            }
          },
        };
      },
    },

    'require-reduced-motion-safe': {
      meta: {
        type: 'suggestion',
        messages: {
          missingReducedMotion: 'Ensure animations respect prefers-reduced-motion (use motion-safe:/motion-reduce: or MotionConfig/useReducedMotion).',
        },
      },
      create(context) {
        let hasMotionSafety = false;
        const motionNodes = [];
        return {
          ImportDeclaration(node) {
            const text = context.sourceCode.getText(node);
            if (text.includes('MotionConfig') || text.includes('useReducedMotion') || text.includes('AppMotionProvider')) {
              hasMotionSafety = true;
            }
          },
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            if (/(?:^|\s)animate-[^\s]+/.test(value) && !value.includes('motion-reduce:') && !value.includes('motion-safe:')) {
              context.report({ node, messageId: 'missingReducedMotion' });
            }
          },
          JSXOpeningElement(node) {
            if (node.name?.type === 'JSXMemberExpression' && node.name.object?.name === 'motion') {
              motionNodes.push(node);
            }
          },
          'Program:exit'() {
            if (!hasMotionSafety) {
              for (const node of motionNodes) {
                context.report({ node, messageId: 'missingReducedMotion' });
              }
            }
          },
        };
      },
    },
  },
};
```

Update `frontend/eslint.config.js` to register `design-guardrails` as `warn` across `src/**/*.{js,jsx}` while keeping existing broker portal rules intact:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import designGuardrails from './eslint-rules/design-guardrails.js'

export default defineConfig([
  {
    ignores: [
      'dist/',
      'e2e/',
      'public/',
      'node_modules/',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'design-guardrails': designGuardrails,
    },
    rules: {
      'design-guardrails/no-arbitrary-tailwind-values': 'warn',
      'design-guardrails/no-unapproved-hex-colors': 'warn',
      'design-guardrails/no-slash-labels': 'warn',
      'design-guardrails/no-raw-html-controls': 'warn',
      'design-guardrails/no-unpaired-outline-none': 'warn',
      'design-guardrails/require-reduced-motion-safe': 'warn',
    },
  },
  {
    files: ['src/pages/portals/broker/**/*.js', 'src/pages/portals/broker/**/*.jsx'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^React$' }],
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/pages/portals/broker/**/*.test.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);
```

- [ ] **Step 4: Run tests and lint to verify**

Run from `frontend/`: `npx vitest run tests/designGuardrails.test.js; npm run lint`
Expected: `designGuardrails.test.js` PASSES (6 tests) and `npm run lint` exits with code 0 (warnings only, zero errors).

- [ ] **Step 5: Commit**

```powershell
git add frontend/eslint-rules/design-guardrails.js frontend/eslint.config.js frontend/tests/designGuardrails.test.js; if ($?) { git commit -m "feat(lint): add non-blocking ESLint design guardrails plugin" }
```

---

### Task 5: Upgrade Rulebook (`DESIGN.md` & `AGENTS.md`) & Final Verification

**Files:**
- Modify: `DESIGN.md:154-229`
- Modify: `AGENTS.md:1-10`

- [ ] **Step 1: Update `DESIGN.md` with Guardrails, Common Label Dictionary, Motion & Layout Wrapper references**

Add a concise **Section 10: Ready-Made Building Blocks & Automated Guardrails** to `DESIGN.md` documenting:
- `frontend/src/constants/uiLabels.js` (`ACTION_LABELS`, `STATUS_LABELS`, `getPriceLabel`, `getListingContextFlags`)
- `frontend/src/lib/motion.js` (`MOTION_DURATIONS`, `fadeSlideReveal`, `tapFeedback`, `stepSpring`, `AppMotionProvider`)
- `frontend/src/components/ui/layout/LayoutPrimitives.jsx` (`PageContainer`, `SectionStack`, `BentoGrid`, `BentoMain`, `BentoRail`)
- `npm run lint` design guardrail warnings (`frontend/eslint-rules/design-guardrails.js`).

- [ ] **Step 2: Update `AGENTS.md` with a short Guardrails checklist**

Append under `## Design System` in `AGENTS.md`:
- Reuse `ACTION_LABELS` / `STATUS_LABELS` / context helpers from `@/constants/uiLabels`, `fadeSlideReveal` / `AppMotionProvider` from `@/lib/motion`, and `PageContainer` / `SectionStack` / `BentoGrid` from `@/components/ui/layout/LayoutPrimitives`.
- Run `npm run lint` in `frontend/` and resolve any `design-guardrails/*` warnings on files you touch.

- [ ] **Step 3: Run full verification**

Run from `frontend/`: `npm test; npm run lint`
Expected: All unit tests pass, `npm run lint` exits `0`.

- [ ] **Step 4: Commit**

```powershell
git add DESIGN.md AGENTS.md; if ($?) { git commit -m "docs: update DESIGN.md and AGENTS.md with labels, motion, layout, and guardrail rules" }
```
