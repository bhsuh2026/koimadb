import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase as supabaseAdmin } from "@/integrations/supabase/client";
import { requireAdmin } from "./admin-auth.server";

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
  exact: z.boolean().default(false),
  sort: z
    .enum(["rank_import_asc", "rank_sales_asc", "name_asc", "countries_desc"])
    .default("rank_import_asc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

const SEARCH_STOP_WORDS = new Set([
  "주",
  "주식회사",
  "유한회사",
  "합자회사",
  "합명회사",
  "법인",
  "inc",
  "co",
  "ltd",
  "corp",
  "llc",
]);

/** 쿼리를 포함어/제외어(-단어)로 분리합니다. */
function splitIncludeExclude(input: string): { include: string; excludes: string[] } {
  const parts = input.split(/\s+/);
  const inc: string[] = [];
  const exc: string[] = [];
  for (const raw of parts) {
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("-") && t.length > 1) {
      exc.push(t.slice(1));
    } else {
      inc.push(t);
    }
  }
  return { include: inc.join(" "), excludes: exc };
}

function getSearchTokens(input: string): string[] {
  return Array.from(
    new Set(
      input
        .replace(/㈜/g, " ")
        .replace(/[%,()"\\*]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .map((token) => token.replace(/[._/-]+/g, ""))
        .filter((token) => {
          if (!token) return false;
          if (/^\d+$/.test(token)) return token.length >= 2;
          return token.length >= 2 && !SEARCH_STOP_WORDS.has(token.toLowerCase());
        }),
    ),
  ).slice(0, 5);
}

/** 사용자 입력을 안전한 PostgreSQL 정규식 토큰으로 변환 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "품목" 단위 정확 일치 패턴 (쉼표 경계). 콤마(\054)는 octal 로 표기해 PostgREST or= 파싱과 충돌하지 않도록 합니다. */
function exactItemPattern(token: string): string {
  const t = escapeRegex(token);
  return `(^|\\054[[:space:]]*)${t}([[:space:]]*\\054|[[:space:]]*$)`;
}

/** 제외어 토큰 정규화 (sanitize): wildcard 등 특수문자 제거 */
function cleanExcludeToken(t: string): string {
  return t.replace(/[%,()"\\*]/g, "").trim();
}

export const listImporters = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data }) => {
    const { include, excludes } = splitIncludeExclude(data.q);
    const tokens = getSearchTokens(include);
    let query = supabaseAdmin
      .from("importers")
      .select("*", { count: tokens.length > 0 ? "planned" : "exact" });

    if (data.countries.length > 0)
      query = query.overlaps("countries", data.countries);
    if (data.scales.length) query = query.in("scale_label", data.scales);
    if (data.hasEmail) query = query.neq("email", "");
    if (data.hs) query = query.contains("hs_codes", [data.hs.trim()]);

    if (tokens.length > 0) {
      for (const t of tokens) {
        if (data.exact) {
          // 정확 일치: items 필드를 쉼표 경계 정규식으로 매칭. 업체명 / 사업자번호는 그대로 부분일치.
          const pat = exactItemPattern(t);
          query = query.or(
            `name_kr.ilike.%${t}%,name_en.ilike.%${t}%,biz_no.ilike.%${t}%,items_kr.imatch."${pat}",items_en.imatch."${pat}"`,
          );
        } else {
          query = query.or(
            `name_kr.ilike.%${t}%,name_en.ilike.%${t}%,biz_no.ilike.%${t}%,items_kr.ilike.%${t}%,items_en.ilike.%${t}%`,
          );
        }
      }
    }

    // 제외어: items_kr · items_en 양쪽 모두 해당 단어를 포함하지 않은 행만 통과.
    for (const raw of excludes.slice(0, 5)) {
      const w = cleanExcludeToken(raw);
      if (w.length < 2) continue;
      query = query
        .not("items_kr", "ilike", `%${w}%`)
        .not("items_en", "ilike", `%${w}%`);
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

// ====== Admin (관리자) ======================================================

const ImporterInputSchema = z.object({
  rank_import: z.number().int().nullable().optional(),
  rank_sales: z.number().int().nullable().optional(),
  biz_no: z.string().max(50).nullable().optional(),
  name_kr: z.string().max(255).default(""),
  name_en: z.string().max(255).default(""),
  email: z.string().max(500).default(""),
  email_extra: z.string().max(500).default(""),
  phone: z.string().max(100).default(""),
  phone_extra: z.string().max(100).default(""),
  countries: z.array(z.string().min(1).max(50)).max(50).default([]),
  scale_label: z.string().max(50).default(""),
  items_kr: z.string().max(2000).default(""),
  items_en: z.string().max(2000).default(""),
  hs_codes: z.array(z.string().min(1).max(20)).max(200).default([]),
});

// 관리자용: 마스킹 없이 원본 데이터 반환
export const adminListImporters = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      q: z.string().max(100).default(""),
      countries: z.array(z.string().min(1).max(50)).max(50).default([]),
      scales: z.array(z.string().min(1).max(50)).max(20).default([]),
      hs: z.string().max(12).default(""),
      hasEmail: z.boolean().default(false),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const tokens = getSearchTokens(data.q);
    let query = supabaseAdmin
      .from("importers")
      .select("*", { count: tokens.length > 0 ? "planned" : "exact" });
    if (data.countries.length) query = query.overlaps("countries", data.countries);
    if (data.scales.length) query = query.in("scale_label", data.scales);
    if (data.hs) query = query.contains("hs_codes", [data.hs.trim()]);
    if (data.hasEmail) query = query.neq("email", "");
    if (tokens.length > 0) {
      for (const t of tokens) {
        query = query.or(
          `name_kr.ilike.%${t}%,name_en.ilike.%${t}%,biz_no.ilike.%${t}%,items_kr.ilike.%${t}%`,
        );
      }
    }
    query = query.order("rank_import", { ascending: true, nullsFirst: false });
    const from = (data.page - 1) * data.pageSize;
    query = query.range(from, from + data.pageSize - 1);
    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Importer[], total: count ?? 0 };
  });


export const createImporter = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => ImporterInputSchema.parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("importers")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Importer;
  });

