import koimaLogo from "@/assets/koima-logo.png";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  RotateCcw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Settings,
  X,
  BarChart3,
  FileText,
  Scale,
  Building2,
  ExternalLink,
} from "lucide-react";
import { SCALE, SCOLOR, flagOf, displayCountry, type Company } from "@/lib/koima-types";
import { listCompanies } from "@/lib/companies.functions";
import { DetailModal } from "@/components/DetailModal";
import { LangToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/usa")({
  component: UsaPage,
  head: () => ({
    meta: [
      { title: "USA · Korean Importers Directory | KOIMA · 미국 · 韓國進口商" },
      {
        name: "description",
        content:
          "Korean importers actively trading with the USA — 미국 거래 한국 수입업체 디렉토리.",
      },
      { property: "og:title", content: "USA · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content:
          "11,000+ Korean importers sourcing from the USA. Browse by import scale and contact.",
      },
    ],
  }),
});

const PAGE_SIZE = 40;
const USA_KR = "미국";

type SortKey = "scale_desc" | "scale_asc" | "name_asc";

function UsaPage() {
  const { t, lang } = useLang();
  const listFn = useServerFn(listCompanies);

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [scales, setScales] = useState<Set<number>>(new Set());
  const [mailOnly, setMailOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("scale_desc");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Company | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const dirRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDeb, scales, mailOnly, sort]);

  const scaleArr = useMemo(() => Array.from(scales), [scales]);

  const listQuery = useQuery({
    queryKey: ["usa-companies", { qDeb, scaleArr, mailOnly, sort, page }],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          other: USA_KR,
          scales: scaleArr,
          hasEmail: mailOnly,
          sort,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: (prev) => prev,
  });

  // grand total (no filters) — used for hero stat
  const totalQuery = useQuery({
    queryKey: ["usa-total"],
    queryFn: () =>
      listFn({
        data: { other: USA_KR, page: 1, pageSize: 1 },
      }),
    staleTime: 5 * 60 * 1000,
  });

  const total = listQuery.data?.total ?? 0;
  const rows = listQuery.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const grandTotal = totalQuery.data?.total ?? 0;

  const reset = () => {
    setQ("");
    setScales(new Set());
    setMailOnly(false);
    setSort("scale_desc");
  };

  const pagerNums = useMemo(() => {
    const nums: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    return nums;
  }, [page, pages]);

  const activeFilters = (scales.size ? 1 : 0) + (mailOnly ? 1 : 0) + (qDeb ? 1 : 0);

  const scrollToList = () =>
    setTimeout(() => dirRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-700 to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={koimaLogo}
                alt="KOIMA"
                className="h-7 w-auto rounded bg-white/95 px-1.5 py-1"
              />
              <span className="hidden text-[9px] uppercase tracking-[0.2em] text-white/60 sm:inline">
                Korea Importers Association
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                Directory
              </Link>
              <Link
                to="/importers"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                🌏 <span className="hidden sm:inline">ASEAN</span>
              </Link>
              <Link
                to="/eu"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                🇪🇺 <span className="hidden sm:inline">EU</span>
              </Link>
              <Link
                to="/cis"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                <span className="hidden sm:inline">CIS</span>
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("관리자", "Admin", "管理")}</span>
              </Link>
              <LangToggle className="inline-flex items-center gap-0.5 rounded-md border border-white/20 bg-white/10 px-1 py-1 text-[11px] font-bold text-white/90 backdrop-blur" />
            </div>
          </div>

          <div className="mx-auto max-w-[1300px] px-4 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur">
              <Sparkles className="h-3 w-3 text-white/80" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/80">
                {t("미국 · 단일 국가", "USA · Single Country", "中国 · 单一国家")}
              </span>
            </div>
            <h1 className="flex flex-wrap items-end gap-x-3 gap-y-1 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
              <span className="text-[36px] leading-none sm:text-[44px]">🇺🇸</span>
              {t(
                "미국 거래 한국 수입업체 디렉토리",
                "Korean Importers Sourcing from the United States",
                "中国相关韩国Importer Directory",
              )}
            </h1>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-white/80">
              {t(
                "미국에서 제품을 수입 중인 한국 기업을 한 곳에서 확인하실 수 있습니다. 수입 규모대와 이메일 보유 여부로 좁혀 검색할 수 있습니다.",
                "Browse Korean companies importing from the United States. Filter by annual import scale and email availability.",
                "Browse Korean companies importing from the United States. Filter by annual import scale and email availability.",
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Stat
                kr="등록 수입업체"
                en="Registered importers"
                zh="登记进口商"
                value={grandTotal.toLocaleString()}
              />
              <Stat
                kr="권역"
                en="Region"
                zh="区域"
                value={t("북미", "North America", "东北亚")}
              />
              <Stat
                kr="협정"
                en="Agreement"
                zh="协定"
                value={t("한-미 FTA", "KORUS FTA", "中韩 FTA")}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ===== INTRO ===== */}
      <section className="mx-auto max-w-[1300px] px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              title={t("한-미 교역 개요", "Korea–U.S. Trade Overview", "Korea–U.S. Trade Overview")}
            />
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/80">
              {t(
                "미국은 한국의 주요 교역상대국으로, 기계·화학·농산물·소비재 등 다양한 품목에서 한국 수입업체와 활발한 거래가 이루어집니다.",
                "The United States is one of Korea's key trading partners, with Korean importers active across machinery, chemicals, agricultural products and consumer goods.",
                "The United States is one of Korea's key trading partners, with Korean importers active across machinery, chemicals, agricultural products and consumer goods.",
              )}
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-foreground/80">
              <li>· {t("총 수입업체 수", "Total importers", "进口商总数")}: <b className="font-mono">{grandTotal.toLocaleString()}</b></li>
              <li>· {t("수입 규모 6~15단계", "Import scale tier 6–15", "Import scale tier 6–15")}</li>
              <li>· {t("출처: 관세청 수입실적 / KOIMA", "Source: Korea Customs / KOIMA", "数据来源:韩国关税厅/KOIMA")}</li>
            </ul>
          </Card>

          <Card>
            <CardHead
              icon={<FileText className="h-3.5 w-3.5" />}
              title={t("적용 협정 · 특혜관세", "Applicable Agreements · Tariffs", "Applicable Agreements · Tariffs")}
              sub={t("세율은 공식 포털 확인", "Check official portals", "Check official portals")}
            />
            <div className="mt-3 space-y-2.5">
              <AgreementRow
                title={t("한-미 FTA", "KORUS FTA", "KORUS FTA")}
                desc={t(
                  "2012년 발효 · 대부분 품목 관세 철폐",
                  "In force since 2012 · tariff elimination on most items",
                  "In force since 2012 · tariff elimination on most items",
                )}
                tag={t("발효 중", "In force", "已生效")}
              />
              <AgreementRow
                title="RCEP"
                desc={t(
                  "미국 포함 · 누적 원산지 활용 가능",
                  "Includes the U.S. · cumulative rules of origin",
                  "Includes the U.S. · cumulative rules of origin",
                )}
                tag={t("발효 중", "In force", "已生效")}
              />
              <AgreementRow
                title={t("원산지증명", "Certificate of Origin", "Certificate of Origin")}
                desc={t(
                  "FTA 특혜세율 적용 시 원산지증명 필수",
                  "Required to claim FTA preferential rates",
                  "Required to claim FTA preferential rates",
                )}
                tag={t("필수", "Required", "必需")}
                muted
              />
            </div>
          </Card>

          <Card>
            <CardHead
              icon={<Scale className="h-3.5 w-3.5" />}
              title={t("관세율 · 통관 조회", "Tariff & Customs Lookup", "Tariff & Customs Lookup")}
              sub={t("공식 포털 직접 조회", "Consult official portals", "Consult official portals")}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                {
                  label: t("FTA 포털 · 수입세율", "FTA Portal · Tariffs", "FTA门户·进口税率"),
                  href: "https://www.customs.go.kr/ftaportalkor/main.do",
                },
                {
                  label: t("관세청 UNI-PASS", "KCS UNI-PASS", "韩国关税厅 UNI-PASS"),
                  href: "https://unipass.customs.go.kr/",
                },
                {
                  label: t("미국 관세국경보호국 (CBP)", "U.S. CBP", "U.S. Customs and Border Protection"),
                  href: "https://www.cbp.gov/",
                },
                {
                  label: t("KOTRA · 미국 시장정보", "KOTRA · U.S. Market Info", "KOTRA · U.S. Market Info"),
                  href: "https://news.kotra.or.kr/",
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  {l.label}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead
              icon={<Building2 className="h-3.5 w-3.5" />}
              title={t("카운터파트 · 협력 기관", "Counterpart Institutions", "Counterpart Institutions")}
            />
            <div className="mt-3 grid gap-2.5">
              <PartnerRow
                tag={t("주한 대사관", "Embassy in Korea", "驻韩使馆")}
                name={t("주한 미국 대사관", "U.S. Embassy in Korea", "U.S. Embassy in Korea")}
                desc={t("서울 소재 · 비자·통상 채널", "Seoul · visa and trade liaison", "Seoul · visa and trade liaison")}
                href="https://kr.usembassy.gov/"
              />
              <PartnerRow
                tag={t("무역 진흥", "Trade Promotion", "贸易促进")}
                name={t("KOTRA 미국 무역관", "KOTRA U.S. Trade Offices", "KOTRA U.S. Trade Offices")}
                desc={t(
                  "워싱턴·뉴욕·로스앤젤레스·시카고 등",
                  "Washington · New York · Los Angeles · Chicago, etc.",
                  "Washington · New York · Los Angeles · Chicago, etc.",
                )}
                href="https://www.kotra.or.kr/"
              />
              <PartnerRow
                tag={t("상공회의소", "Chamber of Commerce", "商会")}
                name={t("암참 코리아 (AmCham Korea)", "American Chamber of Commerce in Korea", "American Chamber of Commerce in Korea")}
                desc={t(
                  "미국 기업 및 양국 교역 협력 네트워크",
                  "Network for U.S.–Korea trade and business cooperation",
                  "Network for U.S.–Korea trade and business cooperation",
                )}
                href="https://www.amchamkorea.org/"
              />
            </div>
          </Card>
        </div>
      </section>

      {/* ===== DIRECTORY ===== */}
      <div
        ref={dirRef}
        className="mx-auto max-w-[1300px] scroll-mt-4 px-4 pb-20 pt-8 sm:px-6 sm:pt-10"
      >
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[18px] font-bold tracking-tight text-foreground sm:text-[20px]">
            {t("수입업체 디렉토리", "Importer Directory", "Importer Directory")}
          </h2>
          <button
            onClick={scrollToList}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            ↑
          </button>
        </div>

        {/* Sticky search bar */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 sm:py-2 sm:bg-transparent sm:border-0 sm:static">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(
                  "업체명·사업자번호 검색",
                  "Search company name or biz no.",
                  "Search company name or biz no.",
                )}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 pl-9 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="relative inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-semibold text-foreground transition hover:border-primary md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("필터", "Filters", "Filters")}
              {activeFilters > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop filter panel */}
        <div className="mt-4 hidden gap-4 rounded-xl border border-border bg-card p-4 md:grid md:grid-cols-[1fr_2fr]">
          <div>
            <Label kr={t("옵션", "Options", "Options")} />
            <div className="flex flex-wrap items-center gap-3">
              <Toggle on={mailOnly} onClick={() => setMailOnly((v) => !v)}>
                {t("이메일 보유만", "With email only", "With email only")}
              </Toggle>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                {t("초기화", "Reset", "Reset")}
              </button>
            </div>
          </div>
          <div>
            <Label kr={t("수입 규모대", "Annual import scale", "Annual import scale")} />
            <ScaleChips scales={scales} setScales={setScales} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="text-[13px] text-muted-foreground">
            <b className="font-mono text-[18px] font-bold text-primary">
              {total.toLocaleString()}
            </b>{" "}
            {t("개사", "companies", "companies")} ·{" "}
            <span className="font-semibold text-foreground">
              {t("미국", "USA", "中国")}
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 cursor-pointer rounded-md border border-border bg-card px-2.5 text-[12px]"
            >
              <option value="scale_desc">{t("수입규모 ↓", "Import size ↓", "Import size ↓")}</option>
              <option value="scale_asc">{t("수입규모 ↑", "Import size ↑", "Import size ↑")}</option>
              <option value="name_asc">{t("업체명 A–Z", "Name A–Z", "Name A–Z")}</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {listQuery.isLoading && !listQuery.data ? (
          <GridSkeleton />
        ) : listQuery.error ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t(
              "데이터를 불러오지 못했습니다.",
              "Could not load data.",
              "Could not load data.",
            )}
          </div>
        ) : total === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card px-6 py-16 text-center text-muted-foreground">
            <div className="text-[15px] font-semibold text-foreground/70">
              {t("검색 결과가 없습니다", "No results", "无搜索结果")}
            </div>
          </div>
        ) : (
          <div
            className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 ${
              listQuery.isFetching ? "opacity-60 transition-opacity" : ""
            }`}
          >
            {rows.map((c) => (
              <CompanyCard key={c.id} company={c} onOpen={() => setOpened(c)} />
            ))}
          </div>
        )}

        {/* Pager */}
        {pages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            <PagerBtn onClick={() => setPage(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </PagerBtn>
            {pagerNums.map((n, idx) =>
              n === "…" ? (
                <span
                  key={`e-${idx}`}
                  className="px-2 font-mono text-[11px] text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <PagerBtn key={n} active={n === page} onClick={() => setPage(n)}>
                  {n}
                </PagerBtn>
              ),
            )}
            <PagerBtn onClick={() => setPage(page + 1)} disabled={page === pages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </PagerBtn>
          </div>
        )}

        <footer className="mt-10 border-t border-border pt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t(
            "출처 · 관세청 수입실적 / KOIMA · 문의:",
            "Source · Korea Customs / KOIMA · Contact:",
            "Source · Korea Customs / KOIMA · Contact:",
          )}{" "}
          <a href="mailto:seobh@koima.or.kr" className="text-accent hover:underline">
            seobh@koima.or.kr
          </a>
        </footer>
      </div>

      <DetailModal company={opened} onClose={() => setOpened(null)} />

      {/* Mobile filter sheet */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-primary/40 backdrop-blur-sm md:hidden"
          onClick={(e) => e.target === e.currentTarget && setFilterOpen(false)}
        >
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {t("필터", "Filters", "Filters")}
              </h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Label kr={t("옵션", "Options", "Options")} />
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Toggle on={mailOnly} onClick={() => setMailOnly((v) => !v)}>
                {t("이메일 보유만", "With email only", "With email only")}
              </Toggle>
            </div>
            <Label kr={t("수입 규모대", "Annual import scale", "Annual import scale")} />
            <ScaleChips scales={scales} setScales={setScales} />
            <div className="mt-6 flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground"
              >
                {t("초기화", "Reset", "Reset")}
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                {t("적용", "Apply", "应用")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* lang prop used for reflow on switch */}
      <span className="hidden" data-lang={lang} />
    </div>
  );
}

/* ---------- Small UI bits ---------- */

function Stat({ kr, en, zh, value }: { kr: string; en: string; zh: string; value: string }) {
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
        {t(kr, en, zh)}
      </div>
      <div className="mt-0.5 font-mono text-[15px] font-bold text-white">{value}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">{children}</div>
  );
}

function CardHead({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="text-[14px] font-bold text-foreground">{title}</div>
      </div>
      {sub && <div className="mt-1 text-[10.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function AgreementRow({
  title,
  desc,
  tag,
  muted,
}: {
  title: string;
  desc: string;
  tag: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-foreground">{title}</div>
        <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          muted ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"
        }`}
      >
        {tag}
      </span>
    </div>
  );
}

