import { getContext } from "@/lib/data";
import { getStockCategories } from "@/lib/queries";
import { StockForm } from "@/components/stock-form";
import { PageHeader } from "@/components/ui";

export default async function NewStockItemPage() {
  const ctx = await getContext();
  const categories = await getStockCategories(ctx);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuevo ítem" backHref="/stock" />
      <StockForm categories={categories} />
    </div>
  );
}
