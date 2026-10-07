import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui";
import type { Transaction } from "@/lib/types";

export default async function EditTransactionPage({ params }: PageProps<"/finanzas/[id]">) {
  const { id } = await params;
  const { supabase } = await getContext();
  const [tx, clients] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle<Transaction>(),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  if (!tx.data) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Editar movimiento"
        backHref="/finanzas"
        subtitle={tx.data.job_id ? <Link href={`/casos/${tx.data.job_id}`} className="text-accent">Vinculado a un caso →</Link> : undefined}
      />
      <TransactionForm transaction={{ ...tx.data, amount: Number(tx.data.amount) }} clients={clients.data ?? []} today={today()} />
    </div>
  );
}
