# TASK: Update Existing Property Details Page to Match Reference Design

**Project:** Human Shelter Realty  
**Module:** Property Listing Management  
**Target:** Existing Property Details Page  
**Mode:** Controlled UI Implementation  
**Reference:** Attached Property Details Mockup Image  
**Design Standard:** `AGENTS.md` and `design.md`

## 1. Objective

Update the existing Property Details page to closely replicate the provided reference image.

The design must be modern, professional, responsive, and easy to understand, with minimal cognitive overload.

Prioritize:

- Clean layout and visual hierarchy
- Nonredundant property information
- Organized property details
- Consistent design system
- Reusable existing components
- Preservation of all existing functionality

**This task authorizes implementing the approved Property Details UI redesign.**

Do not modify unrelated pages, backend logic, database structures, or authentication.

## 2. Mandatory Inspection

Before making changes:

1. Read `AGENTS.md`, `design.md`, and `ARCHITECTURE_MAP.md`, where available.
2. Inspect the existing Property Details page.
3. Identify the components used by the page.
4. Inspect existing property data mappings.
5. Review the current Supabase `properties` schema and relevant property relationships.
6. Identify existing buttons, tabs, galleries, and actions.
7. Review existing route and API dependencies.
8. Identify reusable components.
9. Compare the current UI against the reference mockup.
10. Document the files requiring modification.

Follow the project design system and engineering standards.

Preserve existing functionality throughout implementation.

## 3. Design Replication

Use the attached mockup as the primary visual reference.

### A. Page Layout

Create a balanced three-column desktop layout:

**Left Column**
- Main property image
- Thumbnail gallery

**Center Column**
- Property title
- Tagline
- Property category and transaction badges
- Listing price
- Key property specifications
- Primary actions
- Property information sections

**Right Column**
- Listing status
- Assigned agent
- Property management actions

Maintain generous spacing and clear separation between sections.

Do not overload the interface with unnecessary cards or repeated information.

### B. Header and Navigation

Preserve the existing application sidebar and top navigation.

Maintain:

- Existing routes
- Search functionality
- Notifications
- User profile
- Role-based navigation
- Authentication behavior

Do not create a duplicate sidebar or header.

### C. Property Gallery

Replicate the reference gallery design.

Include:

- Large primary property image
- Thumbnail images
- Image count
- Gallery navigation
- Image preview or lightbox, if already supported

Use existing property images and media components.

Do not introduce unnecessary image storage changes.

### D. Property Overview

Display:

- Property Title
- Tagline
- Property Type
- Transaction Type
- Listing Availability
- Listing Price

Use the current database fields and verified related tables.

Display the listing price prominently in Philippine pesos.

Avoid repeating the price in multiple sections.

### E. Key Property Specifications

Display only the most important specifications near the top:

- Bedrooms
- Bathrooms
- Floor Area

Use compact icons and readable labels.

Do not repeat these three values in the Overview section below.

### F. Property Information Tabs

Create or update the existing tabs:

1. Overview
2. Details
3. Location
4. Amenities
5. Gallery
6. Agent
7. Activity

Only display a tab if its content is supported by the existing application.

Do not create duplicate data queries for repeated information.

### G. Overview Section

Display two main cards.

**Card 1: About This Property**

Show the property description using the existing `public_remarks` field or verified equivalent.

**Card 2: Key Details**

Show secondary information such as:

- Property Subtype
- Lot Area
- Year Built
- Property Condition
- Architectural Style
- Stories

Do not repeat title, price, bedrooms, bathrooms, or floor area.

Hide optional fields that have no meaningful value rather than displaying unnecessary empty rows.

### H. Location Section

Display:

- Property address
- City / Municipality
- Province / Region
- Postal Code
- Location map, when valid coordinates exist

Use the existing location data.

Display the complete address once.

Do not repeat the same location information across multiple cards.

If coordinates are missing, provide an appropriate location placeholder.

### I. Listing Status Panel

Display:

- Current availability status
- Listing ID
- Date Created
- Last Updated
- Featured Property status

Respect the difference between:

- `status` for property transaction availability
- `standard_status` for publication status

Do not allow the visual redesign to bypass existing status lifecycle rules.

### J. Assigned Agent Panel

Display the assigned agent using the existing `list_agent_key` relationship.

Include:

- Agent profile photo, if available
- Agent name
- Role
- View Profile action, if supported

Do not fabricate missing agent information.

