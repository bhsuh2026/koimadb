import records from "@/data/central-asia-importers.json";
import type { Importer } from "./importers.functions";

export function usesCentralAsiaDataset(scope: string | undefined) {
  return scope === "central-asia";
}

const split = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);
const numberOrNull = (value: string) => value ? Number(value) : null;

export const centralAsiaImporters: Importer[] = records.map((r) => ({
  id: `central-asia-${r.company_code}`,
  name_kr: r.name_ko,
  name_en: r.name_en,
  rank_import: numberOrNull(r.import_rank),
  rank_sales: numberOrNull(r.revenue_rank),
  biz_no: null,
  email: "",
  email_extra: "",
  phone: "",
  phone_extra: "",
  countries: split(r.ca_countries_ko).map((c) => c === "투르크메니스탄" ? "투르크멘" : c),
  scale_label: r.import_scale_ko,
  items_kr: r.products_ko,
  items_en: r.products_en,
  hs_codes: split(r.hs_codes),
  industry_kr: r.industry_ko,
  industry_en: r.industry_en,
  category: r.category12,
  product_source: r.product_source,
  has_email: r.has_email === "Y",
  website: safeWebsite(r.website),
}));

function safeWebsite(value: string): string {
  if (!value.trim()) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["https:", "http:"].includes(url.protocol) && url.hostname.includes(".") ? url.href : "";
  } catch { return ""; }
}

type Filters = {
  countries: string[]; scales: string[]; hs: string; hasEmail: boolean;
  exact: boolean; sort: string; page: number; pageSize: number;
};

export function queryCentralAsia(input: Filters, tokens: string[], excludes: string[]) {
  const contains = (value: string, token: string) => value.toLocaleLowerCase().includes(token.toLocaleLowerCase());
  const matchesItem = (value: string, token: string) => input.exact
    ? split(value).some((item) => item.toLocaleLowerCase() === token.toLocaleLowerCase())
    : contains(value, token);
  const rows = centralAsiaImporters.filter((r) =>
    (!input.countries.length || r.countries.some((c) => input.countries.includes(c))) &&
    (!input.scales.length || input.scales.includes(r.scale_label)) &&
    (!input.hs || r.hs_codes.includes(input.hs.trim())) &&
    (!input.hasEmail || r.has_email) &&
    tokens.every((token) => contains(r.name_kr, token) || contains(r.name_en, token) ||
      contains(r.industry_kr ?? "", token) || contains(r.industry_en ?? "", token) ||
      matchesItem(r.items_kr, token) || matchesItem(r.items_en, token)) &&
    excludes.every((token) => !contains(r.items_kr, token) && !contains(r.items_en, token)),
  );
  rows.sort((a, b) => {
    if (input.sort === "name_asc") return a.name_kr.localeCompare(b.name_kr, "ko");
    const key = input.sort === "rank_sales_asc" ? "rank_sales" : "rank_import";
    return (a[key] ?? Infinity) - (b[key] ?? Infinity) || a.id.localeCompare(b.id);
  });
  const start = (input.page - 1) * input.pageSize;
  return { rows: rows.slice(start, start + input.pageSize), total: rows.length };
}

export function centralAsiaFacets() {
  const countries: Record<string, number> = {};
  const scales: Record<string, number> = {};
  for (const row of centralAsiaImporters) {
    for (const c of row.countries) countries[c] = (countries[c] ?? 0) + 1;
    scales[row.scale_label] = (scales[row.scale_label] ?? 0) + 1;
  }
  return { total: centralAsiaImporters.length, countries, scales };
}