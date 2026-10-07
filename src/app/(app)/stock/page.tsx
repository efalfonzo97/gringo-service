import Link from "next/link";
import { getContext } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { STOCK_CATEGORIES } from "@/lib/labels";
import { getStockItems, isLowStock } from "@/lib/queries";
import { param, withQuery } from "@/lib/util";
import { Empty, PageHeader, Stat } from "@/components/ui";

export default async function StockPage({ searchParams }: PageProps<"/stock">) {
  const params = await searchParams;
  const q = param(params.q).toLowerCase();
  const category = param(params.cat);
  const onlyLow = params.bajo === "1";
  const showArchived = params.archivados === "1";

  const ctx = await getContext();
  const all = await getStockItems(ctx, showArchived);
  const active = all.filter((i) => !i.archived);
  const items = all.filter(
    (i) =>
      (showArchived ? i.archived : true) &&
      (!q || i.name.toLowerCase().includes(q)) &&
      (!category || i.category === category) &&
      (!onlyLow || isLowStock(i)),
  );
  const value = active.reduce((s, i) => s + Math.max(i.quantity, 0) * i.cost, 0);
  const low = active.filter(isLowStock).length;
  const base = { q: q || null, cat: category || null, bajo: onlyLow ? "1" : null };

  return (
    <div>
      <PageHeader title="Stock" subtitle="Repuestos, insumos y gas" action={<Link href="/stock/nuevo" className="btn btn-sm">＋ Nuevo</Link>} />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Ítems" value={active.length} />
        <Stat label="Stock bajo" value={low} tone={low ? "danger" : undefined} />
        <Stat label="Valor (costo)" value={formatMoney(value)} />
      </div>

      <form className="mb-3 flex gap-2">
        <input className="input" name="q" defaultValue={q} placeholder="Buscar ítem" />
        <select className="input w-auto" name="cat" defaultValue={category}>
          <option value="">Todas</option>
          {Object.entries(STOCK_CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="btn-ghost">Buscar</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={withQuery("/stock", { ...base, bajo: onlyLow ? null : "1" })} className={`chip ${onlyLow ? "border-accent bg-accent-soft font-semibold" : ""}`}>
          Solo stock bajo
        </Link>
        <Link href={withQuery("/stock", { ...base, archivados: showArchived ? null : "1" })} className={`chip ${showArchived ? "border-accent bg-accent-soft font-semibold" : ""}`}>
          Archivados
        </Link>
      </div>

      {items.length === 0 ? (
        <Empty>{all.length ? "No hay ítems que coincidan." : "Todavía no cargaste ítems de stock."}</Empty>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {items.map((i) => {
            const isLow = isLowStock(i);
            return (
              <li key={i.id}>
                <Link href={`/stock/${i.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {STOCK_CATEGORIES[i.category]}
                      {i.location ? ` · ${i.location}` : ""}
                      {i.price ? ` · ${formatMoney(i.price)} c/u` : ""}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={`block font-semibold tabular-nums ${isLow ? "text-danger" : ""}`}>
                      {i.quantity} {i.unit}
                    </span>
                    {isLow && <span className="block text-xs text-danger">mín. {i.min_quantity}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
