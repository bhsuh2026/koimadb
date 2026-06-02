import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, Loader2 } from "lucide-react";
import { adminBulkUpsertImporters } from "@/lib/importers.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/import")({
  component: AdminImport,
});

type ParsedRow = {
  rank_import: number | null;
  biz_no: string | null;
  name_kr: string;
  name_en: string;
  email: string;
  phone: string;
  countries: string[];
  scale_label: string;
  items_kr: string;
  items_en: string;
  hs_codes: string[];
};

const TEMPLATE_HEADERS = [
  "rank_import",
  "biz_no",
  "name_kr",
  "name_en",
  "email",
  "phone",
  "countries",
  "scale_label",
  "items_kr",
  "items_en",
  "hs_codes",
];

function AdminImport() {
  const fn = useServerFn(adminBulkUpsertImporters);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const upload = useMutation({
    mutationFn: (data: ParsedRow[]) => fn({ data: { rows: data } }),
    onSuccess: (r) => {
      toast.success(
        `완료 — 신규 ${r.inserted}건, 업데이트 ${r.updated}건${
          r.errors.length ? `, 실패 ${r.errors.length}건` : ""
        }`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = (file: File) => {
    setFileName(file.name);
    setParseErrors([]);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const errs: string[] = [];
        const parsed: ParsedRow[] = [];
        res.data.forEach((r, i) => {
          const name_kr = (r.name_kr ?? "").trim();
          const name_en = (r.name_en ?? "").trim();
          if (!name_kr && !name_en) {
            errs.push(`${i + 2}행: 업체명(한글/영문)이 모두 비어있음`);
            return;
          }
          parsed.push({
            rank_import: r.rank_import ? Number(r.rank_import) || null : null,
            biz_no: (r.biz_no ?? "").trim() || null,
            name_kr,
            name_en,
            email: (r.email ?? "").trim(),
            phone: (r.phone ?? "").trim(),
            countries: (r.countries ?? "")
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean),
            scale_label: (r.scale_label ?? "").trim(),
            items_kr: (r.items_kr ?? "").trim(),
            items_en: (r.items_en ?? "").trim(),
            hs_codes: (r.hs_codes ?? "")
              .split(/[,;\s]/)
              .map((s) => s.trim())
              .filter(Boolean),
          });
        });
        setRows(parsed);
        setParseErrors(errs);
        if (parsed.length === 0) toast.error("유효한 행이 없습니다");
        else toast.success(`${parsed.length}건 파싱 완료`);
      },
      error: (err) => toast.error(`파싱 오류: ${err.message}`),
    });
  };

  const downloadTemplate = () => {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      `1,123-45-67890,주식회사 예시,Example Inc,info@example.com,02-1234-5678,"중국,베트남",1억불 초과,전자부품,Electronic Components,"8517620000,8471700000"`,
    ].join("\n");
    const blob = new Blob(["\uFEFF" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "importers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <h2 className="mb-4 text-lg font-bold text-primary">엑셀/CSV 대량 업로드</h2>

      <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-50/50 p-4 text-[12px] text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="mb-1 flex items-center gap-1.5 font-bold">
          <AlertTriangle className="h-3.5 w-3.5" /> 업로드 규칙
        </div>
        <ul className="ml-5 list-disc space-y-0.5">
          <li>CSV(UTF-8) 형식. 첫 줄은 컬럼명: {TEMPLATE_HEADERS.join(", ")}</li>
          <li>사업자번호가 일치하는 기존 업체는 자동 업데이트, 없으면 신규 등록</li>
          <li>countries / hs_codes 는 쉼표(,) 또는 세미콜론(;)으로 구분</li>
          <li>한 번에 최대 2,000행</li>
        </ul>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
        >
          <Upload className="h-4 w-4" /> CSV 파일 선택
        </button>
        <button
          onClick={downloadTemplate}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-4 text-[13px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Download className="h-4 w-4" /> 템플릿 다운로드
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {fileName && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[12px]">
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono">{fileName}</span>
          <span className="text-muted-foreground">— {rows.length}건 준비됨</span>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive">
          <div className="mb-1 font-bold">파싱 경고 {parseErrors.length}건</div>
          <ul className="ml-5 max-h-32 list-disc overflow-y-auto">
            {parseErrors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="mb-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[800px] text-[12px]">
              <thead className="bg-secondary/50 text-left text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">업체명</th>
                  <th className="px-3 py-2">사업자번호</th>
                  <th className="px-3 py-2">국가</th>
                  <th className="px-3 py-2">규모</th>
                  <th className="px-3 py-2">HS</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5">{r.name_kr || r.name_en}</td>
                    <td className="px-3 py-1.5 font-mono">{r.biz_no || "—"}</td>
                    <td className="px-3 py-1.5">{r.countries.join(", ")}</td>
                    <td className="px-3 py-1.5">{r.scale_label}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px]">
                      {r.hs_codes.slice(0, 2).join(", ")}
                      {r.hs_codes.length > 2 && ` +${r.hs_codes.length - 2}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <div className="border-t border-border px-3 py-2 text-center text-[11px] text-muted-foreground">
                미리보기 50건만 표시 (총 {rows.length}건)
              </div>
            )}
          </div>

          <button
            onClick={() => upload.mutate(rows)}
            disabled={upload.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[14px] font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {upload.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {upload.isPending ? "업로드 중…" : `${rows.length}건 업로드`}
          </button>

          {upload.data && (
            <div className="mt-4 rounded-lg border border-border bg-card p-4 text-[13px]">
              <div className="mb-2 font-bold text-primary">업로드 결과</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-secondary/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">신규</div>
                  <div className="font-mono text-lg font-bold text-primary">
                    {upload.data.inserted}
                  </div>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">업데이트</div>
                  <div className="font-mono text-lg font-bold text-foreground">
                    {upload.data.updated}
                  </div>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">실패</div>
                  <div className="font-mono text-lg font-bold text-destructive">
                    {upload.data.errors.length}
                  </div>
                </div>
              </div>
              {upload.data.errors.length > 0 && (
                <ul className="mt-3 max-h-40 overflow-y-auto text-[11px] text-destructive">
                  {upload.data.errors.slice(0, 30).map((e, i) => (
                    <li key={i}>{e.row}행: {e.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
