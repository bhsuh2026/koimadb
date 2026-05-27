import { useMemo, useRef, useState } from "react";
import type PapaType from "papaparse";

let papaPromise: Promise<typeof PapaType> | null = null;
const loadPapa = () => {
  if (!papaPromise) {
    papaPromise = import("papaparse").then((m) => (m.default ?? m) as typeof PapaType);
  }
  return papaPromise;
};
import { X, Upload, FileCheck2, AlertTriangle, Download, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateCompanies } from "@/lib/companies.functions";
import { ASEAN, SCALE, type CompanyInput } from "@/lib/koima-types";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
  onDone: () => void;
};

type RowError = { row: number; field: string; message: string; raw: string };

type ParsedRow = {
  rowNum: number;
  raw: Record<string, string>;
  value: CompanyInput | null;
  errors: { field: string; message: string }[];
};

const REQUIRED_HEADERS = ["name_kr"];
const KNOWN_HEADERS = [
  "name_kr",
  "name_en",
  "biz_no",
  "email",
  "phone",
  "scale_code",
  "asean_countries",
  "other_countries",
];

const ASEAN_KR = new Set(ASEAN.map((a) => a.kr));
const VALID_SCALES = new Set(Object.keys(SCALE).map(Number));

const BIZ_NO_RE = /^\d{3}-?\d{2}-?\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitList(v: string): string[] {
  return v
    .split(/[;|,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateRow(rowNum: number, raw: Record<string, string>): ParsedRow {
  const errors: { field: string; message: string }[] = [];
  const get = (k: string) => (raw[k] ?? "").trim();

  const name_kr = get("name_kr");
  if (!name_kr) errors.push({ field: "name_kr", message: "필수값 (업체명 한글)" });
  if (name_kr.length > 255) errors.push({ field: "name_kr", message: "255자 초과" });

  const name_en = get("name_en");
  if (name_en.length > 255) errors.push({ field: "name_en", message: "255자 초과" });

  const biz_no_raw = get("biz_no");
  const biz_no = biz_no_raw || null;
  if (biz_no_raw && !BIZ_NO_RE.test(biz_no_raw)) {
    errors.push({ field: "biz_no", message: "형식 오류 (예: 123-45-67890)" });
  }

  const email = get("email");
  if (email && !EMAIL_RE.test(email)) {
    errors.push({ field: "email", message: "이메일 형식 오류" });
  }

  const phone = get("phone");
  if (phone.length > 50) errors.push({ field: "phone", message: "50자 초과" });

  const scaleStr = get("scale_code") || "6";
  const scale_code = Number(scaleStr);
  if (!Number.isInteger(scale_code) || !VALID_SCALES.has(scale_code)) {
    errors.push({ field: "scale_code", message: "6~15 사이 정수만 허용" });
  }

  const asean_countries = splitList(get("asean_countries"));
  const invalidAsean = asean_countries.filter((c) => !ASEAN_KR.has(c));
  if (invalidAsean.length) {
    errors.push({
      field: "asean_countries",
      message: `아세안 외 국가: ${invalidAsean.join(", ")}`,
    });
  }
  if (asean_countries.length > 20) {
    errors.push({ field: "asean_countries", message: "최대 20개" });
  }

  const other_countries = splitList(get("other_countries"));
  if (other_countries.length > 300) {
    errors.push({ field: "other_countries", message: "최대 300개" });
  }

  const value: CompanyInput | null =
    errors.length === 0
      ? {
          name_kr,
          name_en,
          biz_no,
          email,
          phone,
          scale_code,
          asean_countries,
          other_countries,
        }
      : null;

  return { rowNum, raw, value, errors };
}

const TEMPLATE_CSV = `name_kr,name_en,biz_no,email,phone,scale_code,asean_countries,other_countries
샘플무역,Sample Trade,123-45-67890,info@sample.co.kr,02-1234-5678,8,베트남;태국,중국;일본
`;

export function CsvUploadDialog({ onClose, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  const bulkFn = useServerFn(bulkCreateCompanies);

  const stats = useMemo(() => {
    const validRows = parsed.filter((r) => r.errors.length === 0);
    const errorRows = parsed.filter((r) => r.errors.length > 0);
    const errorCount = errorRows.reduce((s, r) => s + r.errors.length, 0);
    return { total: parsed.length, valid: validRows.length, errorRows: errorRows.length, errorCount };
  }, [parsed]);

  const missingHeaders = headers
    ? REQUIRED_HEADERS.filter((h) => !headers.includes(h))
    : [];
  const unknownHeaders = headers
    ? headers.filter((h) => !KNOWN_HEADERS.includes(h))
    : [];

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    setParsed([]);
    setHeaders(null);
    const Papa = await loadPapa();
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const hdrs = (res.meta.fields ?? []).map((h) => h.trim());
        setHeaders(hdrs);
        const rows = res.data.map((raw, i) => validateRow(i + 2, raw));
        setParsed(rows);
        setParsing(false);
        if (res.errors.length) {
          toast.warning(`CSV 파싱 경고 ${res.errors.length}건`);
        }
      },
      error: (err) => {
        toast.error(`CSV 파싱 실패: ${err.message}`);
        setParsing(false);
      },
    });
  };

  const downloadErrorReport = async () => {
    const rows: RowError[] = [];
    for (const p of parsed) {
      for (const e of p.errors) {
        rows.push({
          row: p.rowNum,
          field: e.field,
          message: e.message,
          raw: JSON.stringify(p.raw),
        });
      }
    }
    const Papa = await loadPapa();
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-report-${fileName || "upload"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    const valid = parsed.filter((r) => r.value).map((r) => r.value!) as CompanyInput[];
    if (valid.length === 0) {
      toast.error("업로드할 유효한 행이 없습니다");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const CHUNK = 200;
      let inserted = 0;
      for (let i = 0; i < valid.length; i += CHUNK) {
        const chunk = valid.slice(i, i + CHUNK);
        const res = await bulkFn({ data: { rows: chunk } });
        inserted += res.inserted;
        setProgress(Math.round(((i + chunk.length) / valid.length) * 100));
      }
      toast.success(`${inserted}건 등록되었습니다`);
      onDone();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const headerOk = headers !== null && missingHeaders.length === 0;
  const canUpload = headerOk && stats.valid > 0 && !uploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl bg-card shadow-2xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 className="text-base font-bold text-primary">CSV 일괄 업로드</h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: File select */}
          <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                1단계 — 파일 선택
              </div>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                템플릿 다운로드
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-[12px] font-semibold"
              >
                <Upload className="h-3.5 w-3.5" />
                CSV 파일 선택
              </button>
              {fileName && (
                <span className="text-[12px] text-muted-foreground">
                  {fileName} · {parsed.length}행
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              필수: <code className="rounded bg-card px-1">name_kr</code> · 옵션:
              name_en, biz_no, email, phone, scale_code(6–15),
              asean_countries(세미콜론 구분), other_countries(세미콜론 구분)
            </p>
          </div>

          {/* Step 2: Validation */}
          {parsing && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-[13px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> 파싱 및 검증 중…
            </div>
          )}

          {!parsing && headers && (
            <div className="space-y-3">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                2단계 — 검증 리포트
              </div>

              {/* Header check */}
              <div
                className={`rounded-lg border p-3 text-[12px] ${
                  headerOk
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-destructive/40 bg-destructive/5"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {headerOk ? (
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  헤더 검증
                </div>
                {missingHeaders.length > 0 && (
                  <div className="mt-1 text-destructive">
                    누락된 필수 헤더: {missingHeaders.join(", ")}
                  </div>
                )}
                {unknownHeaders.length > 0 && (
                  <div className="mt-1 text-amber-600">
                    알 수 없는 헤더(무시됨): {unknownHeaders.join(", ")}
                  </div>
                )}
                {headerOk && unknownHeaders.length === 0 && (
                  <div className="mt-1 text-muted-foreground">
                    모든 헤더 OK · {headers.length}개 컬럼
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Stat label="전체" value={stats.total} tone="muted" />
                <Stat label="유효" value={stats.valid} tone="ok" />
                <Stat label="오류 행" value={stats.errorRows} tone={stats.errorRows ? "err" : "muted"} />
              </div>

              {/* Error list */}
              {stats.errorRows > 0 && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div className="text-[12px] font-semibold text-destructive">
                      오류 {stats.errorCount}건 · {stats.errorRows}행
                    </div>
                    <button
                      onClick={downloadErrorReport}
                      className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" /> 오류 리포트 (CSV)
                    </button>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-[12px]">
                      <thead className="bg-secondary/50 text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-1.5">행</th>
                          <th className="px-3 py-1.5">필드</th>
                          <th className="px-3 py-1.5">오류</th>
                          <th className="px-3 py-1.5">값</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed
                          .filter((r) => r.errors.length > 0)
                          .slice(0, 200)
                          .flatMap((r) =>
                            r.errors.map((e, i) => (
                              <tr key={`${r.rowNum}-${i}`} className="border-t border-border">
                                <td className="px-3 py-1.5 font-mono text-muted-foreground">
                                  {r.rowNum}
                                </td>
                                <td className="px-3 py-1.5 font-mono">{e.field}</td>
                                <td className="px-3 py-1.5 text-destructive">{e.message}</td>
                                <td className="px-3 py-1.5 max-w-[220px] truncate font-mono text-muted-foreground">
                                  {r.raw[e.field] || "—"}
                                </td>
                              </tr>
                            )),
                          )}
                      </tbody>
                    </table>
                    {parsed.filter((r) => r.errors.length > 0).length > 200 && (
                      <div className="border-t border-border px-3 py-2 text-center text-[11px] text-muted-foreground">
                        상위 200건만 표시 · 전체는 리포트 다운로드 참조
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span>업로드 중…</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border bg-card p-4">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={upload}
            disabled={!canUpload}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 업로드 중…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                3단계 — 유효한 {stats.valid}건 업로드
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "err" | "muted";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700"
      : tone === "err"
        ? "border-destructive/40 bg-destructive/5 text-destructive"
        : "border-border bg-secondary/30 text-muted-foreground";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="font-mono text-lg font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
