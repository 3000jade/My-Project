-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: User Profiles UI Preferences & Display Density
-- Module: 01-user-management
-- ==============================================================================

-- Non-destructive column extension for user dashboard UI preferences (density, font size, themes)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{"font_size": "standard"}'::jsonb;

-- Comment for schema documentation
COMMENT ON COLUMN public.profiles.ui_preferences IS 'Stores user UI customization preferences such as font_size (compact, standard, comfortable) and dashboard density.';
