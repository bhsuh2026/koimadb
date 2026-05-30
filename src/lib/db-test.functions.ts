import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const runDbTest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const t0 = Date.now();

    const { count, error } = await supabase
      .from("importers")
      .select("*", { count: "exact", head: true });

    if (error) throw new Error(`importers: ${error.message}`);

    return {
      ok: true,
      elapsedMs: Date.now() - t0,
      importers: count ?? 0,
      at: new Date().toISOString(),
    };
  });
