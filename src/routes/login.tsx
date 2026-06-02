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

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      try {
        const s = await checkAdmin();
        if (cancelled) return;
        if (s.isAdmin) navigate({ to: redirectTo, replace: true });
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
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/login" },
        });
        if (error) throw error;
        setInfo(
          "가입 요청이 접수되었습니다. 이메일의 인증 링크를 클릭한 뒤 다시 로그인하세요. 관리자 권한은 별도로 부여되어야 합니다.",
        );
        setMode("signin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
          <Field label="이메일">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="비밀번호">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>

          {err && <ErrorBox>{err}</ErrorBox>}
          {info && <InfoBox>{info}</InfoBox>}

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
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0.55rem 0.7rem;font-size:13px;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
      {children}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-[12px] text-muted-foreground">
      {children}
    </div>
  );
}
