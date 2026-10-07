import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { formatDay, formatMoney } from "@/lib/format";
import { EQUIPMENT_TYPES, OPEN_STATUSES, equipmentLabel } from "@/lib/labels";
import { JOB_SELECT } from "@/lib/queries";
import { mapsLink, param, whatsappLink } from "@/lib/util";
import { deleteClient, deleteEquipment, saveEquipment } from "../../actions";
import { JobRow } from "@/components/job-row";
import { Submit } from "@/components/submit";
import { Empty, Stat } from "@/components/ui";
import type { Client, Equipment, JobWithClient } from "@/lib/types";

export default async function ClientPage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await getContext();

  const [clientRes, equipmentRes, jobsRes, paidRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    supabase.from("equipment").select("*").eq("client_id", id).order("created_at"),
    supabase.from("jobs").select(JOB_SELECT).eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("transactions").select("amount").eq("client_id", id).eq("type", "ingreso"),
  ]);
  const client = clientRes.data;
  if (!client) notFound();

  const equipment = (equipmentRes.data ?? []) as Equipment[];
  const jobs = (jobsRes.data ?? []) as JobWithClient[];
  const billed = (paidRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const open = jobs.filter((j) => OPEN_STATUSES.includes(j.status)).length;
  const wa = whatsappLink(client.phone);
  const maps = mapsLink(client.address, client.zone);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/clientes" className="mb-1 inline-block text-sm text-muted">‹ Clientes</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">{client.name}</h1>
            <p className="text-sm text-muted">
              {[client.address, client.zone].filter(Boolean).join(", ")}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">💬 WhatsApp</a>}
            {client.phone && <a href={`tel:${client.phone}`} className="btn-ghost btn-sm">📞</a>}
            {maps && <a href={maps} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">📍</a>}
            <Link href={`/clientes/${id}/editar`} className="btn-ghost btn-sm">✏️ Editar</Link>
          </div>
        </div>
        {client.notes && <p className="card mt-3 whitespace-pre-line text-sm">{client.notes}</p>}
        {param(query.error) === "tiene-casos" && (
          <p className="mt-3 text-sm text-danger">No se puede borrar un cliente con casos. Borrá primero sus casos.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Casos" value={jobs.length} />
        <Stat label="Abiertos" value={open} tone={open ? "warn" : undefined} />
        <Stat label="Facturado" value={formatMoney(billed)} tone="income" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Historial de casos</h2>
            <Link href={`/casos/nuevo?cliente=${id}`} className="btn btn-sm">＋ Nuevo caso</Link>
          </div>
          {jobs.length === 0 ? (
            <Empty>Sin casos todavía.</Empty>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} showDate />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Equipos</h2>
          <ul className="card divide-y divide-border p-0 text-sm">
            {equipment.length === 0 && <li className="px-4 py-3 text-muted">Sin equipos cargados.</li>}
            {equipment.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{equipmentLabel(e)}</p>
                    <p className="text-xs text-muted">
                      {[e.capacity, e.location, e.installed_on ? `instalado ${formatDay(e.installed_on)}` : null].filter(Boolean).join(" · ")}
                    </p>
                    {e.notes && <p className="text-xs text-muted">{e.notes}</p>}
                  </div>
                  <form action={deleteEquipment}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="client_id" value={id} />
                    <Submit className="text-xs text-muted" confirm="¿Borrar este equipo?">✕</Submit>
                  </form>
                </div>
              </li>
            ))}
            <li className="px-4 py-3">
              <details>
                <summary className="cursor-pointer font-medium text-accent">＋ Agregar equipo</summary>
                <form action={saveEquipment} className="mt-3 space-y-2">
                  <input type="hidden" name="client_id" value={id} />
                  <select className="input" name="type" defaultValue="aire" aria-label="Tipo">
                    {Object.entries(EQUIPMENT_TYPES).map(([value, t]) => (
                      <option key={value} value={value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" name="brand" placeholder="Marca" aria-label="Marca" />
                    <input className="input" name="model" placeholder="Modelo" aria-label="Modelo" />
                    <input className="input" name="capacity" placeholder="Frigorías / litros / kg" aria-label="Capacidad" />
                    <input className="input" name="location" placeholder="Ubicación" aria-label="Ubicación" />
                  </div>
                  <label className="block text-xs text-muted">
                    Fecha de instalación
                    <input className="input mt-1" type="date" name="installed_on" />
                  </label>
                  <input className="input" name="notes" placeholder="Notas" aria-label="Notas" />
                  <Submit className="btn-ghost btn-sm w-full">Guardar equipo</Submit>
                </form>
              </details>
            </li>
          </ul>
        </section>
      </div>

      <form action={deleteClient}>
        <input type="hidden" name="id" value={id} />
        <Submit className="text-sm text-danger" confirm="¿Borrar este cliente y sus equipos?">Borrar cliente</Submit>
      </form>
    </div>
  );
}
