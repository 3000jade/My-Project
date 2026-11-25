# Multi-Branch Realty Contact Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the public Contact page and its CMS Live Canvas so visitors can reach Human Shelter Realty across multiple physical branches, pick a branch or inquiry topic in the form, tap to call any branch directly, see clear response times and trust signals, and get honest error/confirmation feedback.

**Architecture:** Extract pure URL, phone-link, branch-normalization, and inquiry-message helpers into a shared utility module, then compose the public Contact page from two focused UI components (`BranchDirectory` and `ContactInquiryForm`) backed by existing `cmsService` (`page/contact-us` and `office` records) and `inquiryService.submitInquiry` (`/api/inquiries`) with zero backend schema changes. Sync `ContactLiveCanvas` so admins can edit the new main-line, response-time, credentials, and per-branch fields (area/region, Google Maps link, branch WhatsApp, and headquarters flag) directly inline.

**Tech Stack:** React 19, Tailwind CSS v4 (`@tailwindcss/vite`), `shadcn/ui` (`Card`, `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Alert`, `Select`, `Skeleton`), `lucide-react`, `framer-motion` (`MotionConfig reducedMotion="user"`), Vitest (`vitest run` with `jsdom` and `@testing-library/react`).

**Spec:** Conversation context (realty contact page principal elements + multi-branch establishment requirement) & `DESIGN.md` (`c:\Users\Win11x64\Desktop\My code space\CP_kerby\DESIGN.md`).

## Global Constraints

- Strictly follow `DESIGN.md` color tokens: Canvas `#F8FAFC`, Surface `#FFFFFF`, Muted Surface `#F1F5F9`, Hairline Border `#E2E8F0`, Primary Text `#1E293B`, Secondary Text `#64748B`, Primary Teal `#0F766E` / hover `#115E59`, Conversion Coral `#FF8559` (only with `#FFFFFF` text). No off-token hex values.
- Use the 8-point spacing grid (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `p-4`, `p-6`, `p-8`, `py-12`) and standard radii (`rounded-lg`, `rounded-xl`, `rounded-full`). No arbitrary pixel classes (`p-[13px]`, `text-[15px]`, `h-[54px]`).
- Reuse `shadcn/ui` components from `frontend/src/components/ui/` (`Card`, `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Alert`, `Select`, `Skeleton`) and `lucide-react` icons (no `material-symbols-outlined` on updated sections).
- Minimum interactive touch target `min-h-11` (`44px`) on buttons, links, and dropdown triggers; every focusable control pairs `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]`.
- At most one solid Primary (`bg-[#0F766E]`) CTA per view; secondary actions use `variant="outline"` or `variant="ghost"`.
- Wrap animations in `<MotionConfig reducedMotion="user">` and respect `prefers-reduced-motion` when smooth-scrolling to the form.
- Existing `POST /api/inquiries` contract (`backend/src/schemas/inquiry.schema.ts`) requires `name`, valid `email`, and `message`, with optional `phone`, `type` (`'general' | 'tour' | 'offer'`), `source`, and `consentAccepted`. Do not break or alter backend routes.

---

## File Structure

| File | Action | Responsibility |
| :--- | :--- | :--- |
| `frontend/src/utils/contactHelpers.js` | Create | Safe URL/media sanitization, `tel:` link formatting, CMS `office` branch normalization & sorting (HQ first), area/region extraction, and structured inquiry message formatting. |
| `frontend/src/components/contact/BranchDirectory.jsx` | Create | Multi-branch directory with area filter chips, search input (when > 3 branches), HQ badge, clickable `tel:` phone links, map links, optional branch WhatsApp, and "Message This Branch" selection trigger. |
| `frontend/src/components/contact/ContactInquiryForm.jsx` | Create | Short contact form with topic selector (`Buying`, `Selling`, `Renting`, `General`), preferred branch selector synced with `BranchDirectory`, privacy note, honest error `<Alert>`, and next-step confirmation state. |
| `frontend/src/pages/public/ContactPage.jsx` | Modify | Public Contact page combining editable header + response-time strip, 4 direct channels (clickable main phone, WhatsApp, Calendly, Email), Trust & Credentials card, `ContactInquiryForm`, `BranchDirectory`, and loading skeletons. |
| `frontend/src/components/cms/ContactLiveCanvas.jsx` | Modify | Admin live CMS editor exposing editable main phone, response time, brokerage credentials, and per-branch region/area, Google Maps link, WhatsApp link, and HQ toggle. |
| `frontend/tests/contactHelpers.test.js` | Create | Unit tests for URL safety, `toTelHref`, `normalizeBranch`, HQ-first sorting, and `buildInquiryMessage`. |
| `frontend/tests/BranchDirectory.test.jsx` | Create | Component tests for multi-branch rendering, area filtering, clickable `tel:` links, and "Message This Branch" callback. |
| `frontend/tests/ContactInquiryForm.test.jsx` | Create | Component tests for topic + branch submission payload, honest error alert retaining input, and success state next steps. |
| `frontend/tests/ContactPage.test.jsx` | Create | Integration tests for ContactPage rendering direct channels, trust card, branches, and selecting a branch to pre-fill the form. |
| `frontend/tests/ContactLiveCanvas.test.jsx` | Create | Component tests verifying admin edits to new contact channels and branch metadata call `onUpdate` / `onCreate` with the expected payloads. |

---

### Task 1: Contact Helpers & Multi-Branch Normalization

**Files:**
- Create: `frontend/src/utils/contactHelpers.js`
- Test: `frontend/tests/contactHelpers.test.js`

**Interfaces:**
- Consumes: Raw CMS `office` items (`{ id, title, media_url, payload }`) and form values.
- Produces:
  - `DEFAULT_CONTACT_CONTENT`: `{ eyebrow, headline, intro, phone, whatsappUrl, calendlyUrl, email, responseTime, credentialsText, testimonialQuote, testimonialAuthor, fallbackBranch }`
  - `INQUIRY_TOPICS`: `Array<{ value: string, label: string, inquiryType: 'general' | 'tour' }>`
  - `safeHttpUrl(url: string): string | null`
  - `safeMediaUrl(url: string): string | null`
  - `toTelHref(phone: string): string | null`
  - `normalizeBranches(offices: Array<object>): Array<NormalizedBranch>`
  - `extractBranchRegions(branches: Array<NormalizedBranch>): Array<string>`
  - `buildInquiryMessage({ topicLabel: string, branchName: string, message: string }): string`

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/contactHelpers.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  safeHttpUrl,
  safeMediaUrl,
  toTelHref,
  normalizeBranches,
  extractBranchRegions,
  buildInquiryMessage,
} from '../src/utils/contactHelpers';

