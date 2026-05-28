import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Database, ArrowLeft, ShieldCheck, LogOut, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminStatus } from "@/lib/auth.functions";
import { runDbTest } from "@/lib/db-test.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "관리자 · KOIMA Admin" }],
  }),
  beforeLoad: async ({ location }) => {
    // 1) 로그인 세션 확인
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    // 2) admin 역할 확인 (서버 검증)
    try {
      const status = await getMyAdminStatus();
      if (!status.isAdmin) {
        throw redirect({ to: "/login", search: { redirect: location.href } });
      }
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const testFn = useServerFn(runDbTest);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const r = await testFn();
      toast.success(
        `DB OK · ${r.elapsedMs}ms · companies ${r.companies.toLocaleString()} · importers ${r.importers.toLocaleString()}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`DB 오류: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            사이트
          </Link>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-extrabold text-primary">KOIMA Admin</h1>
            <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
              데이터베이스 관리
            </span>
          </div>
          <nav className="ml-auto flex items-center gap-1">
            <AdminTab to="/admin" active={pathname === "/admin"}>
              <Database className="h-3.5 w-3.5" /> 업체
            </AdminTab>
            <button
              onClick={onTest}
              disabled={testing}
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
              title="Supabase 연결 및 테이블 카운트 테스트"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              데이터 테스트
            </button>
            {email && (
              <span className="ml-2 hidden items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground sm:inline-flex">
                <ShieldCheck className="h-3 w-3 text-primary" />
                {email}
              </span>
            )}
            <button
              onClick={onLogout}
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function AdminTab({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