export const updateImporter = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid() })
      .merge(ImporterInputSchema.partial())
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await supabaseAdmin
      .from("importers")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Importer;
  });

export const deleteImporter = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("importers")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Stats Dashboard ======================================================
export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { count: total } = await supabaseAdmin
      .from("importers")
      .select("id", { count: "exact", head: true });
    const { count: withEmail } = await supabaseAdmin
      .from("importers")
      .select("id", { count: "exact", head: true })
      .neq("email", "");
    const { count: withBiz } = await supabaseAdmin
      .from("importers")
      .select("id", { count: "exact", head: true })
      .not("biz_no", "is", null);

    const rows: { countries: string[]; scale_label: string; hs_codes: string[] }[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from("importers")
        .select("countries, scale_label, hs_codes")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      rows.push(...(data as typeof rows));
      if (data.length < PAGE) break;
      from += PAGE;
    }

    const countries: Record<string, number> = {};
    const scales: Record<string, number> = {};
    const hsCodes: Record<string, number> = {};
    for (const r of rows) {
      for (const c of r.countries ?? []) countries[c] = (countries[c] ?? 0) + 1;
      if (r.scale_label) scales[r.scale_label] = (scales[r.scale_label] ?? 0) + 1;
      for (const h of r.hs_codes ?? []) {
        const k = h.slice(0, 4);
        if (k) hsCodes[k] = (hsCodes[k] ?? 0) + 1;
      }
    }
    return {
      total: total ?? 0,
      withEmail: withEmail ?? 0,
      withBiz: withBiz ?? 0,
      countries,
      scales,
      hsCodes,
    };
  });