describe('contactHelpers', () => {
  it('sanitizes http and https URLs and rejects javascript URLs', () => {
    expect(safeHttpUrl('https://maps.google.com/?q=BGC')).toBe('https://maps.google.com/?q=BGC');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('')).toBeNull();
  });

  it('allows safe relative media paths and rejects protocol-relative paths', () => {
    expect(safeMediaUrl('/images/bgc-office.jpg')).toBe('/images/bgc-office.jpg');
    expect(safeMediaUrl('//evil.com/x.png')).toBeNull();
  });

  it('formats clickable tel: links from human phone numbers', () => {
    expect(toTelHref('+63 2 8123-4567')).toBe('tel:+63281234567');
    expect(toTelHref('(02) 8888 9999')).toBe('tel:0288889999');
    expect(toTelHref('abc')).toBeNull();
    expect(toTelHref('')).toBeNull();
  });

  it('normalizes branches and sorts headquarters branches first', () => {
    const raw = [
      {
        id: 'b2',
        title: 'Cebu IT Park Branch',
        payload: {
          address: 'Cebu City',
          phone: '+63 32 555 0100',
          hours: 'Mon-Sat, 9 AM - 6 PM',
          region: 'Cebu',
          is_headquarters: false,
        },
      },
      {
        id: 'b1',
        title: 'BGC Main Office',
        payload: {
          address: 'High Street South, BGC',
          phone: '+63 2 8000 0000',
          hours: 'Mon-Sat, 9 AM - 6 PM',
          region: 'Metro Manila',
          map_url: 'https://maps.google.com/?q=BGC',
          is_headquarters: true,
        },
      },
    ];

    const branches = normalizeBranches(raw);
    expect(branches).toHaveLength(2);
    expect(branches[0].id).toBe('b1');
    expect(branches[0].isHeadquarters).toBe(true);
    expect(branches[0].telHref).toBe('tel:+63280000000');
    expect(branches[0].mapUrl).toBe('https://maps.google.com/?q=BGC');
    expect(branches[1].id).toBe('b2');
  });

  it('extracts unique non-empty branch regions in display order', () => {
    const branches = normalizeBranches([
      { id: '1', title: 'BGC', payload: { region: 'Metro Manila' } },
      { id: '2', title: 'Makati', payload: { region: 'Metro Manila' } },
      { id: '3', title: 'Cebu', payload: { region: 'Cebu' } },
    ]);
    expect(extractBranchRegions(branches)).toEqual(['Metro Manila', 'Cebu']);
  });

  it('formats inquiry message with topic and selected branch metadata', () => {
    const formatted = buildInquiryMessage({
      topicLabel: 'Buying a Property',
      branchName: 'BGC Main Office',
      message: 'Looking for a 2BR condo.',
    });
    expect(formatted).toContain('[Topic: Buying a Property]');
    expect(formatted).toContain('[Preferred Branch: BGC Main Office]');
    expect(formatted).toContain('Looking for a 2BR condo.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- tests/contactHelpers.test.js`
Expected: FAIL with module not found (`../src/utils/contactHelpers`).

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/utils/contactHelpers.js`:

```js
export const DEFAULT_CONTACT_CONTENT = {
  eyebrow: "Let's Talk",
  headline: 'Ready to start the conversation?',
  intro:
    "Whether you're ready to buy, thinking of selling, or exploring neighborhoods across our branches, our local advisors are here to help.",
  phone: '+63 2 8000 0000',
  whatsappUrl: 'https://wa.me/639170000000',
  calendlyUrl: 'https://calendly.com',
  email: 'hello@humanshelter.ph',
  responseTime: 'Typically replies within 2 hours during business hours (Mon–Sat, 9:00 AM – 6:00 PM)',
  credentialsText: 'Licensed Real Estate Brokerage · PRC-Accredited Advisors',
  testimonialQuote:
    'The team walked us through every step clearly and helped us close on our family home without any stress.',
  testimonialAuthor: 'Verified Homebuyer, Metro Manila',
  fallbackBranch: {
    id: 'default-hq',
    title: 'Main Advisory Office',
    region: 'Metro Manila',
    address: 'Bonifacio Global City, Taguig, Metro Manila',
    phone: '+63 2 8000 0000',
    telHref: 'tel:+63280000000',
    hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
    mapUrl: null,
    whatsappUrl: null,
    photoUrl: null,
    isHeadquarters: true,
  },
};

export const INQUIRY_TOPICS = [
  { value: 'buying', label: 'Buying a Property', inquiryType: 'general' },
  { value: 'selling', label: 'Selling a Property', inquiryType: 'general' },
  { value: 'renting', label: 'Renting / Leasing', inquiryType: 'general' },
  { value: 'viewing', label: 'Schedule a Property Viewing', inquiryType: 'tour' },
  { value: 'general', label: 'General Question', inquiryType: 'general' },
];

export function safeHttpUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function safeMediaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return safeHttpUrl(trimmed);
}

export function toTelHref(phone) {
  if (typeof phone !== 'string') return null;
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7) return null;
  return `tel:${cleaned}`;
}

export function normalizeBranches(offices = []) {
  if (!Array.isArray(offices)) return [];

  return offices
    .filter((item) => item && (item.id || item.title))
    .map((office) => {
      const payload = office.payload || {};
      const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
      return {
        id: String(office.id || office.title),
        title: office.title || 'Office Branch',
        region: typeof payload.region === 'string' ? payload.region.trim() : '',
        address: typeof payload.address === 'string' ? payload.address.trim() : '',
        phone,
        telHref: toTelHref(phone),
        hours: typeof payload.hours === 'string' ? payload.hours.trim() : '',
        mapUrl: safeHttpUrl(payload.map_url),
        whatsappUrl: safeHttpUrl(payload.whatsapp_url),
        photoUrl: safeMediaUrl(office.media_url),
        isHeadquarters: Boolean(payload.is_headquarters),
      };
    })
    .sort((a, b) => Number(b.isHeadquarters) - Number(a.isHeadquarters));
}

export function extractBranchRegions(branches = []) {
  const seen = new Set();
  const regions = [];
  for (const branch of branches) {
    if (branch.region && !seen.has(branch.region)) {
      seen.add(branch.region);
      regions.push(branch.region);
    }
  }
  return regions;
}

export function buildInquiryMessage({ topicLabel, branchName, message }) {
  const lines = [];
  if (topicLabel) lines.push(`[Topic: ${topicLabel}]`);
  if (branchName) lines.push(`[Preferred Branch: ${branchName}]`);
  lines.push((message || '').trim());
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- tests/contactHelpers.test.js`
Expected: PASS (all 6 tests passing).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/contactHelpers.js frontend/tests/contactHelpers.test.js
git commit -m "feat(contact): add multi-branch normalization and contact helper utilities"
```

---

### Task 2: Multi-Branch Directory Component

**Files:**
- Create: `frontend/src/components/contact/BranchDirectory.jsx`
- Test: `frontend/tests/BranchDirectory.test.jsx`

**Interfaces:**
- Consumes:
  - `extractBranchRegions` from `frontend/src/utils/contactHelpers.js`
  - Props: `{ branches: NormalizedBranch[], selectedBranchId: string, onSelectBranch: (branch: NormalizedBranch) => void, isLoading?: boolean }`
- Produces:
  - Default export `BranchDirectory` component rendering filterable branch cards, HQ badge, clickable `tel:` phone links, map links, optional WhatsApp links, and a "Message This Branch" button calling `onSelectBranch(branch)`.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/BranchDirectory.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BranchDirectory from '../src/components/contact/BranchDirectory';

const SAMPLE_BRANCHES = [
  {
    id: 'bgc',
    title: 'BGC Main Office',
    region: 'Metro Manila',
    address: 'High Street South, BGC',
    phone: '+63 2 8000 0000',
    telHref: 'tel:+63280000000',
    hours: 'Mon-Sat, 9 AM - 6 PM',
    mapUrl: 'https://maps.google.com/?q=BGC',
    whatsappUrl: 'https://wa.me/639170000001',
    photoUrl: null,
    isHeadquarters: true,
  },
  {
    id: 'cebu',
    title: 'Cebu IT Park Branch',
    region: 'Cebu',
    address: 'IT Park, Apas, Cebu City',
    phone: '+63 32 555 0100',
    telHref: 'tel:+63325550100',
    hours: 'Mon-Sat, 9 AM - 6 PM',
    mapUrl: 'https://maps.google.com/?q=Cebu',
    whatsappUrl: null,
    photoUrl: null,
    isHeadquarters: false,
  },
];

describe('BranchDirectory', () => {
  it('renders branch cards with HQ badge and clickable phone links', () => {
    render(
      <BranchDirectory
        branches={SAMPLE_BRANCHES}
        selectedBranchId=""
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByText('BGC Main Office')).toBeInTheDocument();
    expect(screen.getByText('Main Office')).toBeInTheDocument();
    const bgcPhoneLink = screen.getByRole('link', { name: /\+63 2 8000 0000/i });
    expect(bgcPhoneLink).toHaveAttribute('href', 'tel:+63280000000');
  });

  it('filters branches by region chip', () => {
    render(
      <BranchDirectory
        branches={SAMPLE_BRANCHES}
        selectedBranchId=""
        onSelectBranch={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cebu' }));
    expect(screen.getByText('Cebu IT Park Branch')).toBeInTheDocument();
    expect(screen.queryByText('BGC Main Office')).not.toBeInTheDocument();
  });

  it('calls onSelectBranch when Message This Branch is clicked', () => {
    const onSelectBranch = vi.fn();
    render(
      <BranchDirectory
        branches={SAMPLE_BRANCHES}
        selectedBranchId=""
        onSelectBranch={onSelectBranch}
      />
    );

    const messageButtons = screen.getAllByRole('button', { name: /message this branch/i });
    fireEvent.click(messageButtons[1]);
    expect(onSelectBranch).toHaveBeenCalledWith(SAMPLE_BRANCHES[1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- tests/BranchDirectory.test.jsx`
Expected: FAIL with module not found (`../src/components/contact/BranchDirectory`).

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/contact/BranchDirectory.jsx`:

```jsx
import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  MessageCircle,
  Search,
  Building2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { extractBranchRegions } from '@/utils/contactHelpers';

export default function BranchDirectory({
  branches = [],
  selectedBranchId = '',
  onSelectBranch,
  isLoading = false,
}) {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const regions = useMemo(() => extractBranchRegions(branches), [branches]);
  const showSearch = branches.length > 3;

  const filteredBranches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesRegion = activeRegion === 'ALL' || branch.region === activeRegion;
      if (!matchesRegion) return false;
      if (!query) return true;
      return (
        branch.title.toLowerCase().includes(query) ||
        branch.address.toLowerCase().includes(query) ||
        branch.region.toLowerCase().includes(query)
      );
    });
  }, [branches, activeRegion, searchQuery]);

  return (
    <section aria-labelledby="office-branches-heading" className="pt-12">
      <div className="text-center max-w-2xl mx-auto mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 justify-center text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
          <Building2 className="size-4" aria-hidden="true" />
          <span>Visit or Call a Branch</span>
        </div>
        <h2
          id="office-branches-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B]"
        >
          Our Office Branches
        </h2>
        <p className="text-sm text-[#64748B]">
          Choose the branch closest to you to call directly, open directions, or send your message straight to that office.
        </p>
      </div>

      {!isLoading && (regions.length > 1 || showSearch) && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          {regions.length > 1 && (
            <div
              role="group"
              aria-label="Filter branches by area"
              className="flex flex-wrap items-center gap-2"
            >
              <Button
                type="button"
                variant={activeRegion === 'ALL' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveRegion('ALL')}
                className="min-h-11 rounded-full normal-case tracking-normal text-sm"
              >
                All Branches ({branches.length})
              </Button>
              {regions.map((region) => (
                <Button
                  key={region}
                  type="button"
                  variant={activeRegion === region ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setActiveRegion(region)}
                  className="min-h-11 rounded-full normal-case tracking-normal text-sm"
                >
                  {region}
                </Button>
              ))}
            </div>
          )}

          {showSearch && (
            <div className="relative w-full md:w-72">
              <Search
                className="size-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search branch or city..."
                aria-label="Search branch or city"
                className="h-11 pl-10 bg-white border-[#E2E8F0] text-[#1E293B] rounded-lg focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-6 flex flex-col gap-4">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-8 text-center">
          <p className="text-sm text-[#64748B] mb-4">
            No branches match your current filter.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 normal-case tracking-normal"
            onClick={() => {
              setActiveRegion('ALL');
              setSearchQuery('');
            }}
          >
            Show All Branches
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <Card
                key={branch.id}
                className={`bg-white border rounded-xl shadow-xs flex flex-col justify-between transition-shadow hover:shadow-md ${
                  isSelected ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#E2E8F0]'
                }`}
              >
                <CardHeader className="p-6 pb-4 flex flex-col gap-4">
                  {branch.photoUrl && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#F1F5F9]">
                      <img
                        src={branch.photoUrl}
                        alt={branch.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-semibold tracking-tight text-[#1E293B]">
                      {branch.title}
                    </CardTitle>
                    {branch.isHeadquarters && (
                      <Badge className="bg-teal-50 text-[#0F766E] border border-teal-200 rounded-full shrink-0">
                        Main Office
                      </Badge>
                    )}
                  </div>
                  {branch.region && (
                    <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
                      {branch.region}
                    </span>
                  )}
                </CardHeader>

                <CardContent className="px-6 pb-4 flex flex-col gap-3 text-sm text-[#64748B]">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-[#0F766E] shrink-0 mt-1" aria-hidden="true" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                      {branch.telHref ? (
                        <a
                          href={branch.telHref}
                          className="text-[#1E293B] font-medium hover:text-[#0F766E] underline-offset-4 hover:underline min-h-11 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                        >
                          {branch.phone}
                        </a>
                      ) : (
                        <span className="text-[#1E293B] font-medium">{branch.phone}</span>
                      )}
                    </div>
                  )}
                  {branch.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                      <span>{branch.hours}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-2 items-stretch">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onSelectBranch?.(branch)}
                    className="w-full min-h-11 rounded-lg normal-case tracking-normal text-sm font-semibold border-[#E2E8F0] hover:border-[#0F766E] hover:text-[#0F766E]"
                  >
                    <Send className="size-4" aria-hidden="true" />
                    <span>{isSelected ? 'Selected for Your Message' : 'Message This Branch'}</span>
                  </Button>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {branch.mapUrl && (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                      >
                        <span>View on Map</span>
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    )}
                    {branch.whatsappUrl && (
                      <a
                        href={branch.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        <span>Branch WhatsApp</span>
                      </a>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- tests/BranchDirectory.test.jsx`
Expected: PASS (all 3 tests passing).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/contact/BranchDirectory.jsx frontend/tests/BranchDirectory.test.jsx
git commit -m "feat(contact): add filterable multi-branch directory with clickable phone links"
```

---

### Task 3: Enhanced Contact Inquiry Form Component

**Files:**
- Create: `frontend/src/components/contact/ContactInquiryForm.jsx`
- Test: `frontend/tests/ContactInquiryForm.test.jsx`

**Interfaces:**
- Consumes:
  - `INQUIRY_TOPICS`, `buildInquiryMessage` from `frontend/src/utils/contactHelpers.js`
  - `inquiryService.submitInquiry` from `frontend/src/services/inquiryService.js`
  - Props: `{ branches: NormalizedBranch[], selectedBranchId: string, onBranchChange: (branchId: string) => void, responseTime: string, fallbackPhone?: string, fallbackTelHref?: string | null, whatsappUrl?: string }`
- Produces:
  - Default export `ContactInquiryForm` with topic selector, preferred branch selector, privacy note, honest error `<Alert variant="destructive">` that preserves input on failure, and helpful confirmation view with next-step links.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/ContactInquiryForm.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactInquiryForm from '../src/components/contact/ContactInquiryForm';
import { inquiryService } from '../src/services/inquiryService';

vi.mock('../src/services/inquiryService', () => ({
  inquiryService: {
    submitInquiry: vi.fn(),
  },
}));

const BRANCHES = [
  { id: 'bgc', title: 'BGC Main Office' },
  { id: 'cebu', title: 'Cebu IT Park Branch' },
];

describe('ContactInquiryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits topic and selected branch inside the inquiry payload and shows confirmation', async () => {
    inquiryService.submitInquiry.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <ContactInquiryForm
          branches={BRANCHES}
          selectedBranchId="cebu"
          onBranchChange={vi.fn()}
          responseTime="Replies within 2 hours"
        />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByLabelText(/email or phone/i), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText(/how can we help/i), {
      target: { value: 'Interested in a 3BR house.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(inquiryService.submitInquiry).toHaveBeenCalledTimes(1);
    });

    const submitted = inquiryService.submitInquiry.mock.calls[0][0];
    expect(submitted.name).toBe('Maria Santos');
    expect(submitted.email).toBe('maria@example.com');
    expect(submitted.message).toContain('[Topic: Buying a Property]');
    expect(submitted.message).toContain('[Preferred Branch: Cebu IT Park Branch]');
    expect(submitted.message).toContain('Interested in a 3BR house.');

    expect(await screen.findByText(/message received/i)).toBeInTheDocument();
    expect(screen.getByText(/cebu it park branch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse listings/i })).toHaveAttribute('href', '/properties');
  });

  it('shows an error alert and preserves typed input when submission fails', async () => {
    inquiryService.submitInquiry.mockRejectedValueOnce(new Error('Network offline'));

    render(
      <MemoryRouter>
        <ContactInquiryForm
          branches={BRANCHES}
          selectedBranchId=""
          onBranchChange={vi.fn()}
          responseTime="Replies within 2 hours"
          fallbackPhone="+63 2 8000 0000"
          fallbackTelHref="tel:+63280000000"
        />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Juan Dela Cruz' } });
    fireEvent.change(screen.getByLabelText(/email or phone/i), { target: { value: '09171234567' } });
    fireEvent.change(screen.getByLabelText(/how can we help/i), { target: { value: 'Need valuation' } });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not send your message/i);
    expect(screen.queryByText(/message received/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toHaveValue('Juan Dela Cruz');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- tests/ContactInquiryForm.test.jsx`
Expected: FAIL with module not found (`../src/components/contact/ContactInquiryForm`).

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/contact/ContactInquiryForm.jsx`:

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Building2,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inquiryService } from '@/services/inquiryService';
import { INQUIRY_TOPICS, buildInquiryMessage } from '@/utils/contactHelpers';

const ANY_BRANCH_VALUE = '__any__';

export default function ContactInquiryForm({
  branches = [],
  selectedBranchId = '',
  onBranchChange,
  responseTime,
  fallbackPhone,
  fallbackTelHref,
  whatsappUrl,
}) {
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [topicValue, setTopicValue] = useState(INQUIRY_TOPICS[0].value);
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedTopic = INQUIRY_TOPICS.find((t) => t.value === topicValue) || INQUIRY_TOPICS[0];
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;
  const branchSelectValue = selectedBranch ? selectedBranch.id : ANY_BRANCH_VALUE;

  const handleBranchSelect = (val) => {
    onBranchChange?.(val === ANY_BRANCH_VALUE ? '' : val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactInfo.trim() || !contactMessage.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const trimmedInfo = contactInfo.trim();
      const isEmail = trimmedInfo.includes('@');
      const slugName = contactName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'client';

      await inquiryService.submitInquiry({
        name: contactName.trim(),
        email: isEmail ? trimmedInfo : `${slugName}@lead.client.ph`,
        phone: !isEmail ? trimmedInfo : undefined,
        message: buildInquiryMessage({
          topicLabel: selectedTopic.label,
          branchName: selectedBranch ? selectedBranch.title : 'Any / Nearest Branch',
          message: contactMessage,
        }),
        type: selectedTopic.inquiryType,
        source: 'contact_page',
      });

      setIsSubmitted(true);
    } catch {
      setSubmitError(
        'We could not send your message right now. Your details are still saved below—please try again or reach us directly by phone or WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContactName('');
    setContactInfo('');
    setContactMessage('');
    setSubmitError('');
    setIsSubmitted(false);
  };

  return (
    <Card
      id="contact-form"
      className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs scroll-mt-24"
    >
      <CardHeader className="p-6 md:p-8 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Send Us a Message
        </CardTitle>
        <CardDescription className="text-sm text-[#64748B]">
          Share a few quick details and we will connect you with the right branch advisor.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-4">
            <div className="size-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-xl font-semibold text-[#1E293B]">Message Received</h3>
              <p className="text-sm text-[#64748B]">
                Thank you, {contactName}.{' '}
                {selectedBranch
                  ? `Your message has been routed to our ${selectedBranch.title} team.`
                  : 'An advisor from our nearest branch will reach out shortly.'}
              </p>
              {responseTime && (
                <p className="text-xs text-[#0F766E] font-medium">{responseTime}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="min-h-11 rounded-lg normal-case tracking-normal text-sm">
                <Link to="/properties">
                  <span>Browse Listings</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleReset}
                className="min-h-11 rounded-lg normal-case tracking-normal text-sm"
              >
                Send Another Message
              </Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertTitle>Could not send your message</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{submitError}</span>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {fallbackTelHref && fallbackPhone && (
                      <a href={fallbackTelHref} className="font-semibold underline">
                        Call {fallbackPhone}
                      </a>
                    )}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                      >
                        Chat on WhatsApp
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Your Name
              </Label>
              <Input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="How should we address you?"
                required
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-info" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Email or Phone
              </Label>
              <Input
                id="contact-info"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Your email address or mobile number"
                required
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-topic" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  I Am Looking To
                </Label>
                <Select value={topicValue} onValueChange={setTopicValue}>
                  <SelectTrigger
                    id="contact-topic"
                    className="w-full h-11 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <Tag className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-[#E2E8F0]">
                    <SelectGroup>
                      {INQUIRY_TOPICS.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-branch" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Preferred Branch
                </Label>
                <Select value={branchSelectValue} onValueChange={handleBranchSelect}>
                  <SelectTrigger
                    id="contact-branch"
                    className="w-full h-11 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <Building2 className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Any / Nearest Branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-[#E2E8F0]">
                    <SelectGroup>
                      <SelectItem value={ANY_BRANCH_VALUE}>Any / Nearest Branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                How Can We Help?
              </Label>
              <Textarea
                id="contact-message"
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Tell us the area, budget, or property type you have in mind..."
                required
                className="bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm resize-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full h-12 rounded-lg text-sm font-semibold normal-case tracking-normal mt-2"
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              {!isSubmitting && <Send className="size-4" aria-hidden="true" />}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] pt-1">
              <ShieldCheck className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <span>Your details stay private and are only used to reply to your inquiry.</span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- tests/ContactInquiryForm.test.jsx`
Expected: PASS (all 2 tests passing).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/contact/ContactInquiryForm.jsx frontend/tests/ContactInquiryForm.test.jsx
git commit -m "feat(contact): add ContactInquiryForm with topic/branch routing and honest error handling"
```

---

### Task 4: Upgrade Public `ContactPage.jsx` with Direct Phone, Response Time, Trust Card & Multi-Branch Wiring

**Files:**
- Modify: `frontend/src/pages/public/ContactPage.jsx`
- Test: `frontend/tests/ContactPage.test.jsx`

**Interfaces:**
- Consumes:
  - `DEFAULT_CONTACT_CONTENT`, `safeHttpUrl`, `toTelHref`, `normalizeBranches` from `frontend/src/utils/contactHelpers.js`
  - `BranchDirectory` from `frontend/src/components/contact/BranchDirectory.jsx`
  - `ContactInquiryForm` from `frontend/src/components/contact/ContactInquiryForm.jsx`
  - `cmsService.getPublicContentBySlug`, `cmsService.getPublicContents` from `frontend/src/services/cmsService.js`
- Produces:
  - Upgraded `ContactPage` route component wrapped in `<MotionConfig reducedMotion="user">`, displaying response-time banner, 4 direct channels (including clickable main phone), brokerage trust & testimonial card, `ContactInquiryForm`, and `BranchDirectory` wired together via `selectedBranchId`.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/ContactPage.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../src/pages/public/ContactPage';
import cmsService from '../src/services/cmsService';

vi.mock('../src/services/cmsService', () => ({
  default: {
    getPublicContentBySlug: vi.fn(),
    getPublicContents: vi.fn(),
    updateContent: vi.fn(),
    createContent: vi.fn(),
  },
}));

vi.mock('../src/components/cms/LiveCmsEditor', () => ({
  LiveEditProvider: ({ children }) => <>{children}</>,
  LiveEditFloatingBar: () => null,
  LiveEditableText: ({ value }) => <>{value}</>,
}));

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders direct phone channel, response time, trust card, and multiple branches', async () => {
    cmsService.getPublicContentBySlug.mockResolvedValueOnce({
      id: 'page-1',
      title: 'Talk to Our Local Experts',
      summary: 'Visit any branch or send us a message.',
      payload: {
        contact_phone: '+63 2 8111 2222',
        response_time: 'Replies within 1 hour',
        credentials_text: 'PRC License #12345',
      },
    });

    cmsService.getPublicContents.mockResolvedValueOnce([
      {
        id: 'b-bgc',
        title: 'BGC Flagship',
        payload: { address: 'BGC Taguig', phone: '+63 2 8111 2222', region: 'Metro Manila', is_headquarters: true },
      },
      {
        id: 'b-davao',
        title: 'Davao Branch',
        payload: { address: 'Lanang, Davao', phone: '+63 82 222 3333', region: 'Davao' },
      },
    ]);

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Talk to Our Local Experts')).toBeInTheDocument();
    expect(screen.getByText('Replies within 1 hour')).toBeInTheDocument();
    expect(screen.getByText('PRC License #12345')).toBeInTheDocument();

    const phoneLinks = screen.getAllByRole('link', { name: /\+63 2 8111 2222/i });
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+63281112222');

    expect(screen.getByText('BGC Flagship')).toBeInTheDocument();
    expect(screen.getByText('Davao Branch')).toBeInTheDocument();

    const messageButtons = screen.getAllByRole('button', { name: /message this branch/i });
    fireEvent.click(messageButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /selected for your message/i })).toBeInTheDocument();
    });
  });

  it('shows the default fallback main office when CMS returns no offices', async () => {
    cmsService.getPublicContentBySlug.mockResolvedValueOnce(null);
    cmsService.getPublicContents.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Main Advisory Office')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- tests/ContactPage.test.jsx`
Expected: FAIL because current `ContactPage.jsx` does not render `response_time`, `credentials_text`, `tel:` main phone link, or fallback branch.

- [ ] **Step 3: Update `frontend/src/pages/public/ContactPage.jsx`**

Replace `frontend/src/pages/public/ContactPage.jsx` with:

```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Calendar,
  Mail,
  Clock,
  Award,
  Quote,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import cmsService from '@/services/cmsService';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from '@/components/cms/LiveCmsEditor';
import BranchDirectory from '@/components/contact/BranchDirectory';
import ContactInquiryForm from '@/components/contact/ContactInquiryForm';
import {
  DEFAULT_CONTACT_CONTENT,
  safeHttpUrl,
  toTelHref,
  normalizeBranches,
} from '@/utils/contactHelpers';

export default function ContactPage() {
  const [cmsContact, setCmsContact] = useState(null);
  const [offices, setOffices] = useState([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const saveContactField = async (field, nextValue) => {
    const fallbackTitle = cmsContact?.title || DEFAULT_CONTACT_CONTENT.headline;
    const fallbackSummary = cmsContact?.summary || DEFAULT_CONTACT_CONTENT.intro;
    if (cmsContact?.id) {
      const updated = await cmsService.updateContent(cmsContact.id, { [field]: nextValue });
      setCmsContact(updated);
    } else {
      const created = await cmsService.createContent({
        content_type: 'page',
        slug: 'contact-us',
        title: field === 'title' ? nextValue : fallbackTitle,
        summary: field === 'summary' ? nextValue : fallbackSummary,
        status: 'PUBLISHED',
      });
      setCmsContact(created);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact | Human Shelter';

    let mounted = true;
    cmsService
      .getPublicContentBySlug('page', 'contact-us')
      .then((item) => {
        if (mounted && item) setCmsContact(item);
      })
      .catch(() => {});

    cmsService
      .getPublicContents('office')
      .then((items) => {
        if (mounted && Array.isArray(items)) setOffices(items);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingOffices(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const payload = cmsContact?.payload || {};
  const headline = cmsContact?.title || DEFAULT_CONTACT_CONTENT.headline;
  const intro = cmsContact?.summary || DEFAULT_CONTACT_CONTENT.intro;
  const eyebrow = payload.eyebrow || DEFAULT_CONTACT_CONTENT.eyebrow;
  const contactPhone = payload.contact_phone || DEFAULT_CONTACT_CONTENT.phone;
  const contactTelHref = toTelHref(contactPhone);
  const whatsappUrl = safeHttpUrl(payload.whatsapp_url) || DEFAULT_CONTACT_CONTENT.whatsappUrl;
  const calendlyUrl = safeHttpUrl(payload.calendly_url) || DEFAULT_CONTACT_CONTENT.calendlyUrl;
  const responseTime = payload.response_time || DEFAULT_CONTACT_CONTENT.responseTime;
  const credentialsText = payload.credentials_text || DEFAULT_CONTACT_CONTENT.credentialsText;
  const testimonialQuote = payload.testimonial_quote || DEFAULT_CONTACT_CONTENT.testimonialQuote;
  const testimonialAuthor = payload.testimonial_author || DEFAULT_CONTACT_CONTENT.testimonialAuthor;

  const rawEmail = typeof payload.contact_email === 'string' ? payload.contact_email.trim() : '';
  const contactEmail =
    rawEmail && !/[\r\n\s]/.test(rawEmail) && rawEmail.includes('@')
      ? rawEmail
      : DEFAULT_CONTACT_CONTENT.email;

  const branches = useMemo(() => {
    const normalized = normalizeBranches(offices);
    return normalized.length > 0 ? normalized : [DEFAULT_CONTACT_CONTENT.fallbackBranch];
  }, [offices]);

  const handleSelectBranchFromDirectory = (branch) => {
    setSelectedBranchId(branch.id);
    const formEl = document.getElementById('contact-form');
    if (formEl && typeof formEl.scrollIntoView === 'function') {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      formEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <LiveEditProvider>
        <div
          className="text-[#1E293B] font-sans min-h-screen pt-24 pb-24 bg-[#F8FAFC]"
          style={{
            backgroundImage: "url('/images/topographic-bg.svg')",
            backgroundRepeat: 'repeat',
            backgroundSize: '600px 600px',
          }}
        >
          <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-12 flex flex-col gap-12">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-3 justify-center">
                  <span className="w-6 h-0.5 bg-[#0F766E]" />
                  <span className="text-xs font-semibold tracking-wider text-[#0F766E] uppercase">
                    {eyebrow}
                  </span>
                  <span className="w-6 h-0.5 bg-[#0F766E]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E293B]">
                  <LiveEditableText
                    value={headline}
                    onSave={(val) => saveContactField('title', val)}
                  />
                </h1>
                <div className="text-[#64748B] text-base md:text-lg leading-relaxed">
                  <LiveEditableText
                    value={intro}
                    onSave={(val) => saveContactField('summary', val)}
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-2 text-xs font-medium text-[#0F766E]">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  <span>{responseTime}</span>
                </div>
              </motion.div>
            </div>

            {/* Direct Channels + Trust Card (Left) & Contact Form (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5 flex flex-col gap-4">
                {contactTelHref && (
                  <a
                    href={contactTelHref}
                    className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <div className="size-12 bg-teal-50 text-[#0F766E] rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-[#1E293B]">Call Our Main Line</h2>
                      <p className="text-sm text-[#64748B]">{contactPhone}</p>
                    </div>
                  </a>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Chat on WhatsApp</h2>
                    <p className="text-sm text-[#64748B]">Quick answers from our live advisory desk.</p>
                  </div>
                </a>

                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-teal-50 text-[#0F766E] rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Book a Consultation</h2>
                    <p className="text-sm text-[#64748B]">Pick a time that works for you on our calendar.</p>
                  </div>
                </a>

                <a
                  href={`mailto:${contactEmail}`}
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#0F766E] transition-all flex items-center gap-4 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                >
                  <div className="size-12 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1E293B]">Send an Email</h2>
                    <p className="text-sm text-[#64748B] truncate">{contactEmail}</p>
                  </div>
                </a>

                {/* Trust & Credentials Card */}
                <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs mt-2">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                      <Award className="size-4 shrink-0" aria-hidden="true" />
                      <span>{credentialsText}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Quote className="size-4 text-[#64748B] shrink-0 mt-1" aria-hidden="true" />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-[#1E293B] leading-relaxed">
                          &ldquo;{testimonialQuote}&rdquo;
                        </p>
                        <span className="text-xs text-[#64748B]">{testimonialAuthor}</span>
                      </div>
                    </div>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#115E59] min-h-11 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                    >
                      <span>Meet Our Advisory Team</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-7">
                <ContactInquiryForm
                  branches={branches}
                  selectedBranchId={selectedBranchId}
                  onBranchChange={setSelectedBranchId}
                  responseTime={responseTime}
                  fallbackPhone={contactPhone}
                  fallbackTelHref={contactTelHref}
                  whatsappUrl={whatsappUrl}
                />
              </div>
            </div>

            {/* Multi-Branch Directory */}
            <BranchDirectory
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={handleSelectBranchFromDirectory}
              isLoading={isLoadingOffices}
            />
          </main>
          <LiveEditFloatingBar />
        </div>
      </LiveEditProvider>
    </MotionConfig>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- tests/ContactPage.test.jsx`
Expected: PASS (all 2 tests passing).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/ContactPage.jsx frontend/tests/ContactPage.test.jsx
git commit -m "feat(contact): wire multi-branch directory, direct phone, response time, and trust card"
```

---

### Task 5: Sync Admin CMS `ContactLiveCanvas.jsx` with Multi-Branch & Contact Fields

**Files:**
- Modify: `frontend/src/components/cms/ContactLiveCanvas.jsx`
- Test: `frontend/tests/ContactLiveCanvas.test.jsx`

**Interfaces:**
- Consumes:
  - `DEFAULT_CONTACT_CONTENT` from `frontend/src/utils/contactHelpers.js`
  - Props: `{ items, onCreate, onUpdate, onTogglePublish, onRequestDelete }`
- Produces:
  - Updated `ContactLiveCanvas` exposing inline editors for `contact_phone`, `response_time`, `credentials_text`, and per-branch `region`, `map_url`, `whatsapp_url`, and `is_headquarters` toggle.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/ContactLiveCanvas.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactLiveCanvas from '../src/components/cms/ContactLiveCanvas';

vi.mock('@/components/cms/LiveCmsEditor', () => ({
  useLiveEdit: () => ({ isEditing: true }),
  LiveEditableText: ({ value, ariaLabel, placeholder }) => (
    <span aria-label={ariaLabel || placeholder}>{value || placeholder}</span>
  ),
}));

vi.mock('@/components/cms/LiveCmsPrimitives', () => ({
  LiveEditableImage: () => <div data-testid="editable-image" />,
  LiveCardControls: () => <div data-testid="card-controls" />,
  LiveSectionAddButton: ({ label, onClick }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

describe('ContactLiveCanvas', () => {
  it('displays main phone, response time, credentials, and toggles headquarters on a branch', () => {
    const onUpdate = vi.fn();
    const items = [
      {
        id: 'page-1',
        content_type: 'page',
        slug: 'contact-us',
        title: 'Contact Us',
        summary: 'Intro text',
        status: 'PUBLISHED',
        payload: {
          contact_phone: '+63 2 8000 1111',
          response_time: 'Replies within 2 hours',
          credentials_text: 'PRC Licensed Brokerage',
        },
      },
      {
        id: 'office-1',
        content_type: 'office',
        title: 'BGC Branch',
        status: 'PUBLISHED',
        payload: {
          region: 'Metro Manila',
          address: 'BGC, Taguig',
          phone: '+63 2 8000 1111',
          hours: 'Mon-Sat, 9 AM - 6 PM',
          map_url: 'https://maps.google.com/?q=BGC',
          is_headquarters: false,
        },
      },
    ];

    render(
      <ContactLiveCanvas
        items={items}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onTogglePublish={vi.fn()}
        onRequestDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Main Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('Brokerage Credentials')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /set as main office/i }));
    expect(onUpdate).toHaveBeenCalledWith('office-1', {
      payload: expect.objectContaining({ is_headquarters: true }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- tests/ContactLiveCanvas.test.jsx`
Expected: FAIL because `ContactLiveCanvas.jsx` does not yet render `Main Phone Number`, `Response Time`, `Brokerage Credentials`, or the headquarters toggle.

- [ ] **Step 3: Update `frontend/src/components/cms/ContactLiveCanvas.jsx`**

Update `frontend/src/components/cms/ContactLiveCanvas.jsx` to include:
- `Main Phone Number` (`contact_phone`), `Response Time` (`response_time`), and `Brokerage Credentials` (`credentials_text`) cards in Section 1 alongside WhatsApp, Booking Calendar, and Company Email.
- Per-branch `region` ("Area / City"), `map_url` ("Google Maps Link"), `whatsapp_url` ("Branch WhatsApp Link (optional)"), and a button to toggle `is_headquarters` ("Main Office" / "Set as Main Office") in Section 2.
- Default `region: 'Metro Manila'`, `map_url: ''`, `is_headquarters: offices.length === 0` when creating a new office branch via `LiveSectionAddButton`.

```jsx
import React from 'react';
import {
  MessageCircle,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Clock,
  Building2,
  Award,
  ExternalLink,
  Globe,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveEditableText, useLiveEdit } from '@/components/cms/LiveCmsEditor';
import {
  LiveEditableImage,
  LiveCardControls,
  LiveSectionAddButton,
} from '@/components/cms/LiveCmsPrimitives';
import { DEFAULT_CONTACT_CONTENT } from '@/utils/contactHelpers';

export default function ContactLiveCanvas({
  items = [],
  onCreate,
  onUpdate,
  onTogglePublish,
  onRequestDelete,
}) {
  const { isEditing } = useLiveEdit();

  const contactPage = items.find(
    (i) => i.content_type === 'page' && i.slug === 'contact-us' && i.status !== 'ARCHIVED'
  );

  const offices = items.filter(
    (i) => i.content_type === 'office' && (isEditing ? i.status !== 'ARCHIVED' : i.status === 'PUBLISHED')
  );

  const saveContact = async (patch) => {
    if (contactPage?.id) {
      await onUpdate(contactPage.id, patch);
    } else {
      await onCreate({
        content_type: 'page',
        slug: 'contact-us',
        title: patch.title || DEFAULT_CONTACT_CONTENT.headline,
        summary: patch.summary || DEFAULT_CONTACT_CONTENT.intro,
        payload: patch.payload || {},
        status: 'PUBLISHED',
      });
    }
  };

  const saveChannel = (key, value) =>
    saveContact({
      payload: { ...(contactPage?.payload || {}), [key]: value },
    });

  return (
    <div className="divide-y divide-[#E2E8F0] bg-[#F8FAFC]">
      {/* 1. Contact Page Headline, Direct Channels & Trust Info */}
      <section className="p-6 md:p-8 bg-white flex flex-col gap-6">
        <div className="max-w-2xl flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">
            Contact Page Header &amp; Channels
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">
            <LiveEditableText
              value={contactPage?.title || DEFAULT_CONTACT_CONTENT.headline}
              ariaLabel="Edit Contact page headline"
              onSave={(val) => saveContact({ title: val })}
            />
          </h1>
          <div className="text-sm text-[#64748B]">
            <LiveEditableText
              multiline
              value={contactPage?.summary || DEFAULT_CONTACT_CONTENT.intro}
              ariaLabel="Edit Contact page intro"
              onSave={(val) => saveContact({ summary: val })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Phone className="size-4 text-[#0F766E]" />
                <span>Main Phone Number</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.contact_phone || DEFAULT_CONTACT_CONTENT.phone}
                  ariaLabel="Edit main phone number"
                  onSave={(val) => saveChannel('contact_phone', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <MessageCircle className="size-4 text-[#0F766E]" />
                <span>WhatsApp Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.whatsapp_url || DEFAULT_CONTACT_CONTENT.whatsappUrl}
                  ariaLabel="Edit WhatsApp link"
                  onSave={(val) => saveChannel('whatsapp_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Calendar className="size-4 text-[#0F766E]" />
                <span>Booking Calendar Link</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.calendly_url || DEFAULT_CONTACT_CONTENT.calendlyUrl}
                  ariaLabel="Edit booking calendar link"
                  onSave={(val) => saveChannel('calendly_url', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Mail className="size-4 text-[#0F766E]" />
                <span>Company Email</span>
              </div>
              <div className="text-xs text-[#64748B] break-all">
                <LiveEditableText
                  value={contactPage?.payload?.contact_email || DEFAULT_CONTACT_CONTENT.email}
                  ariaLabel="Edit company email"
                  onSave={(val) => saveChannel('contact_email', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Clock className="size-4 text-[#0F766E]" />
                <span>Response Time</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.response_time || DEFAULT_CONTACT_CONTENT.responseTime}
                  ariaLabel="Edit response time"
                  onSave={(val) => saveChannel('response_time', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <Award className="size-4 text-[#0F766E]" />
                <span>Brokerage Credentials</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <LiveEditableText
                  value={contactPage?.payload?.credentials_text || DEFAULT_CONTACT_CONTENT.credentialsText}
                  ariaLabel="Edit brokerage credentials"
                  onSave={(val) => saveChannel('credentials_text', val)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Office Branches */}
      <section className="p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              <Building2 className="size-4" />
              <span>Locations</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] mt-1">
              Our Office Branches
            </h2>
          </div>
          <LiveSectionAddButton
            label="Add Office Branch"
            onClick={() =>
              onCreate({
                content_type: 'office',
                title: 'New Office Branch',
                payload: {
                  region: 'Metro Manila',
                  address: '123 Main Street, Metro Manila',
                  phone: '+63 2 8000 0000',
                  hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
                  map_url: '',
                  whatsapp_url: '',
                  is_headquarters: offices.length === 0,
                },
                status: 'DRAFT',
              })
            }
          />
        </div>

        {offices.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            No office branches yet. Click &ldquo;Add Office Branch&rdquo; to display branch cards on your Contact page.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offices.map((office) => {
              const isHq = Boolean(office.payload?.is_headquarters);
              return (
                <Card key={office.id} className="bg-white border border-[#E2E8F0] rounded-xl">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant={isHq ? 'default' : 'outline'}
                        size="sm"
                        className="normal-case tracking-normal text-xs"
                        onClick={() =>
                          onUpdate(office.id, {
                            payload: { ...(office.payload || {}), is_headquarters: !isHq },
                          })
                        }
                      >
                        <Star className="size-3.5" aria-hidden="true" />
                        <span>{isHq ? 'Main Office' : 'Set as Main Office'}</span>
                      </Button>
                      <LiveCardControls
                        item={office}
                        onTogglePublish={onTogglePublish}
                        onRequestDelete={onRequestDelete}
                      />
                    </div>

                    <LiveEditableImage
                      src={office.media_url}
                      alt={office.title}
                      emptyLabel="Add branch photo (optional)"
                      className="w-full h-36 rounded-lg"
                      onSave={(url) => onUpdate(office.id, { media_url: url })}
                    />

                    <div className="text-lg font-bold text-[#1E293B]">
                      <LiveEditableText
                        value={office.title}
                        ariaLabel={`Edit branch name ${office.title}`}
                        onSave={(val) => onUpdate(office.id, { title: val })}
                      />
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.region || ''}
                          placeholder="Area / City (e.g. Metro Manila, Cebu)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), region: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-[#0F766E] shrink-0 mt-1" />
                        <LiveEditableText
                          value={office.payload?.address || ''}
                          placeholder="Branch address"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), address: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.phone || ''}
                          placeholder="Phone number"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), phone: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.hours || ''}
                          placeholder="Office hours"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), hours: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.map_url || ''}
                          placeholder="Google Maps link (https://...)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), map_url: val },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="size-4 text-[#0F766E] shrink-0" />
                        <LiveEditableText
                          value={office.payload?.whatsapp_url || ''}
                          placeholder="Branch WhatsApp link (optional)"
                          onSave={(val) =>
                            onUpdate(office.id, {
                              payload: { ...(office.payload || {}), whatsapp_url: val },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run full contact test suite and production build check**

Run: `npm --prefix frontend test -- tests/contactHelpers.test.js tests/BranchDirectory.test.jsx tests/ContactInquiryForm.test.jsx tests/ContactPage.test.jsx tests/ContactLiveCanvas.test.jsx && npm --prefix frontend run build`
Expected: All 5 test files PASS and Vite build succeeds with zero errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/cms/ContactLiveCanvas.jsx frontend/tests/ContactLiveCanvas.test.jsx
git commit -m "feat(cms): sync ContactLiveCanvas with multi-branch and contact channel fields"
```
