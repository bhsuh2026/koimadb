import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, ExternalLink, Building2, Printer, Flag } from "lucide-react";
import { flagOf, displayCountry } from "@/lib/koima-types";
import { useLang } from "@/lib/i18n";

export type RegionKey = "asean" | "eu" | "cis";

type Counterpart = {
  title_kr: string;
  title_en: string;
  category_kr: string;
  category_en: string;
  desc_kr: string;
  desc_en: string;
  href?: string;
  hrefLabel?: string;
};

type Props = {
  regionKey: RegionKey;
  lockedCountries: string[];
  countryCounts: Record<string, number>;
  lockedLabel?: string;
};

const REGION_INFO: Record<
  RegionKey,
  {
    snapshotTitleKr: string;
    snapshotTitleEn: string;
    ftaTitleKr: string;
    ftaTitleEn: string;
    intro_kr: string;
    intro_en: string;
    ftas: { name: string; desc_kr: string; desc_en: string; status_kr: string; status_en: string }[];
    portals: { label_kr: string; label_en: string; href: string }[];
    counterparts: Counterpart[];
  }
> = {
  asean: {
    snapshotTitleKr: "한-아세안 교역 스냅샷",
    snapshotTitleEn: "Korea–ASEAN Trade Snapshot",
    ftaTitleKr: "적용 가능 FTA · 특혜관세",
    ftaTitleEn: "Applicable FTAs & Preferential Tariffs",
    intro_kr:
      "아세안 교역에는 한-아세안 FTA와 RCEP이 공통 적용되며, 베트남·싱가포르는 양자 FTA도 함께 적용됩니다. 수입자는 품목별로 더 유리한 특혜세율을 선택할 수 있습니다.",
    intro_en:
      "Korea–ASEAN trade is covered by AKFTA and RCEP, with bilateral FTAs additionally applying to Vietnam and Singapore. Importers may apply the most favourable preferential rate per item.",
    ftas: [
      {
        name: "한-아세안 FTA (AKFTA)",
        desc_kr: "아세안 10개국 공통 적용 · 상호대응세율 제도 운영",
        desc_en: "Applies across all 10 ASEAN members; mutual response tariff system.",
        status_kr: "발효 중",
        status_en: "In force",
      },
      {
        name: "RCEP",
        desc_kr: "아세안 10개국 포함 · 누적 원산지 기준 활용 가능",
        desc_en: "Includes ASEAN 10; supports cumulative rules of origin.",
        status_kr: "발효 중",
        status_en: "In force",
      },
      {
        name: "양자 FTA",
        desc_kr: "한-베트남 FTA(VKFTA), 한-싱가포르 FTA 등 개별국 협정 별도 적용",
        desc_en: "Bilateral deals such as VKFTA and KSFTA apply per country.",
        status_kr: "국가별",
        status_en: "Per country",
      },
    ],
    portals: [
      { label_kr: "FTA 포털 · 수입세율 조회", label_en: "FTA Portal · Tariff lookup", href: "https://www.customs.go.kr/ftaportalkor/main.do" },
      { label_kr: "관세청 UNI-PASS · 통관", label_en: "Korea Customs UNI-PASS", href: "https://unipass.customs.go.kr/" },
      { label_kr: "관세청 · 관세법령정보", label_en: "Korea Customs · Law Portal", href: "https://unipass.customs.go.kr/clip/index.do" },
      { label_kr: "KOTRA · 아세안 시장정보", label_en: "KOTRA · ASEAN Market Info", href: "https://news.kotra.or.kr/" },
    ],
    counterparts: [
      {
        title_kr: "한-아세안센터",
        title_en: "ASEAN-Korea Centre",
        category_kr: "권역 협력 · ASEAN-Korea",
        category_en: "Regional cooperation",
        desc_kr: "서울 소재 · 한-아세안 무역·투자·문화 협력 기관",
        desc_en: "Seoul-based intergovernmental body for ASEAN–Korea trade, investment & culture.",
        href: "https://www.aseankorea.org/",
        hrefLabel: "aseankorea.org",
      },
      {
        title_kr: "아세안 각국 주한 대사관",
        title_en: "ASEAN Embassies in Korea",
        category_kr: "주한 대사관 · Embassies",
        category_en: "Diplomatic missions",
        desc_kr: "국가별 대사관 — 선택국에 따라 정보 갱신 예정",
        desc_en: "Per-country embassies — directory pending update.",
      },
      {
        title_kr: "KOTRA 아세안 무역관",
        title_en: "KOTRA ASEAN Trade Offices",
        category_kr: "KOTRA 무역관 · ASEAN",
        category_en: "Trade promotion",
        desc_kr: "하노이·방콕·자카르타·싱가포르·마닐라 등",
        desc_en: "Hanoi · Bangkok · Jakarta · Singapore · Manila and more.",
        href: "https://www.kotra.or.kr/",
        hrefLabel: "kotra.or.kr",
      },
    ],
  },
  eu: {
    snapshotTitleKr: "한-EU 교역 스냅샷",
    snapshotTitleEn: "Korea–EU Trade Snapshot",
    ftaTitleKr: "적용 가능 FTA · 특혜관세",
    ftaTitleEn: "Applicable FTAs & Preferential Tariffs",
    intro_kr:
      "한-EU FTA가 EU 27개 회원국 전체에 동일하게 적용되며, EFTA 국가는 별도 협정을 따릅니다. 자율 원산지 인증제(Approved Exporter)를 활용해 특혜세율을 적용할 수 있습니다.",
    intro_en:
      "The Korea–EU FTA applies uniformly across all 27 EU member states; EFTA countries fall under a separate agreement. Approved exporters can claim preferential rates.",
    counterparts: [
      {
        title_kr: "주한 EU 대표부",
        title_en: "EU Delegation to Korea",
        category_kr: "권역 협력 · EU",
        category_en: "Regional cooperation",
        desc_kr: "서울 소재 · 한-EU 통상·정치 대화 창구",
        desc_en: "Seoul-based mission for Korea–EU trade and political dialogue.",
        href: "https://www.eeas.europa.eu/delegations/republic-korea_en",
        hrefLabel: "eeas.europa.eu",
      },
      {
        title_kr: "EU 회원국 주한 대사관",
        title_en: "EU Member State Embassies",
        category_kr: "주한 대사관 · Embassies",
        category_en: "Diplomatic missions",
        desc_kr: "국가별 대사관 — 선택국에 따라 정보 갱신 예정",
        desc_en: "Per-country embassies — directory pending update.",
      },
      {
        title_kr: "KOTRA 유럽 무역관",
        title_en: "KOTRA Europe Trade Offices",
        category_kr: "KOTRA 무역관 · Europe",
        category_en: "Trade promotion",
        desc_kr: "프랑크푸르트·파리·암스테르담·밀라노·마드리드 등",
        desc_en: "Frankfurt · Paris · Amsterdam · Milan · Madrid and more.",
        href: "https://www.kotra.or.kr/",
        hrefLabel: "kotra.or.kr",
      },
    ],
    ftas: [
      {
        name: "한-EU FTA",
        desc_kr: "EU 27개 회원국 전체에 동일 적용 · 자율 원산지 인증제 운영",
        desc_en: "Applies uniformly across all 27 EU member states; approved exporter system.",
        status_kr: "발효 중",
        status_en: "In force",
      },
      {
        name: "한-EFTA FTA (참고)",
        desc_kr: "스위스·노르웨이·아이슬란드·리히텐슈타인 (EU 외)",
        desc_en: "Covers EFTA states outside the EU.",
        status_kr: "참고",
        status_en: "Reference",
      },
    ],
    portals: [
      { label_kr: "FTA 포털 · 수입세율 조회", label_en: "FTA Portal · Tariff lookup", href: "https://www.customs.go.kr/ftaportalkor/main.do" },
      { label_kr: "관세청 UNI-PASS · 통관", label_en: "Korea Customs UNI-PASS", href: "https://unipass.customs.go.kr/" },
      { label_kr: "KOTRA · 유럽 시장정보", label_en: "KOTRA · Europe Market Info", href: "https://news.kotra.or.kr/" },
    ],
  },
  cis: {
    snapshotTitleKr: "한-CIS 교역 스냅샷",
    snapshotTitleEn: "Korea–CIS Trade Snapshot",
    ftaTitleKr: "적용 가능 협정 · 특혜관세",
    ftaTitleEn: "Applicable Agreements & Preferential Tariffs",
    intro_kr:
      "한-CIS 간 FTA는 미발효 상태로, EAEU 관세동맹·CIS 자유무역지대 등 권역 협정과 양자 합의에 따라 품목별 세율이 달라집니다. 일반적으로 MFN 세율이 적용되는 경우가 많습니다.",
    intro_en:
      "No Korea–CIS FTA is in force. Tariffs depend on the EAEU customs union, intra-CIS arrangements, and bilateral terms; MFN rates often apply.",
    counterparts: [
      {
        title_kr: "CIS 각국 주한 대사관",
        title_en: "CIS Embassies in Korea",
        category_kr: "주한 대사관 · Embassies",
        category_en: "Diplomatic missions",
        desc_kr: "러시아·우즈베키스탄·카자흐스탄 등 국가별 대사관",
        desc_en: "Per-country embassies including Russia, Uzbekistan, Kazakhstan.",
      },
      {
        title_kr: "KOTRA 러시아·CIS 무역관",
        title_en: "KOTRA Russia & CIS Trade Offices",
        category_kr: "KOTRA 무역관 · CIS",
        category_en: "Trade promotion",
        desc_kr: "모스크바·상트페테르부르크·타슈켄트·알마티 등",
        desc_en: "Moscow · St. Petersburg · Tashkent · Almaty and more.",
        href: "https://www.kotra.or.kr/",
        hrefLabel: "kotra.or.kr",
      },
      {
        title_kr: "한-러 협력 기관",
        title_en: "Korea–Russia cooperation bodies",
        category_kr: "권역 협력 · CIS",
        category_en: "Regional cooperation",
        desc_kr: "한-러 경제과학기술공동위 등 정부간 협력 채널",
        desc_en: "Intergovernmental committees on Korea–Russia economic cooperation.",
      },
    ],
    ftas: [
      {
        name: "EAEU 관세동맹 (참고)",
        desc_kr: "러시아·카자흐스탄·벨라루스·키르기스스탄·아르메니아 공통 관세",
        desc_en: "Customs union covering Russia, Kazakhstan, Belarus, Kyrgyzstan, Armenia.",
        status_kr: "참고",
        status_en: "Reference",
      },
      {
        name: "CIS 자유무역지대",
        desc_kr: "CIS 회원국 간 상호 관세 인하 및 통상 편의화 협정",
        desc_en: "Intra-CIS preferential tariff and trade facilitation arrangements.",
        status_kr: "참고",
        status_en: "Reference",
      },
      {
        name: "양자 협정",
        desc_kr: "한-CIS 간 FTA는 미발효 · 품목별 양자 협정 또는 일반 관세 적용",
        desc_en: "No Korea–CIS FTA in force; bilateral or MFN tariffs apply by item.",
        status_kr: "국가별",
        status_en: "Per country",
      },
    ],
    portals: [
      { label_kr: "관세청 UNI-PASS · 통관", label_en: "Korea Customs UNI-PASS", href: "https://unipass.customs.go.kr/" },
      { label_kr: "KOTRA · 러시아·CIS 시장정보", label_en: "KOTRA · Russia & CIS Market Info", href: "https://news.kotra.or.kr/" },
      { label_kr: "관세청 · 관세법령정보", label_en: "Korea Customs · Law Portal", href: "https://unipass.customs.go.kr/clip/index.do" },
    ],
  },
};

