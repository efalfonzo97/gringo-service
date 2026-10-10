import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { formatDay, formatMoney, today } from "@/lib/format";
import { JOB_MOVEMENTS, JOB_STATUS, PAY_METHODS, REVIEW_OPTIONS, equipmentLabel } from "@/lib/labels";
import { JOB_SELECT, getPhotos, getStockItems } from "@/lib/queries";
import { googleCalendarLink, mapsLink, shortTime, whatsappLink } from "@/lib/util";
import {
  addJobMovement,
  addJobNote,
  consumeStock,
  deleteJob,
  deleteJobNote,
  deleteReminder,
  deleteStockMove,
  deleteTransaction,
  saveReminder,
  setJobStatus,
} from "../../actions";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoUploader } from "@/components/photo-uploader";
import { Submit } from "@/components/submit";
import { KindBadge, StatusBadge } from "@/components/ui";
import type { JobNote, JobStatus, JobWithClient, Reminder, StockMove, Transaction } from "@/lib/types";

const NEXT_STEPS: Partial<Record<JobStatus, JobStatus[]>> = {
  pendiente: ["agendado", "en_curso", "cancelado"],
  agendado: ["en_curso", "terminado", "cancelado"],
  en_curso: ["esperando_repuesto", "terminado"],
  esperando_repuesto: ["en_curso", "terminado"],
  terminado: ["en_curso"],
  cancelado: ["pendiente"],
};

function dateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
}

function BalanceRow({ label, value, sign, strong, tone }: { label: React.ReactNode; value: number; sign?: "+" | "−"; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? "border-t border-border pt-2.5 font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${tone ?? ""}`}>
        {sign && value !== 0 ? `${sign} ` : ""}
        {formatMoney(value)}
      </dd>
    </div>
  );
}

