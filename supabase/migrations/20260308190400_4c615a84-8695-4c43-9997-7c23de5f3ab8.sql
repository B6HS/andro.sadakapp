
-- Allow super_admin to read donations for stats
CREATE POLICY "Super admins can view all donations"
  ON public.donations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to read settings
CREATE POLICY "Super admins can manage settings"
  ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
