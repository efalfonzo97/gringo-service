import Link from "next/link";
import { postponeReminder, setReminderStatus } from "@/app/(app)/actions";
import { formatDay, today } from "@/lib/format";
import { EQUIPMENT_TYPES, JOB_KINDS, equipmentLabel } from "@/lib/labels";
import { googleCalendarLink, monthsBetween, whatsappLink, withQuery } from "@/lib/util";
import type { ReminderWithClient } from "@/lib/types";
import { Submit } from "./submit";

function whenLabel(due: string, now: string) {
  if (due === now) return { text: "Hoy", tone: "text-warn font-semibold" };
  if (due < now) {
    const [y, m, d] = due.split("-").map(Number);
    const [y2, m2, d2] = now.split("-").map(Number);
    const days = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y, m - 1, d)) / 86400000);
    return { text: `Venció hace ${days} día${days === 1 ? "" : "s"}`, tone: "text-danger font-semibold" };
  }
  return { text: formatDay(due), tone: "text-muted" };
}

/** Mensaje de WhatsApp listo para mandar al cliente. */
function whatsappText(r: ReminderWithClient, businessName: string) {
  const name = r.clients?.name.split(" ")[0] ?? "";
  const equipment = r.equipment ? EQUIPMENT_TYPES[r.equipment.type].label.toLowerCase() : "equipo";
  const origin = r.jobs?.scheduled_date ?? r.jobs?.closed_at?.slice(0, 10) ?? null;
  const months = origin ? monthsBetween(origin, today()) : 0;
  const what = r.jobs ? (r.jobs.kind === "instalacion" ? "instalamos" : r.jobs.kind === "mantenimiento" ? "le hicimos el mantenimiento a" : "reparamos") : "revisamos";
  const ago = months >= 1 ? `Hace ${months === 12 ? "un año" : `${months} meses`} ${what} tu ${equipment}` : `Te escribo por tu ${equipment}`;
  return `Hola ${name}! Te escribo de ${businessName}. ${ago} y ya toca hacerle una revisión para que siga funcionando bien. ¿Te parece si coordinamos un día?`;
}

export function ReminderItem({ reminder: r, businessName, back }: { reminder: ReminderWithClient; businessName: string; back: string }) {
  const now = today();
  const when = whenLabel(r.due_date, now);
  const wa = whatsappLink(r.clients?.phone ?? null, whatsappText(r, businessName));
  const scheduleHref = withQuery("/casos/nuevo", {
    cliente: r.client_id,
    equipo: r.equipment_id,
    tipo: "mantenimiento",
    titulo: r.title,
    recordatorio: r.id,
  });
  const calendar = googleCalendarLink({
    title: `${r.title}${r.clients ? ` · ${r.clients.name}` : ""}`,
    date: r.due_date,
    details: [r.clients?.phone ? `Tel: ${r.clients.phone}` : "", r.notes ?? ""].filter(Boolean).join("\n"),
    location: [r.clients?.address, r.clients?.zone].filter(Boolean).join(", ") || null,
  });

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl" aria-hidden>🔔</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{r.title}</span>
            <span className={`text-xs ${when.tone}`}>{when.text}</span>
          </p>
          <p className="truncate text-sm text-muted">
            {r.clients ? (
              <Link href={`/clientes/${r.clients.id}`} className="text-foreground hover:text-accent">{r.clients.name}</Link>
            ) : (
              "Sin cliente"
            )}
            {r.equipment ? ` · ${equipmentLabel(r.equipment)}` : ""}
          </p>
          {r.jobs && (
            <p className="truncate text-xs text-muted">
              Origen: <Link href={`/casos/${r.jobs.id}`} className="text-accent">#{r.jobs.number} {JOB_KINDS[r.jobs.kind]}</Link>
              {r.jobs.scheduled_date ? ` del ${formatDay(r.jobs.scheduled_date)}` : ""}
            </p>
          )}
          {r.notes && <p className="text-xs text-muted">{r.notes}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-9">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">💬 Avisar</a>
        )}
        {r.client_id && <Link href={scheduleHref} className="btn btn-sm">📅 Agendar</Link>}
        <form action={postponeReminder}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="days" value="7" />
          <input type="hidden" name="back" value={back} />
          <Submit className="btn-ghost btn-sm">+1 semana</Submit>
        </form>
        <form action={setReminderStatus}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="status" value="hecho" />
          <input type="hidden" name="back" value={back} />
          <Submit className="btn-ghost btn-sm">✓ Listo</Submit>
        </form>
        <a href={calendar} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Agregar a Google Calendar para que avise el celular">
          🗓️ Google
        </a>
      </div>
    </li>
  );
}