export function RegionSnapshot({ regionKey, lockedCountries, countryCounts, lockedLabel }: Props) {
  const { t, lang } = useLang();
  const info = REGION_INFO[regionKey];

  const rows = useMemo(() => {
    const list = lockedCountries
      .map((c) => ({ name: c, count: countryCounts[c] ?? 0 }))
      .sort((a, b) => b.count - a.count);
    return list;
  }, [lockedCountries, countryCounts]);

  const max = rows[0]?.count ?? 0;
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <>
    <section className="mb-6 grid gap-4 lg:grid-cols-2">
      {/* Trade snapshot bar chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-2">
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">
            <BarChart3 className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">
              {t(info.snapshotTitleKr, info.snapshotTitleEn)}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {lockedLabel && <span className="mr-1">{lockedLabel}</span>}
              {t("총", "Total")}{" "}
              <span className="font-semibold text-foreground">
                {total.toLocaleString()}
              </span>
              {t("개 거래업체", " importers")}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {rows.map((r) => {
            const pct = max > 0 ? (r.count / max) * 100 : 0;
            return (
              <Link
                key={r.name}
                to="/c/$country"
                params={{ country: encodeURIComponent(r.name) }}
                className="group grid grid-cols-[88px_1fr_60px] items-center gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-accent"
                title={t(`${displayCountry(r.name, lang)} 전용 페이지`, `${displayCountry(r.name, lang)} page`)}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{flagOf(r.name)}</span>
                  <span className="truncate font-medium text-foreground group-hover:text-primary">
                    {displayCountry(r.name, lang)}
                  </span>
                </span>
                <span className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/70 transition-all group-hover:bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="text-right tabular-nums text-muted-foreground group-hover:text-foreground">
                  {r.count.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          {t(
            "막대를 클릭하면 해당 국가 디렉토리로 이동합니다.",
            "Click a bar to open the country directory.",
          )}
        </p>
      </div>

      {/* FTA & customs */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-start gap-2">
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">§</div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">
              {t(info.ftaTitleKr, info.ftaTitleEn)}
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                {t("정보 안내용 · 세율은 공식 포털 확인", "Informational · verify on official portals")}
              </span>
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {t(info.intro_kr, info.intro_en)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {info.ftas.map((f) => (
            <div
              key={f.name}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold">{f.name}</div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t(f.desc_kr, f.desc_en)}
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {t(f.status_kr, f.status_en)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Tariff lookup section */}
    <section className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <div className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Printer className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            {t("품목별 관세율 · 원산지 · 통관 확인", "Tariff, Origin & Customs — Official Lookup")}
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {t("실시간 세율은 아래 공식 포털에서 조회", "Live rates via official portals below")}
            </span>
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t(
              "정확한 품목별(HS코드) 관세율과 원산지결정기준은 협정·국가별로 다르고 수시로 변동되므로, 아래 관세청 공식 포털에서 직접 조회하시기 바랍니다. 본 페이지는 안내 목적이며 세율 수치를 직접 제공하지 않습니다.",
              "HS-code tariffs and origin rules vary by agreement and country and change frequently. Use the official Korea Customs portals below; this page is informational and does not provide tariff figures.",
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {info.portals.map((p) => (
          <a
            key={p.href}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] text-foreground/80 transition hover:border-primary hover:text-primary"
          >
            <Building2 className="size-3" />
            {t(p.label_kr, p.label_en)}
            <ExternalLink className="size-2.5" />
          </a>
        ))}
      </div>
    </section>

    {/* Counterpart institutions */}
    <section className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <div className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Flag className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            {t("카운터파트 · 협력 기관", "Counterpart Institutions & Contacts")}
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {t("대사관별 정보는 확인 후 갱신 예정", "Embassy details pending update")}
            </span>
          </h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {info.counterparts.map((c) => (
          <div
            key={c.title_kr}
            className="flex flex-col rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <div className="text-[10px] font-medium uppercase tracking-wide text-primary/80">
              {t(c.category_kr, c.category_en)}
            </div>
            <div className="mt-0.5 text-xs font-semibold">{t(c.title_kr, c.title_en)}</div>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">
              {t(c.desc_kr, c.desc_en)}
            </p>
            {c.href && (
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                {c.hrefLabel ?? c.href}
                <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
    </>
  );
}
