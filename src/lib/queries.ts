import type { AppContext } from "@/lib/data";
import type { JobWithClient, StockItem } from "@/lib/types";

export const JOB_SELECT = "*, clients(id, name, phone, address, zone), equipment(id, type, brand, model)";

/** Casos agendados entre dos fechas (fin exclusivo), ordenados por día y hora. */
export async function getScheduledJobs(ctx: AppContext, start: string, end: string) {
  const { data } = await ctx.supabase
    .from("jobs")
    .select(JOB_SELECT)
    .gte("scheduled_date", start)
    .lt("scheduled_date", end)
    .order("scheduled_date")
    .order("scheduled_time", { nullsFirst: false });
  return (data ?? []) as JobWithClient[];
}

/** Cuánto se cobró de cada caso (suma de ingresos vinculados). */
export async function getPaidByJob(ctx: AppContext, jobIds: string[]) {
  const paid = new Map<string, number>();
  if (jobIds.length === 0) return paid;
  const { data } = await ctx.supabase.from("transactions").select("job_id, amount").eq("type", "ingreso").in("job_id", jobIds);
  for (const t of data ?? []) paid.set(t.job_id, (paid.get(t.job_id) ?? 0) + Number(t.amount));
  return paid;
}

/** Casos terminados con saldo pendiente de cobro. */
export async function getReceivables(ctx: AppContext) {
  const { data } = await ctx.supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "terminado")
    .gt("price", 0)
    .order("closed_at", { ascending: false })
    .limit(300);
  const jobs = (data ?? []) as JobWithClient[];
  const paid = await getPaidByJob(ctx, jobs.map((j) => j.id));
  return jobs
    .map((job) => ({ job, due: Number(job.price) - (paid.get(job.id) ?? 0) }))
    .filter((r) => r.due > 0.5);
}

export async function getStockItems(ctx: AppContext, includeArchived = false) {
  let query = ctx.supabase.from("stock_items").select("*").order("name");
  if (!includeArchived) query = query.eq("archived", false);
  const { data } = await query;
  return ((data ?? []) as StockItem[]).map((i) => ({ ...i, quantity: Number(i.quantity), min_quantity: Number(i.min_quantity), cost: Number(i.cost), price: Number(i.price) }));
}

export function isLowStock(item: Pick<StockItem, "quantity" | "min_quantity">) {
  return item.min_quantity > 0 && item.quantity <= item.min_quantity;
}
