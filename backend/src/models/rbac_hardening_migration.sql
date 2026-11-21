-- ==============================================================================
-- RBAC HARDENING MIGRATION (Supabase RLS + SECURITY DEFINER RPCs)
-- Human Shelter Realty / CP_kerby Platform
-- ==============================================================================

-- 1. Prevent self-role escalation on public.profiles
ALTER POLICY "Users can update their own profile."
  ON public.profiles
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    (
      (select auth.uid()) = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (select auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- 2. Lock down public.sales from {public} to authenticated staff
ALTER POLICY "Sales are viewable by authenticated users."
  ON public.sales
  TO authenticated
  USING (
    agent_id = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

ALTER POLICY "Sales can be inserted by authenticated users."
  ON public.sales
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('agent', 'broker', 'admin')
    )
  );

ALTER POLICY "Sales can be updated by authenticated users."
  ON public.sales
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

-- 3. Lock down public.notifications from {public} to owning user or broker/admin
ALTER POLICY "Notifications are viewable by authenticated users."
  ON public.notifications
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

ALTER POLICY "Notifications can be inserted."
  ON public.notifications
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

ALTER POLICY "Notifications can be updated by authenticated users."
  ON public.notifications
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

-- 4. Tighten legacy public.inquiries policies so agents only see/edit assigned inquiries
ALTER POLICY "Agents, brokers, and admins can view inquiries."
  ON public.inquiries
  TO authenticated
  USING (
    assigned_agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

ALTER POLICY "Agents, brokers, and admins can update inquiries."
  ON public.inquiries
  TO authenticated
  USING (
    assigned_agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    assigned_agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role IN ('broker', 'admin')
    )
  );

-- 5. Revoke public/anon/authenticated RPC execution on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.apply_property_edit_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_property_edit_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_property_status_lifecycle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_property_media_to_images() FROM PUBLIC, anon, authenticated;
