# Listing Wizard Steps 1–7 Spacing Implementation Plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task-by-task after user approval. Steps use checkbox syntax for tracking.

**Goal:** Apply the compact workspace profile consistently to all seven listing-wizard steps, preserving field contracts, conditional behavior, and the restored property preview card.

**Architecture:** Keep the existing seven-step wizard and its 8/4 desktop form/preview columns. Normalize presentation in the wizard and its six private form children. Do not introduce a second wizard, shared density framework, or new dependency.

**Tech Stack:** Existing React JSX, Tailwind v4, local UI primitives, Vitest/Testing Library.
**Spec:** [Component cookbook](../../../design.md), especially Compact workspace profile and padding ownership.
**Status:** Implemented after explicit user approval on 2026-11-05. See the execution record below for verification and limits.

## Global constraints

- “Scope a density change to the requested screen or wizard step.”
- “Do not change shared Button size defaults globally.”
- “Keep essential form text at 14px; compactness comes from layout, not shrinking type.”
- Retain the restored listing preview card exactly: 28px outer radius, 20px cover radius, 16:11 cover ratio, existing padding/gaps, data, and actions. Its public preview and lightbox are also excluded.
- No backend, route, permission, validation, payload, upload-limit, draft-storage, autosave, or publication-rule changes.
- Preserve all existing user edits and the compact work already delivered in step 4. Do not reset the file to HEAD.
- Keep seven step names/order and the horizontal numbered-circle visual from the supplied screenshot. No new required steps, collapsed form sections, or replacement status rules.
- This pass changes wizard presentation and stepper keyboard access. It does not redesign dashboard chrome, shared maps, or public property cards.
- No commits, package installation, or shared primitive changes are needed for this task.

## Review: confirmed inconsistencies

Source paths below refer to frontend/src/pages/portals/broker/ unless otherwise stated. Findings are source-based; only the supplied screenshots were visually reviewed.

| Area / evidence | Current issue | Result to deliver |
|---|---|---|
| BrokerCreateListings.jsx:1914–1991 | Only step 4 has compact shell/footer classes. Other steps combine 24px parent gaps with mb-6 on header/stepper. | One compact shell for all steps, with one owner for each gap. |
| BrokerCreateListings.jsx:1953–1980 | Stepper requires 720px horizontal content; clickable div wrappers have no native keyboard behavior. | Preserve horizontal scroll and visual, use native named step buttons with visible focus and active-step semantics. |
| Step 1, :1996–2252 | Title capped at max-w-2xl while tagline fills card; 24px field gaps; 40/44px controls mixed; uppercase 11/12px labels. | Aligned full-width fields, matching controls, readable labels, compact groups. |
| Step 2, :2258–2674 | Nested outer card, p-5 Area/Street Address cards, p-4 search strip; URL label is nowrap; coordinate inputs are 36px while search is 44px. | Remove redundant inner card padding/shadows; responsive URL row; matched field sizing, retain usable map viewport. |
| Step 3, :2678–2711; private *Specs children | Parent and children both use 24px section spacing. Dwelling uses fixed w-24/w-36 wrapping fields; condo/land use different 2/3/4-column breakpoints. | Consistent family-aware field grids and grouped unit controls without changing any value conversion. |
| Step 4, :2715–3034 | Mostly compact already; service semantics and coarse-pointer minimums must survive the wider normalization. | Keep delivered layout; align remaining labels/helper spacing without reverting it or changing preview. |
| Step 5, :3039–3065; CategoryAmenitiesPicker.jsx | Header card remains spacious; amenities are 12px wrapping pills, while step 4 uses readable service rows. Custom entry is capped at max-w-md with 40px mobile controls. | Two-column compact selectable rows, single column mobile; retain aria-pressed, selected count, custom addition, and all mirrored form fields. |
| Step 6, :3067–3963 | Main gaps24px, empty photo state p-8, other empty states p-6, mixed media row padding and small controls. | Consistent compact groups/empty states, usable thumbnails and upload/reorder controls; all sections remain visible. |
| Step 7, :3968–4619 | Header p-6; summaries p-5 sm:p-6; 24px column gaps; most summary values text-xs; footer again spacious. | 16px summaries/sections, readable values, 12/16px rows/columns and consistent footer. Preserve all Fix/Edit and submit paths. |
| design.md compact profile | Generic permission to shorten a preview conflicts with the user's explicit request to restore this preview. | Add a wizard-specific exception: property preview is preserved. Existing generic guidance remains elsewhere. |

