-- pg_trgm for fast ILIKE search on Korean/English names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.importers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_import integer,
  rank_sales integer,
  biz_no text,
  name_kr text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  email_extra text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  phone_extra text NOT NULL DEFAULT '',
  countries text[] NOT NULL DEFAULT '{}',
  scale_label text NOT NULL DEFAULT '',
  items_kr text NOT NULL DEFAULT '',
  items_en text NOT NULL DEFAULT '',
  hs_codes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.importers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.importers TO authenticated;
GRANT ALL ON public.importers TO service_role;

ALTER TABLE public.importers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read importers"
  ON public.importers FOR SELECT
  TO public
  USING (true);

CREATE INDEX idx_importers_rank_import ON public.importers (rank_import NULLS LAST);
CREATE INDEX idx_importers_scale_label ON public.importers (scale_label);
CREATE INDEX idx_importers_countries ON public.importers USING GIN (countries);
CREATE INDEX idx_importers_hs_codes ON public.importers USING GIN (hs_codes);
CREATE INDEX idx_importers_name_kr_trgm ON public.importers USING GIN (name_kr gin_trgm_ops);
CREATE INDEX idx_importers_name_en_trgm ON public.importers USING GIN (name_en gin_trgm_ops);
CREATE INDEX idx_importers_biz_no ON public.importers (biz_no);

CREATE TRIGGER importers_set_updated_at
  BEFORE UPDATE ON public.importers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();