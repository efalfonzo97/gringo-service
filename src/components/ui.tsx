import Link from "next/link";
import { JOB_KINDS, JOB_STATUS } from "@/lib/labels";
import type { JobKind, JobStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = JOB_STATUS[status];
  return <span className={`badge ${s.tone}`}>{s.label}</span>;
}

export function KindBadge({ kind }: { kind: JobKind }) {
  return <span className="badge border border-border text-muted">{JOB_KINDS[kind]}</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {backHref && (
          <Link href={backHref} className="mb-1 inline-block text-sm text-muted">
            ‹ Volver
          </Link>
        )}
        <h1 className="page-title truncate">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "income" | "danger" | "warn" }) {
  const color = tone === "income" ? "text-income" : tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "";
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="card text-center text-sm text-muted">{children}</p>;
}
