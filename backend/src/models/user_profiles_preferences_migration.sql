-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: User Profiles Preferences & Firm Extensions
-- Module: 01-user-management
-- ==============================================================================

-- Non-destructive column extensions for client preferences, broker firm details, and notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_location TEXT,
  ADD COLUMN IF NOT EXISTS investment_budget TEXT,
  ADD COLUMN IF NOT EXISTS firm_name TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "priceDrops": true}'::jsonb;

-- Ensure RLS is enabled on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can update only their own profile, admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policy: Public/authenticated users can view profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);
