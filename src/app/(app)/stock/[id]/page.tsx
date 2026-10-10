import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { formatDay, formatMoney, today } from "@/lib/format";
import { PAY_METHODS } from "@/lib/labels";
import { isLowStock } from "@/lib/queries";
import { addStockMove, deleteStockMove, toggleStockArchived } from "../../actions";
import { Submit } from "@/components/submit";
import { Stat } from "@/components/ui";
import type { StockItem, StockMove } from "@/lib/types";

const REASONS = { compra: "Compra", uso: "Usado en caso", ajuste: "Ajuste" } as const;

export default async function StockItemPage({ params }: PageProps<"/stock/[id]">) {
  const { id } = await params;
  const { supabase } = await getContext();
  const [itemRes, movesRes] = await Promise.all([
    supabase.from("stock_items").select("*").eq("id", id).maybeSingle<StockItem>(),
    supabase.from("stock_moves").select("*, jobs(id, number, title)").eq("item_id", id).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(100),
  ]);
  const raw = itemRes.data;
  if (!raw) notFound();
  const item = { ...raw, quantity: Number(raw.quantity), min_quantity: Number(raw.min_quantity), cost: Number(raw.cost), price: Number(raw.price) };
  const moves = (movesRes.data ?? []) as (StockMove & { jobs: { id: string; number: number; title: string } | null })[];
  const low = isLowStock(item);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/stock" className="mb-1 inline-block text-sm text-muted">‹ Stock</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">{item.name}</h1>
            <p className="text-sm text-muted">
              {item.category}
              {item.location ? ` · ${item.location}` : ""}
              {item.archived ? " · Archivado" : ""}
            </p>
          </div>
          <Link href={`/stock/${id}/editar`} className="btn-ghost btn-sm">✏️ Editar</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Disponible" value={`${item.quantity} ${item.unit}`} tone={low ? "danger" : undefined} hint={item.min_quantity ? `Mínimo ${item.min_quantity}` : "Sin mínimo"} />
        <Stat label="Costo unitario" value={formatMoney(item.cost)} />
        <Stat label="Precio al cliente" value={formatMoney(item.price)} />
        <Stat label="Margen" value={item.price && item.cost ? `${Math.round(((item.price - item.cost) / item.cost) * 100)}%` : "—"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <section className="card space-y-3 self-start">
          <h2 className="font-semibold">Registrar movimiento</h2>
          <form action={addStockMove} className="space-y-3">
            <input type="hidden" name="item_id" value={id} />
            <div className="flex flex-wrap gap-2">
              <label className="chip cursor-pointer">
                <input type="radio" name="reason" value="compra" defaultChecked className="sr-only" /> Compra
              </label>
              <label className="chip cursor-pointer">
                <input type="radio" name="reason" value="ajuste" className="sr-only" /> Ajuste
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm text-muted">
                Cantidad
                <input className="input mt-1" name="quantity" inputMode="decimal" required />
              </label>
              <label className="text-sm text-muted">
                Costo unit. ($)
                <input className="input mt-1" name="unit_cost" inputMode="decimal" defaultValue={item.cost ? String(item.cost) : ""} />
              </label>
            </div>
            <label className="block text-sm text-muted">
              Fecha
              <input className="input mt-1" type="date" name="date" defaultValue={today()} />
            </label>
            <fieldset className="space-y-2 rounded-xl bg-accent-soft/50 p-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="as_expense" defaultChecked /> Compra: cargar también como gasto
              </label>
              <select className="input" name="method" defaultValue="efectivo" aria-label="Medio de pago">
                {Object.entries(PAY_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="direction" value="salida" /> Ajuste: es una salida (rotura, pérdida…)
              </label>
            </fieldset>
            <input className="input" name="note" placeholder="Nota (proveedor, motivo…)" aria-label="Nota" />
            <Submit className="btn w-full">Guardar</Submit>
          </form>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Movimientos</h2>
          {moves.length === 0 ? (
            <p className="card text-center text-sm text-muted">Sin movimientos.</p>
          ) : (
            <ul className="card divide-y divide-border p-0 text-sm">
              {moves.map((m) => {
                const qty = Number(m.quantity);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-14 shrink-0 text-muted">{formatDay(m.date)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{REASONS[m.reason]}</span>
                      <span className="block truncate text-xs text-muted">
                        {m.jobs ? (
                          <Link href={`/casos/${m.jobs.id}`} className="text-accent">#{m.jobs.number} · {m.jobs.title}</Link>
                        ) : (
                          m.note
                        )}
                        {m.unit_cost ? ` · ${formatMoney(Number(m.unit_cost))} c/u` : ""}
                      </span>
                    </span>
                    <span className={`font-semibold tabular-nums ${qty > 0 ? "text-income" : ""}`}>
                      {qty > 0 ? "+" : "−"}
                      {Math.abs(qty)}
                    </span>
                    <form action={deleteStockMove}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="back" value={`/stock/${id}`} />
                      <Submit className="text-xs text-muted" confirm="¿Borrar este movimiento? La cantidad se corrige sola.">✕</Submit>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <form action={toggleStockArchived}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="archived" value={String(item.archived)} />
        <Submit className="text-sm text-muted underline">{item.archived ? "Reactivar ítem" : "Archivar ítem"}</Submit>
      </form>
    </div>
  );
}
