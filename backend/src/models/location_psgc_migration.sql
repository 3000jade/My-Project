-- ==============================================================================
-- Location PSGC & Philippine Geographic Reference Migration
-- Adds nullable region, barangay, and PSGC code columns to public.properties
-- ==============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS region TEXT NULL,
  ADD COLUMN IF NOT EXISTS region_psgc_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS province_psgc_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS city_psgc_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS barangay TEXT NULL,
  ADD COLUMN IF NOT EXISTS barangay_psgc_code TEXT NULL;

-- Ensure state_or_province and state synchronization on existing rows
UPDATE public.properties
SET state_or_province = COALESCE(state_or_province, state),
    state = COALESCE(state, state_or_province)
WHERE state_or_province IS DISTINCT FROM state;

-- Indexes for geographic filtering
CREATE INDEX IF NOT EXISTS idx_properties_region_psgc ON public.properties (region_psgc_code);
CREATE INDEX IF NOT EXISTS idx_properties_province_psgc ON public.properties (province_psgc_code);
CREATE INDEX IF NOT EXISTS idx_properties_city_psgc ON public.properties (city_psgc_code);
CREATE INDEX IF NOT EXISTS idx_properties_barangay_psgc ON public.properties (barangay_psgc_code);
