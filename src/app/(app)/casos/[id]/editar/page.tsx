import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { JobForm } from "@/components/job-form";
import { PageHeader } from "@/components/ui";
import type { Client, Equipment, Job } from "@/lib/types";

export default async function EditJobPage({ params }: PageProps<"/casos/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await getContext();
  const [job, clients, equipment] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).maybeSingle<Job>(),
    supabase.from("clients").select("id, name, zone").order("name"),
    supabase.from("equipment").select("*").order("created_at"),
  ]);
  if (!job.data) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Editar caso #${job.data.number}`} backHref={`/casos/${id}`} />
      <JobForm
        job={job.data}
        clients={(clients.data ?? []) as Pick<Client, "id" | "name" | "zone">[]}
        equipment={(equipment.data ?? []) as Equipment[]}
      />
    </div>
  );
}
