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
import { flagOf, displayCountry, displayCompanyName } from "@/lib/koima-types";
import { AseanFlag } from "@/components/AseanFlag";
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
  /** When set, country filter is locked to this country (e.g. "중국", "미국"). */
  lockedCountry?: string;
  /** Header title (h1). */
  title: string;
  /** Small subtitle shown above title. */
  scopeBadge?: string;
};

export function ImportersDirectory({
  lockedCountry,
  title,
  scopeBadge,
}: ImportersDirectoryProps) {
  const { t } = useLang();
  const listFn = useServerFn(listImporters);
  const facetsFn = useServerFn(getImporterFacets);
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [countries, setCountries] = useState<string[]>(
    lockedCountry ? [lockedCountry] : [],
  );
  const [scales, setScales] = useState<Set<string>>(new Set());
  const [hs, setHs] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [sort, setSort] = useState<SortKey>("rank_import_asc");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Importer | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

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

  // Effective countries: when locked, always inject the locked country
  const effectiveCountries = useMemo(() => {
    if (!lockedCountry) return countries;
    return countries.includes(lockedCountry) ? countries : [lockedCountry, ...countries];
  }, [countries, lockedCountry]);

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
    return Object.entries(m)
      .filter(([k]) => k !== lockedCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([k]) => k);
  }, [facets.data, lockedCountry]);

  const allCountries = useMemo(() => {
    const m = facets.data?.countries ?? {};
    return Object.keys(m)
      .filter((k) => k !== lockedCountry)
      .sort((a, b) => a.localeCompare(b, "ko"));
  }, [facets.data, lockedCountry]);

  const total = list.data?.total ?? 0;
  const rows = list.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const lockedCount = lockedCountry
    ? (facets.data?.countries?.[lockedCountry] ?? null)
    : null;

  const clearAll = () => {
    setQ("");
    setCountries(lockedCountry ? [lockedCountry] : []);
    setScales(new Set());
    setHs("");
    setHasEmail(false);
    setPage(1);
  };

  const additionalCountries = useMemo(
    () => countries.filter((c) => c !== lockedCountry),
    [countries, lockedCountry],
  );

  const activeFilterCount =
    additionalCountries.length + scales.size + (hs ? 1 : 0) + (hasEmail ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={koimaLogo}
                alt="KOIMA 한국수입업협회"
                className="h-9 w-auto shrink-0 sm:h-10"
              />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold sm:text-xl">
                  {scopeBadge && (
                    <span className="mr-1.5">{scopeBadge}</span>
                  )}
                  {t(title, "Korean Importers Directory")}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {t("2025 관세청 기준 ·", "2025 Korea Customs ·")}{" "}
                  {(lockedCount ?? facets.data?.total ?? 118353).toLocaleString()}
                  {t("개 업체", " companies")}
                </p>
              </div>

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
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("업체명 · 사업자번호 · 품목으로 검색", "Search by name · biz no · items")}
                className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
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
              <Link
                to="/importers"
                title="아세안 거래 디렉토리"
                aria-label="아세안 거래 디렉토리"
                className="inline-flex items-center justify-center rounded-md border bg-card px-2 py-2 shadow-sm hover:bg-accent"
              >
                <AseanFlag className="h-5 w-auto" />
              </Link>
              <Link
                to="/eu"
                title="EU 거래 디렉토리"
                aria-label="EU 거래 디렉토리"
                className="inline-flex items-center justify-center rounded-md border bg-card px-2 py-2 text-xl leading-none shadow-sm hover:bg-accent"
              >
                🇪🇺
              </Link>

            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel
            lockedCountry={lockedCountry}
            topCountries={topCountries}
            allCountries={allCountries}
            scalesAvailable={SCALE_ORDER}
            scaleCounts={facets.data?.scales ?? {}}
            additionalCountries={additionalCountries}
            setAdditionalCountries={(next) =>
              setCountries(lockedCountry ? [lockedCountry, ...next] : next)
            }
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
          <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {list.isLoading ? (
                "검색 중…"
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {total.toLocaleString()}
                  </span>{" "}
                  개 결과
                  {lockedCountry && (
                    <span className="ml-1 text-xs">
                      · {flagOf(lockedCountry)} {displayCountry(lockedCountry)} 거래
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
                <X className="size-3.5" /> 필터 초기화
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
                조건에 맞는 업체가 없습니다.
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
                <ChevronLeft className="size-4" /> 이전
              </button>
              <span className="px-2 tabular-nums">
                {page} / {pages.toLocaleString()}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-2 shadow-sm enabled:hover:bg-accent disabled:opacity-40"
              >
                다음 <ChevronRight className="size-4" />
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
              <div className="font-semibold">필터</div>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded p-1 hover:bg-accent"
                aria-label="닫기"
              >
                <X className="size-5" />
              </button>
            </div>
            <FilterPanel
              lockedCountry={lockedCountry}
              topCountries={topCountries}
              allCountries={allCountries}
              scalesAvailable={SCALE_ORDER}
              scaleCounts={facets.data?.scales ?? {}}
              additionalCountries={additionalCountries}
              setAdditionalCountries={(next) =>
                setCountries(lockedCountry ? [lockedCountry, ...next] : next)
              }
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
              {total.toLocaleString()}개 결과 보기
            </button>
          </div>
        </div>
      )}

      {opened && <DetailSheet row={opened} onClose={() => setOpened(null)} />}

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <p>
              출처 · Source: 2025 관세청 수입실적 / Korea Customs Service · 데이터 갱신 2026.05
            </p>
            <p>
              KOIMA 품목별 수입업체 검색 · 바이어 매칭 서비스 | 문의: seobh@koima.or.kr
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterPanel(props: {
  lockedCountry?: string;
  topCountries: string[];
  allCountries: string[];
  scalesAvailable: string[];
  scaleCounts: Record<string, number>;
  additionalCountries: string[];
  setAdditionalCountries: (c: string[]) => void;
  scales: Set<string>;
  setScales: (s: Set<string>) => void;
  hasEmail: boolean;
  setHasEmail: (b: boolean) => void;
  clearAll: () => void;
  onFilterChange: () => void;
}) {
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
          {props.lockedCountry ? "추가 수입국가 (AND)" : "주요 수입국가"}
        </div>

        {props.lockedCountry && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <span>{flagOf(props.lockedCountry)}</span>
            {displayCountry(props.lockedCountry)}
            <span className="ml-1 text-[10px] font-normal text-primary/70">고정</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {!props.lockedCountry && (
            <FilterChip
              active={props.additionalCountries.length === 0}
              onClick={() => {
                props.setAdditionalCountries([]);
                props.onFilterChange();
              }}
            >
              전체
            </FilterChip>
          )}
          {props.topCountries.map((c) => (
            <FilterChip
              key={c}
              active={props.additionalCountries.includes(c)}
              onClick={() => toggleCountry(c)}
            >
              <span className="mr-1">{flagOf(c)}</span>
              {displayCountry(c)}
            </FilterChip>
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
                {displayCountry(c)}
                <button
                  onClick={() => toggleCountry(c)}
                  className="ml-0.5 rounded hover:text-destructive"
                  aria-label={`${displayCountry(c)} 제거`}
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
              초기화
            </button>
          </div>
        )}

        {/* Search more countries */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={countryQ}
            onChange={(e) => setCountryQ(e.target.value)}
            placeholder="국가 검색…"
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
                <span className="flex-1">{displayCountry(c)}</span>
                <span className="text-[10px] text-muted-foreground">선택</span>
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
            {showAll ? "접기" : `전체 국가 보기 (${props.allCountries.length}개)`}
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
                  {displayCountry(c)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="size-3.5" /> 수입액 구간
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
                <span>{s}</span>
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
          이메일 보유 업체만
        </label>
      </div>

      <button
        onClick={props.clearAll}
        className="w-full rounded-md border bg-card px-3 py-2 text-xs hover:bg-accent"
      >
        필터 초기화
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
  const countries = row.countries.slice(0, 6);
  const extra = Math.max(0, row.countries.length - countries.length);
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
              {displayCompanyName(row.name_kr) || row.name_en}
            </span>
            {row.rank_import != null && row.rank_import <= 100 && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                TOP {row.rank_import}
              </span>
            )}
          </div>
          {row.name_en && (
            <div className="truncate text-xs text-muted-foreground">
              {row.name_en}
            </div>
          )}
        </div>
        {row.scale_label && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${scaleColor(row.scale_label)}`}
          >
            {row.scale_label}
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
              <span>{flagOf(c)}</span> {displayCountry(c)}
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
          <span className="font-mono tabular-nums">사업자 {maskBizNo(row.biz_no)}</span>
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

      {row.items_kr && (
        <div className="mt-2 line-clamp-2 text-xs text-muted-foreground/90">
          {row.items_kr}
        </div>
      )}
    </button>
  );
}

function DetailSheet({ row, onClose }: { row: Importer; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emails = [row.email, row.email_extra].filter(Boolean).join(", ");
  const phones = [row.phone, row.phone_extra].filter(Boolean).join(" / ");

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background p-5 shadow-2xl sm:inset-y-8 sm:left-auto sm:right-8 sm:w-[520px] sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{row.name_kr || row.name_en}</h2>
            {row.name_en && (
              <p className="text-sm text-muted-foreground">{row.name_en}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {row.scale_label && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${scaleColor(row.scale_label)}`}
                >
                  {row.scale_label}
                </span>
              )}
              {row.rank_import != null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  수입액 순위 #{row.rank_import.toLocaleString()}
                </span>
              )}
              {row.rank_sales != null && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  매출액 순위 #{row.rank_sales.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-accent"
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          개인정보 보호를 위해 사업자번호 · 연락처 · 이메일 · HS코드 · 품목은 일부가
          마스킹되어 표시됩니다.
        </div>
        <dl className="space-y-3 text-sm">
          {row.biz_no && (
            <Row label="사업자번호">
              <span className="font-mono tabular-nums">{maskBizNo(row.biz_no)}</span>
            </Row>
          )}
          {emails && (
            <Row label="이메일">
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
            <Row label="전화">
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
            <Row label={`수입국가 (${row.countries.length})`}>
              <div className="flex flex-wrap gap-1">
                {row.countries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    <span>{flagOf(c)}</span> {displayCountry(c)}
                  </span>
                ))}
              </div>
            </Row>
          )}
          {row.hs_codes.length > 0 && (
            <Row label="HS코드">
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
          {row.items_kr && (
            <Row label="취급 품목">
              <p className="whitespace-pre-wrap leading-relaxed">{row.items_kr}</p>
            </Row>
          )}
          {row.items_en && (
            <Row label="Items (EN)">
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {row.items_en}
              </p>
            </Row>
          )}
        </dl>
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
