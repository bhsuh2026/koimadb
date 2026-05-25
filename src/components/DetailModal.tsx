import { useEffect } from "react";
import type { Company } from "@/lib/koima-types";
import { SCALE, SCOLOR, ASEAN } from "@/lib/koima-types";
import { X, Mail, Phone, Building2 } from "lucide-react";

type Props = {
  company: Company | null;
  onClose: () => void;
};

const ASEAN_SET = new Set(ASEAN.map((a) => a.kr));

export function DetailModal({ company, onClose }: Props) {
  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [company, onClose]);

  if (!company) return null;
  const sc = SCALE[company.scale_code] ?? SCALE[6];
  const col = SCOLOR[company.scale_code] ?? SCOLOR[6];
  const aseanList = company.asean_countries.filter((c) => ASEAN_SET.has(c));
  const others = company.other_countries;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl border-t-[3px] border-accent bg-card shadow-2xl sm:rounded-xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold leading-tight text-primary sm:text-lg">
              {company.name_kr || "(상호 미상)"}
            </h3>
            {company.name_en && (
              <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                {company.name_en}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="사업자번호 · Business No.">
              <span className="font-mono text-sm">{company.biz_no || "—"}</span>
            </Field>
            <Field label="수입 규모 · Import Scale">
              <span
                className="inline-block rounded-sm px-2 py-1 font-mono text-[11px] font-semibold"
                style={{ color: col[0], background: col[1] }}
              >
                {sc[0]}
              </span>
            </Field>
            <Field label="이메일 · Email">
              {company.email ? (
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-accent hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  {company.email}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground/60">미등록 N/A</span>
              )}
            </Field>
            <Field label="전화 · Phone">
              {company.phone ? (
                <a
                  href={`tel:${company.phone}`}
                  className="inline-flex items-center gap-1.5 font-mono text-sm text-accent hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {company.phone}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground/60">미등록 N/A</span>
              )}
            </Field>
          </div>

          <SectionHeading>
            수입 거래국 · Sourcing Markets ({aseanList.length + others.length})
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              · 파란색: 아세안
            </span>
          </SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {aseanList.map((n) => (
              <span
                key={`a-${n}`}
                className="rounded-sm border border-accent bg-accent px-2 py-1 text-[11.5px] font-semibold text-accent-foreground"
              >
                {n}
              </span>
            ))}
            {others.map((n) => (
              <span
                key={`o-${n}`}
                className="rounded-sm border border-border bg-secondary px-2 py-1 text-[11.5px] text-secondary-foreground"
              >
                {n}
              </span>
            ))}
          </div>

          <div className="mt-6 rounded-md border-l-[3px] border-primary bg-secondary/60 p-4 text-[12px] leading-relaxed text-muted-foreground">
            <Building2 className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom text-primary" />
            이 업체와의 매칭·소개를 원하시면 KOIMA로 문의하세요.{" "}
            <b className="text-primary">seobh@koima.or.kr</b>
            <div className="mt-1 text-[11px] text-muted-foreground/70">
              For an introduction to this buyer, contact KOIMA Buyer Matching Service.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-primary">
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
