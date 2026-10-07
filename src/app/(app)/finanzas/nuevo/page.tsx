import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui";

export default async function NewTransactionPage({ searchParams }: PageProps<"/finanzas/nuevo">) {
  const params = await searchParams;
  const { supabase } = await getContext();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuevo movimiento" backHref="/finanzas" />
      <TransactionForm clients={clients ?? []} defaultType={params.tipo === "ingreso" ? "ingreso" : "egreso"} today={today()} />
    </div>
  );
}