## Fixed presentation decisions

| Element | Exact target |
|---|---|
| Shell | max-w-7xl, p-4 md:p-6, flex flex-col gap-4; retain existing drawer/page bottom padding policy |
| Main columns | grid-cols-1 lg:grid-cols-12 gap-4; retain lg:col-span-8 and lg:col-span-4 |
| Form section | bg-white rounded-md border, p-4, one shadow-xs, flex flex-col gap-4 |
| Section heading | text-base leading-6 font-semibold; subordinate heading text-sm leading-5 font-semibold |
| Field label / value | text-sm leading-5; helper text text-xs leading-4; retain units/identifiers in monospace where used |
| Field group | flex flex-col gap-2; no fixed label heights; counters/helper hints may wrap without pushing adjacent input baselines |
| Field grid | grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3; short 3/4-field groups become xl:grid-cols-3/4 only where specified below |
| Controls | h-11 md:h-10 [@media(pointer:coarse)]:h-11; native input/select; exclude checkbox boxes, textareas, editor, map, media frame, progress UI |
| Inner groups | Heading/divider + fields, without another white card/shadow; use gap-3 or gap-4 intentionally, no added mt/mb between already spaced siblings |
| Checklist rows | grid-cols-1 md:grid-cols-2 gap-x-4; rows min-h-11 md:min-h-8 with coarse-pointer min-h-11, gap-2, py-1.5 px-2, wrapping labels |
| Footer | sticky bottom-0, p-3, border-t, one shadow-xs, gap-3 groups, no negative horizontal margins or mt-8; parent gap-4 owns separation |
| Long actions | h-auto min-h-11 md:min-h-10 whitespace-normal py-2 with coarse-pointer min-h-11; preserve full labels, do not clip |
| Map/editor exceptions | Keep existing 16:9 cadastral map and at least the editor's existing 140px minimum; do not shrink rich interactions to fit one viewport |

## Proposal images

The boards illustrate layout and spacing, not a pixel-verified live screen. Representative fields are shown for legibility; every existing field remains in implementation. Numeric values, options, and permissions come from source, not generated copy.

1. [Shared stepper and footer, desktop/mobile](../../../artifacts/wizard-spacing-proposal/01-navigation.png).
2. [Steps 1–2: overview and location](../../../artifacts/wizard-spacing-proposal/02-overview-location.png).
3. [Steps 3–5: specifications, pricing, features](../../../artifacts/wizard-spacing-proposal/03-specifications-pricing-features.png).
4. [Steps 6–7: media and review](../../../artifacts/wizard-spacing-proposal/04-media-review.png).
5. [Exact generation prompts and source notes](../../../artifacts/wizard-spacing-proposal/README.md).

## Files and boundaries

- Modify BrokerCreateListings.jsx: shell, stepper, step bodies, page-local SearchableSelect, shared wizard footer.
- Modify components/property-form/CondoLocationFields.jsx and SubdivisionLocationFields.jsx: spacing within the wizard's type-specific location blocks.
- Modify components/property-form/HouseAndLotSpecs.jsx, CondominiumSpecs.jsx, SubdivisionLotSpecs.jsx: type-specific spacing and widths.
- Modify components/property-form/CategoryAmenitiesPicker.jsx: rows replacing pill presentation, with existing events/state updates intact.
- Tests: existing BrokerCreateListings.test.jsx and components/property-form/CategoryAmenitiesPicker.test.jsx.
- Update design.md with the page-specific preview exception and cross-reference this approved plan; reconcile the owning module UI record during implementation.
- The six private child components have no other production imports in the current source search. Recheck before editing. No new component props, public APIs, data types, or schema changes are proposed.

