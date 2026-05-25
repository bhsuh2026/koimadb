import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Download,
  RotateCcw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  ScrollText,
  Building,
  Flag,
} from "lucide-react";
import type { KoimaData, Record8 } from "@/lib/koima-types";
import { SCOLOR } from "@/lib/koima-types";
import { DetailModal } from "@/components/DetailModal";

export const Route = createFileRoute("/")({
  component: Index,
});

const PAGE_SIZE = 40;

function Index() {
  const [data, setData] = useState<KoimaData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // filter state
  const [country, setCountry] = useState<number>(-1);
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [scales, setScales] = useState<Set<number>>(new Set());
  const [mailOnly, setMailOnly] = useState(false);
  const [sort, setSort] = useState<"scale" | "scale-asc" | "name" | "ctry">("scale");
  const [page, setPage] = useState(1);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const dirRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // fetch data
  useEffect(() => {
    fetch("/data/koima.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: KoimaData) => setData(d))
      .catch((e) => setLoadErr(String(e)));
  }, []);

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim().toLowerCase()), 170);
    return () => clearTimeout(t);
  }, [q]);

  // filter + sort
  const results = useMemo(() => {
    if (!data) return [] as number[];
    const RECS = data.records;
    const out: number[] = [];
    for (let k = 0; k < RECS.length; k++) {
      const r = RECS[k];
      if (country >= 0 && r[6].indexOf(country) < 0) continue;
      if (
        qDeb &&
        !(
          (r[1] && r[1].toLowerCase().includes(qDeb)) ||
          (r[2] && r[2].toLowerCase().includes(qDeb)) ||
          (r[0] && r[0].includes(qDeb))
        )
      )
        continue;
      if (scales.size && !scales.has(r[5])) continue;
      if (mailOnly && !r[3]) continue;
      out.push(k);
    }
    const allMk = (r: Record8) => r[6].length + r[7].length;
    if (sort === "scale")
      out.sort((a, b) => RECS[b][5] - RECS[a][5] || allMk(RECS[b]) - allMk(RECS[a]));
    else if (sort === "scale-asc") out.sort((a, b) => RECS[a][5] - RECS[b][5]);
    else if (sort === "name")
      out.sort((a, b) => (RECS[a][1] || "").localeCompare(RECS[b][1] || "", "ko"));
    else if (sort === "ctry") out.sort((a, b) => allMk(RECS[b]) - allMk(RECS[a]));
    return out;
  }, [data, country, qDeb, scales, mailOnly, sort]);

  useEffect(() => setPage(1), [country, qDeb, scales, mailOnly, sort]);

  const total = results.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSlice = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const scrollToList = () => {
    setTimeout(() => {
      dirRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const reset = () => {
    setQ("");
    setScales(new Set());
    setMailOnly(false);
    setSort("scale");
  };

  const exportCsv = () => {
    if (!data || !results.length) return;
    const head = [
      "업체명(한글)",
      "업체명(영문)",
      "사업자번호",
      "수입규모",
      "이메일",
      "전화번호",
      "아세안거래국",
      "기타거래국",
    ];
    const rows = results.map((k) => {
      const r = data.records[k];
      return [
        r[1],
        r[2],
        r[0],
        (data.scale[String(r[5])] ?? ["", ""])[0],
        r[3],
        r[4],
        r[6].map((ai) => data.asean[ai].kr).join(" / "),
        r[7].join(" / "),
      ];
    });
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv =
      "\uFEFF" +
      [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    const scope = country === -1 ? "아세안전체" : data.asean[country].kr;
    a.href = URL.createObjectURL(blob);
    a.download = `KOIMA_${scope}_수입업체_${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // pager
  const pagerNums = useMemo(() => {
    const nums: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    return nums;
  }, [page, pages]);

  const scopeName = country === -1 ? "아세안 전체" : data?.asean[country].kr ?? "—";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="mx-auto flex max-w-[1300px] items-center justify-between border-b border-white/10 px-6 py-3.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[17px] font-extrabold tracking-wide">
                KOIMA<span className="text-[#ff5d6e]">.</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                Korea Importers Association
              </span>
            </div>
            <span className="hidden text-[9px] uppercase tracking-[0.14em] text-white/60 sm:inline">
              Country Directory · 국가별 수입업체
            </span>
          </div>

          <div className="mx-auto max-w-[1300px] px-6 pb-6 pt-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
              <Sparkles className="h-3 w-3 text-white/80" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/80">
                ASEAN · 아세안 10개국
              </span>
            </div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
              아세안 거래 한국 수입업체 디렉토리
              <span className="mt-2 block text-[15px] font-semibold text-white/70 sm:text-[17px]">
                Korean Importers Sourcing from ASEAN
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-white/75">
              아세안 10개국 제품을 수입 중인 한국 기업을 국가별로 확인하실 수 있습니다. 아래에서 국가를
              선택하면 해당국 거래 수입업체로 좁혀집니다. 해외 공급기업과 무역진흥기관을 위한 KOIMA
              바이어 매칭 자료입니다.
              <br />
              <span className="text-white/55">
                Verified Korean buyers actively importing from ASEAN — select a country below to
                filter.
              </span>
            </p>
          </div>

          {/* COUNTRY TABS */}
          <div className="mx-auto max-w-[1300px] px-6 pb-7">
            <div className="pb-2 text-[10px] font-bold uppercase tracking-wider text-white/55">
              국가 선택 · Select a Country
              <span className="ml-1 font-normal normal-case tracking-normal text-white/40">
                — 탭 클릭 시 목록 필터
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setCountry(-1);
                  scrollToList();
                }}
                className={`flex items-center gap-2 rounded-sm border px-3.5 py-2 text-[12.5px] font-semibold transition ${
                  country === -1
                    ? "border-[#ff5d6e] bg-[#ff5d6e] text-white"
                    : "border-[#ff5d6e]/40 bg-[#ff5d6e]/15 text-white/90 hover:bg-[#ff5d6e]/25"
                }`}
              >
                아세안 전체 ASEAN
                <span
                  className={`rounded-sm px-1.5 py-px font-mono text-[10px] ${
                    country === -1 ? "bg-black/20 text-white" : "bg-black/20 text-white/90"
                  }`}
                >
                  {data ? data.records.length.toLocaleString() : "—"}
                </span>
              </button>

              {data?.asean.map((a, i) => {
                const on = country === i;
                return (
                  <button
                    key={a.kr}
                    onClick={() => {
                      setCountry(i);
                      scrollToList();
                    }}
                    className={`flex items-center gap-2 rounded-sm border px-3.5 py-2 text-[12.5px] font-semibold transition ${
                      on
                        ? "border-white bg-white text-primary"
                        : "border-white/15 bg-white/[0.07] text-white/85 hover:border-white/30 hover:bg-white/[0.13]"
                    }`}
                  >
                    {a.kr}
                    <span
                      className={`rounded-sm px-1.5 py-px font-mono text-[10px] ${
                        on ? "bg-accent-soft text-accent" : "bg-black/20"
                      }`}
                    >
                      {a.n.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ===== INTEL ===== */}
      <div className="mx-auto max-w-[1300px] px-6 pb-16 pt-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Trade snapshot */}
          <Card>
            <CardHeader
              icon={<Flag className="h-3.5 w-3.5" />}
              kr="한-아세안 교역 스냅샷"
              en="Korea–ASEAN Trade Snapshot"
            />
            <div className="flex flex-col gap-1.5">
              {data ? (
                <BarChart
                  asean={data.asean}
                  total={data.records.length}
                  onPick={(i) => {
                    setCountry(i);
                    scrollToList();
                  }}
                />
              ) : (
                <BarsSkeleton />
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              막대를 클릭하면 해당국 디렉토리로 이동합니다. 아세안은 한국의 핵심 교역 권역으로, 전
              회원국과 거래하는 한국 수입업체가 폭넓게 분포합니다.
              <br />
              <span className="text-muted-foreground/60">
                * 거래업체 수는 본 데이터베이스 기준
              </span>
            </p>
          </Card>

          {/* FTA */}
          <Card>
            <CardHeader
              icon={<ScrollText className="h-3.5 w-3.5" />}
              kr="적용 가능 FTA · 특혜관세"
              en="Applicable FTAs & Preferential Tariffs"
              note="정보 안내용 · 세율은 공식 포털 확인"
            />
            <p className="mb-3 text-[11.5px] leading-relaxed text-muted-foreground">
              아세안 교역에는{" "}
              <b className="font-semibold text-primary">한-아세안 FTA와 RCEP이 공통 적용</b>되며,
              베트남·싱가포르는 양자 FTA도 함께 적용됩니다. 수입자는 품목별로 더 유리한 특혜세율을
              선택할 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <FtaRow
                title="한-아세안 FTA (AKFTA)"
                desc="아세안 10개국 공통 적용 · 상호대응세율 제도 운영"
                badge="발효 중"
              />
              <FtaRow
                title="RCEP"
                desc="아세안 10개국 포함 · 누적 원산지 기준 활용 가능"
                badge="발효 중"
              />
              <FtaRow
                title="양자 FTA"
                desc="한-베트남 FTA(VKFTA), 한-싱가포르 FTA 등 개별국 협정 별도 적용"
                badge="국가별"
                variant="gold"
              />
            </div>
          </Card>

          {/* Customs links */}
          <Card className="md:col-span-2">
            <CardHeader
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              kr="품목별 관세율 · 원산지 · 통관 확인"
              en="Tariff, Origin & Customs — Official Lookup"
              note="실시간 세율은 아래 공식 포털에서 조회"
            />
            <p className="mb-3 text-[11.5px] leading-relaxed text-muted-foreground">
              정확한 품목별(HS코드) 관세율과 원산지결정기준은 협정·국가별로 다르고 수시로
              변동되므로, 아래 <b className="font-semibold text-primary">관세청 공식 포털</b>에서
              직접 조회하시기 바랍니다. 본 페이지는 안내 목적이며 세율 수치를 직접 제공하지 않습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <LinkBtn href="https://www.customs.go.kr/ftaportalkor/main.do">
                FTA 포털 · 수입세율 조회
              </LinkBtn>
              <LinkBtn href="https://unipass.customs.go.kr/">
                관세청 UNI-PASS · 통관
              </LinkBtn>
              <LinkBtn href="https://www.customs.go.kr/">
                관세청 · 관세법령정보
              </LinkBtn>
              <LinkBtn href="https://news.kotra.or.kr/">
                KOTRA · 아세안 시장정보
              </LinkBtn>
            </div>
          </Card>

          {/* Counterparts */}
          <Card className="md:col-span-2">
            <CardHeader
              icon={<Building className="h-3.5 w-3.5" />}
              kr="카운터파트 · 협력 기관"
              en="Counterpart Institutions & Contacts"
              note="대사관별 정보는 확인 후 갱신 예정"
            />
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <Counterpart
                role="권역 협력 · ASEAN-Korea"
                name={"한-아세안센터\nASEAN-Korea Centre"}
                info="서울 소재 · 한-아세안 무역·투자·문화 협력 기관"
                placeholder="[ 협력 협의 후 연락처 입력 ]"
              />
              <Counterpart
                role="주한 대사관 · Embassies"
                name="아세안 각국 주한 대사관"
                placeholder="[ 국가별 대사관 — 선택국에 따라 정보 입력 ]"
              />
              <Counterpart
                role="KOTRA 무역관 · ASEAN"
                name="KOTRA 아세안 무역관"
                info="하노이·방콕·자카르타·싱가포르·마닐라 등"
                link={{ href: "https://www.kotra.or.kr", label: "kotra.or.kr" }}
              />
            </div>
          </Card>

          {/* Joint banner */}
          <div className="md:col-span-2 flex flex-wrap items-center gap-4 rounded-md bg-gradient-to-r from-primary to-primary-dark px-5 py-4 text-white">
            <div className="min-w-[260px] flex-1">
              <div className="text-[13px] font-extrabold">
                대사관 공동 운영 디렉토리 · Jointly Operated Directory
              </div>
              <div className="mt-1.5 text-[10.5px] leading-relaxed text-white/65">
                본 디렉토리는 KOIMA와 아세안 각국 주한 대사관·한-아세안센터의 공동 협력으로 운영될
                수 있습니다. 각 대사관은 자국 수출기업에 공식 채널을 제공하고, KOIMA는 검증된 한국
                바이어 네트워크를 연결합니다.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-white/20 bg-white/10 px-3.5 py-2 text-center text-[10px] font-bold leading-tight">
                KOIMA
                <br />
                한국수입협회
              </span>
              <span className="text-base font-bold text-[#ff5d6e]">×</span>
              <span className="rounded border border-white/20 bg-white/10 px-3.5 py-2 text-center text-[10px] font-bold leading-tight">
                ASEAN
                <br />
                EMBASSIES
              </span>
            </div>
          </div>
        </section>

        {/* ===== DIRECTORY HEAD ===== */}
        <div ref={dirRef} className="mt-8 scroll-mt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-primary text-white">
              <Building2Icon />
            </span>
            <div>
              <h2 className="text-[17px] font-extrabold tracking-tight text-primary">
                <span className="text-accent">{scopeName}</span> 거래 수입업체 목록
              </h2>
              <div className="font-mono text-[11px] text-muted-foreground">
                Korean Importer Directory · 국가 탭·검색·필터로 바이어를 찾으세요
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Label kr="업체명 · 사업자번호 검색" en="Search by name or business no." />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="한글·영문 업체명 또는 사업자번호 입력"
                className="w-full rounded-sm border border-border bg-background px-3 py-2.5 pl-9 text-sm focus:border-primary focus:bg-card focus:outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setMailOnly((v) => !v)}
                className="flex items-center gap-2 text-[12px]"
              >
                <span
                  className={`relative h-[18px] w-[34px] rounded-full transition ${
                    mailOnly ? "bg-emerald-700" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition ${
                      mailOnly ? "left-[18px]" : "left-[2px]"
                    }`}
                  />
                </span>
                이메일 보유 업체만 · Email only
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                초기화 Reset
              </button>
            </div>
          </div>
          <div>
            <Label kr="수입 규모대" en="Annual import scale" />
            <div className="flex flex-wrap gap-1.5">
              {[15, 14, 13, 12, 11, 10, 9, 8, 7, 6].map((code) => {
                const on = scales.has(code);
                const lbl = data?.scale[String(code)]?.[0] ?? `Scale ${code}`;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      setScales((prev) => {
                        const next = new Set(prev);
                        if (next.has(code)) next.delete(code);
                        else next.add(code);
                        return next;
                      });
                    }}
                    className={`whitespace-nowrap rounded-sm border px-2.5 py-1.5 font-mono text-[10.5px] transition ${
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
          </div>
        </div>

        {/* TOOLBAR */}
        <div
          ref={toolbarRef}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <div className="text-[13px] text-muted-foreground">
            <b className="font-mono text-[20px] font-bold text-primary">
              {total.toLocaleString()}
            </b>{" "}
            개사 · companies
          </div>
          <div className="ml-auto flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="cursor-pointer rounded-sm border border-border bg-card px-3 py-2 text-[12px]"
            >
              <option value="scale">수입규모 큰 순 / Scale ↓</option>
              <option value="scale-asc">수입규모 작은 순 / Scale ↑</option>
              <option value="name">업체명순 / Name A–Z</option>
              <option value="ctry">거래국 많은 순 / Most markets</option>
            </select>
            <button
              onClick={exportCsv}
              disabled={!total}
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* GRID */}
        {!data && !loadErr && <GridSkeleton />}
        {loadErr && (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            데이터를 불러오지 못했습니다 · {loadErr}
          </div>
        )}
        {data && (
          <>
            {total === 0 ? (
              <div className="mt-4 rounded-md border border-border bg-card px-6 py-16 text-center text-muted-foreground">
                <div className="text-[15px] font-semibold text-foreground/70">
                  검색 결과가 없습니다 · No results
                </div>
                <div className="mt-1.5 text-[13px]">
                  국가 탭이나 조건을 변경하세요 · Adjust country or filters.
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {pageSlice.map((k) => (
                  <CompanyCard
                    key={k}
                    data={data}
                    recordIndex={k}
                    onOpen={() => setOpenIdx(k)}
                  />
                ))}
              </div>
            )}

            {/* PAGER */}
            {pages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                <PagerBtn
                  onClick={() => {
                    setPage(page - 1);
                    toolbarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  disabled={page === 1}
                >
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
                    <PagerBtn
                      key={n}
                      active={n === page}
                      onClick={() => {
                        setPage(n);
                        toolbarRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      {n}
                    </PagerBtn>
                  ),
                )}
                <PagerBtn
                  onClick={() => {
                    setPage(page + 1);
                    toolbarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  disabled={page === pages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </PagerBtn>
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  {total.toLocaleString()}개사 중{" "}
                  {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
                  {Math.min(page * PAGE_SIZE, total).toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        <footer className="mt-10 border-t border-border pt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          <div>
            출처 · Source:{" "}
            <span className="font-mono">관세청 수입실적 / Korea Customs Service</span>{" "}
            · 데이터 갱신 · Updated{" "}
            <span className="font-mono">{data?.updated ?? "—"}</span>
          </div>
          <div>
            KOIMA 바이어 매칭 서비스 · Buyer Matching Service | 문의 · Contact:{" "}
            <a href="mailto:seobh@koima.or.kr" className="text-accent hover:underline">
              seobh@koima.or.kr
            </a>
          </div>
        </footer>
      </div>

      {data && (
        <DetailModal
          data={data}
          recordIndex={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}

/* ======== Small UI building blocks ======== */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md border border-border bg-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  kr,
  en,
  note,
}: {
  icon: React.ReactNode;
  kr: string;
  en: string;
  note?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-primary text-white">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[12.5px] font-extrabold leading-tight text-primary">{kr}</h3>
        <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{en}</div>
      </div>
      {note && (
        <span className="rounded-sm bg-secondary px-2 py-1 text-[9px] tracking-wide text-muted-foreground">
          {note}
        </span>
      )}
    </div>
  );
}

function FtaRow({
  title,
  desc,
  badge,
  variant = "default",
}: {
  title: string;
  desc: string;
  badge: string;
  variant?: "default" | "gold";
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-sm bg-paper p-2.5 ${
        variant === "gold" ? "border-l-[3px] border-gold" : "border-l-[3px] border-primary"
      }`}
    >
      <div className="flex-1">
        <b className="text-[12px] font-bold text-foreground">{title}</b>
        <div className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">{desc}</div>
      </div>
      <span
        className={`whitespace-nowrap rounded-sm px-2 py-1 font-mono text-[9px] font-semibold ${
          variant === "gold"
            ? "bg-[oklch(0.92_0.04_75)] text-[oklch(0.45_0.1_75)]"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

function LinkBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-paper px-3 py-2 text-[10.5px] font-semibold text-primary transition hover:border-primary hover:bg-card"
    >
      {children}
      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}

function Counterpart({
  role,
  name,
  info,
  placeholder,
  link,
}: {
  role: string;
  name: string;
  info?: string;
  placeholder?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="rounded-sm border border-border bg-paper p-3">
      <div className="mb-1 text-[8.5px] font-bold uppercase tracking-wider text-destructive">
        {role}
      </div>
      <div className="whitespace-pre-line text-[11.5px] font-bold leading-snug text-foreground">
        {name}
      </div>
      <div className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
        {info}
        {info && (placeholder || link) && <br />}
        {placeholder && <span className="italic text-muted-foreground/50">{placeholder}</span>}
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {link.label} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function BarChart({
  asean,
  total,
  onPick,
}: {
  asean: { kr: string; en: string; n: number }[];
  total: number;
  onPick: (i: number) => void;
}) {
  const max = Math.max(...asean.map((a) => a.n));
  return (
    <div className="flex flex-col gap-1.5">
      {asean.map((a, i) => (
        <button
          key={a.kr}
          onClick={() => onPick(i)}
          className="group flex items-center gap-2.5 text-left"
        >
          <span className="w-16 flex-shrink-0 text-[11px] font-semibold text-foreground transition group-hover:text-accent">
            {a.kr}
          </span>
          <div className="h-[15px] flex-1 overflow-hidden rounded-sm bg-secondary">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-accent to-[oklch(0.65_0.15_220)] transition-all"
              style={{ width: `${Math.max((a.n / max) * 100, 1.5)}%` }}
            />
          </div>
          <span className="w-14 flex-shrink-0 text-right font-mono text-[10.5px] text-muted-foreground">
            {a.n.toLocaleString()}
          </span>
        </button>
      ))}
      <div className="mt-1 font-mono text-[10px] text-muted-foreground/60">
        DB total · {total.toLocaleString()}
      </div>
    </div>
  );
}

function BarsSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="h-3 w-16 animate-pulse rounded-sm bg-secondary" />
          <div className="h-[15px] flex-1 animate-pulse rounded-sm bg-secondary" />
          <div className="h-3 w-12 animate-pulse rounded-sm bg-secondary" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[140px] animate-pulse rounded-md border border-border bg-card"
        />
      ))}
    </div>
  );
}

function CompanyCard({
  data,
  recordIndex,
  onOpen,
}: {
  data: KoimaData;
  recordIndex: number;
  onOpen: () => void;
}) {
  const r = data.records[recordIndex];
  const sc = data.scale[String(r[5])] ?? data.scale["6"];
  const col = SCOLOR[r[5]] ?? SCOLOR[6];
  const totalMk = r[6].length + r[7].length;
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-2.5 rounded-md border border-border bg-card p-4 text-left transition hover:-translate-y-px hover:border-primary hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-bold leading-tight text-foreground group-hover:text-primary">
            {r[1] || "(상호 미상)"}
          </div>
          {r[2] && (
            <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
              {r[2]}
            </div>
          )}
        </div>
        <span
          className="flex-shrink-0 whitespace-nowrap rounded-sm px-2 py-1 font-mono text-[9.5px] font-semibold"
          style={{ color: col[0], background: col[1] }}
        >
          {sc[1]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {r[6].map((ai) => (
          <span
            key={ai}
            className="rounded-sm border border-accent/20 bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent"
          >
            {data.asean[ai].kr}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {r[3] ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-accent/15 bg-accent-soft px-2 py-0.5 text-[10.5px] text-accent">
            <Mail className="h-3 w-3" />
            <span className="max-w-[180px] truncate">{r[3]}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10.5px] text-muted-foreground/50">
            <Mail className="h-3 w-3" />
            이메일 미등록
          </span>
        )}
        {r[4] && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-paper px-2 py-0.5 text-[10.5px] text-muted-foreground">
            <Phone className="h-3 w-3" />
            {r[4]}
          </span>
        )}
      </div>
      <div className="flex gap-4 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <span>
          사업자 · Biz{" "}
          <b className="font-mono font-bold text-primary">{r[0] || "—"}</b>
        </span>
        <span>
          총 거래국 · Markets{" "}
          <b className="font-mono font-bold text-primary">{totalMk}</b>
        </span>
      </div>
    </button>
  );
}

function PagerBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-sm border font-mono text-[12px] transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      } disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground`}
    >
      {children}
    </button>
  );
}

function Label({ kr, en }: { kr: string; en: string }) {
  return (
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {kr}{" "}
      <span className="font-normal text-muted-foreground/60 normal-case">/ {en}</span>
    </div>
  );
}

function Building2Icon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  );
}
