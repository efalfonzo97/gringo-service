import Link from "next/link";
import { getContext } from "@/lib/data";
import { JOB_KINDS, OPEN_STATUSES } from "@/lib/labels";
import { JOB_SELECT } from "@/lib/queries";
import { param, withQuery } from "@/lib/util";
import { JobRow } from "@/components/job-row";
import { Empty, PageHeader } from "@/components/ui";
import type { JobWithClient } from "@/lib/types";

const TABS = [
  { value: "abiertos", label: "Abiertos" },
  { value: "terminados", label: "Terminados" },
  { value: "todos", label: "Todos" },
] as const;

export default async function JobsPage({ searchParams }: PageProps<"/casos">) {
  const params = await searchParams;
  const tab = TABS.find((t) => t.value === params.t)?.value ?? "abiertos";
  const kind = param(params.tipo);
  const q = param(params.q).toLowerCase();

  const { supabase } = await getContext();
  let query = supabase.from("jobs").select(JOB_SELECT).limit(300);
  if (tab === "abiertos") query = query.in("status", OPEN_STATUSES).order("scheduled_date", { nullsFirst: true }).order("scheduled_time");
  else if (tab === "terminados") query = query.eq("status", "terminado").order("closed_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  if (kind in JOB_KINDS) query = query.eq("kind", kind);
  const { data } = await query;

  const jobs = ((data ?? []) as JobWithClient[]).filter(
    (j) =>
      !q ||
      j.title.toLowerCase().includes(q) ||
      String(j.number) === q.replace("#", "") ||
      j.clients?.name.toLowerCase().includes(q) ||
      j.clients?.address?.toLowerCase().includes(q),
  );
  const base = { t: tab === "abiertos" ? null : tab, tipo: kind || null, q: q || null };

  return (
    <div>
      <PageHeader title="Casos" subtitle={`${jobs.length} ${tab === "todos" ? "en total" : tab}`} action={<Link href="/casos/nuevo" className="btn btn-sm">＋ Nuevo</Link>} />

      <div className="mb-4 space-y-3">
        <nav className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1 text-sm sm:inline-grid">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={withQuery("/casos", { ...base, t: t.value === "abiertos" ? null : t.value })}
              aria-current={tab === t.value ? "page" : undefined}
              className={`rounded-lg px-4 py-1.5 text-center ${tab === t.value ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          {base.t && <input type="hidden" name="t" value={base.t} />}
          <input className="input" name="q" defaultValue={q} placeholder="Buscar por cliente, dirección, título o #número" />
          <select className="input w-auto" name="tipo" defaultValue={kind}>
            <option value="">Todos los tipos</option>
            {Object.entries(JOB_KINDS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="btn-ghost">Buscar</button>
        </form>
      </div>

      {jobs.length === 0 ? (
        <Empty>No hay casos para mostrar.</Empty>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} showDate />
          ))}
        </ul>
      )}
    </div>
  );
}
