"use client";

import { useActionState, useState } from "react";
import { deleteTransaction, saveTransaction, type FormState } from "@/app/(app)/actions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAY_METHODS } from "@/lib/labels";
import type { Client, Transaction } from "@/lib/types";

type Props = {
  transaction?: Transaction;
  clients: Pick<Client, "id" | "name">[];
  defaultType?: "ingreso" | "egreso";
  today: string;
};

export function TransactionForm({ transaction, clients, defaultType = "egreso", today }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTransaction, {});
  const [type, setType] = useState<"ingreso" | "egreso">(transaction?.type ?? defaultType);
  const categories = type === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-4">
        {transaction && <input type="hidden" name="id" value={transaction.id} />}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-border p-1" role="radiogroup" aria-label="Tipo">
          {(["egreso", "ingreso"] as const).map((t) => (
            <label key={t} className={`cursor-pointer rounded-lg py-2 text-center font-medium ${type === t ? (t === "ingreso" ? "bg-income/15 text-income" : "bg-danger/10 text-danger") : "text-muted"}`}>
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              {t === "ingreso" ? "Ingreso" : "Gasto"}
            </label>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="amount">Importe ($)</label>
          <input className="input text-2xl font-semibold" id="amount" name="amount" inputMode="decimal" defaultValue={transaction ? String(transaction.amount) : ""} required autoFocus={!transaction} />
        </div>
        <fieldset>
          <legend className="label">Categoría</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c, i) => (
              <label key={`${type}-${c}`} className="chip cursor-pointer">
                <input type="radio" name="category" value={c} defaultChecked={transaction ? transaction.category === c : i === 0} className="sr-only" />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="date">Fecha</label>
            <input className="input" type="date" id="date" name="date" defaultValue={transaction?.date ?? today} />
          </div>
          <div>
            <label className="label" htmlFor="method">Medio</label>
            <select className="input" id="method" name="method" defaultValue={transaction?.method ?? "efectivo"}>
              {Object.entries(PAY_METHODS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Detalle</label>
          <input className="input" id="description" name="description" defaultValue={transaction?.description} placeholder={type === "ingreso" ? "Ej: Service split" : "Ej: Nafta, Casa del Repuesto"} />
        </div>
        {type === "ingreso" && (
          <div>
            <label className="label" htmlFor="client_id">Cliente (opcional)</label>
            <select className="input" id="client_id" name="client_id" defaultValue={transaction?.client_id ?? ""}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <button className="btn w-full sm:w-auto" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
      </form>

      {transaction && (
        <form
          action={deleteTransaction}
          onSubmit={(e) => {
            if (!window.confirm("¿Borrar este movimiento?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={transaction.id} />
          <button className="text-sm text-danger">Borrar movimiento</button>
        </form>
      )}
    </div>
  );
}
