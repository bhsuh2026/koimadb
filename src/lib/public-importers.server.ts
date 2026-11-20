import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// A session-free public client can execute only masked read functions.
export function createPublicImporterClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Company search is unavailable.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const publicImporterResult = z.object({
  total: z.number().nonnegative(),
  rows: z.array(z.object({
    id: z.string(), name_kr: z.string(), name_en: z.string(),
    rank_import: z.number().nullable(), rank_sales: z.number().nullable(),
    biz_no: z.string().nullable(), email: z.string(), email_extra: z.string(),
    phone: z.string(), phone_extra: z.string(), countries: z.array(z.string()),
    scale_label: z.string(), items_kr: z.string(), items_en: z.string(),
    hs_codes: z.array(z.string()),
  })),
});

export const publicFacetResult = z.object({
  total: z.number().nonnegative(),
  countries: z.record(z.number().nonnegative()),
  scales: z.record(z.number().nonnegative()),
});