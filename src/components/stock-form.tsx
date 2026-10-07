"use client";

import { useActionState } from "react";
import { saveStockItem, type FormState } from "@/app/(app)/actions";
import { STOCK_CATEGORIES } from "@/lib/labels";
import type { StockItem } from "@/lib/types";

export function StockForm({ item }: { item?: StockItem }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStockItem, {});
  return (
    <form action={action} className="card space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <label className="label" htmlFor="name">Nombre</label>
        <input className="input" id="name" name="name" defaultValue={item?.name} required placeholder="Ej: Capacitor 35 µF, Gas R410A, Bomba de desagote" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">Categoría</label>
          <select className="input" id="category" name="category" defaultValue={item?.category ?? "repuesto"}>
            {Object.entries(STOCK_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="unit">Unidad</label>
          <select className="input" id="unit" name="unit" defaultValue={item?.unit ?? "u"}>
            <option value="u">Unidad</option>
            <option value="kg">kg</option>
            <option value="m">metro</option>
            <option value="l">litro</option>
            <option value="caja">caja</option>
          </select>
        </div>
        {!item && (
          <div>
            <label className="label" htmlFor="initial_quantity">Cantidad actual</label>
            <input className="input" id="initial_quantity" name="initial_quantity" inputMode="decimal" placeholder="0" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="min_quantity">Avisar cuando quede</label>
          <input className="input" id="min_quantity" name="min_quantity" inputMode="decimal" defaultValue={item?.min_quantity ? String(item.min_quantity) : ""} placeholder="0" />
        </div>
        <div>
          <label className="label" htmlFor="cost">Costo unitario ($)</label>
          <input className="input" id="cost" name="cost" inputMode="decimal" defaultValue={item?.cost ? String(item.cost) : ""} />
        </div>
        <div>
          <label className="label" htmlFor="price">Precio al cliente ($)</label>
          <input className="input" id="price" name="price" inputMode="decimal" defaultValue={item?.price ? String(item.price) : ""} />
        </div>
        <div className={item ? "col-span-2" : ""}>
          <label className="label" htmlFor="location">Dónde está</label>
          <input className="input" id="location" name="location" defaultValue={item?.location ?? ""} placeholder="Camioneta, taller…" />
        </div>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Guardando…" : item ? "Guardar cambios" : "Crear ítem"}</button>
    </form>
  );
}
