import type { EquipmentType, JobKind, JobStatus, PayMethod } from "@/lib/types";

export const EQUIPMENT_TYPES: Record<EquipmentType, { label: string; icon: string }> = {
  aire: { label: "Aire acondicionado", icon: "❄️" },
  heladera: { label: "Heladera", icon: "🧊" },
  lavarropas: { label: "Lavarropas", icon: "🌀" },
  freezer: { label: "Freezer", icon: "🥶" },
  otro: { label: "Otro", icon: "🔌" },
};

export const JOB_KINDS: Record<JobKind, string> = {
  reparacion: "Reparación",
  instalacion: "Instalación",
  mantenimiento: "Mantenimiento",
  presupuesto: "Presupuesto",
};

export const JOB_STATUS: Record<JobStatus, { label: string; tone: string }> = {
  pendiente: { label: "Pendiente", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  agendado: { label: "Agendado", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  en_curso: { label: "En curso", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  esperando_repuesto: { label: "Esperando repuesto", tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  terminado: { label: "Terminado", tone: "bg-accent-soft text-accent" },
  cancelado: { label: "Cancelado", tone: "bg-zinc-500/15 text-muted" },
};

/** Estados en los que el caso sigue abierto. */
export const OPEN_STATUSES: JobStatus[] = ["pendiente", "agendado", "en_curso", "esperando_repuesto"];

/** Categorías con las que arranca cada negocio (después se editan en Stock). */
export const DEFAULT_STOCK_CATEGORIES = ["Repuesto", "Insumo", "Gas refrigerante", "Herramienta"];

/** Categoría de gasto en Finanzas para una compra de stock, según su categoría. */
export function expenseCategoryForStock(category: string) {
  const c = category.toLowerCase();
  if (c.includes("gas")) return "Gas refrigerante";
  if (c.includes("insumo")) return "Insumos";
  if (c.includes("herramienta")) return "Herramientas";
  return "Repuestos";
}

export const PAY_METHODS: Record<PayMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

export const INCOME_CATEGORIES = ["Servicio", "Instalación", "Venta de repuestos", "Otro ingreso"];
export const EXPENSE_CATEGORIES = [
  "Repuestos",
  "Gas refrigerante",
  "Viáticos",
  "Combustible",
  "Herramientas",
  "Insumos",
  "Vehículo",
  "Teléfono e internet",
  "Impuestos y monotributo",
  "Otro gasto",
];

export function equipmentLabel(e: { type: EquipmentType; brand: string | null; model: string | null }) {
  const name = [e.brand, e.model].filter(Boolean).join(" ");
  return `${EQUIPMENT_TYPES[e.type].icon} ${EQUIPMENT_TYPES[e.type].label}${name ? ` · ${name}` : ""}`;
}

/** Movimientos que se pueden cargar desde un caso. */
export const JOB_MOVEMENTS = [
  { value: "cobro", label: "Cobro al cliente", type: "ingreso" as const },
  { value: "Repuestos", label: "Gasto: repuestos comprados", type: "egreso" as const },
  { value: "Gas refrigerante", label: "Gasto: gas refrigerante", type: "egreso" as const },
  { value: "Viáticos", label: "Gasto: viáticos / traslado", type: "egreso" as const },
  { value: "Otro gasto", label: "Gasto: otro", type: "egreso" as const },
];

/** Opciones para programar una revisión al crear un caso. */
export const REVIEW_OPTIONS = [
  { months: 0, label: "No programar" },
  { months: 3, label: "En 3 meses" },
  { months: 6, label: "En 6 meses" },
  { months: 12, label: "En 1 año" },
];