### K. Quick Actions

Preserve existing authorized actions such as:

- Edit Property
- Duplicate Listing
- Print Details
- Archive Property

Show only actions that are currently supported and authorized.

Do not introduce new destructive functionality solely to match the image.

Respect the confirmed approval workflow:

Agents can propose edits to assigned listings, but changes require broker or administrator approval.

Agents must not directly modify approved property records.

## 4. Reduce Cognitive Overload

Apply these rules throughout the page:

1. Display each property detail in its most appropriate location.
2. Avoid repeating identical values in multiple cards.
3. Prioritize important information above secondary information.
4. Use consistent icons and typography.
5. Group related information logically.
6. Keep descriptions concise and readable.
7. Hide irrelevant empty optional fields.
8. Avoid unnecessary badges and decorative elements.
9. Use tabs or progressive disclosure for detailed information.
10. Maintain enough whitespace between content sections.

**Display each important property value once whenever practical.**

## 5. Design System

Follow the actual project design tokens from `design.md` and `AGENTS.md`.

Default reference values:

- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Primary: `#0F766E`
- Primary Hover: `#115E59`
- Secondary Teal: `#14B8A6`
- Coral Accent: `#FF6B6B`
- Primary Text: `#1E293B`
- Secondary Text: `#64748B`
- Border: `#E2E8F0`
- Standard Radius: `8px`
- Spacing: 8px-based system

Use the current project's approved fonts and reusable design components.

Do not introduce a competing design system.

## 6. Database Compatibility

Preserve existing property data mappings.

Relevant fields include:

- `title`
- `tagline`
- `price`
- `address`
- `city`
- `state_or_province`
- `postal_code`
- `beds`
- `baths`
- `sqft`
- `living_area`
- `living_area_units`
- `lot_size_area`
- `year_built`
- `property_condition`
- `architectural_style`
- `status`
- `standard_status`
- `property_type_id`
- `property_sub_type`
- `transaction_type`
- `list_agent_key`
- `public_remarks`
- `is_featured`

Use the existing services and actual property data.

Do not insert hardcoded sample listing details into the production page.

The reference image is a visual guide, not a new database specification.

## 7. Responsive Design

### Desktop

Use the reference image's gallery, content, and sidebar layout.

### Tablet

Adapt the layout to two columns where space permits.

### Mobile

- Use a single-column layout.
- Keep primary information visible first.
- Stack secondary cards below.
- Use responsive gallery thumbnails.
- Provide accessible navigation.
- Prevent horizontal overflow.

## 8. Implementation Rules

1. Inspect the current files before editing.
2. Reuse existing components.
3. Implement only the necessary UI changes.
4. Preserve existing props and data contracts.
5. Maintain existing backend requests.
6. Keep current authentication and authorization behavior.
7. Preserve existing loading and error states.
8. Do not remove functional features merely because they are absent from the mockup.
9. Do not modify unrelated modules.
10. Do not create duplicate components unnecessarily.

If an existing feature conflicts with the mockup, preserve its functionality and adapt its presentation.

## 9. Testing and Verification

After implementation:

- Verify the page renders correctly.
- Compare the result with the reference image.
- Confirm that redundant information is reduced.
- Check all displayed database values.
- Verify property gallery navigation.
- Verify existing page actions.
- Verify role-based permissions.
- Verify responsive layouts.
- Confirm no unrelated pages were modified.
- Run the existing project build and relevant tests.

Do not claim tests passed without executing them.

## 10. Expected Output

After completing the task, provide:

1. Summary of UI improvements
2. List of modified files
3. Components reused
4. Components added, if necessary
5. Existing functionality preserved
6. Visual comparison against reference
7. Responsive verification results
8. Build and test results
9. Any remaining issues

## 11. Restrictions

- Do not modify the Supabase schema.
- Do not execute SQL migrations.
- Do not change RLS policies.
- Do not modify backend business logic.
- Do not change authentication or roles.
- Do not introduce unauthorized property updates.
- Do not remove working functionality.
- Do not redesign unrelated pages.
- Do not push code to GitHub.
- Do not deploy the application.

## 12. Completion Criteria

The task is complete when the existing Property Details page closely matches the reference image, uses the approved Human Shelter Realty design system, avoids redundant information, remains responsive, and preserves all existing functional behavior.

Follow the required project workflow and approval gates. Inspect and propose changes first, then implement the approved visual changes.
