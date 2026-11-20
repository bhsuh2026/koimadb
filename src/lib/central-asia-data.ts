import source from "@/data/central-asia-importers.json";
import type { Importer } from "@/lib/importers.functions";

export type DirectoryImporter = Importer & {
  industry_kr?: string;
  industry_en?: string;
  website?: string;
  product_source?: string;
  email_available?: boolean;
};

const COUNTRY_NAMES: Record<string, string> = {
  KZ: "카자흐스탄", UZ: "우즈베키스탄", KG: "키르기스스탄",
  TJ: "타지키스탄", TM: "투르크멘",
};
const split = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);
const rank = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
export function safeWebsite(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export const centralAsiaImporters: DirectoryImporter[] = source.map((r) => ({
  id: `central-asia-${r.company_code}`,
  rank_import: rank(r.import_rank), rank_sales: rank(r.revenue_rank),
  biz_no: null, name_kr: r.name_ko, name_en: r.name_en,
  email: "", email_extra: "", phone: "", phone_extra: "",
  countries: split(r.ca_country_codes).flatMap((code) => COUNTRY_NAMES[code] ? [COUNTRY_NAMES[code]] : []),
  scale_label: r.import_scale_ko, items_kr: r.products_ko, items_en: r.products_en,
  hs_codes: split(r.hs_codes), industry_kr: r.industry_ko, industry_en: r.industry_en,
  website: safeWebsite(r.website) ?? "", product_source: r.product_source,
  email_available: r.has_email === "Y",
}));

export type DirectoryFilters = {
  q: string; countries: string[]; scales: string[]; hs: string; hasEmail: boolean;
  exact: boolean; sort: "rank_import_asc" | "rank_sales_asc" | "name_asc";
  page: number; pageSize: number;
};

export function filterDirectoryRows(records: DirectoryImporter[], filters: DirectoryFilters) {
  const terms = filters.q.toLowerCase().replace(/㈜|\(주\)|주식회사/g, " ").split(/\s+/).filter(Boolean);
  const include = terms.filter((term) => !term.startsWith("-"));
  const exclude = terms.filter((term) => term.startsWith("-") && term.length > 1).map((term) => term.slice(1));
  const rows = records.filter((r) => {
    const names = `${r.name_kr} ${r.name_en} ${r.biz_no ?? ""}`.toLowerCase();
    const items = `${r.items_kr} ${r.items_en}`.toLowerCase();
    const industry = `${r.industry_kr ?? ""} ${r.industry_en ?? ""}`.toLowerCase();
    const exactItems = split(r.items_kr.toLowerCase()).concat(split(r.items_en.toLowerCase()));
    return (!filters.countries.length || r.countries.some((c) => filters.countries.includes(c)))
      && (!filters.scales.length || filters.scales.includes(r.scale_label))
      && (!filters.hs || r.hs_codes.some((h) => h.startsWith(filters.hs)))
      && (!filters.hasEmail || Boolean(r.email) || r.email_available === true)
      && include.every((term) => names.includes(term) || (filters.exact ? exactItems.includes(term) : `${items} ${industry}`.includes(term)))
      && exclude.every((term) => !items.includes(term));
  });
  rows.sort((a, b) => {
    if (filters.sort === "name_asc") return a.name_kr.localeCompare(b.name_kr, "ko");
    const key = filters.sort === "rank_sales_asc" ? "rank_sales" : "rank_import";
    return (a[key] ?? Infinity) - (b[key] ?? Infinity) || a.name_kr.localeCompare(b.name_kr, "ko");
  });
  const offset = (filters.page - 1) * filters.pageSize;
  return { rows: rows.slice(offset, offset + filters.pageSize), total: rows.length };
}

export function directoryFacets(records: DirectoryImporter[]) {
  const countries: Record<string, number> = {};
  const scales: Record<string, number> = {};
  for (const row of records) {
    for (const country of row.countries) countries[country] = (countries[country] ?? 0) + 1;
    if (row.scale_label) scales[row.scale_label] = (scales[row.scale_label] ?? 0) + 1;
  }
  return { countries, scales };
}