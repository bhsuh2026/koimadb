import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * 서버 측에서 현재 요청 사용자가 admin 역할을 가졌는지 확인하는 미들웨어.
 * 사용: createServerFn(...).middleware([requireAdmin]).handler(...)
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const userId = (context as { userId: string }).userId;
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Forbidden: 관리자 권한이 필요합니다");

    return next({ context: { userId, isAdmin: true } });
  });
