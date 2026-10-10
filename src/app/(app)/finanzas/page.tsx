import Link from "next/link";
import { getContext } from "@/lib/data";
import { PERIODS, addDays, formatDay, formatMoney, resolveRange } from "@/lib/format";
import { PAY_METHODS } from "@/lib/labels";
import { getReceivables } from "@/lib/queries";
import { withQuery } from "@/lib/util";
import { Empty, PageHeader, Stat, StatusBadge } from "@/components/ui";
import type { Transaction } from "@/lib/types";

type Tab = "todos" | "ingreso" | "egreso";

function breakdown(items: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of items) map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

function Bars({ rows, total, tone }: { rows: { name: string; total: number }[]; total: number; tone: "income" | "expense" }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Sin movimientos.</p>;
  return (
    <ul className="space-y-2.5 text-sm">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex justify-between gap-2">
            <span className="truncate">{r.name}</span>
            <span className="font-medium tabular-nums">{formatMoney(r.total)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-accent-soft">
            <div className={`h-2 rounded-full ${tone === "income" ? "bg-accent" : "bg-sage"}`} style={{ width: `${Math.max((r.total / total) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function FinancePage({ searchParams }: PageProps<"/finanzas">) {
  const params = await searchParams;
  const range = resolveRange(params);
  const tab: Tab = params.t === "ingreso" || params.t === "egreso" ? params.t : "todos";

  const ctx = await getContext();
  const [txRes, receivables] = await Promise.all([
    ctx.supabase.from("transactions").select("*").gte("date", range.start).lt("date", range.end).order("date", { ascending: false }).order("created_at", { ascending: false }),
    getReceivables(ctx),
  ]);
  const all = (txRes.data ?? []) as Transaction[];
  const incomes = all.filter((t) => t.type === "ingreso");
  const expenses = all.filter((t) => t.type === "egreso");
  const incomeTotal = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const expenseTotal = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const balance = incomeTotal - expenseTotal;
  const dueTotal = receivables.reduce((s, r) => s + r.due, 0);

  const list = tab === "todos" ? all : all.filter((t) => t.type === tab);
  const byDate = new Map<string, Transaction[]>();
  for (const t of list) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);

  const base = {
    p: range.period,
    f: range.period === "periodo" ? null : range.anchor,
    desde: range.period === "periodo" ? range.start : null,
    hasta: range.period === "periodo" ? addDays(range.end, -1) : null,
    t: tab === "todos" ? null : tab,
  };
  const link = (changes: Record<string, string | null>) => withQuery("/finanzas", { ...base, ...changes });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finanzas"
        action={
          <div className="flex gap-2">
            <Link href="/finanzas/nuevo?tipo=ingreso" className="btn-ghost btn-sm">＋ Ingreso</Link>
            <Link href="/finanzas/nuevo" className="btn btn-sm">＋ Gasto</Link>
          </div>
        }
      />

      <section className="card space-y-3">
        <nav className="grid grid-cols-5 gap-1 text-sm" aria-label="Período">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={withQuery("/finanzas", { p: p.value, t: base.t })}
              aria-current={range.period === p.value ? "true" : undefined}
              className={`rounded-lg py-1.5 text-center ${range.period === p.value ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        {range.period === "periodo" ? (
          <form className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <input type="hidden" name="p" value="periodo" />
            {base.t && <input type="hidden" name="t" value={base.t} />}
            <div>
              <label className="label" htmlFor="desde">Desde</label>
              <input className="input py-2" type="date" id="desde" name="desde" defaultValue={range.start} />
            </div>
            <div>
              <label className="label" htmlFor="hasta">Hasta</label>
              <input className="input py-2" type="date" id="hasta" name="hasta" defaultValue={addDays(range.end, -1)} />
            </div>
            <button className="btn py-2">Ver</button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <Link href={link({ f: range.prev })} className="btn-ghost btn-sm" aria-label="Anterior">‹</Link>
            <span className="text-center font-semibold">{range.label}</span>
            <Link href={link({ f: range.next })} className="btn-ghost btn-sm" aria-label="Siguiente">›</Link>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos" value={formatMoney(incomeTotal)} tone="income" hint={`${incomes.length} movimientos`} />
        <Stat label="Gastos" value={formatMoney(expenseTotal)} hint={`${expenses.length} movimientos`} />
        <Stat label="Ganancia" value={formatMoney(balance)} tone={balance < 0 ? "danger" : "income"} hint={incomeTotal ? `Margen ${Math.round((balance / incomeTotal) * 100)}%` : undefined} />
        <Stat label="Por cobrar" value={formatMoney(dueTotal)} tone={dueTotal ? "warn" : undefined} hint={`${receivables.length} casos con saldo`} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="font-semibold">Ingresos por categoría</h2>
          <Bars rows={breakdown(incomes)} total={incomeTotal} tone="income" />
        </section>
        <section className="card space-y-3">
          <h2 className="font-semibold">Gastos por categoría</h2>
          <Bars rows={breakdown(expenses)} total={expenseTotal} tone="expense" />
        </section>
      </div>

      {receivables.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Por cobrar</h2>
          <ul className="card divide-y divide-border p-0 text-sm">
            {receivables.map(({ job, due }) => (
              <li key={job.id}>
                <Link href={`/casos/${job.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{job.clients?.name}</span>
                      <StatusBadge status={job.status} />
                    </span>
                    <span className="block truncate text-xs text-muted">
                      #{job.number} · {job.title} · precio {formatMoney(Number(job.price))}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-warn">{formatMoney(due)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Movimientos</h2>
          <nav className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
            {(["todos", "ingreso", "egreso"] as const).map((t) => (
              <Link
                key={t}
                href={link({ t: t === "todos" ? null : t })}
                aria-current={tab === t ? "true" : undefined}
                className={`rounded-lg px-3 py-1 text-center ${tab === t ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
              >
                {t === "todos" ? "Todos" : t === "ingreso" ? "Ingresos" : "Gastos"}
              </Link>
            ))}
          </nav>
        </div>
        {list.length === 0 && <Empty>No hay movimientos en este período.</Empty>}
        {[...byDate.entries()].map(([date, items]) => (
          <div key={date} className="space-y-1.5">
            <h3 className="text-sm font-semibold text-muted">{formatDay(date)}</h3>
            <ul className="card divide-y divide-border p-0">
              {items.map((t) => (
                <li key={t.id}>
                  <Link href={`/finanzas/${t.id}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl" aria-hidden>{t.type === "ingreso" ? "💵" : "🧾"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.description || t.category}</span>
                      <span className="block truncate text-xs text-muted">
                        {t.category} · {PAY_METHODS[t.method]}
                      </span>
                    </span>
                    <span className={`font-semibold tabular-nums ${t.type === "ingreso" ? "text-income" : ""}`}>
                      {t.type === "ingreso" ? "+" : "−"}
                      {formatMoney(Number(t.amount))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
