# RESPONSIVE UI/UX REQUIREMENTS

**Project:** Human Shelter Realty  
**Design:** Soft Minimalist SaaS  
**Density:** Balanced Compact  
**Devices:** Desktop, Tablet, Mobile

## 1. Objective

Implement adaptive layouts for three device categories while preserving all existing functionality, fields, and workflows.

## 2. Responsive Breakpoints

- Desktop: 1024px and above
- Tablet: 768px–1023px
- Mobile: Below 768px

Use existing project breakpoints where available. Propose changes before replacing them.

## 3. Desktop Layout

- Expanded sidebar, approximately 220–240px.
- Four summary cards in a horizontal row.
- Search, filters, and sorting in a compact toolbar.
- Full-width agent data table.
- Readable 14px body text.
- Compact 56–64px table rows.
- Consistent 16–24px section spacing.

## 4. Tablet Layout

- Collapsible sidebar or navigation drawer.
- Two-column summary card layout.
- Search and filters adapt to available width.
- Preserve all table columns using controlled horizontal scrolling when needed.
- Maintain touch-friendly controls.
- Prevent unwanted page-level horizontal overflow.

## 5. Mobile Layout

- Replace sidebar with a navigation drawer.
- Display summary cards in a two-column layout where practical.
- Stack search and filtering controls.
- Present agent information as responsive cards.
- Show essential agent details immediately.
- Provide secondary details through expandable content or profile pages.
- Keep all required actions accessible.
- Use single-column forms and mobile-friendly dialogs.

## 6. UI Standards

- Primary: #0F766E
- Coral Accent: #FF6B6B
- Background: #F8FAFC
- Surface: #FFFFFF
- Font: Inter
- Standard border radius: 8px
- Spacing: 8px-based system
- Subtle borders and minimal shadows

## 7. Development Safeguards

1. Inspect existing layouts and responsive rules.
2. Identify reusable components and breakpoints.
3. Propose changes for each device category.
4. List affected files and potential risks.
5. Request explicit approval before modifications.
6. Implement only approved changes.
7. Preserve all existing fields, routes, permissions, and business logic.
8. Verify layouts and interactions at representative device widths.

**MANDATORY WORKFLOW:**

INSPECT → ANALYZE → PROPOSE → APPROVAL → IMPLEMENT → VERIFY