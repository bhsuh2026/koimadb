import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Database, ArrowLeft, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "관리자 · KOIMA Admin" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
          <nav className="ml-auto flex gap-1">
            <AdminTab to="/admin" active={pathname === "/admin"}>
              <Database className="h-3.5 w-3.5" /> 업체
            </AdminTab>
          </nav>
        </div>
      </header>
      <div className="border-b border-destructive/30 bg-destructive/5">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2 text-[11.5px] text-destructive sm:px-6">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            <b className="font-semibold">데모용 — 인증이 없습니다.</b> 운영 환경에서는
            반드시 로그인을 추가하세요.
          </span>
        </div>
      </div>
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