## Task 1 — Capture baseline and normalize shared wizard chrome

**Interfaces:** consumes currentStep, stepTitles, setCurrentStep, isDrawer, existing navigation actions; produces the same step transitions and layout for steps1–7.

- [ ] Run the existing two test files before editing; capture screenshots for steps1–7 and save the restored property-preview source fragment as the preservation baseline.
- [ ] Add a behavioral test for native step navigation before changing the stepper:

~~~jsx
it('opens a named step using its native navigation control', () => {
  renderComponent();
  const step = screen.getByRole('button', { name: /Step 4: Pricing & Terms/i });
  expect(step.tagName).toBe('BUTTON');
  fireEvent.click(step);
  expect(step).toHaveAttribute('aria-current', 'step');
  expect(screen.getByPlaceholderText('150,000,000')).toBeInTheDocument();
});
~~~

- [ ] Run that test and confirm its pre-change failure is the missing named native step button.
- [ ] Replace each clickable step wrapper with button type=button, aria-label={`Step ${stepNum}: ${title}`}, aria-current={isActive ? 'step' : undefined}, preserving onClick and all visual states. Use focus-visible:ring-2 and a 44px minimum hit area; circle remains size-9.
- [ ] Keep seven controls in the existing horizontally scrollable 720px-minimum track. At narrow widths, scroll the active step into view horizontally only when it changes; do not force vertical page scrolling. Use a ref to the track and compare active/track bounding rectangles before updating scrollLeft. Use immediate scrolling to avoid motion-policy complexity.
- [ ] Keep step-based percentage calculation unchanged. Earlier-step checkmarks indicate position, not validated field completion; do not invent a validation gate.
- [ ] Replace step4-only shell/layout/footer ternaries with the common compact classes above. Remove duplicated PageHeader and stepper mb-6. Do not alter the preview subtree or its lg:col-span-4/top-20 wrapper.
- [ ] Run the page tests. In a browser, Tab to a step and activate with Enter/Space; check focused circles are not clipped and only the stepper scrolls horizontally at 375px.

## Task 2 — Step 1: Listing Overview

**Interfaces:** same title/tagline limits, description editor, transaction-purpose updates, lifecycle synchronization, type link and condition choices.

- [ ] Change section padding/gaps to the compact targets; remove title max-w-2xl so title and tagline share an edge.
- [ ] Preserve content order: title, headline, transaction purpose, status/lifecycle group, development condition, description. Do not move sections into new tabs or accordions.
- [ ] Use two status fields in md:grid-cols-2; keep a light grouped background with p-3 and no independent shadow. Keep full status option strings and wrapping status badge.
- [ ] Standardize input/select/segmented-control height; use h-full/min-height inside the purpose control rather than hardcoded h-9 if it exceeds the compact outer control. Do not add a minimum height to the tiny checkbox/icon itself.
- [ ] Make heading/type badge/change-link row wrap. Keep counters adjacent to their labels and remove fixed h-5 label spacers.
- [ ] Confirm all existing field lengths, statuses, publication flags, and rich-text changes still update identically. Check long type names and 120-character titles without overflow.

## Task 3 — Step 2: Location & Address

**Interfaces:** same map callbacks, address suggestion behavior, cascading region/province/city/barangay clearing, subdivision selection, coordinates, and full-address formatting.

- [ ] Retain group order and the shared CadastralLocationPicker component exactly. Use page-local surrounding gaps; do not modify map internals or resize its 16:9 canvas.
- [ ] Replace nested p-5/shadowed Area and Street Address shells with compact heading/divider groups. Retain pale helper/notice backgrounds where they communicate status.
- [ ] Stack the Maps URL label/input below md; allow a horizontal row at md with min-w-0. Position suggestion panels relative to the resized input using top-full + a small gap, replacing fixed top-12 where present. Keep the external full-view controls untouched.
- [ ] Align coordinate controls to the regular 40/44px policy. Keep both coordinates visible in a one/two-column grid and preserve numeric parsing behavior.
- [ ] Normalize CondoLocationFields and SubdivisionLocationFields to gap-x-4 gap-y-3 and the common controls. Retain project actions, lot-picker behavior, unit/tower distinctions, and field names; wrap their long header actions.
- [ ] Re-run location/type tests. Check mobile URL row, open address suggestions, loading/empty suggestions, cascading clear notice, and manual coordinates.

