import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { ClientForm } from "@/components/client-form";
import { PageHeader } from "@/components/ui";
import type { Client } from "@/lib/types";

export default async function EditClientPage({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await getContext();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>();
  if (!client) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Editar cliente" backHref={`/clientes/${id}`} />
      <ClientForm client={client} />
    </div>
  );
}
