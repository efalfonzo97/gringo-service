import type { AppContext } from "@/lib/data";
import { DEFAULT_STOCK_CATEGORIES } from "@/lib/labels";
import type { JobWithClient, Photo, ReminderWithClient, StockCategoryRow, StockItem } from "@/lib/types";

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

/** Casos con precio cargado y saldo pendiente de cobro (todos menos los cancelados). */
export async function getReceivables(ctx: AppContext) {
  const { data } = await ctx.supabase
    .from("jobs")
    .select(JOB_SELECT)
    .neq("status", "cancelado")
    .gt("price", 0)
    .order("scheduled_date", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(500);
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

/** Categorías de stock del negocio (si la base todavía no las tiene, las de siempre). */
export async function getStockCategories(ctx: AppContext): Promise<StockCategoryRow[]> {
  const { data, error } = await ctx.supabase.from("stock_categories").select("id, name").order("name");
  if (error || !data) return DEFAULT_STOCK_CATEGORIES.map((name) => ({ id: name, name }));
  return data;
}

/** Fotos con link temporal para verlas (la carpeta es privada). */
export async function getPhotos(ctx: AppContext, filter: { clientId?: string; jobId?: string }) {
  let query = ctx.supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter.clientId) query = query.eq("client_id", filter.clientId);
  if (filter.jobId) query = query.eq("job_id", filter.jobId);
  const { data } = await query;
  const photos = (data ?? []) as Photo[];
  if (photos.length === 0) return photos;
  const { data: signed } = await ctx.supabase.storage.from("photos").createSignedUrls(photos.map((p) => p.path), 60 * 60);
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return photos.map((p) => ({ ...p, url: urls.get(p.path) ?? null }));
}

export const REMINDER_SELECT =
  "*, clients(id, name, phone, address, zone), equipment(id, type, brand, model), jobs!reminders_job_id_fkey(id, number, kind, title, scheduled_date, closed_at)";

/** Recordatorios pendientes hasta una fecha (exclusiva), incluidos los vencidos. */
export async function getPendingReminders(ctx: AppContext, until: string) {
  const { data } = await ctx.supabase
    .from("reminders")
    .select(REMINDER_SELECT)
    .eq("status", "pendiente")
    .lt("due_date", until)
    .order("due_date")
    .limit(200);
  return (data ?? []) as ReminderWithClient[];
}

/** Recordatorios pendientes entre dos fechas (para el calendario). */
export async function getRemindersBetween(ctx: AppContext, start: string, end: string) {
  const { data } = await ctx.supabase
    .from("reminders")
    .select(REMINDER_SELECT)
    .eq("status", "pendiente")
    .gte("due_date", start)
    .lt("due_date", end)
    .order("due_date");
  return (data ?? []) as ReminderWithClient[];
}
