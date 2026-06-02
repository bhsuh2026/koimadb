import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import {
  adminListImporters,
  adminExportImporters,
  createImporter,
  updateImporter,
  deleteImporter,
  type Importer,
} from "@/lib/importers.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/")({
  component: AdminImporters,
});

const PAGE_SIZE = 25;

const SCALE_LABELS = [
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

type EditState =
  | { mode: "create" }
  | { mode: "edit"; row: Importer }
  | null;

function AdminImporters() {
  const listFn = useServerFn(adminListImporters);
  const exportFn = useServerFn(adminExportImporters);
  const createFn = useServerFn(createImporter);
  const updateFn = useServerFn(updateImporter);
  const deleteFn = useServerFn(deleteImporter);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<EditState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Importer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [countryFilter, setCountryFilter] = useState("");
  const [scaleFilter, setScaleFilter] = useState<string[]>([]);
  const [hsFilter, setHsFilter] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim());
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [countryFilter, scaleFilter, hsFilter, hasEmail]);

  const countriesArr = useMemo(
    () => countryFilter.split(",").map((s) => s.trim()).filter(Boolean),
    [countryFilter],
  );

  const filterPayload = useMemo(
    () => ({
      q: qDeb,
      countries: countriesArr,
      scales: scaleFilter,
      hs: hsFilter.trim(),
      hasEmail,
    }),
    [qDeb, countriesArr, scaleFilter, hsFilter, hasEmail],
  );

  const listQ = useQuery({
    queryKey: ["admin-importers", { ...filterPayload, page }],
    queryFn: () => listFn({ data: { ...filterPayload, page, pageSize: PAGE_SIZE } }),
    placeholderData: (prev) => prev,
  });

  const onExport = async () => {
    setExporting(true);
    try {
      const r = await exportFn({ data: filterPayload });
      const headers = [
        "rank_import","biz_no","name_kr","name_en","email","email_extra",
        "phone","phone_extra","countries","scale_label","items_kr","items_en","hs_codes",
      ];
      const esc = (v: unknown) => {
        const s = v == null ? "" : Array.isArray(v) ? v.join(";") : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        headers.join(","),
        ...r.rows.map((row) =>
          headers.map((h) => esc((row as Record<string, unknown>)[h])).join(","),
        ),
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `importers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${r.rows.length}건 내보내기 완료`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };


  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-importers"] });
    qc.invalidateQueries({ queryKey: ["importers"] });
  };

  const createMut = useMutation({
    mutationFn: (data: Omit<Importer, "id">) => createFn({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("수입업체가 등록되었습니다");
      setEdit(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string } & Partial<Omit<Importer, "id">>) =>
      updateFn({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("저장되었습니다");
      setEdit(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("삭제되었습니다");
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQ.data?.rows ?? [];
  const total = listQ.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="업체명·사업자번호·품목 검색"
            className="h-10 w-full rounded-md border border-border bg-card px-3 pl-9 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="text-[12px] text-muted-foreground">
          총 <b className="font-mono text-primary">{total.toLocaleString()}</b>건
        </div>
        <button
          onClick={() => setEdit({ mode: "create" })}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> 신규 등록
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead className="bg-secondary/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">순위</th>
              <th className="px-3 py-2.5">업체명</th>
              <th className="px-3 py-2.5">사업자번호</th>
              <th className="px-3 py-2.5">규모</th>
              <th className="px-3 py-2.5">국가</th>
              <th className="px-3 py-2.5">품목</th>
              <th className="px-3 py-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading && !listQ.data
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={7} className="px-3 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-secondary" />
                    </td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border transition hover:bg-secondary/40"
                  >
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {r.rank_import ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">
                        {r.name_kr || "(상호 미상)"}
                      </div>
                      {r.name_en && (
                        <div className="font-mono text-[10.5px] text-muted-foreground">
                          {r.name_en}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
                      {r.biz_no || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      {r.scale_label || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      {(r.countries ?? []).slice(0, 3).join(", ")}
                      {r.countries && r.countries.length > 3 &&
                        ` +${r.countries.length - 3}`}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2.5 text-[11px] text-muted-foreground">
                      {r.items_kr || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEdit({ mode: "edit", row: r })}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-primary hover:text-primary"
                          aria-label="수정"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                          aria-label="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            {!listQ.isLoading && rows.length === 0 && (
              <tr className="border-t border-border">
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-[12px]">
            {page} / {pages.toLocaleString()}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {edit && (
        <EditDialog
          initial={edit.mode === "edit" ? edit.row : undefined}
          onClose={() => setEdit(null)}
          onSubmit={(values) => {
            if (edit.mode === "create") createMut.mutate(values);
            else updateMut.mutate({ id: edit.row.id, ...values });
          }}
          busy={createMut.isPending || updateMut.isPending}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          row={confirmDelete}
          busy={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        />
      )}
    </div>
  );
}

function EditDialog({
  initial,
  onClose,
  onSubmit,
  busy,
}: {
  initial?: Importer;
  onClose: () => void;
  onSubmit: (v: Omit<Importer, "id">) => void;
  busy: boolean;
}) {
  const [name_kr, setNameKr] = useState(initial?.name_kr ?? "");
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [biz_no, setBizNo] = useState(initial?.biz_no ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [scale_label, setScaleLabel] = useState(initial?.scale_label ?? "");
  const [countriesText, setCountriesText] = useState(
    (initial?.countries ?? []).join(", "),
  );
  const [items_kr, setItemsKr] = useState(initial?.items_kr ?? "");
  const [items_en, setItemsEn] = useState(initial?.items_en ?? "");
  const [hsText, setHsText] = useState((initial?.hs_codes ?? []).join(", "));
  const [rankImport, setRankImport] = useState(
    initial?.rank_import?.toString() ?? "",
  );

  const submit = () => {
    onSubmit({
      rank_import: rankImport.trim() ? Number(rankImport) : null,
      rank_sales: initial?.rank_sales ?? null,
      name_kr: name_kr.trim(),
      name_en: name_en.trim(),
      biz_no: biz_no.trim() || null,
      email: email.trim(),
      email_extra: initial?.email_extra ?? "",
      phone: phone.trim(),
      phone_extra: initial?.phone_extra ?? "",
      scale_label,
      countries: countriesText
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      items_kr: items_kr.trim(),
      items_en: items_en.trim(),
      hs_codes: hsText
        .split(/[,\n\s]/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-card shadow-2xl sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 className="text-base font-bold text-primary">
            {initial ? "수입업체 수정" : "신규 수입업체 등록"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="업체명 (한글)">
              <input
                value={name_kr}
                onChange={(e) => setNameKr(e.target.value)}
                className="input"
              />
            </FormField>
            <FormField label="업체명 (영문)">
              <input
                value={name_en}
                onChange={(e) => setNameEn(e.target.value)}
                className="input"
              />
            </FormField>
            <FormField label="사업자번호">
              <input
                value={biz_no}
                onChange={(e) => setBizNo(e.target.value)}
                className="input font-mono"
                placeholder="123-45-67890"
              />
            </FormField>
            <FormField label="수입 순위">
              <input
                value={rankImport}
                onChange={(e) => setRankImport(e.target.value)}
                className="input font-mono"
                type="number"
              />
            </FormField>
            <FormField label="수입 규모">
              <select
                value={scale_label}
                onChange={(e) => setScaleLabel(e.target.value)}
                className="input"
              >
                <option value="">— 선택 —</option>
                {SCALE_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="이메일">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </FormField>
            <FormField label="전화번호">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input font-mono"
              />
            </FormField>
          </div>

          <FormField label="수입국가 (쉼표로 구분)">
            <textarea
              value={countriesText}
              onChange={(e) => setCountriesText(e.target.value)}
              rows={2}
              className="input"
              placeholder="중국, 일본, 미국, ..."
            />
          </FormField>

          <FormField label="품목 (한글)">
            <textarea
              value={items_kr}
              onChange={(e) => setItemsKr(e.target.value)}
              rows={2}
              className="input"
            />
          </FormField>

          <FormField label="품목 (영문)">
            <textarea
              value={items_en}
              onChange={(e) => setItemsEn(e.target.value)}
              rows={2}
              className="input"
            />
          </FormField>

          <FormField label="HS 코드 (쉼표/공백 구분)">
            <textarea
              value={hsText}
              onChange={(e) => setHsText(e.target.value)}
              rows={2}
              className="input font-mono"
              placeholder="8517620000, 8471700000"
            />
          </FormField>
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
        <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0.55rem 0.7rem;font-size:13px;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ConfirmDelete({
  row,
  onCancel,
  onConfirm,
  busy,
}: {
  row: Importer;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-6 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-destructive">
          수입업체 삭제
        </h3>
        <p className="text-[13px] text-muted-foreground">
          <b className="text-foreground">{row.name_kr || "(상호 미상)"}</b>을(를)
          삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-md bg-destructive px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
