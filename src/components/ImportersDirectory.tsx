import koimaLogo from "@/assets/koima-logo.png";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Hash,
  Package,
  IdCard,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  listImporters,
  getImporterFacets,
  type Importer,
} from "@/lib/importers.functions";
import { flagOf, displayCountry, displayCompanyName, scaleLabel } from "@/lib/koima-types";
import { Button } from "@/components/ui/button";

import { LangToggle, LangToggleVietnam, useLang } from "@/lib/i18n";
import { hsCategoriesFromCodes } from "@/lib/hs-categories";


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
  if (i <= 1) return "bg-primary/10 text-primary";
  if (i <= 4) return "bg-accent-soft text-foreground";
  if (i <= 7) return "bg-gold/15 text-foreground";
  return "bg-muted text-muted-foreground";
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
  initialQuery = "",
}: ImportersDirectoryProps) {

  const lockedCountries = useMemo(
    () => lockedCountriesProp ?? [],
    [lockedCountriesProp],
  );
  const lockedSet = useMemo(() => new Set(lockedCountries), [lockedCountries]);
  const isLocked = lockedCountries.length > 0;
  const { t, lang } = useLang();
  const router = useRouter();
  const isVietnamPage = router.state.location.pathname === "/vietnam";
  const listFn = useServerFn(listImporters);
  const facetsFn = useServerFn(getImporterFacets);
  const [q, setQ] = useState(initialQuery);
  const [qDeb, setQDeb] = useState(initialQuery);
  const [countries, setCountries] = useState<string[]>([]);
  const [scales, setScales] = useState<Set<string>>(new Set());
  const [hs, setHs] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [exact, setExact] = useState(false);
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
      { qDeb, effectiveCountries, scaleArr, hs, hasEmail, exact, sort, page },
    ],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          countries: effectiveCountries,
          scales: scaleArr,
          hs: hs.trim(),
          hasEmail,
          exact,
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
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <img src={koimaLogo} alt="KOIMA" className="h-9 w-auto sm:h-11" />
            {isVietnamPage ? <LangToggleVietnam /> : <LangToggle />}
          </div>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
            {t(isLocked ? title.replace("디렉토리", "기업정보") : "바이어 기업정보", "Buyer Companies", "Thông tin doanh nghiệp nhập khẩu")}
          </h1>
          <form className="mt-5 flex w-full max-w-3xl items-center gap-2 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring"
            onSubmit={(e) => { e.preventDefault(); setQDeb(q.trim()); setPage(1); }}>
            <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
            <input aria-label={t("바이어 기업 검색", "Search buyer companies", "Tìm doanh nghiệp")}
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t("기업명 · 품목 · 사업자번호", "Company · product · business number", "Tên doanh nghiệp · mặt hàng · mã số thuế")}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none sm:text-base" />
            {q && <Button type="button" variant="ghost" size="icon" onClick={() => setQ("")} aria-label={t("지우기", "Clear", "Xóa")}><X /></Button>}
            <Button type="submit" className="h-11 shrink-0 px-4 sm:px-6"><Search />{t("검색", "Search", "Tìm kiếm")}</Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">

        {/* Sidebar (desktop) */}
        <aside className="hidden">
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground" aria-live="polite">
              {list.isFetching ? t("검색 중…", "Searching…", "Đang tìm kiếm…") : <><span className="font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span> {t("개 기업", "companies", "doanh nghiệp")}</>}
            </div>
            <div className="flex items-center gap-2">
              <select aria-label={t("정렬", "Sort", "Sắp xếp")} value={sort} onChange={(e) => {setSort(e.target.value as SortKey); setPage(1);}}
                className="h-9 max-w-40 rounded-md border bg-card px-2 text-xs sm:text-sm">
                <option value="rank_import_asc">{t("수입액 순", "By imports", "Theo nhập khẩu")}</option>
                <option value="rank_sales_asc">{t("매출액 순", "By revenue", "Theo doanh thu")}</option>
                <option value="name_asc">{t("기업명 순", "Name A–Z", "Theo tên")}</option>
              </select>
              <Button variant="outline" onClick={() => setFilterOpen(true)}><SlidersHorizontal />{t("필터", "Filters", "Bộ lọc")}{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</Button>
            </div>
          </div>
          {list.error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 border-b border-destructive/30 py-4 text-sm text-destructive">
            {t("기업정보를 불러오지 못했습니다.", "Could not load companies.", "Không thể tải doanh nghiệp.")}
            <Button variant="outline" onClick={() => list.refetch()}>{t("다시 시도", "Retry", "Thử lại")}</Button>
          </div>}
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                {t("조건에 맞는 업체가 없습니다.", "No companies match your filters.", "Không có doanh nghiệp phù hợp.")}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <Button variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-2 shadow-sm enabled:hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> {t("이전", "Prev", "Trước")}
              </Button>
              <span className="px-2 tabular-nums">
                {page} / {pages.toLocaleString()}
              </span>
              <Button variant="ghost"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-2 shadow-sm enabled:hover:bg-accent disabled:opacity-40"
              >
                {t("다음", "Next", "Tiếp")} <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">{t("필터", "Filters", "Bộ lọc")}</div>
              <Button variant="ghost"
                onClick={() => setFilterOpen(false)}
                className="rounded p-1 hover:bg-accent"
                aria-label={t("닫기", "Close", "Đóng")}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="mb-6 space-y-3">
              <input aria-label="HS코드" value={hs} onChange={(e) => {setHs(e.target.value.replace(/[^\d]/g, "")); setPage(1);}} placeholder="HS코드" inputMode="numeric" className="h-10 w-full rounded-md border bg-card px-3 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={exact} onChange={(e) => {setExact(e.target.checked); setPage(1);}} />{t("품목 정확 일치", "Exact item match", "Khớp chính xác mặt hàng")}</label>
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
            <Button variant="ghost"
              onClick={() => setFilterOpen(false)}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow"
            >
              {t(`${total.toLocaleString()}개 결과 보기`, `View ${total.toLocaleString()} results`)}
            </Button>
          </div>
        </div>
      )}

      {opened && <DetailSheet row={opened} onClose={() => setOpened(null)} />}


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
            ? t("지역 내 국가 필터", "Filter within region", "Lọc trong khu vực")
            : t("주요 수입국가", "Top import countries", "Quốc gia nhập khẩu chính")}
        </div>

        {props.isLocked && props.lockedLabel && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {props.lockedLabel}
            <span className="ml-1 text-[10px] font-normal text-primary/70">{t("고정", "Locked", "Đã khóa")}</span>
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
            {t("전체", "All", "Tất cả")}
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
                  {t("상세 ↗", "Detail ↗", "Chi tiết ↗")}
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
                <Button variant="ghost"
                  onClick={() => toggleCountry(c)}
                  className="ml-0.5 rounded hover:text-destructive"
                  aria-label={t(`${displayCountry(c, lang)} 제거`, `Remove ${displayCountry(c, lang)}`)}
                >
                  <X className="size-3" />
                </Button>
              </span>
            ))}
            <Button variant="ghost"
              onClick={() => {
                props.setAdditionalCountries([]);
                props.onFilterChange();
              }}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              {t("초기화", "Reset", "Đặt lại")}
            </Button>
          </div>
        )}

        {/* Search more countries */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={countryQ}
            onChange={(e) => setCountryQ(e.target.value)}
            placeholder={t("국가 검색…", "Search countries…", "Tìm quốc gia…")}
            className="w-full rounded-md border bg-card py-1.5 pl-7 pr-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {filteredAll.length > 0 && (
          <div className="mt-1 max-h-36 overflow-y-auto rounded-md border bg-card shadow-sm">
            {filteredAll.map((c) => (
              <Button variant="ghost"
                key={c}
                onClick={() => {
                  toggleCountry(c);
                  setCountryQ("");
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-accent"
              >
                <span className="text-sm">{flagOf(c)}</span>
                <span className="flex-1">{displayCountry(c, lang)}</span>
                <span className="text-[10px] text-muted-foreground">{t("선택", "Select", "Chọn")}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Show all toggle */}
        {!countryQ && props.allCountries.length > props.topCountries.length && (
          <Button variant="ghost"
            onClick={() => setShowAll((v) => !v)}
            className="mt-1.5 text-xs text-muted-foreground underline hover:text-foreground"
          >
            {showAll
              ? t("접기", "Collapse", "Thu gọn")
              : t(
                  `전체 국가 보기 (${props.allCountries.length}개)`,
                  `View all countries (${props.allCountries.length})`,
                )}
          </Button>
        )}
        {showAll && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-card p-1.5 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {props.allCountries.map((c) => (
                <Button variant="ghost"
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
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="size-3.5" /> {t("수입액 구간", "Import scale", "Khoảng kim ngạch nhập khẩu")}
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
          {t("이메일 보유 업체만", "With email only", "Chỉ doanh nghiệp có email")}
        </label>
      </div>

      <Button variant="ghost"
        onClick={props.clearAll}
        className="w-full rounded-md border bg-card px-3 py-2 text-xs hover:bg-accent"
      >
        {t("필터 초기화", "Clear filters", "Xóa bộ lọc")}
      </Button>
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
    <Button variant="ghost"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </Button>
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
    <Button variant="ghost"
      onClick={onOpen}
      className="group flex h-full w-full flex-col items-stretch justify-start whitespace-normal rounded-lg border bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:bg-card hover:shadow-md sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words text-base font-semibold leading-snug sm:text-lg">
              {lang === "ko"
                ? (displayCompanyName(row.name_kr) || row.name_en)
                : (row.name_en || displayCompanyName(row.name_kr))}
            </span>
            {row.rank_import != null && row.rank_import <= 100 && (
              <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
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
            {t("사업자", "Biz no", "Mã số thuế")} {maskBizNo(row.biz_no)}
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
        <div className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {items}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs font-medium text-primary">
        <span className="pt-3">{t("기업 상세정보", "Company details", "Chi tiết doanh nghiệp")}</span><ChevronRight className="mt-3 size-4" />
      </div>
    </Button>
  );
}

function DetailSheet({ row, onClose }: { row: Importer; onClose: () => void }) {
  const { t, lang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [swipeClosing, setSwipeClosing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Mobile swipe-to-close
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onTouchStart = (e: TouchEvent) => {
      // Only start swipe from top area (drag handle or header)
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      const relativeY = touch.clientY - rect.top;
      if (relativeY > 120) return; // allow only near top
      startY = touch.clientY;
      isDragging = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const delta = currentY - startY;
      if (delta > 0) {
        el.style.transform = `translateY(${delta}px)`;
        el.style.transition = "none";
      }
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const delta = currentY - startY;
      el.style.transition = "transform 0.25s ease-out";
      if (delta > 80) {
        setSwipeClosing(true);
        el.style.transform = `translateY(100%)`;
        setTimeout(onClose, 250);
      } else {
        el.style.transform = "";
      }
      startY = 0;
      currentY = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  const emailList = [row.email, row.email_extra].filter(Boolean).join(",").split(",").map((s) => s.trim()).filter(Boolean);
  const phoneList = [row.phone, row.phone_extra].filter(Boolean).join("/").split("/").map((s) => s.trim()).filter(Boolean);

  const primaryName = lang === "ko"
    ? (displayCompanyName(row.name_kr) || row.name_en)
    : (row.name_en || displayCompanyName(row.name_kr));
  const secondaryName = lang === "ko" ? row.name_en : displayCompanyName(row.name_kr);

  const initial = (primaryName || "?").trim().charAt(0).toUpperCase();

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${primaryName}${secondaryName ? ` (${secondaryName})` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} — ${url}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-lg bg-background shadow-2xl ring-1 ring-border/60 animate-in slide-in-from-bottom duration-300 sm:inset-y-6 sm:left-auto sm:right-6 sm:w-[580px] sm:max-w-[calc(100vw-2rem)] sm:rounded-lg sm:slide-in-from-right"
        role="dialog"
        aria-modal="true"
        style={swipeClosing ? { transform: "translateY(100%)", transition: "transform 0.25s ease-out" } : undefined}
      >
        {/* mobile drag handle */}
        <Button variant="ghost"
          className="flex w-full flex-col items-center justify-center pt-2 pb-1 sm:hidden"
          onClick={onClose}
          aria-label={t("목록으로 닫기", "Close to list", "Đóng danh sách")}
        >
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          <span className="mt-1 text-[10px] text-muted-foreground">
            {t("아래로 당겨서 닫기", "Swipe down to close", "Vuốt xuống để đóng")}
          </span>
        </Button>

        {/* Sticky compact header — shows only when scrolled */}
        {scrolled && (
          <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              <Building2 className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{primaryName}</p>
            </div>
            <Button variant="ghost"
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-accent"
              aria-label={t("닫기", "Close", "Đóng")}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-border">
          
          
          <Button variant="ghost"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 backdrop-blur transition hover:bg-accent"
            aria-label={t("닫기", "Close", "Đóng")}
          >
            <X className="size-4" />
          </Button>
          <div className="relative flex items-start gap-3 px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <div className="relative flex size-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-background sm:size-16 sm:text-2xl">
              {initial}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <h2 className="break-words text-base font-bold leading-tight sm:text-xl">
                {primaryName}
              </h2>
              {secondaryName && (
                <p className="mt-1 break-words text-xs text-muted-foreground sm:text-sm">{secondaryName}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {row.scale_label && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${scaleColor(row.scale_label)}`}
                  >
                    <Sparkles className="size-3" />
                    {scaleLabel(row.scale_label, lang)}
                  </span>
                )}
                {row.rank_import != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur sm:text-xs">
                    <TrendingUp className="size-3 text-primary" />
                    {t("수입", "Imp.", "NK")} #{row.rank_import.toLocaleString()}
                  </span>
                )}
                {row.rank_sales != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur sm:text-xs">
                    <Building2 className="size-3 text-primary" />
                    {t("매출", "Rev.", "DT")} #{row.rank_sales.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick action bar */}
          <div className="relative flex gap-2 border-t border-border/60 bg-background/40 px-4 py-2.5 backdrop-blur sm:px-6">
            {row.biz_no && (
              <CopyChip
                label={t("사업자번호", "Biz no.", "Mã số thuế")}
                value={maskBizNo(row.biz_no)}
                icon={<IdCard className="size-3.5" />}
              />
            )}
            <Button variant="ghost"
              onClick={handleShare}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
            >
              <Share2 className="size-3.5" />
              {t("공유", "Share", "Chia sẻ")}
            </Button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-20 sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
          onScroll={(e) => setScrolled((e.target as HTMLDivElement).scrollTop > 24)}
        >
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-3.5 flex-shrink-0" />
            <span>
              {t(
                "개인정보 보호를 위해 사업자번호 · 연락처 · 이메일 · HS코드 · 품목은 일부가 마스킹되어 표시됩니다.",
                "For privacy, business numbers, contacts, emails, HS codes, and items are partially masked.",
                "Vì lý do bảo mật, mã số thuế, liên hệ, email, mã HS và mặt hàng được hiển thị một phần.",
              )}
            </span>
          </div>

          {/* Contact section */}
          {(emailList.length > 0 || phoneList.length > 0) && (
            <Section
              title={t("연락 정보", "Contact", "Liên hệ")}
              count={emailList.length + phoneList.length}
            >
              {emailList.length > 0 && (
                <DRow icon={<Mail className="size-3.5" />} label={t("이메일", "Email", "Email")}>
                  <div className="flex flex-wrap gap-1.5">
                    {emailList.map((v, i) => (
                      <CopyChip key={`${v}-${i}`} value={maskEmail(v)} mono />
                    ))}
                  </div>
                </DRow>
              )}
              {phoneList.length > 0 && (
                <DRow icon={<Phone className="size-3.5" />} label={t("전화", "Phone", "Điện thoại")}>
                  <div className="flex flex-wrap gap-1.5">
                    {phoneList.map((v, i) => (
                      <CopyChip key={`${v}-${i}`} value={maskPhone(v)} mono />
                    ))}
                  </div>
                </DRow>
              )}
            </Section>
          )}

          {/* Trade section */}
          {(row.countries.length > 0 || row.hs_codes.length > 0) && (
            <Section
              title={t("무역 정보", "Trade", "Thương mại")}
              count={row.countries.length + row.hs_codes.length}
            >
              {row.countries.length > 0 && (
                <DRow
                  icon={<Globe2 className="size-3.5" />}
                  label={t("수입국가", "Import countries", "Quốc gia NK")}
                  badge={row.countries.length}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {row.countries.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs"
                      >
                        <span>{flagOf(c)}</span> {displayCountry(c, lang)}
                      </span>
                    ))}
                  </div>
                </DRow>
              )}
              {row.hs_codes.length > 0 && (
                <DRow
                  icon={<Hash className="size-3.5" />}
                  label={t("HS코드", "HS codes", "Mã HS")}
                  badge={row.hs_codes.length}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {row.hs_codes.map((h) => (
                      <CopyChip key={h} value={maskHS(h)} mono />
                    ))}
                  </div>
                </DRow>
              )}
            </Section>
          )}

          {/* Items section */}
          {(row.items_kr || row.items_en) ? (
            <Section title={t("취급 품목", "Items", "Mặt hàng")}>
              {lang === "ko"
                ? row.items_kr && (
                    <DRow icon={<Package className="size-3.5" />} label={t("한국어", "Korean", "Tiếng Hàn")}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{row.items_kr}</p>
                    </DRow>
                  )
                : (row.items_en || row.items_kr) && (
                    <DRow icon={<Package className="size-3.5" />} label={t("영문", "English", "Tiếng Anh")}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {row.items_en || row.items_kr}
                      </p>
                    </DRow>
                  )}
              {lang !== "ko" && row.items_en && row.items_kr && (
                <DRow icon={<Package className="size-3.5" />} label={t("한국어", "Korean", "Tiếng Hàn")}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {row.items_kr}
                  </p>
                </DRow>
              )}
              {lang === "ko" && row.items_en && (
                <DRow icon={<Package className="size-3.5" />} label="English">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {row.items_en}
                  </p>
                </DRow>
              )}
            </Section>
          ) : row.hs_codes.length > 0 ? (
            <Section title={t("취급 품목", "Items", "Mặt hàng")}>
              <DRow
                icon={<Package className="size-3.5" />}
                label={t("HS코드 기반 추정 카테고리", "Inferred from HS codes", "Suy ra từ mã HS")}
              >
                <div className="flex flex-wrap gap-1.5">
                  {hsCategoriesFromCodes(row.hs_codes).map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center rounded-full border border-dashed border-border bg-muted/30 px-2.5 py-1 text-xs text-foreground/80"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t(
                    "이 업체는 세부 품목명을 미등록했습니다. HS코드 상위 분류로 업종을 추정한 결과입니다.",
                    "Specific item names are not registered. Categories are inferred from HS chapter codes.",
                    "Tên mặt hàng cụ thể chưa được đăng ký. Danh mục được suy ra từ chương HS.",
                  )}
                </p>
              </DRow>
            </Section>
          ) : null}
        </div>



        {/* Bottom close bar — mobile sticky */}
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
          <Button variant="ghost"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg active:scale-[0.98] transition"
          >
            <ChevronLeft className="size-4" />
            {t("목록으로 돌아가기", "Back to list", "Quay lại danh sách")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden border-b border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {count != null && count > 0 && (
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function DRow({
  icon,
  label,
  badge,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
        {badge != null && (
          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold normal-case tracking-normal text-foreground/70">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function CopyChip({
  value,
  label,
  icon,
  mono = false,
}: {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <Button variant="ghost"
      onClick={handleCopy}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs transition hover:border-primary/40 hover:bg-primary/5 active:scale-95 ${mono ? "font-mono tabular-nums" : ""}`}
      title="Copy"
    >
      {icon}
      {label && <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>}
      <span>{value}</span>
      {copied ? (
        <Check className="size-3 text-primary" />
      ) : (
        <Copy className="size-3 text-muted-foreground/60 group-hover:text-primary" />
      )}
    </Button>
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
