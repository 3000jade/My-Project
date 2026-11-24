# Live View CMS Editor (Form-Free Visual Studio) — Design Specification

**Date:** 2026-11-25  
**Scope:** Replace the table-and-drawer form UI inside `/admin/cms` with a 100% form-free **Live Preview Canvas** where Super Admins switch between **Homepage**, **About Us**, **Contact**, and **Guides**, click directly on text or images to edit and instant-save, click `+ Add` to insert starter draft cards inline, and toggle **Live / Hidden** or **Delete** right on each card.

---

## 1. Architecture & Data Flow

- **Backend:** Zero backend or database changes required. Consumes existing `/api/cms/admin/contents` (`GET`, `POST`, `PATCH`, `DELETE`) and `/api/cms/admin/upload` (`POST`) endpoints via `frontend/src/services/cmsService.js`.
- **State Model:** `AdminCmsPage` loads all CMS items once (`cmsService.listAdminContents()`) and passes filtered slices + mutation callbacks (`onUpdate(id, patch)`, `onCreate(payload)`, `onRequestDelete(item)`) into the active page canvas.
- **Instant Save:** Every inline text save or image swap calls `onUpdate(id, patch)`, updates local state immediately on success, and updates a top-bar save indicator (`All changes saved` / `Saving...` / error `Alert`).
- **Draft-First Inline Creation:** Every `+ Add` button calls `onCreate(starterRecord)` with `status: 'DRAFT'` and inserts the newly created starter card right into the live page so the admin clicks its text/photo inline and flips `Hidden → Live` (`DRAFT` → `PUBLISHED`) when ready.
- **Edit Mode vs. Preview as Visitor:**
  - `Edit Mode` (default inside `/admin/cms`): `LiveEditProvider` receives `initialEditing={true}` (controlled via `isEditing` prop) so all `LiveEditableText`, `LiveEditableImage`, `+ Add` buttons, and `LiveCardControls` are active, and `DRAFT` cards remain visible with a subtle amber `Hidden` badge.
  - `Preview as Visitor`: Hides all edit borders, `+ Add` buttons, card toolbars, and `DRAFT`/`ARCHIVED` items so the admin sees the exact published visitor experience.

---

## 2. File Structure & Cleanup

| Action | File | Responsibility |
| :--- | :--- | :--- |
| Modify | `frontend/src/components/cms/LiveCmsEditor.jsx` | Supports controlled `editing` / `defaultEditing` props on `LiveEditProvider`, exports `useLiveEdit()`, and adds `multiline` support (`Textarea`) to `LiveEditableText`. |
| Create | `frontend/src/components/cms/LiveCmsPrimitives.jsx` | Exports `LiveEditableImage` (click any image/logo → `Popover` with Upload Image button + URL paste input + Remove button) and `LiveCardControls` (one-click `Live`/`Hidden` toggle + `Delete` trigger). |
| Create | `frontend/src/components/cms/HomeLiveCanvas.jsx` | Live visual editor for Homepage: Top Announcement Banner, Partner Developers & Partner Banks, Awards & Historical Honors, and FAQs. |
| Create | `frontend/src/components/cms/AboutLiveCanvas.jsx` | Live visual editor for About Us: Hero Headline/Intro/Story (`page`/`about-us`) + Staff Directory grouped by department (`staff`). |
| Create | `frontend/src/components/cms/ContactLiveCanvas.jsx` | Live visual editor for Contact: Headline/Intro + WhatsApp/Calendly/Email channel cards (`page`/`contact-us`) + Office Branches grid (`office`). |
| Create | `frontend/src/components/cms/GuidesLiveCanvas.jsx` | Live visual editor for Buyer Guides: Cards grid + expandable inline full-article editor (`article`). |
| Modify | `frontend/src/pages/portals/super-admin/AdminCmsPage.jsx` | Slim Studio Toolbar (4 page tabs: `Homepage`, `About Us`, `Contact`, `Guides`; `Edit Mode` / `Preview as Visitor` toggle; save status pill) + framed preview canvas + `CmsDeleteDialog`. No stacked portal page title/subtitle (`AGENTS.md`). |
| Delete | `frontend/src/components/cms/CmsContentTable.jsx`, `frontend/src/components/cms/CmsContentEditorDrawer.jsx`, `frontend/src/components/cms/CmsMediaField.jsx`, `frontend/src/components/cms/CmsMediaField.test.jsx` | Removed cleanly because `/admin/cms` is now 100% live visual editing with no table or side-drawer form. |
| Modify | `frontend/src/pages/portals/super-admin/AdminCmsPage.test.jsx` | Tests all 4 live canvases, inline click-to-edit instant save, `+ Add` without forms, `Live / Hidden` toggle, `Preview as Visitor`, `LiveEditableImage` upload/URL swap, and `CmsDeleteDialog`. |

---

## 3. Design System & Accessibility (`DESIGN.md` & `AGENTS.md`)

- Uses approved tokens (`#F8FAFC` canvas, `#FFFFFF` surface, `#F1F5F9` muted bar, `#E2E8F0` borders, `#0F766E` teal primary, `#115E59` hover, `#CCFBF1` tint, `#1E293B` ink, `#64748B` secondary ink) and 8-point spacing scale.
- Reuses `shadcn/ui` primitives (`Tabs`, `Button`, `Badge`, `Card`, `Input`, `Textarea`, `Popover`, `Alert`, `Accordion`, `AlertDialog`, `Skeleton`).
- Respects `prefers-reduced-motion` (`motion-reduce:animate-none` on loading spinners).
- No stacked portal page title or subtitle above workspace content in `AdminCmsPage.jsx`.

---

## 4. Verification

- Run `cd frontend; npx vitest run src/components/cms/ src/pages/portals/super-admin/AdminCmsPage.test.jsx src/components/ui/sections/PartnersAndAwardsCms.test.jsx src/pages/public/AboutAndContactCms.test.jsx; npm run build`.
- Run `graphify update .` after all code edits.
