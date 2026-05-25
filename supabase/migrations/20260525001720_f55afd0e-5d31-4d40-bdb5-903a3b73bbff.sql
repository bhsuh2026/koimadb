
DROP POLICY IF EXISTS "Public insert companies" ON public.companies;
DROP POLICY IF EXISTS "Public update companies" ON public.companies;
DROP POLICY IF EXISTS "Public delete companies" ON public.companies;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
