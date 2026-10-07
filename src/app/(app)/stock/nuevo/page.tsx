import { StockForm } from "@/components/stock-form";
import { PageHeader } from "@/components/ui";

export default function NewStockItemPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuevo ítem" backHref="/stock" />
      <StockForm />
    </div>
  );
}
