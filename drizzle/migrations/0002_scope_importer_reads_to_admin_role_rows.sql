ALTER POLICY "Administrators can read importer records" ON public.importers
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
));