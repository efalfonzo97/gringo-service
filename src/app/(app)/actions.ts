"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, JOB_KINDS, JOB_STATUS, PAY_METHODS, STOCK_CATEGORIES } from "@/lib/labels";
import { orNull, parseAmount, str } from "@/lib/util";
import type { JobKind, JobStatus, StockCategory } from "@/lib/types";

export type FormState = { error?: string };

function refresh() {
  revalidatePath("/", "layout");
}

/** Ruta interna a la que volver después de una acción. */
function back(formData: FormData, fallback: string) {
  const value = str(formData, "back");
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function dateOrNull(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function timeOrNull(value: string) {
  return /^\d{2}:\d{2}/.test(value) ? value : null;
}

// --- Clientes ---

export async function saveClient(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Poné el nombre del cliente." };

  const row = {
    name,
    phone: orNull(str(formData, "phone")),
    address: orNull(str(formData, "address")),
    zone: orNull(str(formData, "zone")),
    notes: orNull(str(formData, "notes")),
  };
  const { data, error } = id
    ? await supabase.from("clients").update(row).eq("id", id).select("id").single()
    : await supabase.from("clients").insert(row).select("id").single();
  if (error) return { error: error.message };

  refresh();
  redirect(`/clientes/${data.id}`);
}

export async function deleteClient(formData: FormData) {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  const { count } = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("client_id", id);
  if (count) redirect(`/clientes/${id}?error=tiene-casos`);
  await supabase.from("clients").delete().eq("id", id);
  refresh();
  redirect("/clientes");
}

export async function saveEquipment(formData: FormData) {
  const { supabase } = await getContext();
  const clientId = str(formData, "client_id");
  const id = str(formData, "id");
  const row = {
    client_id: clientId,
    type: str(formData, "type") || "otro",
    brand: orNull(str(formData, "brand")),
    model: orNull(str(formData, "model")),
    capacity: orNull(str(formData, "capacity")),
    location: orNull(str(formData, "location")),
    installed_on: dateOrNull(str(formData, "installed_on")),
    notes: orNull(str(formData, "notes")),
  };
  if (id) await supabase.from("equipment").update(row).eq("id", id);
  else await supabase.from("equipment").insert(row);
  refresh();
  redirect(`/clientes/${clientId}`);
}

export async function deleteEquipment(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("equipment").delete().eq("id", str(formData, "id"));
  refresh();
  redirect(`/clientes/${str(formData, "client_id")}`);
}

// --- Casos ---

export async function saveJob(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getContext();
  const id = str(formData, "id");

  // Cliente: uno existente o uno nuevo cargado en el mismo formulario.
  let clientId = str(formData, "client_id");
  if (clientId === "nuevo" || !clientId) {
    const name = str(formData, "new_client_name");
    if (!name) return { error: "Elegí un cliente o cargá uno nuevo." };
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        phone: orNull(str(formData, "new_client_phone")),
        address: orNull(str(formData, "new_client_address")),
        zone: orNull(str(formData, "new_client_zone")),
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    clientId = data.id;
  }

  // Equipo: uno del cliente, uno nuevo, o ninguno.
  let equipmentId: string | null = str(formData, "equipment_id") || null;
  if (equipmentId === "nuevo") {
    const { data, error } = await supabase
      .from("equipment")
      .insert({
        client_id: clientId,
        type: str(formData, "new_equipment_type") || "otro",
        brand: orNull(str(formData, "new_equipment_brand")),
        model: orNull(str(formData, "new_equipment_model")),
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    equipmentId = data.id;
  }

  const kind = str(formData, "kind") as JobKind;
  if (!(kind in JOB_KINDS)) return { error: "Elegí el tipo de trabajo." };
  const scheduledDate = dateOrNull(str(formData, "scheduled_date"));
  let status = str(formData, "status") as JobStatus;
  if (!(status in JOB_STATUS)) status = "pendiente";
  if (status === "pendiente" && scheduledDate) status = "agendado";

  const title = str(formData, "title") || JOB_KINDS[kind];
  const duration = Number(str(formData, "duration_min"));
  const row = {
    client_id: clientId,
    equipment_id: equipmentId,
    kind,
    status,
    title,
    problem: orNull(str(formData, "problem")),
    diagnosis: orNull(str(formData, "diagnosis")),
    scheduled_date: scheduledDate,
    scheduled_time: timeOrNull(str(formData, "scheduled_time")),
    duration_min: Number.isFinite(duration) && duration > 0 ? duration : 60,
    price: parseAmount(str(formData, "price")) ?? 0,
    warranty_until: dateOrNull(str(formData, "warranty_until")),
    ...(status === "terminado" ? {} : { closed_at: null }),
  };

  const { data, error } = id
    ? await supabase.from("jobs").update(row).eq("id", id).select("id").single()
    : await supabase.from("jobs").insert(row).select("id").single();
  if (error) return { error: error.message };

  if (status === "terminado") {
    await supabase.from("jobs").update({ closed_at: new Date().toISOString() }).eq("id", data.id).is("closed_at", null);
  }
  if (!id) await supabase.from("job_notes").insert({ job_id: data.id, body: "Caso creado." });
  refresh();
  redirect(`/casos/${data.id}`);
}

export async function setJobStatus(formData: FormData) {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  const status = str(formData, "status") as JobStatus;
  if (!(status in JOB_STATUS)) return;
  await supabase
    .from("jobs")
    .update({ status, closed_at: status === "terminado" ? new Date().toISOString() : null })
    .eq("id", id);
  await supabase.from("job_notes").insert({ job_id: id, body: `Estado: ${JOB_STATUS[status].label}.` });
  refresh();
  redirect(back(formData, `/casos/${id}`));
}

export async function addJobNote(formData: FormData) {
  const { supabase } = await getContext();
  const jobId = str(formData, "job_id");
  const body = str(formData, "body");
  if (body) await supabase.from("job_notes").insert({ job_id: jobId, body });
  refresh();
  redirect(`/casos/${jobId}`);
}

export async function deleteJobNote(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("job_notes").delete().eq("id", str(formData, "id"));
  refresh();
  redirect(`/casos/${str(formData, "job_id")}`);
}

export async function deleteJob(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("jobs").delete().eq("id", str(formData, "id"));
  refresh();
  redirect("/casos");
}

/** Usa un repuesto del stock en un caso: descuenta del stock. */
export async function consumeStock(formData: FormData) {
  const { supabase } = await getContext();
  const jobId = str(formData, "job_id");
  const itemId = str(formData, "item_id");
  const quantity = parseAmount(str(formData, "quantity"));
  if (itemId && quantity) {
    const { data: item } = await supabase.from("stock_items").select("cost, price").eq("id", itemId).single();
    await supabase.from("stock_moves").insert({
      item_id: itemId,
      job_id: jobId,
      reason: "uso",
      quantity: -quantity,
      unit_cost: item?.cost ?? null,
      unit_price: parseAmount(str(formData, "unit_price")) ?? item?.price ?? null,
      date: today(),
    });
  }
  refresh();
  redirect(`/casos/${jobId}`);
}

export async function deleteStockMove(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("stock_moves").delete().eq("id", str(formData, "id"));
  refresh();
  redirect(back(formData, "/stock"));
}

/** Registra un cobro del caso como ingreso en Finanzas. */
export async function registerPayment(formData: FormData) {
  const { supabase } = await getContext();
  const jobId = str(formData, "job_id");
  const amount = parseAmount(str(formData, "amount"));
  const { data: job } = await supabase.from("jobs").select("id, number, title, kind, client_id").eq("id", jobId).single();
  if (job && amount) {
    const method = str(formData, "method");
    await supabase.from("transactions").insert({
      type: "ingreso",
      category: job.kind === "instalacion" ? "Instalación" : "Servicio",
      amount,
      method: method in PAY_METHODS ? method : "efectivo",
      date: dateOrNull(str(formData, "date")) ?? today(),
      description: `Caso #${job.number} · ${job.title}`,
      job_id: job.id,
      client_id: job.client_id,
    });
  }
  refresh();
  redirect(`/casos/${jobId}`);
}

// --- Stock ---

export async function saveStockItem(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Poné el nombre del ítem." };
  const category = str(formData, "category") as StockCategory;

  const row = {
    name,
    category: category in STOCK_CATEGORIES ? category : "repuesto",
    unit: str(formData, "unit") || "u",
    min_quantity: parseAmount(str(formData, "min_quantity")) ?? 0,
    cost: parseAmount(str(formData, "cost")) ?? 0,
    price: parseAmount(str(formData, "price")) ?? 0,
    location: orNull(str(formData, "location")),
  };
  const { data, error } = id
    ? await supabase.from("stock_items").update(row).eq("id", id).select("id").single()
    : await supabase.from("stock_items").insert(row).select("id").single();
  if (error) return { error: error.message };

  // Cantidad inicial de un ítem nuevo: entra como ajuste.
  const initial = parseAmount(str(formData, "initial_quantity"));
  if (!id && initial) {
    await supabase.from("stock_moves").insert({ item_id: data.id, reason: "ajuste", quantity: initial, note: "Stock inicial" });
  }
  refresh();
  redirect(`/stock/${data.id}`);
}

export async function toggleStockArchived(formData: FormData) {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  await supabase.from("stock_items").update({ archived: str(formData, "archived") !== "true" }).eq("id", id);
  refresh();
  redirect(`/stock/${id}`);
}

/** Compra o ajuste manual de stock. La compra puede cargarse también como gasto. */
export async function addStockMove(formData: FormData) {
  const { supabase } = await getContext();
  const itemId = str(formData, "item_id");
  const reason = str(formData, "reason") === "ajuste" ? "ajuste" : "compra";
  const quantity = parseAmount(str(formData, "quantity"));
  const sign = reason === "ajuste" && str(formData, "direction") === "salida" ? -1 : 1;
  if (!quantity) redirect(`/stock/${itemId}`);

  const unitCost = parseAmount(str(formData, "unit_cost"));
  const date = dateOrNull(str(formData, "date")) ?? today();
  await supabase.from("stock_moves").insert({
    item_id: itemId,
    reason,
    quantity: sign * quantity,
    unit_cost: unitCost,
    date,
    note: orNull(str(formData, "note")),
  });

  if (reason === "compra" && unitCost && formData.get("as_expense") === "on") {
    const { data: item } = await supabase.from("stock_items").select("name, category").eq("id", itemId).single();
    const category = item?.category === "gas" ? "Gas refrigerante" : item?.category === "insumo" ? "Insumos" : item?.category === "herramienta" ? "Herramientas" : "Repuestos";
    const method = str(formData, "method");
    await supabase.from("transactions").insert({
      type: "egreso",
      category,
      amount: Math.round(unitCost * quantity * 100) / 100,
      method: method in PAY_METHODS ? method : "efectivo",
      date,
      description: `Compra: ${item?.name ?? "stock"} × ${quantity}`,
    });
  }
  refresh();
  redirect(`/stock/${itemId}`);
}

// --- Finanzas ---

export async function saveTransaction(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  const type = str(formData, "type") === "ingreso" ? "ingreso" : "egreso";
  const amount = parseAmount(str(formData, "amount"));
  if (!amount) return { error: "Poné un importe válido." };
  const category = str(formData, "category");
  const valid = type === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const method = str(formData, "method");

  const row = {
    type,
    amount,
    category: valid.includes(category) ? category : valid[valid.length - 1],
    method: method in PAY_METHODS ? method : "efectivo",
    date: dateOrNull(str(formData, "date")) ?? today(),
    description: str(formData, "description"),
    client_id: orNull(str(formData, "client_id")),
  };
  const { error } = id
    ? await supabase.from("transactions").update(row).eq("id", id)
    : await supabase.from("transactions").insert(row);
  if (error) return { error: error.message };
  refresh();
  redirect(back(formData, "/finanzas"));
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("transactions").delete().eq("id", str(formData, "id"));
  refresh();
  redirect(back(formData, "/finanzas"));
}

// --- Ajustes ---

export async function updateBusiness(formData: FormData) {
  const { supabase, userId } = await getContext();
  const name = str(formData, "name");
  await supabase
    .from("business")
    .update({ ...(name ? { name } : {}), phone: orNull(str(formData, "phone")) })
    .eq("owner_id", userId);
  refresh();
  redirect("/ajustes?ok=1");
}
