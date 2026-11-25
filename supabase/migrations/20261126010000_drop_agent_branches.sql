-- ==============================================================================
-- Migration: Remove Agent Branches Table and Branch Columns
-- Drops branch_id / location_branch from profiles and brokerage_memberships,
-- and drops public.branches.
-- ==============================================================================

DROP INDEX IF EXISTS public.idx_profiles_branch;
DROP INDEX IF EXISTS public.idx_brokerage_memberships_branch;
DROP INDEX IF EXISTS public.idx_branches_brokerage;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS branch_id,
  DROP COLUMN IF EXISTS location_branch;

ALTER TABLE public.brokerage_memberships
  DROP COLUMN IF EXISTS branch_id;

DROP TABLE IF EXISTS public.branches CASCADE;