## Task 4 — Step 3: Property Specifications

**Interfaces:** unchanged formData/setFormData/setIsDirty props and all stored unit aliases/conversions.

- [ ] Set all three *Specs outer stacks to gap-4, inner related fields to gap-x-4 gap-y-3, label gaps8px, regular labels/values14px, and matched control sizing.
- [ ] HouseAndLotSpecs: replace w-36 area fields with min-w-0 w-full in a two-column md grid. Rooms use one column mobile, md two columns, xl four columns. Preserve all existing additional architectural controls/fields below the shown examples.
- [ ] CondominiumSpecs: area/tower/unit-related groups use one/two columns, short numeric room groups may use xl:grid-cols-3; keep applicable family fields and unit choices.
- [ ] SubdivisionLotSpecs: dimensional trio uses one/two/xl-three columns; remaining classification/title fields use one/two columns; cadastral reference spans full width.
- [ ] Keep suffix/addon units visually aligned and at the same height as inputs. Preserve conversions, alias writes, required/min/step attributes and conditional visibility.
- [ ] Run house/condo/land page tests and verify each family at 375/768/1280px. Make sure 4-column grids do not start merely because the viewport is md while the form occupies 8/12 of the width.

## Task 5 — Steps 4 and 5: Pricing and features

**Interfaces:** preserve all pricing handlers, fee aliases, rental-only fields, and CategoryAmenitiesPicker selection/custom-entry events.

- [ ] Keep step4's delivered service rows and compact density. Check sale and rent, status helper wrapping, long currency/status options, and coarse-pointer hit areas. No further rearrangement of price/rental fields is needed.
- [ ] Bring step5's enclosing card/header to the common targets.
- [ ] In CategoryAmenitiesPicker replace flex-wrap pill layout with the compact one/two-column row grid. Keep each existing button, type=button, onClick and aria-pressed unchanged; show the check indicator in a reserved icon slot for both states so labels do not jump.
- [ ] Keep the selected count accurate and the custom-input row after the checklist. Remove max-w-md to align it with the group; allow the input/button row to stack at narrow widths and match40/44px heights.
- [ ] Preserve the existing sync of amenities, interior_features and features. Do not change preset lists or custom-tag semantics.
- [ ] Run existing amenity-toggle/custom-add tests and price-formatting tests. Check long option labels remain fully visible and keyboard-operable.

## Task 6 — Step 6: Photos & Maps

**Interfaces:** unchanged mediaPhotos/mediaFloorPlans/mediaVideos/mediaVirtualTours/mediaDocuments and all upload/cancel/retry/reorder/delete/preview callbacks.

- [ ] Retain group order: Photos, Floor Plans, Videos, Virtual Tours, Documents, Confidential Broker Governance.
- [ ] Use p-4/gap-4 outer card, 16px group separation, 12px within each media group; replace p-8/p-6 empty states with p-4. Do not hide groups or introduce collapsed upload panels.
- [ ] Photo grid: one column mobile, two at md, three at xl in the form column; retain image ratio and photo metadata/controls. Do not squeeze four cards across an 8/12 form merely because the viewport is lg.
- [ ] File rows: p-3, gap-3, thumbnail+min-w-0 details, wrapping action group; names may truncate only if the full value remains accessible. Keep all reorder/preview/delete controls and progress/error text available.
- [ ] Match URL/description/upload-action control heights and use minimum heights for wrapping labels. Preserve existing video upload/link mode controls.
- [ ] Confidential group uses p-3 with one/two/xl-three fields; internal showing notes spans full width. Retain private/redacted labels and exact public-preview exclusion rules.
- [ ] Exercise empty, uploading, failed+retry, cancelled, multiple-photo reorder and deletion-confirmation cases. Check the cover badge remains on position1 and private values never appear in public preview.

