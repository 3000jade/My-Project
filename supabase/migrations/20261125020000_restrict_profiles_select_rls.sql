-- Restrict public.profiles SELECT RLS so private HR biodata, contact details,
-- and client budgets are not readable by anonymous or unrelated users.
-- Public agent/broker cards continue to be served via /api/agents/public.

CREATE OR REPLACE FUNCTION public.is_broker_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'broker')
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users and brokers can view profiles" ON public.profiles;

CREATE POLICY "Users and brokers can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR public.is_broker_or_admin()
  );
