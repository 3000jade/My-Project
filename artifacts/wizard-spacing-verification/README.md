# Listing wizard browser verification

Harness imports actual BrokerCreateListings.jsx, all six private children, local UI primitives, index.css, ReactQuill and Leaflet cadastral component. Auth and data services are replaced by deterministic in-memory fixtures; all API and nonlocal browser requests are intercepted. Existing installed Chrome is driven with Playwright. No package installation or real backend mutation occurs.

Run from repository root:

- `node artifacts/wizard-spacing-verification/server.mjs` — current fixture, port4179.
- `$env:BASELINE='1'; node artifacts/wizard-spacing-verification/server.mjs` — original TEMP snapshot fixture, port4178. Remove BASELINE before current verification.
- `node artifacts/wizard-spacing-verification/verify.mjs` — 51 current rendered views, screenshots and current-metrics.json.
- `node artifacts/wizard-spacing-verification/footer.mjs` — last editable field/sticky footer geometry.
- `node artifacts/wizard-spacing-verification/buttons.mjs` — coarse-pointer button-height audit.
- `node artifacts/wizard-spacing-verification/interactions.mjs` — keyboard, suggestions, amenities, Review recovery.
- `node artifacts/wizard-spacing-verification/media.mjs` — mocked upload and media actions.

Final results:51 rendered views passed geometry checks;52 PNG evidence images retained. Preview rendered HTML exactly equals baseline. All18 footer reach checks passed. Native keyboard, suggestions, amenity toggle, Review recovery and mocked media checks passed on the final source.

Coverage:

- House: all7 steps at375,768,1280,1440 pixels (28 views).
- Condominium and residential land: Location and Specifications at375,768,1280 (12 views).
- Coarse pointer768: all7 steps.
- Drawer prop mode: steps1/7 at375/1280 (4 views). Actual dashboard drawer host chrome is outside this standalone fixture.
- Original baseline: all7 steps at1280, preview screenshot and rendered HTML.
- Last editable fields: all18 checks across steps1–6 and375/768/1280 were above the sticky footer after scrolling.
- Native step Enter/Space navigation reached steps2/3 with aria-current=step; active step visible inside375px viewport; scrollY remained0.
- Address suggestions displayed, amenity aria-pressed toggled, Review Edit -> Step1 -> Return to Review -> Step7 and missing-information Fix -> Step1 worked.
- Media: two uploading cards, two failed cards, Cancel removed one, Retry succeeded, second image added, Move Down reorder executed, one Current Cover retained, Remove opened confirmation dialog. Actual deletion confirmation and publication were not submitted.
- Rendered preview card outerHTML exactly equals baseline; screenshots show preserved radii, cover ratio, contents and actions. Width differs as the approved enclosing grid spacing changes.

Limitations:

- External font CSS, map tiles and external images are deterministic placeholders. Material Symbol ligatures therefore appear as words in screenshots. Final51-view matrix has zero document overflow even in this fallback state.
- Live backend, geocoder correctness, actual Drive upload, agent/edit submission paths and real publication were not exercised.
- Initial Maps URL shrink and short action controls were corrected and rechecked. Final current-run.log:51 views, zero JS errors, zero document overflow, zero regular input/select height mismatches. Fresh coarse button scan passed all local actions; shared map controls are excluded. The Featured switch retains a24px track with an expanded pseudo-element hit area: a click5px above the visible track toggled aria-checked false to true.


Final header correction verified after the last CSS change: PageHeader computed margin-bottom is0px and header-to-stepper gap is16px at375/768/1280/1440 (header-spacing.json). The complete51-view matrix was rerun afterward:0 JS errors,0 document overflow,0 input/select height mismatches. Screenshots refreshed; preview rendered HTML still equals baseline. Temporary baseline/current fixture server sessions were stopped after verification.

## Final screenshots

- [Step 1 - desktop](current-page-houseAndLot-1280-step1.png)
- [Step 2 - desktop](current-page-houseAndLot-1280-step2.png)
- [Step 3 - desktop](current-page-houseAndLot-1280-step3.png)
- [Step 4 - desktop](current-page-houseAndLot-1280-step4.png)
- [Step 5 - desktop](current-page-houseAndLot-1280-step5.png)
- [Step 6 - desktop](current-page-houseAndLot-1280-step6.png)
- [Step 7 - desktop](current-page-houseAndLot-1280-step7.png)
- [Step 1 - mobile](current-page-houseAndLot-375-step1.png)
- [Step 5 - mobile](current-page-houseAndLot-375-step5.png)
- [Step 7 - mobile](current-page-houseAndLot-375-step7.png)