-- Enable Row Level Security on companies and importers
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importers ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read companies
CREATE POLICY "Anyone can read companies"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone (anon + authenticated) to read importers
CREATE POLICY "Anyone can read importers"
ON public.importers
FOR SELECT
TO anon, authenticated
USING (true);

-- Data API grants for companies
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- Data API grants for importers
GRANT SELECT ON public.importers TO anon;
GRANT SELECT ON public.importers TO authenticated;
GRANT ALL ON public.importers TO service_role;