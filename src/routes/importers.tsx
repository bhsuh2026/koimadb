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
} from "lucide-react";
import { ASEAN, SCALE, SCOLOR, flagOf, type Company } from "@/lib/koima-types";
import { listCompanies, getStats } from "@/lib/companies.functions";
import { DetailModal } from "@/components/DetailModal";
import { LangToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/importers")({
  component: Index,
});

const PAGE_SIZE = 40;

type SortKey = "scale_desc" | "scale_asc" | "name_asc" | "countries_desc";
function Index() {
  const { t } = useLang();
  const listFn = useServerFn(listCompanies);
  const statsFn = useServerFn(getStats);

  const [country, setCountry] = useState<string | null>(null); // null = all
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
  }, [country, qDeb, scales, mailOnly, sort]);

  const scaleArr = useMemo(() => Array.from(scales), [scales]);

  const listQuery = useQuery({
    queryKey: ["companies", { country, qDeb, scaleArr, mailOnly, sort, page }],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          asean: country,
          scales: scaleArr,
          hasEmail: mailOnly,
          sort,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: (prev) => prev,
  });

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: () => statsFn(),
    staleTime: 5 * 60 * 1000,
  });

  const total = listQuery.data?.total ?? 0;
  const rows = listQuery.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scopeName = country ?? "아세안 전체";

  const scrollToList = () => {
    setTimeout(() => dirRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const reset = () => {
    setQ("");
    setScales(new Set());
    setMailOnly(false);
    setSort("scale_desc");
    setCountry(null);
  };


  const pagerNums = useMemo(() => {
    const nums: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    return nums;
  }, [page, pages]);

  const counts = statsQuery.data?.counts ?? {};
  const grandTotal = statsQuery.data?.total ?? 0;
  const activeFilters =
    (country ? 1 : 0) + (scales.size ? 1 : 0) + (mailOnly ? 1 : 0) + (qDeb ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={koimaLogo}
                alt="KOIMA 한국수입업협회"
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
                <span className="hidden sm:inline">수입업체</span>
                Directory
              </Link>
              <Link
                to="/eu"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                🇪🇺 <span className="hidden sm:inline">EU</span>
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">관리자</span>
                Admin
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-[1300px] px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur">
              <Sparkles className="h-3 w-3 text-white/80" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/80">
                ASEAN · 아세안 10개국
              </span>
            </div>
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
              아세안 거래 한국 수입업체 디렉토리
              <span className="mt-2 block text-[14px] font-semibold text-white/70 sm:text-[17px]">
                Korean Importers Sourcing from ASEAN
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-white/75">
              아세안 10개국 제품을 수입 중인 한국 기업을 국가별로 확인하실 수 있습니다.
              아래에서 국가를 선택하면 해당국 거래 수입업체로 좁혀집니다.
            </p>
          </div>

          {/* COUNTRY TABS — horizontal scroll on mobile */}
          <div className="mx-auto max-w-[1300px] px-4 pb-6 sm:px-6 sm:pb-7">
            <div className="pb-2 text-[10px] font-bold uppercase tracking-wider text-white/55">
              국가 선택 · Select a Country
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:overflow-visible">
              <CountryChip
                active={country === null}
                onClick={() => {
                  setCountry(null);
                  scrollToList();
                }}
                accent
              >
                <span className="text-base leading-none">🌏</span>
                아세안 전체
                <Pill active={country === null}>{grandTotal.toLocaleString()}</Pill>
              </CountryChip>
              {ASEAN.map((a) => {
                const on = country === a.kr;
                const n = counts[a.kr] ?? 0;
                return (
                  <CountryChip
                    key={a.kr}
                    active={on}
                    onClick={() => {
                      setCountry(a.kr);
                      scrollToList();
                    }}
                  >
                    <span className="text-base leading-none">{a.flag}</span>
                    {a.kr}
                    <Pill active={on}>{n.toLocaleString()}</Pill>
                  </CountryChip>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ===== DIRECTORY ===== */}
      <div
        ref={dirRef}
        className="mx-auto max-w-[1300px] scroll-mt-4 px-4 pb-20 pt-6 sm:px-6"
      >
        {/* Sticky search bar */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0 sm:static">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="업체명·사업자번호 검색"
                className="h-11 w-full rounded-lg border border-border bg-card px-3 pl-9 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="relative inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-semibold text-foreground transition hover:border-primary md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              필터
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
            <Label kr="옵션 · Options" />
            <div className="flex flex-wrap items-center gap-3">
              <Toggle on={mailOnly} onClick={() => setMailOnly((v) => !v)}>
                이메일 보유만
              </Toggle>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                초기화
              </button>
            </div>
          </div>
          <div>
            <Label kr="수입 규모대 · Annual import scale" />
            <ScaleChips scales={scales} setScales={setScales} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="text-[13px] text-muted-foreground">
            <b className="font-mono text-[18px] font-bold text-primary">
              {total.toLocaleString()}
            </b>{" "}
            개사 ·{" "}
            <span className="font-semibold text-foreground">{scopeName}</span>
          </div>
          <div className="ml-auto flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 cursor-pointer rounded-md border border-border bg-card px-2.5 text-[12px]"
            >
              <option value="scale_desc">수입규모 ↓</option>
              <option value="scale_asc">수입규모 ↑</option>
              <option value="name_asc">업체명 A–Z</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {listQuery.isLoading && !listQuery.data ? (
          <GridSkeleton />
        ) : listQuery.error ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            데이터를 불러오지 못했습니다 · 잠시 후 다시 시도해 주세요.
          </div>
        ) : total === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card px-6 py-16 text-center text-muted-foreground">
            <div className="text-[15px] font-semibold text-foreground/70">
              검색 결과가 없습니다
            </div>
            <div className="mt-1.5 text-[13px]">
              국가 탭이나 조건을 변경하세요.
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
          출처 · 관세청 수입실적 / KOIMA · 문의:{" "}
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
              <h3 className="text-base font-bold text-foreground">필터</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Label kr="옵션" />
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Toggle on={mailOnly} onClick={() => setMailOnly((v) => !v)}>
                이메일 보유만
              </Toggle>
            </div>
            <Label kr="수입 규모대" />
            <ScaleChips scales={scales} setScales={setScales} />
            <div className="mt-6 flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground"
              >
                초기화
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                적용 · {total.toLocaleString()}개
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Small UI ============ */

function CountryChip({
  active,
  onClick,
  accent = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
        active
          ? accent
            ? "border-[#ff5d6e] bg-[#ff5d6e] text-white"
            : "border-white bg-white text-primary"
          : accent
            ? "border-[#ff5d6e]/40 bg-[#ff5d6e]/15 text-white/90"
            : "border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.15]"
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
        active ? "bg-black/15" : "bg-black/20 text-white/85"
      }`}
    >
      {children}
    </span>
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
    <button onClick={onClick} className="flex items-center gap-2 text-[12px]">
      <span
        className={`relative h-[20px] w-[36px] rounded-full transition ${
          on ? "bg-emerald-600" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition ${
            on ? "left-[18px]" : "left-[2px]"
          }`}
        />
      </span>
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
  return (
    <div className="flex flex-wrap gap-1.5">
      {[15, 14, 13, 12, 11, 10, 9, 8, 7, 6].map((code) => {
        const on = scales.has(code);
        const lbl = SCALE[code][0];
        return (
          <button
            key={code}
            onClick={() =>
              setScales((prev) => {
                const next = new Set(prev);
                if (next.has(code)) next.delete(code);
                else next.add(code);
                return next;
              })
            }
            className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 font-mono text-[10.5px] transition ${
              on
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-muted-foreground hover:border-primary"
            }`}
          >
            {lbl}
          </button>
        );
      })}
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
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-md border px-2 font-mono text-[12px] transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground hover:border-primary"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-[150px] animate-pulse rounded-xl border border-border bg-card"
        />
      ))}
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
  const sc = SCALE[company.scale_code] ?? SCALE[6];
  const col = SCOLOR[company.scale_code] ?? SCOLOR[6];
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-[1px] hover:border-primary hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-bold leading-tight text-foreground group-hover:text-primary">
            {company.name_kr || "(상호 미상)"}
          </div>
          {company.name_en && (
            <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
              {company.name_en}
            </div>
          )}
        </div>
        <span
          className="flex-shrink-0 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[9.5px] font-semibold"
          style={{ color: col[0], background: col[1] }}
        >
          {sc[1]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {company.asean_countries.slice(0, 6).map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent"
          >
            <span className="text-[11px] leading-none">{flagOf(n)}</span>
            {n}
          </span>
        ))}
        {company.asean_countries.length > 6 && (
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            +{company.asean_countries.length - 6}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {company.email ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-accent/15 bg-accent-soft px-2 py-0.5 text-[10.5px] text-accent">
            <Mail className="h-3 w-3" />
            <span className="max-w-[180px] truncate">{company.email}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-[10.5px] text-muted-foreground/50">
            <Mail className="h-3 w-3" />
            이메일 미등록
          </span>
        )}
        {company.phone && (
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-0.5 text-[10.5px] text-muted-foreground">
            <Phone className="h-3 w-3" />
            {company.phone}
          </span>
        )}
      </div>
      <div className="flex gap-4 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{company.biz_no || "—"}</span>
        <span className="ml-auto">
          거래국 {company.asean_countries.length + company.other_countries.length}
        </span>
      </div>
    </button>
  );
}
