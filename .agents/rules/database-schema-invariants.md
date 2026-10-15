# Database Schema & Trigger Safety Invariants

## 1. Live Schema Cache Verification Before Code Assumptions
- Never assume a table or column defined in SQL migration files or documentation exists in the live database.
- Before introducing or refactoring relational inserts (e.g., `property_media`, `property_pricing`), verify column and table existence against the live Supabase schema cache using lightweight probes or `supabaseAdmin`.

## 2. Trigger Integrity & Desynchronization Prevention
- Triggers on child tables (such as `property_media`, `property_images`) that mirror data back to parent tables must NEVER reference non-existent columns.
- When creating or altering triggers on `property_media` or `properties`:
  - Verify that target columns (e.g., `properties.images`) exist in the parent table.
  - If array mirroring is required, ensure the parent table has the matching column type (e.g., `images text[]`) or update the trigger function to write to the child relation (`property_images`).

## 3. Graceful Storage Fallbacks for Unmigrated Schema Fields
- If a relational table (such as `property_pricing` or `property_features`) is pending remote deployment, the backend service MUST store incoming payload data in `properties.custom_reso_attributes` (JSONB) so that submitted user inputs (rental terms, lease lengths, amenities) are never lost during submissions.
