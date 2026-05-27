import { createFileRoute, Link } from "@tanstack/react-router";
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
import { flagOf } from "@/lib/koima-types";

export const Route = createFileRoute("/importers")({
  component: ImportersPage,
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

function ImportersPage() {
  const listFn = useServerFn(listImporters);
  const facetsFn = useServerFn(getImporterFacets);

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [scales, setScales] = useState<Set<string>>(new Set());
  const [hs, setHs] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [sort, setSort] = useState<SortKey>("rank_import_asc");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Importer | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDeb, countries, scales, hs, hasEmail, sort]);

  const scaleArr = useMemo(() => Array.from(scales), [scales]);

  const facets = useQuery({
    queryKey: ["importer-facets"],
    queryFn: () => facetsFn(),
    staleTime: 5 * 60_000,
  });

  const list = useQuery({
    queryKey: ["importers", { qDeb, country, scaleArr, hs, hasEmail, sort, page }],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          country,
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([k]) => k);
  }, [facets.data]);

  const total = list.data?.total ?? 0;
  const rows = list.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearAll = () => {
    setQ(""); setCountry(null); setScales(new Set()); setHs(""); setHasEmail(false);
  };

  const activeFilterCount =
    (country ? 1 : 0) + scales.size + (hs ? 1 : 0) + (hasEmail ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                ← KOIMA ASEAN
              </Link>
              <h1 className="mt-0.5 truncate text-lg font-semibold sm:text-xl">
                한국 수입업체 디렉토리
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                2025 관세청 기준 · {(facets.data?.total ?? 118353).toLocaleString()}개 업체
              </p>
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              필터
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="업체명 · 사업자번호 · 품목으로 검색"
                className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={hs}
                onChange={(e) => setHs(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="HS코드"
                inputMode="numeric"
                className="w-28 rounded-md border bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="rank_import_asc">수입액 순</option>
                <option value="rank_sales_asc">매출액 순</option>
                <option value="name_asc">업체명 가나다순</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel
            topCountries={topCountries}
            scalesAvailable={SCALE_ORDER}
            scaleCounts={facets.data?.scales ?? {}}
            country={country}
            setCountry={setCountry}
            scales={scales}
            setScales={setScales}
            hasEmail={hasEmail}
            setHasEmail={setHasEmail}
            clearAll={clearAll}
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
              topCountries={topCountries}
              scalesAvailable={SCALE_ORDER}
              scaleCounts={facets.data?.scales ?? {}}
              country={country}
              setCountry={setCountry}
              scales={scales}
              setScales={setScales}
              hasEmail={hasEmail}
              setHasEmail={setHasEmail}
              clearAll={clearAll}
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
    </div>
  );
}

function FilterPanel(props: {
  topCountries: string[];
  scalesAvailable: string[];
  scaleCounts: Record<string, number>;
  country: string | null;
  setCountry: (c: string | null) => void;
  scales: Set<string>;
  setScales: (s: Set<string>) => void;
  hasEmail: boolean;
  setHasEmail: (b: boolean) => void;
  clearAll: () => void;
}) {
  const toggleScale = (s: string) => {
    const next = new Set(props.scales);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    props.setScales(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Globe2 className="size-3.5" /> 주요 수입국가
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={props.country === null}
            onClick={() => props.setCountry(null)}
          >
            전체
          </FilterChip>
          {props.topCountries.map((c) => (
            <FilterChip
              key={c}
              active={props.country === c}
              onClick={() => props.setCountry(props.country === c ? null : c)}
            >
              <span className="mr-1">{flagOf(c)}</span>
              {c}
            </FilterChip>
          ))}
        </div>
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
            onChange={(e) => props.setHasEmail(e.target.checked)}
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
              {row.name_kr || row.name_en}
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
              <span>{flagOf(c)}</span> {c}
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
          <span className="font-mono tabular-nums">사업자 {row.biz_no}</span>
        )}
        {row.email && (
          <span className="inline-flex items-center gap-1">
            <Mail className="size-3" /> {row.email.split(",")[0].trim()}
          </span>
        )}
        {row.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3" /> {row.phone}
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
              <span className="font-mono tabular-nums">{row.biz_no}</span>
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
                      {v}
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
                      {v}
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
                    <span>{flagOf(c)}</span> {c}
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
                    {h}
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
