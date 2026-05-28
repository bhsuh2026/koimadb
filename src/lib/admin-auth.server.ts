import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * 서버 측에서 현재 요청 사용자가 admin 역할을 가졌는지 확인하는 미들웨어.
 *
 * 2단계 인증(MFA) 정책:
 *  - 관리자가 검증된 TOTP factor를 1개 이상 보유하고 있으면, 토큰의 AAL이
 *    반드시 `aal2`여야 합니다(2차 인증 통과). 그렇지 않으면 거부합니다.
 *  - factor가 전혀 없는 관리자는 등록 화면(`/admin/mfa`)에서만 사용 가능하도록
 *    프런트엔드에서 강제됩니다. (서버는 등록을 차단하지 않음 — bootstrap 허용)
 *
 * 사용: createServerFn(...).middleware([requireAdmin]).handler(...)
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const ctx = context as {
      userId: string;
      claims: Record<string, unknown>;
    };
    const userId = ctx.userId;

    // 1) admin 역할
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Forbidden: 관리자 권한이 필요합니다");

    // 2) MFA 정책: 검증된 TOTP factor가 있으면 aal2 필수
    const { data: factorList, error: factorErr } =
      await supabaseAdmin.auth.admin.mfa.listFactors({ userId });
    if (factorErr) throw new Error(factorErr.message);

    const hasVerifiedTotp = (factorList?.factors ?? []).some(
      (f) => f.factor_type === "totp" && f.status === "verified",
    );
    const aal = typeof ctx.claims.aal === "string" ? ctx.claims.aal : "aal1";

    if (hasVerifiedTotp && aal !== "aal2") {
      throw new Error("MFA required: 2단계 인증을 완료해 주세요");
    }

    return next({
      context: { userId, isAdmin: true, aal, hasVerifiedTotp },
    });
  });
