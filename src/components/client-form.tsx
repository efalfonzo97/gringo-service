"use client";

import { useActionState } from "react";
import { saveClient, type FormState } from "@/app/(app)/actions";
import type { Client } from "@/lib/types";

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveClient, {});
  return (
    <form action={action} className="card space-y-4">
      {client && <input type="hidden" name="id" value={client.id} />}
      <div>
        <label className="label" htmlFor="name">Nombre</label>
        <input className="input" id="name" name="name" defaultValue={client?.name} required autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">Teléfono / WhatsApp</label>
          <input className="input" id="phone" name="phone" type="tel" inputMode="tel" defaultValue={client?.phone ?? ""} placeholder="11 2345-6789" />
        </div>
        <div>
          <label className="label" htmlFor="zone">Barrio / localidad</label>
          <input className="input" id="zone" name="zone" defaultValue={client?.zone ?? ""} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">Dirección</label>
        <input className="input" id="address" name="address" defaultValue={client?.address ?? ""} placeholder="Calle 123, piso/depto" />
      </div>
      <div>
        <label className="label" htmlFor="notes">Notas</label>
        <textarea className="input min-h-20" id="notes" name="notes" defaultValue={client?.notes ?? ""} placeholder="Horarios, cómo entrar, referencias…" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Guardando…" : client ? "Guardar cambios" : "Crear cliente"}</button>
    </form>
  );
}
