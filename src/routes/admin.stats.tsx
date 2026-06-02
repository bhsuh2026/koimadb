import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, IdCard, Globe2, TrendingUp, Hash, Loader2 } from "lucide-react";
import { adminGetStats } from "@/lib/importers.functions";

export const Route = createFileRoute("/admin/stats")({
  component: AdminStats,
});

function AdminStats() {
  const fn = useServerFn(adminGetStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fn(),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 통계 집계 중…
      </div>
    );
  }

  const topCountries = Object.entries(data.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const scales = Object.entries(data.scales).sort((a, b) => b[1] - a[1]);
  const topHs = Object.entries(data.hsCodes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const maxCountry = topCountries[0]?.[1] ?? 1;
  const maxScale = scales[0]?.[1] ?? 1;
  const maxHs = topHs[0]?.[1] ?? 1;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <h2 className="mb-4 text-lg font-bold text-primary">통계 대시보드</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Building2 className="h-4 w-4" />} label="전체 업체" value={data.total} accent />
        <StatCard icon={<IdCard className="h-4 w-4" />} label="사업자번호 보유" value={data.withBiz} />
        <StatCard icon={<Mail className="h-4 w-4" />} label="이메일 보유" value={data.withEmail} />
        <StatCard
          icon={<Globe2 className="h-4 w-4" />}
          label="국가 수"
          value={Object.keys(data.countries).length}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="국가별 Top 15" icon={<Globe2 className="h-4 w-4" />}>
          <BarList rows={topCountries} max={maxCountry} />
        </Panel>
        <Panel title="수입 규모 분포" icon={<TrendingUp className="h-4 w-4" />}>
          <BarList rows={scales} max={maxScale} mono={false} />
        </Panel>
        <Panel title="HS 코드 Top 15 (4자리)" icon={<Hash className="h-4 w-4" />}>
          <BarList rows={topHs} max={maxHs} mono />
        </Panel>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-mono text-2xl font-bold text-foreground">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[12px] font-bold text-primary">
        {icon}
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function BarList({
  rows,
  max,
  mono = false,
}: {
  rows: [string, number][];
  max: number;
  mono?: boolean;
}) {
  if (rows.length === 0)
    return <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">데이터 없음</div>;
  return (
    <div className="space-y-1.5">
      {rows.map(([label, count]) => (
        <div key={label} className="group">
          <div className="mb-0.5 flex items-baseline justify-between gap-2">
            <span className={`text-[12px] ${mono ? "font-mono" : ""} text-foreground`}>
              {label}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {count.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(2, (count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
