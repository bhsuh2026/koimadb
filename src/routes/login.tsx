import koimaLogo from "@/assets/koima-logo.png";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminStatus } from "@/lib/auth.functions";
import { ShieldCheck, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/admin",
  }),
  head: () => ({
    meta: [{ title: "관리자 로그인 · KOIMA" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const checkAdmin = useServerFn(getMyAdminStatus);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 이미 로그인 + admin이면 바로 이동
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      try {
        const s = await checkAdmin();
        if (!cancelled && s.isAdmin) navigate({ to: redirectTo, replace: true });
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo, checkAdmin]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");

    setErr(null);
    setInfo(null);
    setBusy(true);
    setEmail(submittedEmail);
    setPassword(submittedPassword);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: submittedEmail,
          password: submittedPassword,
          options: { emailRedirectTo: window.location.origin + "/login" },
        });
        if (error) throw error;
        setInfo(
          "가입 요청이 접수되었습니다. 이메일의 인증 링크를 클릭한 뒤 다시 로그인하세요. 관리자 권한은 별도로 부여되어야 합니다.",
        );
        setMode("signin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: submittedEmail,
        password: submittedPassword,
      });
      if (error) throw error;

      const status = await checkAdmin();
      if (!status.isAdmin) {
        await supabase.auth.signOut();
        throw new Error("이 계정은 관리자 권한이 없습니다.");
      }
      navigate({ to: redirectTo, replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "로그인 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center gap-3">
          <img src={koimaLogo} alt="KOIMA" className="h-9 w-auto" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-bold text-primary">관리자 로그인</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              이메일
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {err && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {err}
            </div>
          )}
          {info && (
            <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-[12px] text-muted-foreground">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {busy ? "처리 중…" : mode === "signin" ? "로그인" : "가입하기"}
          </button>

          <button
            type="button"
            onClick={() => {
              setErr(null);
              setInfo(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="w-full text-center text-[12px] text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "계정이 없습니다 · 가입하기"
              : "이미 계정이 있습니다 · 로그인"}
          </button>
        </form>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          관리자 권한은 가입 후 별도로 부여되어야 합니다. 데이터베이스의{" "}
          <code className="rounded bg-secondary px-1">user_roles</code> 테이블에
          본인 user_id를 <code className="rounded bg-secondary px-1">admin</code>
          역할로 등록하세요.
        </p>
      </div>
    </div>
  );
}
