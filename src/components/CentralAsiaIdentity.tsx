import type { ReactNode } from "react";
import registan from "@/assets/central-asia-registan.jpg";
import { displayCountry, flagOf } from "@/lib/koima-types";
import { useLang } from "@/lib/i18n";

const countries = ["카자흐스탄", "우즈베키스탄", "키르기스스탄", "타지키스탄", "투르크멘"];

export function CentralAsiaIdentity({ children }: { children: ReactNode }) {
  const { t, lang } = useLang();
  return (
    <>
      <div className="central-asia-cover relative isolate overflow-hidden">
        <img src={registan} alt="" width={1920} height={768} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="central-asia-shade absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="mb-3 flex items-center gap-3 text-xs font-medium text-region-on-cover/90">
            <span className="h-px w-8 bg-region-gold" />
            KOIMA · {t("한국 수입업체", "KOREAN IMPORTERS", undefined, "ИМПОРТЁРЫ КОРЕИ")}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-region-on-cover sm:text-5xl">
            {t("중앙아시아 5개국", "Central Asia", undefined, "Центральная Азия")}
          </h1>
          <p className="mt-3 text-sm text-region-on-cover/90 sm:text-base">
            {t("중앙아시아와 거래하는 한국 바이어 기업정보", "Korean buyer companies trading with Central Asia", undefined, "Корейские компании-покупатели, торгующие с Центральной Азией")}
          </p>
          <div className="mt-7 max-w-3xl text-foreground">{children}</div>
        </div>
      </div>
      <div className="central-asia-country-band border-b border-region-teal/20 bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-4 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-5">
          {countries.map((country) => (
            <div key={country} className="flex min-w-0 items-center gap-2.5">
              <span className="shrink-0 text-2xl" aria-hidden="true">{flagOf(country)}</span>
              <span className="break-words text-xs font-medium text-foreground sm:text-sm">{displayCountry(country, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}