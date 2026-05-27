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

const SCALE_LABELS = [
  "1억불 초과",
  "5000만불~1억불",
  "3000만불~5000만불",
  "1000만불~3000만불",
  "700만불~1000만불",
  "500만불~700만불",
  "300만불~500만불",
  "100만불~300만불",
  "50만불~100만불",
  "30만불~50만불",
  "10만불~30만불",
  "5만불~10만불",
  "3만불~5만불",
  "1만불~3만불",
  "1만불 미만",
];

// ---- Masking helpers ----------------------------------------------------
// 민감 정보는 서버에서 마스킹해서 반환합니다 (개인정보 보호).
function maskBizNo(v: string | null): string | null {
  if (!v) return v;
  // "123-45-67890" → "123-45-****"
  return v.replace(/(\d{3}-?\d{2}-?)(\d{5})/, (_, a, b) =>
    `${a}${"*".repeat(b.length)}`,
  );
}

function maskOneEmail(v: string): string {
  const t = v.trim();
  if (!t) return t;
  const at = t.indexOf("@");
  if (at < 1) return "***";
  const user = t.slice(0, at);
  const domain = t.slice(at + 1);
  const userMasked =
    user.length <= 2 ? user[0] + "*" : user.slice(0, 2) + "*".repeat(Math.max(2, user.length - 2));
  const dot = domain.lastIndexOf(".");
  const tld = dot >= 0 ? domain.slice(dot) : "";
  return `${userMasked}@***${tld}`;
}
function maskEmails(v: string): string {
  if (!v) return v;
  return v
    .split(",")
    .map((e) => maskOneEmail(e))
    .filter(Boolean)
    .join(", ");
}

function maskOnePhone(v: string): string {
  const t = v.trim();
  if (!t) return t;
  // 마지막 4자리를 ****로 가립니다.
  return t.replace(/(\d)(?=\d{0,3}$)/g, "*").replace(/\d{4}$/, "****");
}
function maskPhones(v: string): string {
  if (!v) return v;
  return v.split(/[/,]/).map((p) => maskOnePhone(p)).filter(Boolean).join(" / ");
}

function maskHs(code: string): string {
  const d = code.replace(/\D/g, "");
  if (d.length <= 4) return d + "**";
  return d.slice(0, 4) + "*".repeat(d.length - 4);
}

function maskItems(v: string): string {
  if (!v) return v;
  // 앞 8글자만 노출, 나머지는 …
  const trimmed = v.trim();
  if (trimmed.length <= 8) return trimmed.slice(0, 4) + "…";
  return trimmed.slice(0, 8) + "…";
}

function maskRow(r: Importer): Importer {
  return {
    ...r,
    biz_no: maskBizNo(r.biz_no),
    email: maskEmails(r.email),
    email_extra: maskEmails(r.email_extra),
    phone: maskPhones(r.phone),
    phone_extra: maskPhones(r.phone_extra),
    hs_codes: (r.hs_codes ?? []).map(maskHs),
    items_kr: maskItems(r.items_kr),
    items_en: maskItems(r.items_en),
  };
}

const ListInput = z.object({
  q: z.string().max(100).default(""),
  countries: z.array(z.string().min(1).max(50)).max(50).default([]),
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

    if (data.countries.length > 0)
      query = query.overlaps("countries", data.countries);
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
      case "countries_desc":
        query = query.order("rank_import", { ascending: true, nullsFirst: false });
        break;
      case "rank_sales_asc":
        query = query.order("rank_sales", { ascending: true, nullsFirst: false });
        break;
      case "name_asc":
        query = query.order("name_kr", { ascending: true });
        break;
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const masked = ((rows ?? []) as Importer[]).map(maskRow);
    return { rows: masked, total: count ?? 0 };
  });

export const getImporterFacets = createServerFn({ method: "GET" }).handler(
  async () => {
    const { count: total } = await supabaseAdmin
      .from("importers")
      .select("id", { count: "exact", head: true });

    // Country distribution — sample top 5000 (covers virtually all unique countries).
    const { data: rows, error } = await supabaseAdmin
      .from("importers")
      .select("countries")
      .order("rank_import", { ascending: true, nullsFirst: false })
      .range(0, 4999);
    if (error) throw new Error(error.message);

    const countries: Record<string, number> = {};
    for (const r of rows ?? []) {
      for (const c of (r.countries as string[]) ?? []) {
        countries[c] = (countries[c] ?? 0) + 1;
      }
    }

    // Scale distribution — exact counts via parallel head queries (15 buckets).
    const scaleEntries = await Promise.all(
      SCALE_LABELS.map(async (label) => {
        const { count } = await supabaseAdmin
          .from("importers")
          .select("id", { count: "exact", head: true })
          .eq("scale_label", label);
        return [label, count ?? 0] as const;
      }),
    );
    const scales: Record<string, number> = Object.fromEntries(scaleEntries);

    return { total: total ?? 0, countries, scales };
  },
);
