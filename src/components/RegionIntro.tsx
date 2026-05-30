import { BarChart3, FileText, Scale, Building2, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";

type Country = { kr: string; en: string; flag: string };

type Props = {
  region: "asean" | "eu" | "cis";
  counts: Record<string, number>;
  grandTotal: number;
  countries: Country[];
  onPickCountry: (kr: string) => void;
};

export function RegionIntro({ region, counts, grandTotal, countries, onPickCountry }: Props) {
  const { t, lang } = useLang();

  // 상위 정렬 — 막대그래프용
  const ranked = [...countries]
    .map((c) => ({ ...c, n: counts[c.kr] ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...ranked.map((r) => r.n));

  const isAsean = region === "asean";
  const isEu = region === "eu";

  // 지역별 FTA / 링크 / 기관 데이터
  const ftas = isAsean
    ? [
        {
          title: "한-아세안 FTA (AKFTA)",
          desc: t("아세안 10개국 공통 적용 · 상호대응세율 제도 운영", "Common to all 10 ASEAN members · reciprocal tariff regime"),
          tag: t("발효 중", "In force"),
          tone: "ok" as const,
        },
        {
          title: "RCEP",
          desc: t("아세안 10개국 포함 · 누적 원산지 기준 활용 가능", "Includes all 10 ASEAN members · cumulative rules of origin"),
          tag: t("발효 중", "In force"),
          tone: "ok" as const,
        },
        {
          title: t("양자 FTA", "Bilateral FTA"),
          desc: t("한-베트남 FTA(VKFTA), 한-싱가포르 FTA 등 개별국 협정 별도 적용", "KR–VN VKFTA, KR–SG FTA and other bilateral agreements"),
          tag: t("국가별", "By country"),
          tone: "muted" as const,
        },
      ]
    : isEu
      ? [
          {
            title: "한-EU FTA (KOREU FTA)",
            desc: t("EU 27개국 공통 적용 · 사실상 모든 공산품 무관세", "Applies across all 27 EU members · zero tariff on most industrial goods"),
            tag: t("발효 중", "In force"),
            tone: "ok" as const,
          },
          {
            title: t("원산지 자율증명", "Approved Exporter / REX"),
            desc: t("인증수출자 또는 REX 시스템 기반 원산지 자율증명 활용", "Self-certification via Approved Exporter or REX system"),
            tag: t("운영 중", "Active"),
            tone: "ok" as const,
          },
          {
            title: t("부가 협정", "Adjacent Agreements"),
            desc: t("한-EFTA FTA(스위스·노르웨이 등), 한-영국 FTA 별도 적용", "KR–EFTA (CH, NO, IS, LI) and KR–UK FTA apply separately"),
            tag: t("별도 적용", "Separate"),
            tone: "muted" as const,
          },
        ]
      : [
          {
            title: t("CIS 자유무역지대", "CIS Free Trade Zone"),
            desc: t("CIS 회원국 간 상호 관세 인하 및 통상 편의화 협정", "Intra-CIS preferential tariff and trade facilitation agreements"),
            tag: t("운영 중", "Active"),
            tone: "ok" as const,
          },
          {
            title: t("한-러시아 협력", "KR–Russia Cooperation"),
            desc: t("한-러시아 경제·과학기술 협력 및 투자 보호 조약", "Economic, S&T cooperation and investment protection treaties"),
            tag: t("운영 중", "Active"),
            tone: "ok" as const,
          },
          {
            title: t("양자 FTA", "Bilateral FTA"),
            desc: t("국가별 양자 협정 별도 적용 · 협정 세부사항은 공식 포털 확인", "Separate bilateral agreements by country · consult official portals"),
            tag: t("국가별", "By country"),
            tone: "muted" as const,
          },
        ];

  const lookups = isAsean
    ? [
        { label: t("FTA 포털 · 수입세율 조회", "FTA Portal · Import Tariffs"), href: "https://www.customs.go.kr/ftaportalkor/main.do" },
        { label: t("관세청 UNI-PASS · 통관", "KCS UNI-PASS · Customs"), href: "https://unipass.customs.go.kr/" },
        { label: t("관세청 · 관세법령정보", "KCS · Customs Law Info"), href: "https://www.customs.go.kr/" },
        { label: t("KOTRA · 아세안 시장정보", "KOTRA · ASEAN Market Info"), href: "https://news.kotra.or.kr/" },
      ]
    : isEu
      ? [
          { label: t("FTA 포털 · 수입세율 조회", "FTA Portal · Import Tariffs"), href: "https://www.customs.go.kr/ftaportalkor/main.do" },
          { label: t("관세청 UNI-PASS · 통관", "KCS UNI-PASS · Customs"), href: "https://unipass.customs.go.kr/" },
          { label: t("EU TARIC · 품목별 관세", "EU TARIC · Tariff Database"), href: "https://taric.ec.europa.eu/" },
          { label: t("KOTRA · EU 시장정보", "KOTRA · EU Market Info"), href: "https://news.kotra.or.kr/" },
        ]
      : [
          { label: t("FTA 포털 · 수입세율 조회", "FTA Portal · Import Tariffs"), href: "https://www.customs.go.kr/ftaportalkor/main.do" },
          { label: t("관세청 UNI-PASS · 통관", "KCS UNI-PASS · Customs"), href: "https://unipass.customs.go.kr/" },
          { label: t("EAEU 관세동맹 포털", "EAEU Customs Union Portal"), href: "https://www.eaeunion.org/" },
          { label: t("KOTRA · 러시아·CIS 시장정보", "KOTRA · Russia & CIS Market Info"), href: "https://news.kotra.or.kr/" },
        ];

  const partners = isAsean
    ? [
        {
          tag: t("권역 협력 · ASEAN-Korea", "Regional · ASEAN-Korea"),
          name: t("한-아세안센터", "ASEAN-Korea Centre"),
          desc: t("서울 소재 · 한-아세안 무역·투자·문화 협력 기관", "Seoul-based intergovernmental body for trade, investment and culture"),
          href: "https://www.aseankorea.org/",
        },
        {
          tag: t("주한 대사관 · Embassies", "Embassies in Korea"),
          name: t("아세안 각국 주한 대사관", "ASEAN Embassies in Seoul"),
          desc: t("국가별 대사관 — 공식 채널을 통한 바이어 매칭 지원", "Country embassies — buyer matching via official channels"),
          href: null,
        },
        {
          tag: t("KOTRA 무역관 · ASEAN", "KOTRA · ASEAN"),
          name: t("KOTRA 아세안 무역관", "KOTRA ASEAN Trade Offices"),
          desc: t("하노이·방콕·자카르타·싱가포르·마닐라 등", "Hanoi · Bangkok · Jakarta · Singapore · Manila, etc."),
          href: "https://www.kotra.or.kr/",
        },
      ]
    : isEu
      ? [
          {
            tag: t("권역 협력 · EU-Korea", "Regional · EU-Korea"),
            name: t("주한 EU 대표부", "Delegation of the EU to Korea"),
            desc: t("서울 소재 · 한-EU 통상·정책 협력 채널", "Seoul-based · EU trade and policy liaison"),
            href: "https://www.eeas.europa.eu/delegations/republic-korea_en",
          },
          {
            tag: t("주한 대사관 · Embassies", "Embassies in Korea"),
            name: t("EU 회원국 주한 대사관", "EU Member-State Embassies in Seoul"),
            desc: t("국가별 대사관 — 공식 채널을 통한 바이어 매칭 지원", "Country embassies — buyer matching via official channels"),
            href: null,
          },
          {
            tag: t("KOTRA 무역관 · EU", "KOTRA · EU"),
            name: t("KOTRA 유럽 무역관", "KOTRA Europe Trade Offices"),
            desc: t("프랑크푸르트·파리·밀라노·암스테르담·바르샤바 등", "Frankfurt · Paris · Milan · Amsterdam · Warsaw, etc."),
            href: "https://www.kotra.or.kr/",
          },
        ]
      : [
          {
            tag: t("권역 협력 · EAEU", "Regional · EAEU"),
            name: t("유라시아경제연합(EAEU)", "Eurasian Economic Union (EAEU)"),
            desc: t("러시아·카자흐스탄·벨라루스 등 관세동맹 및 경제통합 기구", "Customs union and economic integration body covering RU, KZ, BY and others"),
            href: "https://www.eaeunion.org/",
          },
          {
            tag: t("주한 대사관 · Embassies", "Embassies in Korea"),
            name: t("CIS 각국 주한 대사관", "CIS Embassies in Seoul"),
            desc: t("국가별 대사관 — 공식 채널을 통한 바이어 매칭 지원", "Country embassies — buyer matching via official channels"),
            href: null,
          },
          {
            tag: t("KOTRA 무역관 · CIS", "KOTRA · CIS"),
            name: t("KOTRA 러시아·CIS 무역관", "KOTRA Russia & CIS Trade Offices"),
            desc: t("모스크바·알마티·타슈켄트·키예프·타슈켄트 등", "Moscow · Almaty · Tashkent · Kyiv, etc."),
            href: "https://www.kotra.or.kr/",
          },
        ];

  const regionLabel = isAsean ? t("아세안", "ASEAN") : isEu ? t("EU", "EU") : t("CIS", "CIS");
  const tradeNote = isAsean
    ? t(
        "아세안은 한국의 핵심 교역 권역으로, 전 회원국과 거래하는 한국 수입업체가 폭넓게 분포합니다.",
        "ASEAN is a core trade region for Korea, with importers active across all member states.",
      )
    : isEu
      ? t(
          "EU는 한-EU FTA 발효 이후 한국의 최대 선진 시장 중 하나로, 27개 회원국과 폭넓은 수입 거래가 이루어지고 있습니다.",
          "Since the KOREU FTA, the EU has been one of Korea's largest advanced markets, with trade across all 27 members.",
        )
      : t(
          "CIS는 풍부한 자원과 성장 잠재력을 가진 한국의 중요 교역 권역으로, 러시아·카자흐스탄 중심으로 수입 거래가 활발합니다.",
          "The CIS is an important trade region for Korea rich in resources and growth potential, with active imports centered on Russia and Kazakhstan.",
        );

  return (
    <section className="mx-auto max-w-[1300px] px-4 pt-8 sm:px-6 sm:pt-10">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== Trade snapshot ===== */}
        <Card>
          <CardHead
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            kr={t(`한-${regionLabel} 교역 스냅샷`, `Korea–${regionLabel} Trade Snapshot`)}
            en={t(`Korea–${regionLabel} Trade Snapshot`, `한-${regionLabel} 교역 스냅샷`)}
          />
          <div className="mt-4 space-y-2">
            {ranked.slice(0, isAsean ? 10 : isEu ? 12 : 12).map((r) => {
              const w = (r.n / max) * 100;
              return (
                <button
                  key={r.kr}
                  onClick={() => onPickCountry(r.kr)}
                  className="group grid w-full grid-cols-[88px_1fr_56px] items-center gap-2 text-left sm:grid-cols-[110px_1fr_64px]"
                >
                  <span className="flex items-center gap-1.5 truncate text-[12px] font-semibold text-foreground/85">
                    <span className="text-sm leading-none">{r.flag}</span>
                    <span className="truncate">{lang === "en" ? r.en : r.kr}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all group-hover:opacity-80"
                      style={{ width: `${Math.max(3, w)}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                    {r.n.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
            {t("막대를 클릭하면 해당국 디렉토리로 이동합니다.", "Click a bar to filter the directory by that country.")}{" "}
            {tradeNote}
          </p>
          <p className="mt-2 text-[10.5px] text-muted-foreground/70">
            * {t("거래업체 수는 본 데이터베이스 기준", "Counts are based on this database")} · {t("총", "Total")}{" "}
            <b className="font-mono text-foreground">{grandTotal.toLocaleString()}</b>
          </p>
        </Card>

        {/* ===== FTAs ===== */}
        <Card>
          <CardHead
            icon={<FileText className="h-3.5 w-3.5" />}
            kr={t("적용 가능 FTA · 특혜관세", "Applicable FTAs · Preferential Tariffs")}
            en={t("Applicable FTAs & Preferential Tariffs", "적용 가능 FTA · 특혜관세")}
            sub={t("정보 안내용 · 세율은 공식 포털 확인", "Reference only · check official portals")}
          />
          <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/80">
            {isAsean
              ? t(
                  "아세안 교역에는 한-아세안 FTA와 RCEP이 공통 적용되며, 베트남·싱가포르는 양자 FTA도 함께 적용됩니다. 수입자는 품목별로 더 유리한 특혜세율을 선택할 수 있습니다.",
                  "Both AKFTA and RCEP apply to ASEAN trade; VN and SG also have bilateral FTAs. Importers may select the more favourable preferential tariff per item.",
                )
              : t(
                  "EU 교역에는 한-EU FTA가 공통 적용되며, 스위스·노르웨이는 한-EFTA, 영국은 한-영국 FTA가 별도 적용됩니다. 수입자는 품목별로 가장 유리한 협정을 선택할 수 있습니다.",
                  "The KOREU FTA covers all 27 EU members; KR–EFTA covers CH/NO/IS/LI and KR–UK FTA covers the UK. Importers may select the most favourable agreement per item.",
                )}
          </p>
          <div className="mt-4 space-y-2.5">
            {ftas.map((f) => (
              <div
                key={f.title}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/60 p-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-foreground">{f.title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{f.desc}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    f.tone === "ok"
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ===== Tariff lookup ===== */}
        <Card>
          <CardHead
            icon={<Scale className="h-3.5 w-3.5" />}
            kr={t("품목별 관세율 · 원산지 · 통관 확인", "Tariff · Origin · Customs Lookup")}
            en={t("Tariff, Origin & Customs — Official Lookup", "품목별 관세율 · 원산지 · 통관 확인")}
            sub={t("실시간 세율은 공식 포털에서 조회", "Live rates via official portals")}
          />
          <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/80">
            {t(
              "정확한 품목별(HS코드) 관세율과 원산지결정기준은 협정·국가별로 다르고 수시로 변동되므로, 아래 공식 포털에서 직접 조회하시기 바랍니다. 본 페이지는 안내 목적이며 세율 수치를 직접 제공하지 않습니다.",
              "Tariff rates and rules of origin vary by agreement and change frequently — consult the official portals below for accurate figures. This page is informational only.",
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {lookups.map((l) => (
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

        {/* ===== Counterpart institutions ===== */}
        <Card>
          <CardHead
            icon={<Building2 className="h-3.5 w-3.5" />}
            kr={t("카운터파트 · 협력 기관", "Counterpart Institutions & Contacts")}
            en={t("Counterpart Institutions & Contacts", "카운터파트 · 협력 기관")}
            sub={t("대사관별 정보는 확인 후 갱신 예정", "Embassy contacts to be updated")}
          />
          <div className="mt-4 grid gap-2.5">
            {partners.map((p) => (
              <div
                key={p.name}
                className="rounded-lg border border-border bg-background/60 p-3"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {p.tag}
                </div>
                <div className="mt-1 text-[13px] font-bold text-foreground">{p.name}</div>
                <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{p.desc}</div>
                {p.href && (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                  >
                    {p.href.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
            {t(
              `본 디렉토리는 KOIMA와 ${isAsean ? "아세안" : "EU"} 각국 주한 대사관·협력기관의 공동 운영으로 발전시켜 나갑니다. 각 대사관은 자국 수출기업에 공식 채널을 제공하고, KOIMA는 검증된 한국 바이어 네트워크를 연결합니다.`,
              `This directory is jointly developed with embassies and partner agencies. Each embassy provides an official channel for its exporters; KOIMA connects them to verified Korean buyer networks.`,
            )}
          </p>
        </Card>
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">{children}</div>
  );
}

function CardHead({
  icon,
  kr,
  en,
  sub,
}: {
  icon: React.ReactNode;
  kr: string;
  en: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <div className="text-[15px] font-extrabold leading-tight text-foreground">{kr}</div>
          <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {en}
          </div>
        </div>
      </div>
      {sub && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          {sub}
        </span>
      )}
    </div>
  );
}
