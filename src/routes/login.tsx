import koimaLogo from "@/assets/koima-logo.png";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyMfaStatus } from "@/lib/auth.functions";
import { ShieldCheck, LogIn, KeyRound } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/admin",
  }),
  head: () => ({
    meta: [{ title: "관리자 로그인 · KOIMA" }],
  }),
  component: LoginPage,
});

type Step = "credentials" | "totp";

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const checkMfa = useServerFn(getMyMfaStatus);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 이미 로그인 + 관리자 + MFA 통과 상태면 바로 이동
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      try {
        const s = await checkMfa();
        if (cancelled) return;
        if (s.isAdmin && s.mfaSatisfied) {
          navigate({ to: redirectTo, replace: true });
        }
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo, checkMfa]);

  /** 비밀번호 단계 이후 MFA·관리자 상태에 따라 다음 화면 분기 */
  const proceedAfterPassword = async () => {
    const status = await checkMfa();
    if (!status.isAdmin) {
      await supabase.auth.signOut();
      throw new Error("이 계정은 관리자 권한이 없습니다.");
    }

    if (status.hasVerifiedTotp) {
      // 2차 인증 챌린지 시작
      const { data: factors, error: lfErr } =
        await supabase.auth.mfa.listFactors();
      if (lfErr) throw lfErr;
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) {
        // 이론상 도달 불가 — 안전하게 로그아웃
        await supabase.auth.signOut();
        throw new Error("2단계 인증 설정에 문제가 있습니다. 다시 시도해 주세요.");
      }
      setFactorId(totp.id);
      setStep("totp");
      setInfo("등록된 인증 앱에서 6자리 코드를 입력하세요.");
      return;
    }

    // 미등록 관리자 → 등록 화면으로 (AAL1 상태로도 등록 가능)
    navigate({ to: "/admin/mfa", replace: true });
  };

  const onSubmitCredentials = async (e: FormEvent) => {
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await proceedAfterPassword();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "로그인 실패");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitTotp = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!factorId) throw new Error("세션이 만료되었습니다. 다시 로그인하세요.");
      const code = totpCode.replace(/\s/g, "");
      if (!/^\d{6}$/.test(code)) throw new Error("6자리 숫자를 입력하세요.");

      const { data: challenge, error: chErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;

      // AAL2 토큰 확보 → 관리자 페이지로
      navigate({ to: redirectTo, replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setBusy(false);
    }
  };

  const cancelTotp = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setTotpCode("");
    setFactorId(null);
    setErr(null);
    setInfo(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center gap-3">
          <img src={koimaLogo} alt="KOIMA" className="h-9 w-auto" />
          <div className="flex items-center gap-1.5">
            {step === "totp" ? (
              <KeyRound className="h-4 w-4 text-primary" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
            <h1 className="text-sm font-bold text-primary">
              {step === "totp" ? "2단계 인증" : "관리자 로그인"}
            </h1>
          </div>
        </div>

        {step === "credentials" ? (
          <form onSubmit={onSubmitCredentials} className="space-y-3">
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
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
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
        ) : (
          <form onSubmit={onSubmitTotp} className="space-y-3">
            <Field label="인증 코드 (6자리)">
              <input
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                placeholder="000000"
                className="input text-center font-mono text-lg tracking-[0.4em]"
              />
            </Field>

            {err && <ErrorBox>{err}</ErrorBox>}
            {info && <InfoBox>{info}</InfoBox>}

            <button
              type="submit"
              disabled={busy || totpCode.length !== 6}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              {busy ? "확인 중…" : "인증"}
            </button>

            <button
              type="button"
              onClick={cancelTotp}
              className="w-full text-center text-[12px] text-muted-foreground hover:text-primary"
            >
              ← 로그아웃하고 다시 로그인
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          관리자 계정은 비밀번호 + 인증 앱(Google Authenticator, 1Password,
          Authy 등) 2단계 인증으로 보호됩니다.
        </p>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0.55rem 0.7rem;font-size:13px;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
