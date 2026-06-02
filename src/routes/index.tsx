import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import koimaLogo from "@/assets/koima-logo.png";
import { AseanFlag } from "@/components/AseanFlag";
import { LangToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "한국 수입업체 디렉토리 — 2025 관세청 기준" },
      {
        name: "description",
        content:
          "2025년 관세청 기준 한국 수입업체 11.8만 곳의 사업자정보 · 수입국가 · 품목 · HS코드 · 연락처를 한 곳에서 검색하세요.",
      },
      { property: "og:title", content: "한국 수입업체 디렉토리" },
      {
        property: "og:description",
        content: "2025 관세청 기준 한국 수입업체 11.8만 곳을 검색하세요.",
      },
    ],
  }),
});

function HomePage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    navigate({ to: "/search", search: { q: v } });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Top-right utilities */}
      <header className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/admin"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {t("관리자", "Admin")}
        </Link>
        <LangToggle />
      </header>

      {/* Center: logo + search */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-32 sm:pb-40">
        <img
          src={koimaLogo}
          alt="KOIMA"
          className="mb-4 h-16 w-auto sm:h-20"
        />
        <h1 className="mb-1 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("한국 수입업체 디렉토리", "Korean Importers Directory")}
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {t(
            "2025 관세청 기준 · 11.8만 업체 · 사업자 · 품목 · 수입국가 검색",
            "2025 Korea Customs · 118k companies · biz no · items · countries",
          )}
        </p>

        <form
          onSubmit={submit}
          className="group flex w-full max-w-2xl items-center gap-2 rounded-full border bg-card pl-5 pr-2 py-2 shadow-md transition focus-within:shadow-lg focus-within:ring-2 focus-within:ring-ring hover:shadow-lg"
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(
              "업체명 · 사업자번호 · 품목으로 검색",
              "Search by name · biz no · items",
            )}
            className="flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Search className="size-4" />
            {t("검색", "Search")}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/search", search: { q: "" } })}
            className="rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            {t("전체 둘러보기", "Browse all")}
          </button>
          <Link
            to="/eu"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            🇪🇺 EU
          </Link>
          <Link
            to="/cis"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            🌍 CIS
          </Link>
          <Link
            to="/importers"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            <AseanFlag className="h-4 w-auto" /> ASEAN
          </Link>
          <Link
            to="/china"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            🇨🇳 {t("중국", "China")}
          </Link>
          <Link
            to="/usa"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm hover:bg-accent"
          >
            🇺🇸 {t("미국", "USA")}
          </Link>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>
            {t(
              "출처 · 2025 관세청 수입실적 · 데이터 갱신 2026.05",
              "Source · 2025 Korea Customs · Updated 2026.05",
            )}
          </p>
          <p>
            {t(
              "KOIMA 품목별 수입업체 검색 | 문의: seobh@koima.or.kr",
              "KOIMA Korean importers directory | Contact: seobh@koima.or.kr",
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
