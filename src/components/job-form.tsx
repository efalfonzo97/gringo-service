"use client";

import { useActionState, useState } from "react";
import { saveJob, type FormState } from "@/app/(app)/actions";
import { EQUIPMENT_TYPES, JOB_KINDS, JOB_STATUS, REVIEW_OPTIONS, equipmentLabel } from "@/lib/labels";
import type { Client, Equipment, Job, JobKind } from "@/lib/types";

type Props = {
  clients: Pick<Client, "id" | "name" | "zone">[];
  equipment: Equipment[];
  job?: Job;
  defaults?: { clientId?: string; date?: string; equipmentId?: string; kind?: JobKind; title?: string; reminderId?: string };
};

export function JobForm({ clients, equipment, job, defaults = {} }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveJob, {});
  const [clientId, setClientId] = useState(job?.client_id ?? defaults.clientId ?? (clients.length ? "" : "nuevo"));
  const [equipmentId, setEquipmentId] = useState(job?.equipment_id ?? defaults.equipmentId ?? "");
  const [kind, setKind] = useState<JobKind>(job?.kind ?? defaults.kind ?? "reparacion");
  // Revisión sugerida: instalaciones y mantenimientos a 6 meses.
  const [reviewMonths, setReviewMonths] = useState<number | null>(null);
  const review = reviewMonths ?? (kind === "instalacion" || kind === "mantenimiento" ? 6 : 0);
  const clientEquipment = equipment.filter((e) => e.client_id === clientId);
  const isNewClient = clientId === "nuevo";

  return (
    <form action={action} className="space-y-4">
      {job && <input type="hidden" name="id" value={job.id} />}
      {!job && defaults.reminderId && <input type="hidden" name="reminder_id" value={defaults.reminderId} />}

      <section className="card space-y-4">
        <h2 className="font-semibold">Cliente y equipo</h2>
        <div>
          <label className="label" htmlFor="client_id">Cliente</label>
          <select
            id="client_id"
            name="client_id"
            className="input"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setEquipmentId(e.target.value === "nuevo" ? "nuevo" : "");
            }}
            required
          >
            <option value="" disabled>Elegí un cliente…</option>
            <option value="nuevo">＋ Cliente nuevo</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.zone ? ` (${c.zone})` : ""}
              </option>
            ))}
          </select>
        </div>

        {isNewClient && (
          <div className="grid gap-3 rounded-xl bg-accent-soft/50 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="new_client_name">Nombre</label>
              <input className="input" id="new_client_name" name="new_client_name" required autoComplete="off" />
            </div>
            <div>
              <label className="label" htmlFor="new_client_phone">Teléfono / WhatsApp</label>
              <input className="input" id="new_client_phone" name="new_client_phone" type="tel" inputMode="tel" />
            </div>
            <div>
              <label className="label" htmlFor="new_client_zone">Barrio / localidad</label>
              <input className="input" id="new_client_zone" name="new_client_zone" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="new_client_address">Dirección</label>
              <input className="input" id="new_client_address" name="new_client_address" />
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="equipment_id">Equipo</label>
          <select id="equipment_id" name="equipment_id" className="input" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">Sin especificar</option>
            <option value="nuevo">＋ Equipo nuevo</option>
            {clientEquipment.map((e) => (
              <option key={e.id} value={e.id}>
                {equipmentLabel(e)}
                {e.location ? ` — ${e.location}` : ""}
              </option>
            ))}
          </select>
        </div>

        {equipmentId === "nuevo" && (
          <div className="grid gap-3 rounded-xl bg-accent-soft/50 p-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="new_equipment_type">Tipo</label>
              <select className="input" id="new_equipment_type" name="new_equipment_type" defaultValue="aire">
                {Object.entries(EQUIPMENT_TYPES).map(([value, t]) => (
                  <option key={value} value={value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="new_equipment_brand">Marca</label>
              <input className="input" id="new_equipment_brand" name="new_equipment_brand" />
            </div>
            <div>
              <label className="label" htmlFor="new_equipment_model">Modelo</label>
              <input className="input" id="new_equipment_model" name="new_equipment_model" />
            </div>
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Trabajo</h2>
        <fieldset>
          <legend className="label">Tipo</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(JOB_KINDS).map(([value, label]) => (
              <label key={value} className="chip cursor-pointer">
                <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value as JobKind)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="title">Título</label>
          <input className="input" id="title" name="title" defaultValue={job?.title ?? defaults.title} placeholder="Ej: No enfría, pierde agua, instalación split 3000 fg" />
        </div>
        <div>
          <label className="label" htmlFor="problem">Qué reporta el cliente</label>
          <textarea className="input min-h-20" id="problem" name="problem" defaultValue={job?.problem ?? ""} />
        </div>
        {job && (
          <div>
            <label className="label" htmlFor="diagnosis">Diagnóstico / trabajo realizado</label>
            <textarea className="input min-h-20" id="diagnosis" name="diagnosis" defaultValue={job.diagnosis ?? ""} />
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Agenda y precio</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="scheduled_date">Día</label>
            <input className="input" type="date" id="scheduled_date" name="scheduled_date" defaultValue={job?.scheduled_date ?? defaults.date ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="scheduled_time">Hora</label>
            <input className="input" type="time" id="scheduled_time" name="scheduled_time" step={900} defaultValue={job?.scheduled_time?.slice(0, 5) ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="duration_min">Duración</label>
            <select className="input" id="duration_min" name="duration_min" defaultValue={String(job?.duration_min ?? 60)}>
              {[30, 60, 90, 120, 180, 240, 480].map((m) => (
                <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="price">Precio del trabajo ($)</label>
            <input className="input" id="price" name="price" inputMode="decimal" defaultValue={job?.price ? String(job.price) : ""} placeholder="0" />
            <p className="mt-1 text-xs text-muted">Queda en “Por cobrar” hasta que registres el cobro.</p>
          </div>
        </div>
        {!job && (
          <div>
            <label className="label" htmlFor="review_months">Recordarme una revisión</label>
            <select className="input" id="review_months" name="review_months" value={review} onChange={(e) => setReviewMonths(Number(e.target.value))}>
              {REVIEW_OPTIONS.map((o) => (
                <option key={o.months} value={o.months}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Se cuenta desde el día del trabajo. Te aparece en Hoy y en el calendario cuando toque.</p>
          </div>
        )}
        {job && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="status">Estado</label>
              <select className="input" id="status" name="status" defaultValue={job.status}>
                {Object.entries(JOB_STATUS).map(([value, s]) => (
                  <option key={value} value={value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="warranty_until">Garantía hasta</label>
              <input className="input" type="date" id="warranty_until" name="warranty_until" defaultValue={job.warranty_until ?? ""} />
            </div>
          </div>
        )}
      </section>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full sm:w-auto" disabled={pending}>
        {pending ? "Guardando…" : job ? "Guardar cambios" : "Crear caso"}
      </button>
    </form>
  );
}