// ===== Bulk Upload ==========================================================
export const adminBulkUpsertImporters = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      rows: z.array(ImporterInputSchema).min(1).max(2000),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    let inserted = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      try {
        if (row.biz_no) {
          const { data: existing } = await supabaseAdmin
            .from("importers")
            .select("id")
            .eq("biz_no", row.biz_no)
            .maybeSingle();
          if (existing) {
            const { error } = await supabaseAdmin
              .from("importers")
              .update(row)
              .eq("id", existing.id);
            if (error) throw new Error(error.message);
            updated++;
            continue;
          }
        }
        const { error } = await supabaseAdmin.from("importers").insert(row);
        if (error) throw new Error(error.message);
        inserted++;
      } catch (e) {
        errors.push({
          row: i + 1,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { inserted, updated, errors };
  });

// ===== Export (마스킹 없는 원본) =============================================
export const adminExportImporters = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      q: z.string().max(100).default(""),
      countries: z.array(z.string()).max(50).default([]),
      scales: z.array(z.string()).max(20).default([]),
      hs: z.string().max(12).default(""),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const tokens = getSearchTokens(data.q);
    const out: Importer[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      let query = supabaseAdmin.from("importers").select("*");
      if (data.countries.length) query = query.overlaps("countries", data.countries);
      if (data.scales.length) query = query.in("scale_label", data.scales);
      if (data.hs) query = query.contains("hs_codes", [data.hs.trim()]);
      if (tokens.length > 0) {
        for (const t of tokens) {
          query = query.or(
            `name_kr.ilike.%${t}%,name_en.ilike.%${t}%,biz_no.ilike.%${t}%,items_kr.ilike.%${t}%`,
          );
        }
      }
      query = query
        .order("rank_import", { ascending: true, nullsFirst: false })
        .range(from, from + PAGE - 1);
      const { data: rows, error } = await query;
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;
      out.push(...(rows as Importer[]));
      if (rows.length < PAGE || out.length >= 10000) break;
      from += PAGE;
    }
    return { rows: out };
  });

// ===== Duplicate detection & merge (사업자번호 기준) ========================

function unionCSV(...values: string[]): string {
  const set = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    for (const part of v.split(/[,/]/)) {
      const t = part.trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set).join(", ");
}

function unionArr(...arrs: (string[] | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const arr of arrs) {
    for (const v of arr ?? []) {
      const t = String(v).trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set);
}

function mergeRows(rows: Importer[]): Omit<Importer, "id"> & { keeperId: string; mergedIds: string[] } {
  const sorted = [...rows].sort((a, b) => {
    const ar = a.rank_import ?? Number.MAX_SAFE_INTEGER;
    const br = b.rank_import ?? Number.MAX_SAFE_INTEGER;
    return ar - br;
  });
  const keeper = sorted[0];
  const others = sorted.slice(1);
  const pickStr = (key: keyof Importer): string => {
    const v = (keeper[key] as string) ?? "";
    if (v && v.trim()) return v;
    for (const o of others) {
      const ov = (o[key] as string) ?? "";
      if (ov && ov.trim()) return ov;
    }
    return "";
  };
  const pickNum = (key: keyof Importer): number | null => {
    for (const r of sorted) {
      const v = r[key] as number | null | undefined;
      if (v != null) return v;
    }
    return null;
  };
  return {
    keeperId: keeper.id,
    mergedIds: others.map((o) => o.id),
    rank_import: pickNum("rank_import"),
    rank_sales: pickNum("rank_sales"),
    biz_no: keeper.biz_no,
    name_kr: pickStr("name_kr"),
    name_en: pickStr("name_en"),
    email: unionCSV(...rows.map((r) => r.email)),
    email_extra: unionCSV(...rows.map((r) => r.email_extra)),
    phone: unionCSV(...rows.map((r) => r.phone)),
    phone_extra: unionCSV(...rows.map((r) => r.phone_extra)),
    countries: unionArr(...rows.map((r) => r.countries)),
    scale_label: pickStr("scale_label"),
    items_kr: unionCSV(...rows.map((r) => r.items_kr)),
    items_en: unionCSV(...rows.map((r) => r.items_en)),
    hs_codes: unionArr(...rows.map((r) => r.hs_codes)),
  };
}

async function collectBizGroups(): Promise<Map<string, string[]>> {
  const all: { id: string; biz_no: string | null }[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from("importers")
      .select("id, biz_no")
      .not("biz_no", "is", null)
      .neq("biz_no", "")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  const groups = new Map<string, string[]>();
  for (const r of all) {
    const key = (r.biz_no ?? "").replace(/[-\s]/g, "");
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(r.id);
    groups.set(key, list);
  }
  return groups;
}

export const adminFindDuplicates = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const groups = await collectBizGroups();
    const dup = Array.from(groups.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([biz_no, ids]) => ({ biz_no, count: ids.length, ids }))
      .sort((a, b) => b.count - a.count);

    const preview: Record<string, Importer[]> = {};
    for (const g of dup.slice(0, 50)) {
      const { data, error } = await supabaseAdmin
        .from("importers")
        .select("*")
        .in("id", g.ids);
      if (error) throw new Error(error.message);
      preview[g.biz_no] = (data ?? []) as Importer[];
    }
    return {
      totalGroups: dup.length,
      totalRowsAffected: dup.reduce((s, g) => s + g.count, 0),
      groups: dup,
      preview,
    };
  });

