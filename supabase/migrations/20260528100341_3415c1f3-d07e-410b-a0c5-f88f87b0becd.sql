-- Lock down direct table access; all reads go through server functions that mask sensitive fields.
DROP POLICY IF EXISTS "Public read importers" ON public.importers;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;

REVOKE SELECT ON public.importers FROM anon, authenticated;
REVOKE SELECT ON public.companies FROM anon, authenticated;

-- service_role (used by supabaseAdmin in server fns) retains full access via GRANT ALL defaults.
GRANT ALL ON public.importers TO service_role;
GRANT ALL ON public.companies TO service_role;