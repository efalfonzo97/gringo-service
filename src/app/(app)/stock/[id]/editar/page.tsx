import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { StockForm } from "@/components/stock-form";
import { PageHeader } from "@/components/ui";
import type { StockItem } from "@/lib/types";

export default async function EditStockItemPage({ params }: PageProps<"/stock/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await getContext();
  const { data: item } = await supabase.from("stock_items").select("*").eq("id", id).maybeSingle<StockItem>();
  if (!item) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Editar ítem" backHref={`/stock/${id}`} />
      <StockForm item={{ ...item, min_quantity: Number(item.min_quantity), cost: Number(item.cost), price: Number(item.price) }} />
    </div>
  );
}
