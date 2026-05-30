import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase as supabaseAdmin } from "@/integrations/supabase/client";
import { requireAdmin } from "./admin-auth.server";
import type { Company } from "./koima-types";

const CompanyInputSchema = z.object({
  biz_no: z.string().max(50).nullable().optional(),
  name_kr: z.string().max(255).default(""),
  name_en: z.string().max(255).default(""),
  email: z.string().max(255).default(""),
  phone: z.string().max(50).default(""),
  scale_code: z.number().int().min(6).max(15).default(6),
  asean_countries: z.array(z.string().min(1).max(50)).max(20).default([]),
  other_countries: z.array(z.string().min(1).max(50)).max(300).default([]),
});

const ListInput = z.object({
  q: z.string().max(100).default(""),
  asean: z.string().max(50).nullable().default(null),
  other: z.string().max(50).nullable().default(null),
  otherIn: z.array(z.string().min(1).max(50)).max(50).default([]),
  scales: z.array(z.number().int().min(6).max(15)).max(20).default([]),
  hasEmail: z.boolean().default(false),
  sort: z.enum(["scale_desc", "scale_asc", "name_asc", "countries_desc"]).default("scale_desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(40),
});

export const listCompanies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListInput.parse(input))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("companies")
      .select("*", { count: "exact" });

    if (data.asean) query = query.contains("asean_countries", [data.asean]);
    if (data.other) query = query.contains("other_countries", [data.other]);
    if (data.otherIn.length) query = query.overlaps("other_countries", data.otherIn);
    if (data.scales.length) query = query.in("scale_code", data.scales);
    if (data.hasEmail) query = query.neq("email", "");
    if (data.q) {
      const q = data.q.replace(/[%,]/g, " ").trim();
      query = query.or(
        `name_kr.ilike.%${q}%,name_en.ilike.%${q}%,biz_no.ilike.%${q}%`,
      );
    }

    switch (data.sort) {
      case "scale_desc":
        query = query.order("scale_code", { ascending: false }).order("name_kr");
        break;
      case "scale_asc":
        query = query.order("scale_code", { ascending: true }).order("name_kr");
        break;
      case "name_asc":
        query = query.order("name_kr", { ascending: true });
        break;
      case "countries_desc":
        query = query
          .order("scale_code", { ascending: false })
          .order("name_kr");
        break;
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const masked = ((rows ?? []) as Company[]).map(maskCompany);
    return { rows: masked, total: count ?? 0 };
  });

// ---- Masking helpers (개인정보 보호) ----
function maskBizNo(v: string | null): string | null {
  if (!v) return v;
  return v.replace(/(\d{3}-?\d{2}-?)(\d{5})/, (_, a, b) => `${a}${"*".repeat(b.length)}`);
}
function maskOneEmail(v: string): string {
  const t = v.trim();
  if (!t) return t;
  const at = t.indexOf("@");
  if (at < 1) return "***";
  const user = t.slice(0, at);
  const domain = t.slice(at + 1);
  const userMasked = user.length <= 2 ? user[0] + "*" : user.slice(0, 2) + "*".repeat(Math.max(2, user.length - 2));
  const dot = domain.lastIndexOf(".");
  const tld = dot >= 0 ? domain.slice(dot) : "";
  return `${userMasked}@***${tld}`;
}
function maskEmails(v: string): string {
  if (!v) return v;
  return v.split(",").map(maskOneEmail).filter(Boolean).join(", ");
}
function maskOnePhone(v: string): string {
  const t = v.trim();
  if (!t) return t;
  return t.replace(/(\d)(?=\d{0,3}$)/g, "*").replace(/\d{4}$/, "****");
}
function maskPhones(v: string): string {
  if (!v) return v;
  return v.split(/[/,]/).map(maskOnePhone).filter(Boolean).join(" / ");
}
function maskCompany(r: Company): Company {
  return {
    ...r,
    biz_no: maskBizNo(r.biz_no),
    email: maskEmails(r.email),
    phone: maskPhones(r.phone),
  };
}


export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const { count: total } = await supabaseAdmin
    .from("companies")
    .select("id", { count: "exact", head: true });

  // Aggregate ASEAN country counts in-app (limit 20000 covers full dataset).
  const map: Record<string, number> = {};
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data: rows, error } = await supabaseAdmin
      .from("companies")
      .select("asean_countries")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      for (const c of (r.asean_countries as string[]) ?? []) {
        map[c] = (map[c] ?? 0) + 1;
      }
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return { total: total ?? 0, counts: map };
});

// EU stats — counts companies trading with each EU country and the EU-wide total.
export const getEuStats = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ countries: z.array(z.string().min(1).max(50)).min(1).max(50) }).parse(i),
  )
  .handler(async ({ data }) => {
    const set = new Set(data.countries);
    const map: Record<string, number> = {};
    for (const c of data.countries) map[c] = 0;
    let from = 0;
    const PAGE = 1000;
    let total = 0;
    while (true) {
      const { data: rows, error } = await supabaseAdmin
        .from("companies")
        .select("other_countries")
        .overlaps("other_countries", data.countries)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;
      total += rows.length;
      for (const r of rows) {
        for (const c of (r.other_countries as string[]) ?? []) {
          if (set.has(c)) map[c] = (map[c] ?? 0) + 1;
        }
      }
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    return { total, counts: map };
  });

// CIS stats — counts companies trading with each CIS country and the CIS-wide total.
export const getCisStats = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ countries: z.array(z.string().min(1).max(50)).min(1).max(50) }).parse(i),
  )
  .handler(async ({ data }) => {
    const set = new Set(data.countries);
    const map: Record<string, number> = {};
    for (const c of data.countries) map[c] = 0;
    let from = 0;
    const PAGE = 1000;
    let total = 0;
    while (true) {
      const { data: rows, error } = await supabaseAdmin
        .from("companies")
        .select("other_countries")
        .overlaps("other_countries", data.countries)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;
      total += rows.length;
      for (const r of rows) {
        for (const c of (r.other_countries as string[]) ?? []) {
          if (set.has(c)) map[c] = (map[c] ?? 0) + 1;
        }
      }
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    return { total, counts: map };
  });


export const getCompany = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as Company | null;
  });

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => CompanyInputSchema.parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("companies")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Company;
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z
      .object({ id: z.string().uuid() })
      .merge(CompanyInputSchema.partial())
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await supabaseAdmin
      .from("companies")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Company;
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const BulkInput = z.object({
  rows: z.array(CompanyInputSchema).min(1).max(1000),
});

export const bulkCreateCompanies = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => BulkInput.parse(i))
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabaseAdmin
      .from("companies")
      .insert(data.rows)
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0 };
  });
