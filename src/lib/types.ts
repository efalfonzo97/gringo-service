export type Business = { owner_id: string; name: string; phone: string | null };

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  zone: string | null;
  notes: string | null;
  created_at: string;
};

export type EquipmentType = "aire" | "heladera" | "lavarropas" | "freezer" | "otro";

export type Equipment = {
  id: string;
  client_id: string;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  capacity: string | null;
  location: string | null;
  installed_on: string | null;
  notes: string | null;
};

export type JobKind = "reparacion" | "instalacion" | "mantenimiento" | "presupuesto";
export type JobStatus = "pendiente" | "agendado" | "en_curso" | "esperando_repuesto" | "terminado" | "cancelado";

export type Job = {
  id: string;
  number: number;
  client_id: string;
  equipment_id: string | null;
  kind: JobKind;
  status: JobStatus;
  title: string;
  problem: string | null;
  diagnosis: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_min: number;
  price: number;
  warranty_until: string | null;
  closed_at: string | null;
  created_at: string;
};

export type JobWithClient = Job & {
  clients: Pick<Client, "id" | "name" | "phone" | "address" | "zone"> | null;
  equipment: Pick<Equipment, "id" | "type" | "brand" | "model"> | null;
};

export type JobNote = { id: string; job_id: string; body: string; created_at: string };

export type StockItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost: number;
  price: number;
  location: string | null;
  archived: boolean;
};

export type StockMove = {
  id: string;
  item_id: string;
  job_id: string | null;
  date: string;
  reason: "compra" | "uso" | "ajuste";
  quantity: number;
  unit_cost: number | null;
  unit_price: number | null;
  note: string | null;
  created_at: string;
};

export type PayMethod = "efectivo" | "transferencia" | "mercadopago" | "tarjeta" | "otro";

export type Transaction = {
  id: string;
  date: string;
  type: "ingreso" | "egreso";
  category: string;
  amount: number;
  method: PayMethod;
  description: string;
  job_id: string | null;
  client_id: string | null;
  created_at: string;
};

export type StockCategoryRow = { id: string; name: string };

export type Photo = {
  id: string;
  client_id: string;
  job_id: string | null;
  path: string;
  caption: string | null;
  created_at: string;
  url?: string | null;
};

export type ReminderStatus = "pendiente" | "hecho" | "descartado";

export type Reminder = {
  id: string;
  client_id: string | null;
  job_id: string | null;
  equipment_id: string | null;
  due_date: string;
  title: string;
  notes: string | null;
  status: ReminderStatus;
  done_job_id: string | null;
  created_at: string;
};

export type ReminderWithClient = Reminder & {
  clients: Pick<Client, "id" | "name" | "phone" | "address" | "zone"> | null;
  equipment: Pick<Equipment, "id" | "type" | "brand" | "model"> | null;
  jobs: Pick<Job, "id" | "number" | "kind" | "title" | "scheduled_date" | "closed_at"> | null;
};
