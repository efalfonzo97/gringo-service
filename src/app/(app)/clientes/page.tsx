import Link from "next/link";
import { getContext } from "@/lib/data";
import { OPEN_STATUSES } from "@/lib/labels";
import { param, whatsappLink } from "@/lib/util";
import { Empty, PageHeader } from "@/components/ui";
import type { Client } from "@/lib/types";

export default async function ClientsPage({ searchParams }: PageProps<"/clientes">) {
  const params = await searchParams;
  const q = param(params.q).toLowerCase();
  const { supabase } = await getContext();

  const [clientsRes, jobsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("jobs").select("client_id, status"),
  ]);
  const stats = new Map<string, { total: number; open: number }>();
  for (const j of jobsRes.data ?? []) {
    const s = stats.get(j.client_id) ?? { total: 0, open: 0 };
    s.total += 1;
    if (OPEN_STATUSES.includes(j.status)) s.open += 1;
    stats.set(j.client_id, s);
  }

  const clients = ((clientsRes.data ?? []) as Client[]).filter(
    (c) => !q || [c.name, c.phone, c.address, c.zone].some((v) => v?.toLowerCase().includes(q)),
  );

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes`} action={<Link href="/clientes/nuevo" className="btn btn-sm">＋ Nuevo</Link>} />
      <form className="mb-4 flex gap-2">
        <input className="input" name="q" defaultValue={q} placeholder="Buscar por nombre, teléfono, dirección o barrio" />
        <button className="btn-ghost">Buscar</button>
      </form>

      {clients.length === 0 ? (
        <Empty>{q ? "No hay clientes que coincidan." : "Todavía no cargaste clientes."}</Empty>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {clients.map((c) => {
            const s = stats.get(c.id);
            const wa = whatsappLink(c.phone);
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent" aria-hidden>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <Link href={`/clientes/${c.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {[c.address, c.zone].filter(Boolean).join(", ") || c.phone || "Sin datos de contacto"}
                  </span>
                </Link>
                <span className="hidden text-right text-xs text-muted sm:block">
                  {s ? `${s.total} casos` : "Sin casos"}
                  {s?.open ? <span className="block font-medium text-warn">{s.open} abiertos</span> : null}
                </span>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost btn-sm px-2" aria-label="WhatsApp">💬</a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