export const adminMergeGroup = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(2).max(50) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("importers")
      .select("*")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    if (!rows || rows.length < 2) throw new Error("병합할 행이 부족합니다");
    const merged = mergeRows(rows as Importer[]);
    const { keeperId, mergedIds, ...patch } = merged;
    const { error: upErr } = await supabaseAdmin
      .from("importers")
      .update(patch)
      .eq("id", keeperId);
    if (upErr) throw new Error(upErr.message);
    if (mergedIds.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("importers")
        .delete()
        .in("id", mergedIds);
      if (delErr) throw new Error(delErr.message);
    }
    return { keeperId, deletedCount: mergedIds.length };
  });

export const adminMergeAllDuplicates = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ dryRun: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data }) => {
    const groups = await collectBizGroups();
    const dupGroups = Array.from(groups.values()).filter((ids) => ids.length > 1);

    if (data.dryRun) {
      return {
        dryRun: true,
        groupCount: dupGroups.length,
        rowsToRemove: dupGroups.reduce((s, ids) => s + (ids.length - 1), 0),
        merged: 0,
        deleted: 0,
        errors: [] as { ids: string; message: string }[],
      };
    }

    let merged = 0;
    let deleted = 0;
    const errors: { ids: string; message: string }[] = [];
    for (const ids of dupGroups) {
      try {
        const { data: rows, error } = await supabaseAdmin
          .from("importers")
          .select("*")
          .in("id", ids);
        if (error) throw new Error(error.message);
        if (!rows || rows.length < 2) continue;
        const m = mergeRows(rows as Importer[]);
        const { keeperId, mergedIds, ...patch } = m;
        const { error: upErr } = await supabaseAdmin
          .from("importers")
          .update(patch)
          .eq("id", keeperId);
        if (upErr) throw new Error(upErr.message);
        if (mergedIds.length > 0) {
          const { error: delErr } = await supabaseAdmin
            .from("importers")
            .delete()
            .in("id", mergedIds);
          if (delErr) throw new Error(delErr.message);
          deleted += mergedIds.length;
        }
        merged++;
      } catch (e) {
        errors.push({
          ids: ids.join(","),
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return {
      dryRun: false,
      groupCount: dupGroups.length,
      rowsToRemove: dupGroups.reduce((s, ids) => s + (ids.length - 1), 0),
      merged,
      deleted,
      errors,
    };
  });



