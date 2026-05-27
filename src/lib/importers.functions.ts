import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Importer = {
  id: string;
  rank_import: number | null;
  rank_sales: number | null;
  biz_no: string | null;
  name_kr: string;
  name_en: string;
  email: string;
  email_extra: string;
  phone: string;
  phone_extra: string;
  countries: string[];
  scale_label: string;
  items_kr: string;
  items_en: string;
  hs_codes: string[];
};

const ListInput = z.object({
  q: z.string().max(100).default(""),
  country: z.string().max(50).nullable().default(null),
  scales: z.array(z.string().min(1).max(50)).max(20).default([]),
  hs: z.string().max(12).default(""),
  hasEmail: z.boolean().default(false),
  sort: z
    .enum(["rank_import_asc", "rank_sales_asc", "name_asc", "countries_desc"])
    .default("rank_import_asc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const listImporters = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("importers")
      .select("*", { count: "exact" });

    if (data.country) query = query.contains("countries", [data.country]);
    if (data.scales.length) query = query.in("scale_label", data.scales);
    if (data.hasEmail) query = query.neq("email", "");
    if (data.hs) query = query.contains("hs_codes", [data.hs.trim()]);
    if (data.q) {
      const q = data.q.replace(/[%,]/g, " ").trim();
      query = query.or(
        `name_kr.ilike.%${q}%,name_en.ilike.%${q}%,biz_no.ilike.%${q}%,items_kr.ilike.%${q}%,items_en.ilike.%${q}%`,
      );
    }

    switch (data.sort) {
      case "rank_import_asc":
        query = query.order("rank_import", { ascending: true, nullsFirst: false });
        break;
      case "rank_sales_asc":
        query = query.order("rank_sales", { ascending: true, nullsFirst: false });
        break;
      case "name_asc":
        query = query.order("name_kr", { ascending: true });
        break;
      case "countries_desc":
        query = query
          .order("rank_import", { ascending: true, nullsFirst: false });
        break;
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Importer[], total: count ?? 0 };
  });

export const getImporterFacets = createServerFn({ method: "GET" }).handler(
  async () => {
    const { count: total } = await supabaseAdmin
      .from("importers")
      .select("id", { count: "exact", head: true });

    // Top countries — aggregate from a sample (top 5000 by import rank covers
    // virtually all unique countries) to keep this fast.
    const { data: rows, error } = await supabaseAdmin
      .from("importers")
      .select("countries, scale_label")
      .order("rank_import", { ascending: true, nullsFirst: false })
      .range(0, 4999);
    if (error) throw new Error(error.message);

    const countries: Record<string, number> = {};
    const scales: Record<string, number> = {};
    for (const r of rows ?? []) {
      for (const c of (r.countries as string[]) ?? []) {
        countries[c] = (countries[c] ?? 0) + 1;
      }
      const s = (r.scale_label as string) ?? "";
      if (s) scales[s] = (scales[s] ?? 0) + 1;
    }
    return { total: total ?? 0, countries, scales };
  },
);
