DROP INDEX IF EXISTS public.idx_importers_name_kr_trgm;
DROP INDEX IF EXISTS public.idx_importers_name_en_trgm;
DROP EXTENSION IF EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX idx_importers_name_kr_trgm ON public.importers USING GIN (name_kr extensions.gin_trgm_ops);
CREATE INDEX idx_importers_name_en_trgm ON public.importers USING GIN (name_en extensions.gin_trgm_ops);