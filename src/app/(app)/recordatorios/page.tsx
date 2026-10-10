import Link from "next/link";
import { getContext } from "@/lib/data";
import { formatDay, today } from "@/lib/format";
import { REMINDER_SELECT } from "@/lib/queries";
import { deleteReminder, saveReminder, setReminderStatus } from "../actions";
import { ReminderItem } from "@/components/reminder-item";
import { Submit } from "@/components/submit";
import { Empty, PageHeader } from "@/components/ui";
import type { Client, ReminderWithClient } from "@/lib/types";

export default async function RemindersPage({ searchParams }: PageProps<"/recordatorios">) {
  const params = await searchParams;
  const showDone = params.ver === "hechos";
  const ctx = await getContext();
  const [pendingRes, doneRes, clientsRes] = await Promise.all([
    ctx.supabase.from("reminders").select(REMINDER_SELECT).eq("status", "pendiente").order("due_date").limit(300),
    showDone
      ? ctx.supabase.from("reminders").select(REMINDER_SELECT).neq("status", "pendiente").order("due_date", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] }),
    ctx.supabase.from("clients").select("id, name").order("name"),
  ]);
  const pending = (pendingRes.data ?? []) as ReminderWithClient[];
  const done = (doneRes.data ?? []) as ReminderWithClient[];
  const clients = (clientsRes.data ?? []) as Pick<Client, "id" | "name">[];
  const now = today();
  const overdue = pending.filter((r) => r.due_date <= now);
  const upcoming = pending.filter((r) => r.due_date > now);
  const back = "/recordatorios";

  return (
    <div className="space-y-5">
      <PageHeader title="Recordatorios" subtitle="Revisiones, services y llamados pendientes" />

      <details className="card">
        <summary className="cursor-pointer font-medium text-accent">＋ Nuevo recordatorio</summary>
        <form action={saveReminder} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="back" value={back} />
          <input className="input sm:col-span-2" name="title" placeholder="Ej: Service anual del aire" required aria-label="Recordatorio" />
          <select className="input" name="client_id" defaultValue="" aria-label="Cliente">
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className="input" type="date" name="due_date" required defaultValue={now} aria-label="Fecha" />
          <input className="input sm:col-span-2" name="notes" placeholder="Notas (opcional)" aria-label="Notas" />
          <Submit className="btn sm:w-auto">Guardar</Submit>
        </form>
      </details>

      <section className="space-y-2">
        <h2 className="font-semibold">Para hacer ahora {overdue.length > 0 && <span className="text-sm font-normal text-muted">· {overdue.length}</span>}</h2>
        {overdue.length === 0 ? (
          <Empty>No hay recordatorios vencidos. 👌</Empty>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {overdue.map((r) => (
              <ReminderItem key={r.id} reminder={r} businessName={ctx.business.name} back={back} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Próximos</h2>
        {upcoming.length === 0 ? (
          <Empty>Sin recordatorios a futuro. Se crean solos al cargar un caso con “Recordarme una revisión”.</Empty>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {upcoming.map((r) => (
              <ReminderItem key={r.id} reminder={r} businessName={ctx.business.name} back={back} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <Link href={showDone ? "/recordatorios" : "/recordatorios?ver=hechos"} className="text-sm text-accent">
          {showDone ? "Ocultar resueltos" : "Ver resueltos"}
        </Link>
        {showDone && (
          <ul className="card divide-y divide-border p-0 text-sm">
            {done.length === 0 && <li className="px-4 py-3 text-muted">Nada resuelto todavía.</li>}
            {done.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate">
                    {r.status === "hecho" ? "✓" : "✕"} {r.title}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatDay(r.due_date)}
                    {r.clients ? ` · ${r.clients.name}` : ""}
                    {r.done_job_id ? (
                      <>
                        {" · "}
                        <Link href={`/casos/${r.done_job_id}`} className="text-accent">ver caso</Link>
                      </>
                    ) : null}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={setReminderStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="pendiente" />
                    <input type="hidden" name="back" value="/recordatorios?ver=hechos" />
                    <Submit className="btn-ghost btn-sm">Reabrir</Submit>
                  </form>
                  <form action={deleteReminder}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="back" value="/recordatorios?ver=hechos" />
                    <Submit className="px-2 text-muted" confirm="¿Borrar este recordatorio?">✕</Submit>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