export default async function JobPage({ params }: PageProps<"/casos/[id]">) {
  const { id } = await params;
  const ctx = await getContext();
  const { supabase } = ctx;

  const [jobRes, notesRes, movesRes, txRes, remindersRes, stock, photos] = await Promise.all([
    supabase.from("jobs").select(JOB_SELECT).eq("id", id).maybeSingle(),
    supabase.from("job_notes").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    supabase.from("stock_moves").select("*, stock_items(name, unit)").eq("job_id", id).order("created_at"),
    supabase.from("transactions").select("*").eq("job_id", id).order("date").order("created_at"),
    supabase.from("reminders").select("*").eq("job_id", id).order("due_date"),
    getStockItems(ctx),
    getPhotos(ctx, { jobId: id }),
  ]);
  const job = jobRes.data as JobWithClient | null;
  if (!job) notFound();

  const notes = (notesRes.data ?? []) as JobNote[];
  const moves = (movesRes.data ?? []) as (StockMove & { stock_items: { name: string; unit: string } | null })[];
  const movements = (txRes.data ?? []) as Transaction[];
  const reminders = (remindersRes.data ?? []) as Reminder[];
  const client = job.clients;
  const wa = whatsappLink(client?.phone ?? null);
  const maps = mapsLink(client?.address ?? null, client?.zone);
  const back = `/casos/${job.id}`;

  // --- Balance del caso ---
  const price = Number(job.price);
  const payments = movements.filter((t) => t.type === "ingreso");
  const expenses = movements.filter((t) => t.type === "egreso");
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const due = Math.max(price - paid, 0);
  const partsFromStock = moves.reduce((s, m) => s + Math.abs(Number(m.quantity)) * Number(m.unit_cost ?? 0), 0);
  const partsBilled = moves.reduce((s, m) => s + Math.abs(Number(m.quantity)) * Number(m.unit_price ?? 0), 0);
  const expenseBy = (cats: string[]) => expenses.filter((t) => cats.includes(t.category)).reduce((s, t) => s + Number(t.amount), 0);
  const partsBought = expenseBy(["Repuestos", "Gas refrigerante"]);
  const travel = expenseBy(["Viáticos", "Combustible"]);
  const otherExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0) - partsBought - travel;
  const totalCosts = partsFromStock + partsBought + travel + otherExpenses;
  const revenue = Math.max(price, paid); // si se cobró de más, cuenta lo cobrado
  const labor = revenue - totalCosts;

  const calendar = job.scheduled_date
    ? googleCalendarLink({
        title: `${job.title} · ${client?.name ?? ""}`,
        date: job.scheduled_date,
        time: job.scheduled_time,
        minutes: job.duration_min,
        details: [`Caso #${job.number}`, client?.phone ? `Tel: ${client.phone}` : "", job.problem ?? ""].filter(Boolean).join("\n"),
        location: [client?.address, client?.zone].filter(Boolean).join(", ") || null,
      })
    : null;
  const reviewFrom = job.scheduled_date ?? today();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/casos" className="mb-1 inline-block text-sm text-muted">‹ Casos</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">Caso #{job.number}</p>
            <h1 className="page-title">{job.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={job.status} />
              <KindBadge kind={job.kind} />
              {job.warranty_until && (
                <span className={`badge border border-border ${job.warranty_until >= today() ? "text-accent" : "text-muted"}`}>
                  Garantía hasta {formatDay(job.warranty_until)}
                </span>
              )}
            </div>
          </div>
          <Link href={`/casos/${job.id}/editar`} className="btn-ghost btn-sm">✏️ Editar</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(NEXT_STEPS[job.status] ?? []).map((status) => (
          <form key={status} action={setJobStatus}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="status" value={status} />
            <Submit className={status === "terminado" ? "btn btn-sm" : "btn-ghost btn-sm"}>
              {status === "terminado" ? "✓ " : "→ "}
              {JOB_STATUS[status].label}
            </Submit>
          </form>
        ))}
        {calendar && (
          <a href={calendar} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Agregar a Google Calendar para que avise el celular">
            🗓️ Agregar a Google Calendar
          </a>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <section className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">Cliente</p>
                <Link href={`/clientes/${client?.id}`} className="text-lg font-semibold hover:text-accent">{client?.name}</Link>
                {client?.address && (
                  <p className="text-sm text-muted">
                    {client.address}
                    {client.zone ? `, ${client.zone}` : ""}
                  </p>
                )}
                {client?.phone && <p className="text-sm text-muted">{client.phone}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" aria-label="WhatsApp">💬</a>}
                {client?.phone && <a href={`tel:${client.phone}`} className="btn-ghost btn-sm" aria-label="Llamar">📞</a>}
                {maps && <a href={maps} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" aria-label="Cómo llegar">📍</a>}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div className="col-span-2">
                <dt className="text-muted">Equipo</dt>
                <dd>{job.equipment ? equipmentLabel(job.equipment) : "Sin especificar"}</dd>
              </div>
              <div>
                <dt className="text-muted">Agenda</dt>
                <dd>{job.scheduled_date ? `${formatDay(job.scheduled_date)}${job.scheduled_time ? ` · ${shortTime(job.scheduled_time)}` : ""}` : "Sin fecha"}</dd>
              </div>
              <div>
                <dt className="text-muted">Duración estimada</dt>
                <dd>{job.duration_min < 60 ? `${job.duration_min} min` : `${job.duration_min / 60} h`}</dd>
              </div>
            </dl>
            {job.problem && (
              <div className="border-t border-border pt-3 text-sm">
                <p className="text-muted">Reporta el cliente</p>
                <p className="whitespace-pre-line">{job.problem}</p>
              </div>
            )}
            {job.diagnosis && (
              <div className="border-t border-border pt-3 text-sm">
                <p className="text-muted">Diagnóstico / trabajo realizado</p>
                <p className="whitespace-pre-line">{job.diagnosis}</p>
              </div>
            )}
          </section>

          <section className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Balance del caso</h2>
              {due > 0 ? (
                <span className="badge bg-warn/10 text-warn">Falta cobrar {formatMoney(due)}</span>
              ) : price > 0 ? (
                <span className="badge bg-accent-soft text-accent">Cobrado</span>
              ) : null}
            </div>
            <dl className="text-sm">
              <BalanceRow label="Precio del trabajo" value={price} />
              <BalanceRow label="Cobrado" value={paid} tone="text-income" />
              <BalanceRow label="Repuestos del stock (costo)" value={partsFromStock} sign="−" />
              <BalanceRow label="Repuestos comprados" value={partsBought} sign="−" />
              <BalanceRow label="Viáticos" value={travel} sign="−" />
              {otherExpenses > 0 && <BalanceRow label="Otros gastos" value={otherExpenses} sign="−" />}
              <BalanceRow
                label={
                  <>
                    Mano de obra / ganancia
                    {revenue > 0 && <span className="ml-1 text-xs font-normal text-muted">({Math.round((labor / revenue) * 100)}%)</span>}
                  </>
                }
                value={labor}
                strong
                tone={labor < 0 ? "text-danger" : "text-income"}
              />
            </dl>
            {price === 0 && <p className="text-xs text-muted">Cargá el precio del trabajo en “Editar” para ver el saldo y la ganancia.</p>}

            {movements.length > 0 && (
              <ul className="divide-y divide-border border-t border-border text-sm">
                {movements.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">
                        {t.type === "ingreso" ? "💵 Cobro" : `🧾 ${t.category}`}
                        {t.description.replace(`Caso #${job.number} · `, "") !== job.title && (
                          <span className="text-muted"> · {t.description.replace(`Caso #${job.number} · `, "")}</span>
                        )}
                      </span>
                      <span className="block text-xs text-muted">
                        {formatDay(t.date)} · {PAY_METHODS[t.method]}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`font-medium tabular-nums ${t.type === "ingreso" ? "text-income" : ""}`}>
                        {t.type === "ingreso" ? "+" : "−"}
                        {formatMoney(Number(t.amount))}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="back" value={back} />
                        <Submit className="text-muted" confirm="¿Borrar este movimiento? También se borra de Finanzas.">✕</Submit>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <form action={addJobMovement} className="space-y-2 border-t border-border pt-3">
              <input type="hidden" name="job_id" value={job.id} />
              <div className="grid grid-cols-2 gap-2">
                <select className="input col-span-2 sm:col-span-1" name="movement" defaultValue="cobro" aria-label="Tipo de movimiento">
                  {JOB_MOVEMENTS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input className="input col-span-2 sm:col-span-1" name="amount" inputMode="decimal" placeholder="Importe" defaultValue={due > 0 ? String(due) : ""} required aria-label="Importe" />
                <select className="input" name="method" defaultValue="efectivo" aria-label="Medio de pago">
                  {Object.entries(PAY_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input className="input" type="date" name="date" defaultValue={today()} aria-label="Fecha" />
              </div>
              <input className="input" name="description" placeholder="Detalle (opcional): ej. capacitor en Casa del Repuesto, nafta" aria-label="Detalle" />
              <Submit className="btn w-full sm:w-auto">Registrar</Submit>
              <p className="text-xs text-muted">Todo lo que cargás acá también queda en Finanzas.</p>
            </form>
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">Repuestos del stock</h2>
            {moves.length === 0 ? (
              <p className="text-sm text-muted">Todavía no se usaron repuestos del stock.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {moves.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 truncate">
                      {m.stock_items?.name} × {Math.abs(Number(m.quantity))} {m.stock_items?.unit}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-right text-xs text-muted tabular-nums">
                        costo {formatMoney(Math.abs(Number(m.quantity)) * Number(m.unit_cost ?? 0))}
                      </span>
                      <form action={deleteStockMove}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="back" value={back} />
                        <Submit className="text-muted" confirm="¿Quitar y devolver al stock?">✕</Submit>
                      </form>
                    </span>
                  </li>
                ))}
                <li className="flex justify-between py-2 text-muted">
                  <span>Precio de lista al cliente</span>
                  <span className="tabular-nums">{formatMoney(partsBilled)}</span>
                </li>
              </ul>
            )}
            {stock.length > 0 ? (
              <form action={consumeStock} className="grid grid-cols-[1fr_5rem] gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_5rem_auto]">
                <input type="hidden" name="job_id" value={job.id} />
                <select className="input" name="item_id" required defaultValue="" aria-label="Repuesto">
                  <option value="" disabled>Elegí del stock…</option>
                  {stock.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
                <input className="input" name="quantity" inputMode="decimal" defaultValue="1" aria-label="Cantidad" />
                <Submit className="btn-ghost col-span-2 sm:col-span-1">Usar</Submit>
              </form>
            ) : (
              <p className="text-sm text-muted">
                <Link href="/stock/nuevo" className="text-accent">Cargá ítems en Stock</Link> para descontarlos desde acá.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Fotos</h2>
              {client && <PhotoUploader clientId={client.id} jobId={job.id} />}
            </div>
            <PhotoGrid photos={photos} back={back} />
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">Revisión / recordatorio</h2>
            {reminders.length > 0 && (
              <ul className="divide-y divide-border text-sm">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">🔔 {r.title}</span>
                      <span className="block text-xs text-muted">
                        {formatDay(r.due_date)} · {r.status === "pendiente" ? "pendiente" : r.status === "hecho" ? "hecho ✓" : "descartado"}
                      </span>
                    </span>
                    <form action={deleteReminder}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <Submit className="text-muted" confirm="¿Borrar este recordatorio?">✕</Submit>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={saveReminder} className="grid grid-cols-[1fr_auto] gap-2">
              <input type="hidden" name="client_id" value={job.client_id} />
              <input type="hidden" name="job_id" value={job.id} />
              {job.equipment_id && <input type="hidden" name="equipment_id" value={job.equipment_id} />}
              <input type="hidden" name="from_date" value={reviewFrom} />
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="title" value={job.kind === "instalacion" ? "Revisión de la instalación" : "Revisión / service"} />
              <select className="input" name="months" defaultValue="6" aria-label="Cuándo">
                {REVIEW_OPTIONS.filter((o) => o.months > 0).map((o) => (
                  <option key={o.months} value={o.months}>Revisión {o.label.toLowerCase()}</option>
                ))}
              </select>
              <Submit className="btn-ghost">＋ Programar</Submit>
            </form>
            <p className="text-xs text-muted">Se cuenta desde {formatDay(reviewFrom)}. Cuando toque, aparece en Hoy y en el calendario.</p>
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">Seguimiento</h2>
            <form action={addJobNote} className="space-y-2">
              <input type="hidden" name="job_id" value={job.id} />
              <textarea className="input min-h-20" name="body" placeholder="Ej: Se cambió el capacitor. Cliente avisa que vuelve a fallar…" required />
              <Submit className="btn-ghost btn-sm">Agregar nota</Submit>
            </form>
            <ol className="space-y-3 border-t border-border pt-3">
              {notes.map((n) => (
                <li key={n.id} className="group flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">{dateTime(n.created_at)}</p>
                    <p className="whitespace-pre-line">{n.body}</p>
                  </div>
                  <form action={deleteJobNote}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="job_id" value={job.id} />
                    <Submit className="text-xs text-muted opacity-60 hover:opacity-100" confirm="¿Borrar esta nota?">✕</Submit>
                  </form>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <form action={deleteJob} className="pt-2">
        <input type="hidden" name="id" value={job.id} />
        <Submit className="text-sm text-danger" confirm="¿Borrar el caso con sus notas? Los cobros y gastos quedan en Finanzas.">Borrar caso</Submit>
      </form>
    </div>
  );
}
