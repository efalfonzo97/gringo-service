import { getContext } from "@/lib/data";
import { isDate } from "@/lib/format";
import { param } from "@/lib/util";
import { JobForm } from "@/components/job-form";
import { PageHeader } from "@/components/ui";
import type { Client, Equipment } from "@/lib/types";

export default async function NewJobPage({ searchParams }: PageProps<"/casos/nuevo">) {
  const params = await searchParams;
  const { supabase } = await getContext();
  const [clients, equipment] = await Promise.all([
    supabase.from("clients").select("id, name, zone").order("name"),
    supabase.from("equipment").select("*").order("created_at"),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuevo caso" backHref="/casos" />
      <JobForm
        clients={(clients.data ?? []) as Pick<Client, "id" | "name" | "zone">[]}
        equipment={(equipment.data ?? []) as Equipment[]}
        defaults={{ clientId: param(params.cliente) || undefined, date: isDate(params.fecha) ? params.fecha : undefined }}
      />
    </div>
  );
}
