import Link from "next/link";
import { getContext } from "@/lib/data";
import { addDays, formatMoney, isDate, isMonth, monthRange, today } from "@/lib/format";
import { OPEN_STATUSES } from "@/lib/labels";
import { JOB_SELECT, getReceivables, getScheduledJobs, getStockItems, isLowStock } from "@/lib/queries";
import { setJobStatus } from "./actions";
import { Calendar, monthGrid } from "@/components/calendar";
import { JobRow } from "@/components/job-row";
import { Empty, Stat } from "@/components/ui";
import type { JobWithClient } from "@/lib/types";

function longDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const now = today();
  const selected = isDate(params.f) ? params.f : now;
  const month = isMonth(params.mes) ? params.mes : selected.slice(0, 7);

  const ctx = await getContext();
  const grid = monthGrid(month);
  const current = monthRange(now.slice(0, 7));

  const [calendarJobs, dayJobsRaw, unscheduled, monthTx, receivables, stock, waiting] = await Promise.all([
    getScheduledJobs(ctx, grid.start, grid.end),
    getScheduledJobs(ctx, selected, addDays(selected, 1)),
    ctx.supabase
      .from("jobs")
      .select(JOB_SELECT)
      .is("scheduled_date", null)
      .in("status", OPEN_STATUSES)
      .order("created_at", { ascending: false })
      .limit(8),
    ctx.supabase.from("transactions").select("type, amount").gte("date", current.start).lt("date", current.next),
    getReceivables(ctx),
    getStockItems(ctx),
    ctx.supabase.from("jobs").select(JOB_SELECT).eq("status", "esperando_repuesto").order("created_at").limit(10),
  ]);

  const counts = new Map<string, number>();
  for (const j of calendarJobs) {
    if (j.status === "cancelado" || !j.scheduled_date) continue;
    counts.set(j.scheduled_date, (counts.get(j.scheduled_date) ?? 0) + 1);
  }

  const dayJobs = dayJobsRaw.filter((j) => j.status !== "cancelado");
  const todayJobs = selected === now ? dayJobs : (await getScheduledJobs(ctx, now, addDays(now, 1))).filter((j) => j.status !== "cancelado");
  const pendingToday = todayJobs.filter((j) => j.status !== "terminado").length;

  const income = (monthTx.data ?? []).filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
  const expense = (monthTx.data ?? []).filter((t) => t.type === "egreso").reduce((s, t) => s + Number(t.amount), 0);
  const dueTotal = receivables.reduce((s, r) => s + r.due, 0);
  const lowStock = stock.filter(isLowStock);
  const waitingParts = (waiting.data ?? []) as JobWithClient[];
  const backlog = (unscheduled.data ?? []) as JobWithClient[];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{longDate(now)}</p>
          <h1 className="page-title">Hoy</h1>
        </div>
        <Link href={`/casos/nuevo?fecha=${selected}`} className="btn btn-sm hidden md:inline-flex">＋ Agendar</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Trabajos de hoy" value={todayJobs.length} hint={todayJobs.length ? `${pendingToday} por hacer` : "Día libre"} />
        <Stat label="Ingresos del mes" value={formatMoney(income)} tone="income" hint={`Gastos ${formatMoney(expense)}`} />
        <Stat label="Por cobrar" value={formatMoney(dueTotal)} tone={dueTotal > 0 ? "warn" : undefined} hint={`${receivables.length} casos terminados`} />
        <Stat label="Stock bajo" value={lowStock.length} tone={lowStock.length ? "danger" : undefined} hint={lowStock.length ? "Revisar reposición" : "Todo en orden"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{selected === now ? "Agenda de hoy" : longDate(selected)}</h2>
            {selected !== now && (
              <Link href="/" className="text-sm text-accent">Volver a hoy</Link>
            )}
          </div>
          {dayJobs.length === 0 ? (
            <Empty>
              No hay trabajos agendados.{" "}
              <Link href={`/casos/nuevo?fecha=${selected}`} className="font-medium text-accent">Agendar uno</Link>
            </Empty>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {dayJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  actions={
                    job.status === "terminado" ? null : (
                      <>
                        {job.status !== "en_curso" && (
                          <form action={setJobStatus}>
                            <input type="hidden" name="id" value={job.id} />
                            <input type="hidden" name="status" value="en_curso" />
                            <input type="hidden" name="back" value={`/?f=${selected}`} />
                            <button className="btn-ghost btn-sm">▶ Empezar</button>
                          </form>
                        )}
                        <form action={setJobStatus}>
                          <input type="hidden" name="id" value={job.id} />
                          <input type="hidden" name="status" value="terminado" />
                          <input type="hidden" name="back" value={`/casos/${job.id}`} />
                          <button className="btn-ghost btn-sm">✓ Terminar</button>
                        </form>
                      </>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <Calendar month={month} selected={selected} counts={counts} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-semibold">Sin agendar</h2>
          {backlog.length === 0 ? (
            <Empty>No hay casos abiertos sin fecha.</Empty>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {backlog.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Para atender</h2>
          <ul className="card divide-y divide-border p-0 text-sm">
            {receivables.slice(0, 4).map(({ job, due }) => (
              <li key={job.id}>
                <Link href={`/casos/${job.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate">💵 {job.clients?.name} · #{job.number}</span>
                  <span className="font-semibold tabular-nums text-warn">{formatMoney(due)}</span>
                </Link>
              </li>
            ))}
            {waitingParts.slice(0, 4).map((job) => (
              <li key={job.id}>
                <Link href={`/casos/${job.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate">⏳ {job.clients?.name} · #{job.number}</span>
                  <span className="text-muted">Esperando repuesto</span>
                </Link>
              </li>
            ))}
            {lowStock.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Link href={`/stock/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate">📦 {item.name}</span>
                  <span className="tabular-nums text-danger">
                    {item.quantity} {item.unit}
                  </span>
                </Link>
              </li>
            ))}
            {receivables.length + waitingParts.length + lowStock.length === 0 && (
              <li className="px-4 py-3 text-center text-muted">Nada pendiente. 👌</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
