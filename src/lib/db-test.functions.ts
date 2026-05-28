import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const runDbTest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const t0 = Date.now();

    const [companies, importers] = await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("importers").select("*", { count: "exact", head: true }),
    ]);

    if (companies.error) throw new Error(`companies: ${companies.error.message}`);
    if (importers.error) throw new Error(`importers: ${importers.error.message}`);

    return {
      ok: true,
      elapsedMs: Date.now() - t0,
      companies: companies.count ?? 0,
      importers: importers.count ?? 0,
      at: new Date().toISOString(),
    };
  });
