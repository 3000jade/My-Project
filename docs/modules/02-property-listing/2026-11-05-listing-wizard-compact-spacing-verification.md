---
module: 02-property-listing
date: 2026-11-05
status: implemented-with-mocked-browser-verification
affected_files:
  - frontend/src/pages/portals/broker/BrokerCreateListings.jsx
  - frontend/src/pages/portals/broker/BrokerCreateListings.test.jsx
  - frontend/src/pages/portals/broker/components/property-form/CondoLocationFields.jsx
  - frontend/src/pages/portals/broker/components/property-form/SubdivisionLocationFields.jsx
  - frontend/src/pages/portals/broker/components/property-form/HouseAndLotSpecs.jsx
  - frontend/src/pages/portals/broker/components/property-form/CondominiumSpecs.jsx
  - frontend/src/pages/portals/broker/components/property-form/SubdivisionLotSpecs.jsx
  - frontend/src/pages/portals/broker/components/property-form/CategoryAmenitiesPicker.jsx
  - design.md
---

# Listing wizard compact spacing — verification record

User approved the [seven-step implementation plan](../../superpowers/plans/2026-11-05-listing-wizard-compact-spacing.md). Scope is the listing wizard and its six private form components, with documentation and a native-step navigation regression test. Shared primitives, map components, backend behavior, and other pages were not changed by this work.

## Delivered behavior

- One compact shell, stepper, form grid, and sticky footer across steps 1–7.
- 16px card/group spacing, 12px field-row gaps, 16px columns, and readable 14px labels/values.
- Matched 40px desktop / 44px mobile/coarse-pointer controls and wrapping long actions.
- Native named step buttons with active-step semantics and horizontal-only active-step visibility.
- Full-width overview fields, wrapped lifecycle badge, flatter location groups, and responsive URL entry.
- Family-aware specification grids; all original fields, conversions, validation attributes, and aliases retained.
- Compact amenity rows with the existing selection/custom-feature behavior.
- Media sections retain upload/retry/cancel/reorder/delete/preview controls; review retains expanded summaries and Fix/Edit/Return paths.
- The restored property preview and every subsequent modal/lightbox are byte-identical to the per-turn baseline. Its rendered card HTML also matches the baseline. The surrounding compact grid can affect available card width.

## Verification performed

From frontend:

~~~powershell
npm.cmd test -- src/pages/portals/broker/BrokerCreateListings.test.jsx src/pages/portals/broker/components/property-form/CategoryAmenitiesPicker.test.jsx
npm.cmd run build
~~~

- Baseline: 18 tests passed. New native-step navigation regression failed before implementation for the missing named button.
- Final: 19 tests passed across two test files. Production build passed; existing large-bundle warnings remain.
- Source/AST comparison against per-turn snapshots: all pre-existing event handlers, field bindings, required/min/max/step/maxLength/name/accept/multiple contracts retained.
- Scoped review and re-review resolved the media touch sizing, duplicated media separation, and overview status-group wrapping findings.
- Real Chrome rendering of the actual component in an isolated Vite fixture: 51 views covering all steps at 375/768/1280/1440 widths, condo/land location/specification variants, 768px coarse pointer, and drawer-prop representatives.
- Final matrix: zero JavaScript errors, document overflow, or measured regular-input/select height mismatches.
- 18 last-field/footer checks passed; keyboard Enter/Space step navigation, address suggestions, amenity toggles, and Review Edit/Return/Fix interactions passed.
- Mocked media scenarios passed: uploading, failed upload, cancel, retry, add/reorder, exactly one cover, and opening removal confirmation. Actual deletion/publication was not submitted.
- Featured switch keeps its original small visual track; a pointer test confirmed activation in its expanded hit area above the track.

## Evidence and limits

[Browser evidence and reproducible fixture commands](../../../artifacts/wizard-spacing-verification/README.md) include screenshots, metrics and interaction reports.

External fonts, map tiles, images, authentication, and data services were replaced by deterministic fixtures; no real API mutations occurred. Symbol-font fallbacks appear as words in screenshots. The fixture tests the actual component's drawer prop, not the surrounding dashboard drawer host. Live geocoding, Drive uploads, real publication, and full agent/edit submission paths were not exercised. Source-preservation checks support unchanged contracts but do not replace those integration checks.

