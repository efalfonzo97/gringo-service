import type { EquipmentType, JobKind, JobStatus, PayMethod, StockCategory } from "@/lib/types";

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

export const STOCK_CATEGORIES: Record<StockCategory, string> = {
  repuesto: "Repuesto",
  insumo: "Insumo",
  gas: "Gas refrigerante",
  herramienta: "Herramienta",
};

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
