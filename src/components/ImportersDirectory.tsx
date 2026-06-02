import koimaLogo from "@/assets/koima-logo.png";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Building2,
  TrendingUp,
  Globe2,
} from "lucide-react";
import {
  listImporters,
  getImporterFacets,
  type Importer,
} from "@/lib/importers.functions";
import { flagOf, displayCountry, displayCompanyName, scaleLabel } from "@/lib/koima-types";
import { AseanFlag } from "@/components/AseanFlag";
import { RegionSnapshot } from "@/components/RegionSnapshot";
import { LangToggle, useLang } from "@/lib/i18n";


const PAGE_SIZE = 50;

type SortKey = "rank_import_asc" | "rank_sales_asc" | "name_asc";

const SCALE_ORDER = [
  "1억불 초과",
  "5000만불~1억불",
  "3000만불~5000만불",
  "1000만불~3000만불",
  "700만불~1000만불",
  "500만불~700만불",
  "300만불~500만불",
  "100만불~300만불",
  "50만불~100만불",
  "30만불~50만불",
  "10만불~30만불",
  "5만불~10만불",
  "3만불~5만불",
  "1만불~3만불",
  "1만불 미만",
];

function scaleColor(label: string): string {
  const i = SCALE_ORDER.indexOf(label);
  if (i < 0) return "bg-muted text-muted-foreground";
  if (i <= 1) return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  if (i <= 4) return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
  if (i <= 7) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  if (i <= 10) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export type ImportersDirectoryProps = {
  /** Lock query to these countries (1+ for region pages). Empty = no lock. */
  lockedCountries?: string[];
  /** Display label for the locked region (e.g. "🇪🇺 EU", "🇨🇳 중국"). */
  lockedLabel?: string;
  /** Header title (h1). */
  title: string;
  /** Small subtitle shown above title. */
  scopeBadge?: string;
  /** When set, renders RegionSnapshot above results (asean/eu/cis). */
  regionKey?: import("@/components/RegionSnapshot").RegionKey;
  /** Initial search query (e.g. from /search?q=…). */
  initialQuery?: string;
};


export function ImportersDirectory({
  lockedCountries: lockedCountriesProp,
  lockedLabel,
  title,
  scopeBadge,
  regionKey,
  initialQuery = "",
}: ImportersDirectoryProps) {

  const lockedCountries = useMemo(
    () => lockedCountriesProp ?? [],
    [lockedCountriesProp],
  );
  const lockedSet = useMemo(() => new Set(lockedCountries), [lockedCountries]);
  const isLocked = lockedCountries.length > 0;
  const { t, lang } = useLang();
  const listFn = useServerFn(listImporters);
  const facetsFn = useServerFn(getImporterFacets);
  const [q, setQ] = useState(initialQuery);
  const [qDeb, setQDeb] = useState(initialQuery);
  const [countries, setCountries] = useState<string[]>([]);
  const [scales, setScales] = useState<Set<string>>(new Set());
  const [hs, setHs] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [sort, setSort] = useState<SortKey>("rank_import_asc");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Importer | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sync when initialQuery changes (e.g. submitting a new search from /).
  useEffect(() => {
    setQ(initialQuery);
    setQDeb(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const scaleArr = useMemo(() => Array.from(scales), [scales]);

  const facets = useQuery({
    queryKey: ["importer-facets"],
    queryFn: () => facetsFn(),
    staleTime: 5 * 60_000,
  });

  // Effective countries: when locked, fall back to the full locked set when
  // the user hasn't picked any additional countries.
  const effectiveCountries = useMemo(() => {
    if (countries.length > 0) return countries;
    return lockedCountries;
  }, [countries, lockedCountries]);

  const list = useQuery({
    queryKey: [
      "importers",
      { qDeb, effectiveCountries, scaleArr, hs, hasEmail, sort, page },
    ],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          countries: effectiveCountries,
          scales: scaleArr,
          hs: hs.trim(),
          hasEmail,
          sort,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: (prev) => prev,
  });

  const topCountries = useMemo(() => {
    const m = facets.data?.countries ?? {};
    let entries = Object.entries(m);
    if (isLocked) entries = entries.filter(([k]) => lockedSet.has(k));
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, isLocked ? 50 : 16)
      .map(([k]) => k);
  }, [facets.data, isLocked, lockedSet]);

  const allCountries = useMemo(() => {
    const m = facets.data?.countries ?? {};
    let keys = Object.keys(m);
    if (isLocked) keys = keys.filter((k) => lockedSet.has(k));
    return keys.sort((a, b) =>
      displayCountry(a, lang).localeCompare(displayCountry(b, lang), lang),
    );
  }, [facets.data, isLocked, lockedSet, lang]);

  const total = list.data?.total ?? 0;
  const rows = list.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sum of importers across all locked countries (approx — may double-count
  // importers that trade with multiple locked countries).
  const lockedCount = useMemo(() => {
    if (!isLocked) return null;
    const m = facets.data?.countries ?? {};
    let sum = 0;
    for (const c of lockedCountries) sum += m[c] ?? 0;
    return sum || null;
  }, [isLocked, lockedCountries, facets.data]);

  const clearAll = () => {
    setQ("");
    setCountries([]);
    setScales(new Set());
    setHs("");
    setHasEmail(false);
    setPage(1);
  };

  const additionalCountries = countries;

  const activeFilterCount =
    additionalCountries.length + scales.size + (hs ? 1 : 0) + (hasEmail ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold sm:text-xl">
                  {scopeBadge && (
                    <span className="mr-1.5">{scopeBadge}</span>
                  )}
                  {t(title, "Korean Importers Directory")}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {t("2025 관세청 기준 ·", "2025 Korea Customs ·")}{" "}
                  {(lockedCount ?? facets.data?.total ?? 0).toLocaleString()}
                  {t("개 업체", " companies")}
                </p>
              </div>
            <div className="flex items-center gap-2">
              <LangToggle />
              <button
                onClick={() => setFilterOpen(true)}
                className="relative inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent lg:hidden"
              >
                <SlidersHorizontal className="size-4" />
                {t("필터", "Filters")}
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQDeb(q.trim());
                setPage(1);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("업체명 · 사업자번호 · 품목으로 검색", "Search by name · biz no · items")}
                  className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Search className="size-4" />
                {t("검색", "Search")}
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              <input
                value={hs}
                onChange={(e) => {
                  setHs(e.target.value.replace(/[^\d]/g, ""));
                  setPage(1);
                }}
                placeholder={t("HS코드", "HS code")}
                inputMode="numeric"
                className="w-28 rounded-md border bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="rank_import_asc">{t("수입액 순", "By imports")}</option>
                <option value="rank_sales_asc">{t("매출액 순", "By revenue")}</option>
                <option value="name_asc">{t("업체명 가나다순", "Name A–Z")}</option>
              </select>
              <div className="inline-flex flex-1 items-center justify-around gap-1 rounded-lg border bg-card p-1 shadow-sm sm:flex-none sm:justify-start">
                <Link
                  to="/"
                  title={t("전체 디렉토리", "All importers")}
                  aria-label={t("전체 디렉토리", "All importers")}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
                >
                  <span className="text-base leading-none">🌐</span>
                  <span className="hidden sm:inline">{t("전체", "All")}</span>
                </Link>
                <Link
                  to="/eu"
                  title="EU 거래 디렉토리"
                  aria-label="EU 거래 디렉토리"
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
                >
                  <span className="text-base leading-none">🇪🇺</span>
                  <span className="hidden sm:inline">EU</span>
                </Link>
                <Link
                  to="/cis"
                  title="CIS 거래 디렉토리"
                  aria-label="CIS 거래 디렉토리"
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
                >
                  <span className="text-base leading-none">🌍</span>
                  <span className="hidden sm:inline">CIS</span>
                </Link>
                <Link
                  to="/importers"
                  title="아세안 거래 디렉토리"
                  aria-label="아세안 거래 디렉토리"
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
                >
                  <AseanFlag className="h-4 w-auto" />
                  <span className="hidden sm:inline">ASEAN</span>
                </Link>
              </div>


            </div>
          </div>
        </div>
      </header>

      {/* Region snapshot (asean/eu/cis only) */}
      {regionKey && isLocked && (facets.data?.countries ?? null) && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <RegionSnapshot
            regionKey={regionKey}
            lockedCountries={lockedCountries}
            countryCounts={facets.data!.countries}
            lockedLabel={lockedLabel}
          />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">

        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel
            lockedLabel={lockedLabel}
            isLocked={isLocked}
            topCountries={topCountries}
            allCountries={allCountries}
            scalesAvailable={SCALE_ORDER}
            scaleCounts={facets.data?.scales ?? {}}
            countryCounts={facets.data?.countries ?? {}}

            additionalCountries={additionalCountries}
            setAdditionalCountries={(next) => setCountries(next)}
            scales={scales}
            setScales={setScales}
            hasEmail={hasEmail}
            setHasEmail={setHasEmail}
            clearAll={clearAll}
            onFilterChange={() => setPage(1)}
          />
        </aside>

        {/* Results */}
        <main className="min-w-0 flex-1">
          {list.isFetching && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full animate-[loading-slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" style={{ width: '40%' }} />
            </div>
          )}
          <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {list.isFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {t("검색 중…", "Searching…")}
                </span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {total.toLocaleString()}
                  </span>{" "}
                  {t("개 결과", "results")}
                  {isLocked && (
                    <span className="ml-1 text-xs">
                      · {lockedLabel ?? t("선택 지역", "Selected region")} {t("거래", "trade")}
                    </span>
                  )}
                </>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs hover:text-foreground"
              >
                <X className="size-3.5" /> {t("필터 초기화", "Clear filters")}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {list.isLoading && !list.data
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg border bg-muted/30"
                  />
                ))
              : rows.map((r) => (
                  <ImporterCard key={r.id} row={r} onOpen={() => setOpened(r)} />
                ))}
            {!list.isLoading && rows.length === 0 && (
              <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
                {t("조건에 맞는 업체가 없습니다.", "No companies match your filters.")}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-2 shadow-sm enabled:hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> {t("이전", "Prev")}
              </button>
              <span className="px-2 tabular-nums">
                {page} / {pages.toLocaleString()}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-2 shadow-sm enabled:hover:bg-accent disabled:opacity-40"
              >
                {t("다음", "Next")} <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">{t("필터", "Filters")}</div>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded p-1 hover:bg-accent"
                aria-label={t("닫기", "Close")}
              >
                <X className="size-5" />
              </button>
            </div>
            <FilterPanel
              lockedLabel={lockedLabel}
              isLocked={isLocked}
              topCountries={topCountries}
              allCountries={allCountries}
              scalesAvailable={SCALE_ORDER}
              scaleCounts={facets.data?.scales ?? {}}
              countryCounts={facets.data?.countries ?? {}}

              additionalCountries={additionalCountries}
              setAdditionalCountries={(next) => setCountries(next)}
              scales={scales}
              setScales={setScales}
              hasEmail={hasEmail}
              setHasEmail={setHasEmail}
              clearAll={clearAll}
              onFilterChange={() => setPage(1)}
            />
            <button
              onClick={() => setFilterOpen(false)}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow"
            >
              {t(`${total.toLocaleString()}개 결과 보기`, `View ${total.toLocaleString()} results`)}
            </button>
          </div>
        </div>
      )}

      {opened && <DetailSheet row={opened} onClose={() => setOpened(null)} />}

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={koimaLogo}
              alt="KOIMA"
              className="h-9 w-auto shrink-0 sm:h-10"
            />
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <p>
              {t(
                "출처 · 2025 관세청 수입실적 · 데이터 갱신 2026.05",
                "Source · 2025 Korea Customs Service import records · Updated 2026.05",
              )}
            </p>
            <p>
              {t(
                "KOIMA 품목별 수입업체 검색 · 바이어 매칭 서비스 | 문의: seobh@koima.or.kr",
                "KOIMA Korean importers directory · Buyer matching | Contact: seobh@koima.or.kr",
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterPanel(props: {
  lockedLabel?: string;
  isLocked: boolean;
  topCountries: string[];
  allCountries: string[];
  scalesAvailable: string[];
  scaleCounts: Record<string, number>;
  countryCounts: Record<string, number>;

  additionalCountries: string[];
  setAdditionalCountries: (c: string[]) => void;
  scales: Set<string>;
  setScales: (s: Set<string>) => void;
  hasEmail: boolean;
  setHasEmail: (b: boolean) => void;
  clearAll: () => void;
  onFilterChange: () => void;
}) {
  const { t, lang } = useLang();
  const [countryQ, setCountryQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const toggleCountry = (c: string) => {
    const next = new Set(props.additionalCountries);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    props.setAdditionalCountries(Array.from(next));
    props.onFilterChange();
  };

  const toggleScale = (s: string) => {
    const next = new Set(props.scales);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    props.setScales(next);
    props.onFilterChange();
  };

  const filteredAll = useMemo(() => {
    if (!countryQ.trim()) return [];
    const q = countryQ.trim();
    return props.allCountries
      .filter((c) => c.includes(q) && !props.additionalCountries.includes(c))
      .slice(0, 20);
  }, [countryQ, props.allCountries, props.additionalCountries]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Globe2 className="size-3.5" />
          {props.isLocked
            ? t("지역 내 국가 필터", "Filter within region")
            : t("주요 수입국가", "Top import countries")}
        </div>

        {props.isLocked && props.lockedLabel && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {props.lockedLabel}
            <span className="ml-1 text-[10px] font-normal text-primary/70">{t("고정", "Locked")}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={props.additionalCountries.length === 0}
            onClick={() => {
              props.setAdditionalCountries([]);
              props.onFilterChange();
            }}
          >
            {t("전체", "All")}
          </FilterChip>
          {props.topCountries.map((c) => (
            <span key={c} className="inline-flex items-center gap-0.5">
              <FilterChip
                active={props.additionalCountries.includes(c)}
                onClick={() => toggleCountry(c)}
              >
                <span className="mr-1">{flagOf(c)}</span>
                {displayCountry(c, lang)}
                {props.countryCounts[c] != null && (
                  <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/70">
                    {props.countryCounts[c].toLocaleString()}
                  </span>
                )}
              </FilterChip>

              {props.isLocked && (
                <Link
                  to="/c/$country"
                  params={{ country: encodeURIComponent(c) }}
                  title={t(`${displayCountry(c, lang)} 전용 페이지 열기`, `Open ${displayCountry(c, lang)} page`)}
                  aria-label={t(`${displayCountry(c, lang)} 전용 페이지`, `${displayCountry(c, lang)} page`)}
                  className="ml-0.5 inline-flex items-center rounded-md border border-border bg-card px-1.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {t("상세 ↗", "Detail ↗")}
                </Link>
              )}
            </span>
          ))}

        </div>

        {/* Selected summary */}
        {props.additionalCountries.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {props.additionalCountries.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                <span>{flagOf(c)}</span>
                {displayCountry(c, lang)}
                <button
                  onClick={() => toggleCountry(c)}
                  className="ml-0.5 rounded hover:text-destructive"
                  aria-label={t(`${displayCountry(c, lang)} 제거`, `Remove ${displayCountry(c, lang)}`)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                props.setAdditionalCountries([]);
                props.onFilterChange();
              }}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              {t("초기화", "Reset")}
            </button>
          </div>
        )}

        {/* Search more countries */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={countryQ}
            onChange={(e) => setCountryQ(e.target.value)}
            placeholder={t("국가 검색…", "Search countries…")}
            className="w-full rounded-md border bg-card py-1.5 pl-7 pr-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {filteredAll.length > 0 && (
          <div className="mt-1 max-h-36 overflow-y-auto rounded-md border bg-card shadow-sm">
            {filteredAll.map((c) => (
              <button
                key={c}
                onClick={() => {
                  toggleCountry(c);
                  setCountryQ("");
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-accent"
              >
                <span className="text-sm">{flagOf(c)}</span>
                <span className="flex-1">{displayCountry(c, lang)}</span>
                <span className="text-[10px] text-muted-foreground">{t("선택", "Select")}</span>
              </button>
            ))}
          </div>
        )}

        {/* Show all toggle */}
        {!countryQ && props.allCountries.length > props.topCountries.length && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="mt-1.5 text-xs text-muted-foreground underline hover:text-foreground"
          >
            {showAll
              ? t("접기", "Collapse")
              : t(
                  `전체 국가 보기 (${props.allCountries.length}개)`,
                  `View all countries (${props.allCountries.length})`,
                )}
          </button>
        )}
        {showAll && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-card p-1.5 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {props.allCountries.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCountry(c)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                    props.additionalCountries.includes(c)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="mr-0.5">{flagOf(c)}</span>
                  {displayCountry(c, lang)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="size-3.5" /> {t("수입액 구간", "Import scale")}
        </div>
        <div className="space-y-1">
          {props.scalesAvailable.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={props.scales.has(s)}
                  onChange={() => toggleScale(s)}
                  className="accent-primary"
                />
                <span>{scaleLabel(s, lang)}</span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {(props.scaleCounts[s] ?? 0).toLocaleString()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={props.hasEmail}
            onChange={(e) => {
              props.setHasEmail(e.target.checked);
              props.onFilterChange();
            }}
            className="accent-primary"
          />
          {t("이메일 보유 업체만", "With email only")}
        </label>
      </div>

      <button
        onClick={props.clearAll}
        className="w-full rounded-md border bg-card px-3 py-2 text-xs hover:bg-accent"
      >
        {t("필터 초기화", "Clear filters")}
      </button>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function maskBizNo(v: string) {
  const s = v.replace(/\D/g, "");
  if (s.length === 10) return `${s.slice(0, 3)}-${"*".repeat(2)}-${"*".repeat(5)}`;
  return v.slice(0, 3) + v.slice(3).replace(/./g, "*");
}
function maskEmail(v: string) {
  const [local, domain] = v.split("@");
  if (!domain) return v;
  const maskedLocal =
    local.length <= 2 ? local : local.slice(0, 2) + "*".repeat(Math.max(1, local.length - 2));
  const dParts = domain.split(".");
  const maskedDomain = dParts
    .map((p, i) =>
      i === dParts.length - 1 ? p : p.slice(0, 2) + "*".repeat(Math.max(1, p.length - 2)),
    )
    .join(".");
  return `${maskedLocal}@${maskedDomain}`;
}
function maskPhone(v: string) {
  return v.replace(
    /(\d{2,3})-(\d{3,4})-(\d{4})/,
    (_, a) => `${a}-${"*".repeat(4)}-${"*".repeat(4)}`,
  );
}
function maskHS(h: string) {
  if (h.length <= 4) return h;
  return h.slice(0, 2) + "*".repeat(h.length - 4) + h.slice(-2);
}

function ImporterCard({ row, onOpen }: { row: Importer; onOpen: () => void }) {
  const { t, lang } = useLang();
  const countries = row.countries.slice(0, 6);
  const extra = Math.max(0, row.countries.length - countries.length);
  const items = lang === "ko" ? row.items_kr : (row.items_en || row.items_kr);
  return (
    <button
      onClick={onOpen}
      className="group block w-full rounded-lg border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-[15px] font-semibold sm:text-base">
              {lang === "ko"
                ? (displayCompanyName(row.name_kr) || row.name_en)
                : (row.name_en || displayCompanyName(row.name_kr))}
            </span>
            {row.rank_import != null && row.rank_import <= 100 && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                TOP {row.rank_import}
              </span>
            )}
          </div>
          {lang === "ko"
            ? row.name_en && (
                <div className="truncate text-xs text-muted-foreground">{row.name_en}</div>
              )
            : displayCompanyName(row.name_kr) && (
                <div className="truncate text-xs text-muted-foreground">
                  {displayCompanyName(row.name_kr)}
                </div>
              )}
        </div>
        {row.scale_label && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${scaleColor(row.scale_label)}`}
          >
            {scaleLabel(row.scale_label, lang)}
          </span>
        )}
      </div>

      {countries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {countries.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"
            >
              <span>{flagOf(c)}</span> {displayCountry(c, lang)}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              +{extra}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {row.biz_no && (
          <span className="font-mono tabular-nums">
            {t("사업자", "Biz no")} {maskBizNo(row.biz_no)}
          </span>
        )}
        {row.email && (
          <span className="inline-flex items-center gap-1">
            <Mail className="size-3" /> {maskEmail(row.email.split(",")[0].trim())}
          </span>
        )}
        {row.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3" /> {maskPhone(row.phone)}
          </span>
        )}
      </div>

      {items && (
        <div className="mt-2 line-clamp-2 text-xs text-muted-foreground/90">
          {items}
        </div>
      )}
    </button>
  );
}

function DetailSheet({ row, onClose }: { row: Importer; onClose: () => void }) {
  const { t, lang } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emails = [row.email, row.email_extra].filter(Boolean).join(", ");
  const phones = [row.phone, row.phone_extra].filter(Boolean).join(" / ");
  const primaryName = lang === "ko"
    ? (displayCompanyName(row.name_kr) || row.name_en)
    : (row.name_en || displayCompanyName(row.name_kr));
  const secondaryName = lang === "ko" ? row.name_en : displayCompanyName(row.name_kr);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:inset-y-8 sm:left-auto sm:right-8 sm:w-[520px] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* mobile drag handle */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-semibold leading-tight sm:text-xl">
              {primaryName}
            </h2>
            {secondaryName && (
              <p className="mt-0.5 break-words text-xs text-muted-foreground sm:text-sm">{secondaryName}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {row.scale_label && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium sm:text-xs ${scaleColor(row.scale_label)}`}
                >
                  {scaleLabel(row.scale_label, lang)}
                </span>
              )}
              {row.rank_import != null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] sm:text-xs">
                  {t("수입액", "Imports")} #{row.rank_import.toLocaleString()}
                </span>
              )}
              {row.rank_sales != null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] sm:text-xs">
                  {t("매출액", "Revenue")} #{row.rank_sales.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded p-1.5 hover:bg-accent"
            aria-label={t("닫기", "Close")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">

        <div className="mb-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          {t(
            "개인정보 보호를 위해 사업자번호 · 연락처 · 이메일 · HS코드 · 품목은 일부가 마스킹되어 표시됩니다.",
            "For privacy, business numbers, contacts, emails, HS codes, and items are partially masked.",
          )}
        </div>
        <dl className="space-y-3 text-sm">
          {row.biz_no && (
            <Row label={t("사업자번호", "Business no.")}>
              <span className="font-mono tabular-nums">{maskBizNo(row.biz_no)}</span>
            </Row>
          )}
          {emails && (
            <Row label={t("이메일", "Email")}>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {emails.split(",").map((e, i) => {
                  const v = e.trim();
                  if (!v) return null;
                  return (
                    <span key={`${v}-${i}`} className="rounded bg-muted px-1.5 py-0.5">
                      {maskEmail(v)}
                    </span>
                  );
                })}
              </div>
            </Row>
          )}
          {phones && (
            <Row label={t("전화", "Phone")}>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {phones.split("/").map((p, i) => {
                  const v = p.trim();
                  if (!v) return null;
                  return (
                    <span key={`${v}-${i}`} className="rounded bg-muted px-1.5 py-0.5">
                      {maskPhone(v)}
                    </span>
                  );
                })}
              </div>
            </Row>
          )}

          {row.countries.length > 0 && (
            <Row label={t(`수입국가 (${row.countries.length})`, `Import countries (${row.countries.length})`)}>
              <div className="flex flex-wrap gap-1">
                {row.countries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    <span>{flagOf(c)}</span> {displayCountry(c, lang)}
                  </span>
                ))}
              </div>
            </Row>
          )}
          {row.hs_codes.length > 0 && (
            <Row label={t("HS코드", "HS codes")}>
              <div className="flex flex-wrap gap-1 font-mono text-xs">
                {row.hs_codes.map((h) => (
                  <span
                    key={h}
                    className="rounded bg-muted px-1.5 py-0.5 tabular-nums"
                  >
                    {maskHS(h)}
                  </span>
                ))}
              </div>
            </Row>
          )}
          {lang === "ko"
            ? row.items_kr && (
                <Row label="취급 품목">
                  <p className="whitespace-pre-wrap leading-relaxed">{row.items_kr}</p>
                </Row>
              )
            : (row.items_en || row.items_kr) && (
                <Row label="Items">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {row.items_en || row.items_kr}
                  </p>
                </Row>
              )}
          {lang !== "ko" && row.items_en && row.items_kr && (
            <Row label="품목 (KR)">
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {row.items_kr}
              </p>
            </Row>
          )}
          {lang === "ko" && row.items_en && (
            <Row label="Items (EN)">
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {row.items_en}
              </p>
            </Row>
          )}
        </dl>
        </div>
      </div>
    </div>

  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
