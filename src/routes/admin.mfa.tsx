import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";

export const Route = createFileRoute("/admin/mfa")({
  component: AdminMfaPage,
});

type Factor = {
  id: string;
  friendly_name?: string | null;
  status: "unverified" | "verified";
  created_at: string;
};

function AdminMfaPage() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<{
    factorId: string;
    secret: string;
    uri: string;
    qrDataUrl: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors((data?.totp ?? []) as Factor[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "factor 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const verified = factors.find((f) => f.status === "verified");

  const startEnrollment = async () => {
    setBusy(true);
    try {
      // 미완료(unverified) factor가 있으면 정리
      for (const f of factors.filter((x) => x.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `KOIMA Admin · ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      const qrDataUrl = await QRCode.toDataURL(data.totp.uri, {
        margin: 1,
        width: 220,
      });
      setEnroll({
        factorId: data.id,
        secret: data.totp.secret,
        uri: data.totp.uri,
        qrDataUrl,
      });
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "등록 시작 실패");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrollment = async () => {
    if (!enroll) return;
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) {
      toast.error("6자리 숫자를 입력하세요");
      return;
    }
    setBusy(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enroll.factorId,
      });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: ch.id,
        code: clean,
      });
      if (vErr) throw vErr;
      toast.success("2단계 인증이 활성화되었습니다");
      setEnroll(null);
      setCode("");
      await refresh();
      // 새 AAL2 토큰을 라우터에 반영
      window.location.assign("/admin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setBusy(false);
    }
  };

  const cancelEnrollment = async () => {
    if (!enroll) return;
    try {
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    } catch {
      /* ignore */
    }
    setEnroll(null);
    setCode("");
    await refresh();
  };

  const unenroll = async (factorId: string) => {
    if (
      !window.confirm(
        "2단계 인증을 해제하면 계정 탈취 위험이 커집니다. 정말 해제하시겠습니까?",
      )
    )
      return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("2단계 인증이 해제되었습니다");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "해제 실패");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!enroll) return;
    await navigator.clipboard.writeText(enroll.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-primary">2단계 인증 (TOTP)</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-5 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
        </div>
      ) : enroll ? (
        <EnrollmentCard
          enroll={enroll}
          code={code}
          setCode={setCode}
          onConfirm={confirmEnrollment}
          onCancel={cancelEnrollment}
          onCopySecret={copySecret}
          copied={copied}
          busy={busy}
        />
      ) : verified ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-bold">활성화됨</span>
          </div>
          <p className="mb-4 text-[13px] text-muted-foreground">
            관리자 계정에 인증 앱(TOTP)이 등록되어 있습니다. 로그인 시 비밀번호
            + 6자리 코드가 필요합니다.
          </p>
          <div className="rounded-md border border-border bg-card px-3 py-2 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {verified.friendly_name || "인증 앱"}
                </div>
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  등록: {new Date(verified.created_at).toLocaleString("ko-KR")}
                </div>
              </div>
              <button
                onClick={() => unenroll(verified.id)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 해제
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-sm font-bold">미등록</span>
          </div>
          <p className="mb-4 text-[13px] text-muted-foreground">
            관리자 계정은 반드시 2단계 인증을 활성화해야 합니다. Google
            Authenticator, 1Password, Authy 등 인증 앱을 준비한 뒤 등록을
            시작하세요.
          </p>
          <button
            onClick={startEnrollment}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            등록 시작
          </button>
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({
  enroll,
  code,
  setCode,
  onConfirm,
  onCancel,
  onCopySecret,
  copied,
  busy,
}: {
  enroll: { secret: string; qrDataUrl: string };
  code: string;
  setCode: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCopySecret: () => void;
  copied: boolean;
  busy: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <ol className="ml-4 list-decimal space-y-1 text-[13px] text-foreground">
        <li>인증 앱에서 "계정 추가"를 선택합니다.</li>
        <li>아래 QR 코드를 스캔하거나 시크릿 키를 직접 입력합니다.</li>
        <li>앱에 표시된 6자리 코드를 입력해 등록을 완료합니다.</li>
      </ol>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-start">
        <img
          src={enroll.qrDataUrl}
          alt="TOTP QR 코드"
          className="h-[220px] w-[220px] shrink-0 rounded-md bg-white p-2"
        />
        <div className="flex-1 space-y-2">
          <div>
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              시크릿 키
            </div>
            <div className="flex items-stretch gap-1">
              <code className="flex-1 break-all rounded-md bg-secondary px-2 py-1.5 font-mono text-[12px]">
                {enroll.secret}
              </code>
              <button
                onClick={onCopySecret}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            QR을 스캔할 수 없는 환경이면 시크릿 키를 수동 입력하세요. 알고리즘:
            SHA1 · 자릿수: 6 · 주기: 30초.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          앱에 표시된 6자리 코드
        </label>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={busy || code.length !== 6}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          활성화
        </button>
      </div>
    </div>
  );
}
