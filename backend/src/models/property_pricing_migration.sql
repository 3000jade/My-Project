-- ==============================================================================
-- MIGRATION: Create public.property_pricing Table
-- Enforces 1:1 Pricing & Terms relation linked by property_id
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.property_pricing (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  rent_frequency TEXT NULL,
  lease_term TEXT NULL,
  association_fee NUMERIC(15, 2) NULL,
  association_fee_frequency VARCHAR(20) NULL DEFAULT 'Monthly',
  association_fee_includes TEXT[] NULL DEFAULT '{}',
  security_deposit NUMERIC(15, 2) NULL,
  advance_rent NUMERIC(15, 2) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Index for relational lookups
CREATE INDEX IF NOT EXISTS idx_property_pricing_property_id ON public.property_pricing(property_id);

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_property_pricing_updated_at'
  ) THEN
    CREATE TRIGGER update_property_pricing_updated_at
      BEFORE UPDATE ON public.property_pricing
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Backfill existing association fee frequency from properties
INSERT INTO public.property_pricing (property_id, currency, association_fee_frequency)
SELECT id, 'PHP', COALESCE(association_fee_frequency, 'Monthly')
FROM public.properties
ON CONFLICT (property_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.property_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view property pricing of published active listings" ON public.property_pricing;
CREATE POLICY "Public can view property pricing of published active listings"
  ON public.property_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_pricing.property_id 
      AND (p.standard_status = 'Active' OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Authorized brokers and creators can manage property pricing" ON public.property_pricing;
CREATE POLICY "Authorized brokers and creators can manage property pricing"
  ON public.property_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_pricing.property_id 
      AND (
        p.created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role IN ('broker', 'admin')
        )
      )
    )
  );
