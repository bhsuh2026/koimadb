
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  biz_no TEXT,
  name_kr TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  scale_code SMALLINT NOT NULL DEFAULT 6,
  asean_countries TEXT[] NOT NULL DEFAULT '{}',
  other_countries TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX companies_name_kr_idx ON public.companies (name_kr);
CREATE INDEX companies_biz_no_idx ON public.companies (biz_no);
CREATE INDEX companies_scale_idx ON public.companies (scale_code);
CREATE INDEX companies_asean_gin_idx ON public.companies USING GIN (asean_countries);
CREATE INDEX companies_email_idx ON public.companies ((email <> ''));

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update companies" ON public.companies FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete companies" ON public.companies FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