## Task 7 — Step 7: Review & Publish

**Interfaces:** unchanged validationSummary/submissionError, setReturnToReview, existing step Edit/Fix links and role-specific executeSubmission arguments.

- [ ] Use p-4 header, p-4 summaries, rounded-md, gap-4 between summaries, gap-x-4 gap-y-3 within each two-column detail grid.
- [ ] Retain the existing summary sections and order, always expanded. Keep only the existing Internal Notes disclosure; no new collapsible summaries.
- [ ] Use14px for essential values/labels and12px for metadata; preserve confidentiality markers. Long addresses/reference values wrap rather than widening the page.
- [ ] Keep Missing Information and submission failure banners prominent. Let field names wrap instead of blindly truncating them next to Fix; preserve every recovery link/retry action.
- [ ] Keep the read-only Listing Status badge and the existing role-gated Featured Property switch, together with all role-specific draft/publish/update/approval actions. Do not introduce a publication-status dropdown. Normalize actions through the common footer; never rename or merge business actions.
- [ ] Verify Edit → step → Return to Review, missing requirements → Fix, success/failure recovery, create/edit, agent/broker, and page/drawer variants.

## Task 8 — Documentation and final verification

- [ ] Add this wizard's preview-preservation exception to design.md. Keep balanced/public defaults and global tokens unchanged.
- [ ] Update the owning property-listing module UI record and its existing INDEX/change-log convention with the approved wizard density decisions and actual verification results. Do not infer implementation approval from the generated images.
- [ ] Run from frontend:

~~~powershell
npm.cmd test -- src/pages/portals/broker/BrokerCreateListings.test.jsx src/pages/portals/broker/components/property-form/CategoryAmenitiesPicker.test.jsx
npm.cmd run build
~~~

- [ ] Browser review at375,768,1280,1440px for each step. Also check a768px coarse-pointer viewport: hit areas remain44px even where desktop styles would otherwise start.
- [ ] Verify no horizontal document overflow, except intentional scrolling inside the stepper/map; labels/errors wrap; sticky actions do not cover the last editable field; page and drawer scrolling work.
- [ ] Compare the restored property-preview subtree and screenshots against baseline; all original preview styling and actions must remain unchanged.
- [ ] Inspect the diff for event handlers, field names, required/min/max/step constraints, status mappings, upload logic, and API payloads. Only the stepper's semantic/scroll behavior is intentionally new.
- [ ] Report changed files, test/build outcomes, browser evidence, and unchecked scenarios. Do not claim full visual validation from generated proposal boards.

## Approval and execution boundary

The original deliverable was a review, plan and four proposal images. The user subsequently approved implementation. Changes were applied in the existing working branch without commits, preserving pre-existing edits and the property preview.

## Execution record — 2026-11-05

- Tasks 1–8 delivered: shared compact chrome, all seven step layouts, six private child components, keyboard step semantics, and documentation.
- Baseline tests: 18 passed. Native step regression observed failing before the semantic change. Final tests: 19 passed; production build passed with existing large-chunk warnings.
- Final actual-component browser fixture: 51 views, no JavaScript errors, document overflow, or regular-control height mismatches. Header margin is 0px and its stepper gap is 16px at all four widths. Footer checks passed 18/18.
- Keyboard, suggestions, amenities, Review recovery and mocked upload/retry/cancel/reorder/removal-dialog interactions passed. Preview source and rendered HTML match baseline.
- [Verification record](../../modules/02-property-listing/2026-11-05-listing-wizard-compact-spacing-verification.md) and [browser evidence](../../../artifacts/wizard-spacing-verification/README.md).
- Original checklist remains the implementation specification. Full live agent/edit submission, actual Drive/geocoder/publication, and the dashboard drawer host were not exercised; fixtures mock external services/assets. Those integration scenarios remain outside the verified results.

