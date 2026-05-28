import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * 현재 로그인한 사용자의 관리자 여부를 반환.
 */
export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as { userId: string }).userId;
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { userId, isAdmin: !!data };
  });

/**
 * 관리자 + MFA 상태를 한 번에 반환. (로그인/가드 분기용)
 *   - isAdmin: user_roles에 admin 존재 여부
 *   - aal: 현재 세션의 AAL ('aal1' | 'aal2')
 *   - hasVerifiedTotp: 검증된 TOTP factor 보유 여부
 *   - mfaSatisfied: TOTP가 없으면 true, 있으면 aal2일 때만 true
 */
export const getMyMfaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as {
      userId: string;
      claims: Record<string, unknown>;
    };
    const userId = ctx.userId;

    const [{ data: roleRow }, factorRes] = await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
      supabaseAdmin.auth.admin.mfa.listFactors({ userId }),
    ]);

    if (factorRes.error) throw new Error(factorRes.error.message);

    const hasVerifiedTotp = (factorRes.data?.factors ?? []).some(
      (f) => f.factor_type === "totp" && f.status === "verified",
    );
    const aal = typeof ctx.claims.aal === "string" ? ctx.claims.aal : "aal1";
    const mfaSatisfied = !hasVerifiedTotp || aal === "aal2";

    return {
      userId,
      isAdmin: !!roleRow,
      aal,
      hasVerifiedTotp,
      mfaSatisfied,
    };
  });
