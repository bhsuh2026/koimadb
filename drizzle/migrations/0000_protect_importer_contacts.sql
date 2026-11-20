CREATE OR REPLACE FUNCTION public.mask_importer_field(value text, kind text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE part text; result text[] := '{}'; local_part text; domain_part text;
BEGIN
  IF value IS NULL OR value = '' THEN RETURN value; END IF;
  IF kind = 'items' THEN
    RETURN left(btrim(value), CASE WHEN length(btrim(value)) <= 8 THEN 4 ELSE 8 END) || '…';
  ELSIF kind = 'biz' THEN
    RETURN regexp_replace(value, '(\d{3}-?\d{2}-?)\d{5}', '\1*****', 'g');
  ELSIF kind = 'hs' THEN
    part := regexp_replace(value, '\D', '', 'g');
    RETURN left(part, 4) || repeat('*', greatest(2, length(part) - 4));
  END IF;
  FOREACH part IN ARRAY regexp_split_to_array(value, CASE WHEN kind = 'email' THEN ',' ELSE '[/,]' END) LOOP
    part := btrim(part);
    IF part = '' THEN CONTINUE; END IF;
    IF kind = 'email' THEN
      IF position('@' IN part) <= 1 THEN part := '***';
      ELSE
        local_part := split_part(part, '@', 1);
        domain_part := split_part(part, '@', 2);
        part := left(local_part, least(2, length(local_part))) || repeat('*', greatest(2, length(local_part) - 2))
          || '@***' || coalesce(substring(domain_part FROM '\.[^.]+$'), '');
      END IF;
    ELSE
      part := regexp_replace(part, '[^0-9+]', '', 'g');
      part := left(part, greatest(0, length(part) - 4)) || '****';
    END IF;
    result := array_append(result, part);
  END LOOP;
  RETURN array_to_string(result, CASE WHEN kind = 'email' THEN ', ' ELSE ' / ' END);
END;
$$;
REVOKE ALL ON FUNCTION public.mask_importer_field(text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_public_importers(
  p_tokens text[] DEFAULT '{}', p_patterns text[] DEFAULT '{}', p_excludes text[] DEFAULT '{}',
  p_countries text[] DEFAULT '{}', p_scales text[] DEFAULT '{}', p_hs text DEFAULT '',
  p_has_email boolean DEFAULT false, p_sort text DEFAULT 'rank_import_asc',
  p_page integer DEFAULT 1, p_page_size integer DEFAULT 50
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' SET statement_timeout = '10s' AS $$
DECLARE
  filters text := 'true'; ordering text; token text; pattern text; i integer;
  result_rows jsonb; total bigint; plan json; start_row bigint;
BEGIN
  IF p_page IS NULL OR p_page < 1 OR p_page_size IS NULL OR p_page_size NOT BETWEEN 1 AND 100
    OR cardinality(p_tokens) > 5 OR cardinality(p_patterns) > 5 OR cardinality(p_excludes) > 5
    OR cardinality(p_countries) > 50 OR cardinality(p_scales) > 20 OR length(p_hs) > 12
    OR EXISTS (SELECT 1 FROM unnest(p_tokens || p_excludes || p_countries || p_scales) v WHERE length(v) > 100)
    OR EXISTS (SELECT 1 FROM unnest(p_patterns) v WHERE length(v) > 500)
    OR (cardinality(p_patterns) > 0 AND cardinality(p_patterns) <> cardinality(p_tokens))
  THEN RAISE EXCEPTION 'Invalid search parameters'; END IF;
  IF cardinality(p_countries) > 0 THEN filters := filters || format(' AND r.countries && %L::text[]', p_countries); END IF;
  IF cardinality(p_scales) > 0 THEN filters := filters || format(' AND r.scale_label = ANY(%L::text[])', p_scales); END IF;
  IF p_hs <> '' THEN filters := filters || format(' AND r.hs_codes @> ARRAY[%L]::text[]', btrim(p_hs)); END IF;
  IF p_has_email THEN filters := filters || ' AND r.email <> '''''; END IF;
  IF cardinality(p_tokens) > 0 THEN
    FOR i IN 1..cardinality(p_tokens) LOOP
      token := '%' || p_tokens[i] || '%';
      IF cardinality(p_patterns) > 0 THEN
        pattern := p_patterns[i];
        filters := filters || format(' AND (r.name_kr ILIKE %L OR r.name_en ILIKE %L OR r.biz_no ILIKE %L OR r.items_kr ~* %L OR r.items_en ~* %L)', token, token, token, pattern, pattern);
      ELSE
        filters := filters || format(' AND (r.name_kr ILIKE %L OR r.name_en ILIKE %L OR r.biz_no ILIKE %L OR r.items_kr ILIKE %L OR r.items_en ILIKE %L)', token, token, token, token, token);
      END IF;
    END LOOP;
  END IF;
  FOREACH token IN ARRAY coalesce(p_excludes, '{}') LOOP
    filters := filters || format(' AND r.items_kr NOT ILIKE %L AND r.items_en NOT ILIKE %L', '%' || token || '%', '%' || token || '%');
  END LOOP;
  ordering := CASE p_sort WHEN 'name_asc' THEN 'r.name_kr ASC, r.id ASC'
    WHEN 'rank_sales_asc' THEN 'r.rank_sales ASC NULLS LAST, r.id ASC'
    ELSE 'r.rank_import ASC NULLS LAST, r.id ASC' END;
  start_row := (p_page::bigint - 1) * p_page_size;
  IF cardinality(p_tokens) > 0 THEN
    EXECUTE 'EXPLAIN (FORMAT JSON) SELECT r.id FROM public.importers r WHERE ' || filters INTO plan;
    total := (plan->0->'Plan'->>'Plan Rows')::bigint;
  ELSE
    EXECUTE 'SELECT count(*) FROM public.importers r WHERE ' || filters INTO total;
  END IF;
  EXECUTE 'SELECT coalesce(jsonb_agg(jsonb_build_object(
    ''id'', r.id, ''name_kr'', r.name_kr, ''name_en'', r.name_en,
    ''rank_import'', r.rank_import, ''rank_sales'', r.rank_sales,
    ''countries'', r.countries, ''scale_label'', r.scale_label,
    ''biz_no'', public.mask_importer_field(r.biz_no, ''biz''),
    ''email'', public.mask_importer_field(r.email, ''email''),
    ''email_extra'', public.mask_importer_field(r.email_extra, ''email''),
    ''phone'', public.mask_importer_field(r.phone, ''phone''),
    ''phone_extra'', public.mask_importer_field(r.phone_extra, ''phone''),
    ''items_kr'', public.mask_importer_field(r.items_kr, ''items''),
    ''items_en'', public.mask_importer_field(r.items_en, ''items''),
    ''hs_codes'', ARRAY(SELECT public.mask_importer_field(h, ''hs'') FROM unnest(r.hs_codes) h)
  )), ''[]''::jsonb) FROM (SELECT r.* FROM public.importers r WHERE '
    || filters || ' ORDER BY ' || ordering || format(' LIMIT %s OFFSET %s', p_page_size, start_row) || ') r' INTO result_rows;
  RETURN jsonb_build_object('rows', result_rows, 'total', greatest(total, CASE WHEN jsonb_array_length(result_rows) > 0 THEN start_row + jsonb_array_length(result_rows) ELSE 0 END));
END;
$$;
REVOKE ALL ON FUNCTION public.search_public_importers(text[], text[], text[], text[], text[], text, boolean, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_importers(text[], text[], text[], text[], text[], text, boolean, text, integer, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_importer_facets()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET statement_timeout = '10s' AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.importers),
    'countries', (SELECT coalesce(jsonb_object_agg(country, n), '{}'::jsonb) FROM (
      SELECT country, count(*) n FROM (SELECT countries FROM public.importers ORDER BY rank_import ASC NULLS LAST LIMIT 5000) sample,
      LATERAL unnest(sample.countries) country GROUP BY country
    ) counts),
    'scales', (SELECT coalesce(jsonb_object_agg(scale_label, n), '{}'::jsonb) FROM (
      SELECT scale_label, count(*) n FROM public.importers GROUP BY scale_label
    ) counts)
  );
$$;
REVOKE ALL ON FUNCTION public.public_importer_facets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_importer_facets() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can read importers" ON public.importers;
CREATE POLICY "Administrators can read importer records" ON public.importers
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.importers FROM anon;
GRANT SELECT ON public.importers TO authenticated;
