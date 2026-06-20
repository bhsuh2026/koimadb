import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, GitMerge, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  adminFindDuplicates,
  adminMergeGroup,
  adminMergeAllDuplicates,
  type Importer,
} from "@/lib/importers.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/duplicates")({
  component: AdminDuplicates,
});

function AdminDuplicates() {
  const findFn = useServerFn(adminFindDuplicates);
  const mergeOneFn = useServerFn(adminMergeGroup);
  const mergeAllFn = useServerFn(adminMergeAllDuplicates);
  const qc = useQueryClient();
  const [confirmAll, setConfirmAll] = useState(false);

  const findQ = useQuery({
    queryKey: ["admin-duplicates"],
    queryFn: () => findFn(),
  });

  const mergeOneMut = useMutation({
    mutationFn: (ids: string[]) => mergeOneFn({ data: { ids } }),
    onSuccess: (r) => {
      toast.success(`병합 완료 · ${r.deletedCount}건 정리`);
      qc.invalidateQueries({ queryKey: ["admin-duplicates"] });
      qc.invalidateQueries({ queryKey: ["admin-importers"] });
      qc.invalidateQueries({ queryKey: ["importers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mergeAllMut = useMutation({
    mutationFn: () => mergeAllFn({ data: { dryRun: false } }),
    onSuccess: (r) => {
      toast.success(
        `전체 병합 완료 · ${r.merged}그룹 / ${r.deleted}건 정리${
          r.errors.length ? ` · 오류 ${r.errors.length}건` : ""
        }`,
      );
      setConfirmAll(false);
      qc.invalidateQueries({ queryKey: ["admin-duplicates"] });
      qc.invalidateQueries({ queryKey: ["admin-importers"] });
      qc.invalidateQueries({ queryKey: ["importers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = findQ.data;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-foreground">중복 기업 통합</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            <b>사업자번호</b>가 동일한 기업을 하나로 병합합니다. 기본 정보는 상위 순위 행을
            유지하고, 국가·품목·HS코드·연락처는 합집합으로 합쳐집니다.
          </p>
        </div>
        <button
          onClick={() => findQ.refetch()}
          disabled={findQ.isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {findQ.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          다시 조회
        </button>
      </div>

      {findQ.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> 중복 기업을 스캔하는 중…
        </div>
      )}

      {findQ.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-[13px] text-destructive">
          오류: {(findQ.error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="중복 그룹" value={data.totalGroups.toLocaleString()} />
            <Stat label="영향 받는 행" value={data.totalRowsAffected.toLocaleString()} />
            <Stat
              label="정리 후 감소"
              value={(data.totalRowsAffected - data.totalGroups).toLocaleString()}
              accent
            />
          </div>

          {data.totalGroups === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-[13px] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              사업자번호 기준 중복 기업이 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <p className="text-[12px] text-foreground">
                    일괄 병합 시 <b>{(data.totalRowsAffected - data.totalGroups).toLocaleString()}건</b>이
                    제거되고 데이터는 합집합으로 보존됩니다. <b>되돌릴 수 없습니다.</b>
                  </p>
                </div>
                {!confirmAll ? (
                  <button
                    onClick={() => setConfirmAll(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-600 px-3 text-[12px] font-semibold text-white hover:bg-amber-700"
                  >
                    <GitMerge className="h-3.5 w-3.5" /> 전체 일괄 병합
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmAll(false)}
                      className="inline-flex h-9 items-center rounded-md border border-border px-3 text-[12px] text-muted-foreground"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => mergeAllMut.mutate()}
                      disabled={mergeAllMut.isPending}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-3 text-[12px] font-semibold text-white disabled:opacity-50"
                    >
                      {mergeAllMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <GitMerge className="h-3.5 w-3.5" />
                      )}
                      확인 · 병합 실행
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {data.groups.slice(0, 50).map((g) => {
                  const rows = data.preview[g.biz_no] ?? [];
                  return (
                    <GroupCard
                      key={g.biz_no}
                      bizNo={g.biz_no}
                      rows={rows}
                      onMerge={() => mergeOneMut.mutate(g.ids)}
                      busy={mergeOneMut.isPending}
                    />
                  );
                })}
                {data.totalGroups > 50 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
                    +{(data.totalGroups - 50).toLocaleString()}개 그룹은 일괄 병합으로
                    처리해주세요.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl font-extrabold ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function GroupCard({
  bizNo,
  rows,
  onMerge,
  busy,
}: {
  bizNo: string;
  rows: Importer[];
  onMerge: () => void;
  busy: boolean;
}) {
  const sorted = [...rows].sort((a, b) => {
    const ar = a.rank_import ?? Number.MAX_SAFE_INTEGER;
    const br = b.rank_import ?? Number.MAX_SAFE_INTEGER;
    return ar - br;
  });
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-2">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="font-mono font-semibold text-foreground">{bizNo}</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
            {rows.length}건
          </span>
        </div>
        <button
          onClick={onMerge}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-[11.5px] font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <GitMerge className="h-3 w-3" />
          )}
          이 그룹 병합
        </button>
      </div>
      <table className="w-full text-[12px]">
        <thead className="bg-secondary/20 text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-1.5">유지</th>
            <th className="px-3 py-1.5">순위</th>
            <th className="px-3 py-1.5">업체명</th>
            <th className="px-3 py-1.5">규모</th>
            <th className="px-3 py-1.5">국가</th>
            <th className="px-3 py-1.5">품목</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-1.5">
                {i === 0 ? (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    KEEP
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">병합</span>
                )}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                {r.rank_import ?? "—"}
              </td>
              <td className="px-3 py-1.5 font-semibold">{r.name_kr || "(상호 미상)"}</td>
              <td className="px-3 py-1.5 text-[11px]">{r.scale_label || "—"}</td>
              <td className="px-3 py-1.5 text-[11px]">
                {(r.countries ?? []).slice(0, 3).join(", ")}
              </td>
              <td className="max-w-[260px] truncate px-3 py-1.5 text-[11px] text-muted-foreground">
                {r.items_kr || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