function PartnerRow({
  tag,
  name,
  desc,
  href,
}: {
  tag: string;
  name: string;
  desc: string;
  href: string;
}) {
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {tag}
      </div>
      <div className="mt-1 text-[13px] font-bold text-foreground">{name}</div>
      <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{desc}</div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
      >
        {t("바로가기", "Visit", "Visit")} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function Label({ kr }: { kr: string }) {
  return (
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {kr}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
        on
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground hover:border-primary/40"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${on ? "bg-primary" : "bg-muted-foreground/30"}`} />
      {children}
    </button>
  );
}

function ScaleChips({
  scales,
  setScales,
}: {
  scales: Set<number>;
  setScales: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const { lang } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(SCALE).map(([code, labels]) => {
        const c = Number(code);
        const on = scales.has(c);
        const [kr, en] = labels;
        const [bg] = SCOLOR[c];
        return (
          <button
            key={code}
            onClick={() =>
              setScales((prev) => {
                const next = new Set(prev);
                if (next.has(c)) next.delete(c);
                else next.add(c);
                return next;
              })
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
              on
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border bg-muted text-muted-foreground hover:border-primary/30"
            }`}
            title={en}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bg }} />
            {lang === "ko" ? kr : en}
          </button>
        );
      })}
    </div>
  );
}

function CompanyCard({
  company,
  onOpen,
}: {
  company: Company;
  onOpen: () => void;
}) {
  const { lang } = useLang();
  const scale = SCALE[company.scale_code];
  const [scaleKr, scaleEn] = scale ?? ["", ""];
  const [color] = SCOLOR[company.scale_code] ?? ["#999", "#eee"];

  const countries = [...(company.asean_countries ?? []), ...(company.other_countries ?? [])];
  const deduped = Array.from(new Set(countries.map(displayCountry)));

  return (
    <button
      onClick={onOpen}
      className="group relative rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold leading-snug text-foreground">
            {company.name_kr}
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">
            {company.name_en}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: color + "22", color }}
        >
          {lang === "ko" ? scaleKr : scaleEn}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {deduped.slice(0, 6).map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            <span className="text-xs leading-none">{flagOf(c)}</span>
            <span className="truncate">{c}</span>
          </span>
        ))}
        {deduped.length > 6 && (
          <span className="inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            +{deduped.length - 6}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {company.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {company.phone}
          </span>
        )}
        {company.email && (
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {company.email}
          </span>
        )}
      </div>
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-[140px] animate-pulse rounded-xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}

function PagerBtn({
  children,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 text-[12px] font-semibold transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}
