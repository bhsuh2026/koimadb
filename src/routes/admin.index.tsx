import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, Save, Upload } from "lucide-react";
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/lib/companies.functions";
import { ASEAN, SCALE, type Company } from "@/lib/koima-types";
import { CsvUploadDialog } from "@/components/admin/CsvUploadDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminCompanies,
});

const PAGE_SIZE = 25;

type EditState =
  | { mode: "create" }
  | { mode: "edit"; company: Company }
  | null;

function AdminCompanies() {
  const listFn = useServerFn(listCompanies);
  const createFn = useServerFn(createCompany);
  const updateFn = useServerFn(updateCompany);
  const deleteFn = useServerFn(deleteCompany);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<EditState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Company | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQDeb(q.trim());
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const listQ = useQuery({
    queryKey: ["admin-companies", { qDeb, page }],
    queryFn: () =>
      listFn({
        data: {
          q: qDeb,
          asean: null,
          scales: [],
          hasEmail: false,
          sort: "name_asc",
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-companies"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const createMut = useMutation({
    mutationFn: (data: Omit<Company, "id">) => createFn({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("업체가 등록되었습니다");
      setEdit(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string } & Partial<Omit<Company, "id">>) =>
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
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="업체명·사업자번호 검색"
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
        <table className="w-full min-w-[800px] text-[13px]">
          <thead className="bg-secondary/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">업체명</th>
              <th className="px-3 py-2.5">사업자번호</th>
              <th className="px-3 py-2.5">규모</th>
              <th className="px-3 py-2.5">이메일</th>
              <th className="px-3 py-2.5">아세안</th>
              <th className="px-3 py-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading && !listQ.data
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-secondary" />
                    </td>
                  </tr>
                ))
              : rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border transition hover:bg-secondary/40"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">
                        {c.name_kr || "(상호 미상)"}
                      </div>
                      {c.name_en && (
                        <div className="font-mono text-[10.5px] text-muted-foreground">
                          {c.name_en}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
                      {c.biz_no || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px]">
                      {SCALE[c.scale_code]?.[0] ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-muted-foreground">
                      {c.email || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      {c.asean_countries.slice(0, 3).join(", ")}
                      {c.asean_countries.length > 3 &&
                        ` +${c.asean_countries.length - 3}`}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEdit({ mode: "edit", company: c })}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-primary hover:text-primary"
                          aria-label="수정"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(c)}
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
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
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
            {page} / {pages}
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
          initial={edit.mode === "edit" ? edit.company : undefined}
          onClose={() => setEdit(null)}
          onSubmit={(values) => {
            if (edit.mode === "create") createMut.mutate(values);
            else updateMut.mutate({ id: edit.company.id, ...values });
          }}
          busy={createMut.isPending || updateMut.isPending}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          company={confirmDelete}
          busy={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        />
      )}
    </div>
  );
}

/* =========================== Edit Dialog =========================== */

function EditDialog({
  initial,
  onClose,
  onSubmit,
  busy,
}: {
  initial?: Company;
  onClose: () => void;
  onSubmit: (v: Omit<Company, "id">) => void;
  busy: boolean;
}) {
  const [name_kr, setNameKr] = useState(initial?.name_kr ?? "");
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [biz_no, setBizNo] = useState(initial?.biz_no ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [scale_code, setScale] = useState<number>(initial?.scale_code ?? 6);
  const [asean, setAsean] = useState<Set<string>>(
    new Set(initial?.asean_countries ?? []),
  );
  const [othersText, setOthersText] = useState(
    (initial?.other_countries ?? []).join(", "),
  );

  const submit = () => {
    onSubmit({
      name_kr: name_kr.trim(),
      name_en: name_en.trim(),
      biz_no: biz_no.trim() || null,
      email: email.trim(),
      phone: phone.trim(),
      scale_code,
      asean_countries: Array.from(asean),
      other_countries: othersText
        .split(/[,\n]/)
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
            {initial ? "업체 수정" : "신규 업체 등록"}
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
              />
            </FormField>
            <FormField label="수입 규모">
              <select
                value={scale_code}
                onChange={(e) => setScale(Number(e.target.value))}
                className="input"
              >
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((c) => (
                  <option key={c} value={c}>
                    {SCALE[c][0]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="이메일">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                type="email"
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

          <FormField label="아세안 거래국">
            <div className="flex flex-wrap gap-1.5">
              {ASEAN.map((a) => {
                const on = asean.has(a.kr);
                return (
                  <button
                    key={a.kr}
                    type="button"
                    onClick={() =>
                      setAsean((prev) => {
                        const n = new Set(prev);
                        if (n.has(a.kr)) n.delete(a.kr);
                        else n.add(a.kr);
                        return n;
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] transition ${
                      on
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <span className="text-[13px] leading-none">{a.flag}</span>
                    {a.kr}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField label="기타 거래국 (쉼표로 구분)">
            <textarea
              value={othersText}
              onChange={(e) => setOthersText(e.target.value)}
              rows={3}
              className="input"
              placeholder="중국, 일본, 미국, ..."
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
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:6px;padding:0.55rem 0.7rem;font-size:13px;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
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
  company,
  onCancel,
  onConfirm,
  busy,
}: {
  company: Company;
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
        <h3 className="mb-2 text-base font-bold text-destructive">업체 삭제</h3>
        <p className="text-[13px] text-muted-foreground">
          <b className="text-foreground">{company.name_kr || "(상호 미상)"}</b>
          을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-md bg-destructive px-4 py-2 text-[13px] font-semibold text-destructive-foreground disabled:opacity-50"
          >
            {busy ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
