import Link from "next/link";
import { equipmentLabel } from "@/lib/labels";
import { mapsLink, shortTime, whatsappLink } from "@/lib/util";
import { formatDay } from "@/lib/format";
import type { JobWithClient } from "@/lib/types";
import { StatusBadge } from "./ui";

/** Fila de un caso: hora o fecha, cliente, equipo, estado y accesos rápidos. */
export function JobRow({ job, showDate = false, actions }: { job: JobWithClient; showDate?: boolean; actions?: React.ReactNode }) {
  const client = job.clients;
  const wa = whatsappLink(client?.phone ?? null);
  const maps = mapsLink(client?.address ?? null, client?.zone);
  const when = showDate && job.scheduled_date ? formatDay(job.scheduled_date) : shortTime(job.scheduled_time);

  return (
    <li className="px-4 py-3">
      <div className="flex items-stretch gap-3">
      <div className="w-14 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-accent">{when || "—"}</div>
      <Link href={`/casos/${job.id}`} className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{client?.name ?? "Sin cliente"}</span>
          <StatusBadge status={job.status} />
        </span>
        <span className="block truncate text-sm">
          #{job.number} · {job.title}
        </span>
        <span className="block truncate text-xs text-muted">
          {job.equipment ? equipmentLabel(job.equipment) : null}
          {job.equipment && client?.address ? " · " : null}
          {client?.address}
          {client?.zone ? `, ${client.zone}` : ""}
        </span>
      </Link>
      <div className="flex shrink-0 flex-col justify-center gap-1">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost btn-sm px-2" aria-label="WhatsApp">
            💬
          </a>
        )}
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className="btn-ghost btn-sm px-2" aria-label="Cómo llegar">
            📍
          </a>
        )}
      </div>
      </div>
      {actions && <div className="mt-2 flex flex-wrap gap-2 pl-[4.25rem]">{actions}</div>}
    </li>
  );
}
