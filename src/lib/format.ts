const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, currency: "ARS" | "USD" = "ARS") {
  return (currency === "USD" ? usd : money).format(value);
}

export function formatDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/** Mes en formato YYYY-MM, por defecto el actual (hora de Argentina). */
export function currentMonth() {
  return today().slice(0, 7);
}

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, next };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// --- Períodos (día, semana, mes, año o rango libre) ---

export type Period = "dia" | "semana" | "mes" | "anio" | "periodo";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "anio", label: "Año" },
  { value: "periodo", label: "Período" },
];

export function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function toUtc(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

function addMonths(date: string, months: number) {
  const d = toUtc(date.slice(0, 8) + "01");
  d.setUTCMonth(d.getUTCMonth() + months);
  return fromUtc(d);
}

function shortDay(date: string) {
  return toUtc(date).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
}

export type DateRange = {
  period: Period;
  anchor: string;
  start: string; // inclusive
  end: string; // exclusiva
  label: string;
  prev: string | null; // ancla del período anterior
  next: string | null; // ancla del período siguiente
};

/** Rango de fechas a partir de los parámetros del link (p, f, desde, hasta, mes). */
export function resolveRange(params: Record<string, string | string[] | undefined>): DateRange {
  const rawPeriod = params.p;
  let period: Period = PERIODS.some((p) => p.value === rawPeriod) ? (rawPeriod as Period) : "mes";
  let anchor = isDate(params.f) ? params.f : today();
  if (!rawPeriod && isMonth(params.mes)) {
    period = "mes";
    anchor = `${params.mes}-01`;
  }

  switch (period) {
    case "dia": {
      const label = toUtc(anchor).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
      return { period, anchor, start: anchor, end: addDays(anchor, 1), label: capitalize(label), prev: addDays(anchor, -1), next: addDays(anchor, 1) };
    }
    case "semana": {
      const weekday = (toUtc(anchor).getUTCDay() + 6) % 7; // lunes = 0
      const start = addDays(anchor, -weekday);
      const end = addDays(start, 7);
      return { period, anchor: start, start, end, label: `${shortDay(start)} – ${shortDay(addDays(end, -1))}`, prev: addDays(start, -7), next: end };
    }
    case "anio": {
      const year = Number(anchor.slice(0, 4));
      return { period, anchor: `${year}-01-01`, start: `${year}-01-01`, end: `${year + 1}-01-01`, label: String(year), prev: `${year - 1}-01-01`, next: `${year + 1}-01-01` };
    }
    case "periodo": {
      let from = isDate(params.desde) ? params.desde : `${today().slice(0, 7)}-01`;
      let to = isDate(params.hasta) ? params.hasta : today();
      if (from > to) [from, to] = [to, from];
      return { period, anchor: from, start: from, end: addDays(to, 1), label: `${shortDay(from)} – ${shortDay(to)}`, prev: null, next: null };
    }
    default: {
      const start = anchor.slice(0, 8) + "01";
      return { period: "mes", anchor: start, start, end: addMonths(start, 1), label: monthLabel(start.slice(0, 7)), prev: addMonths(start, -1), next: addMonths(start, 1) };
    }
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 2 });

/** Importe corto para el centro del gráfico, por ejemplo "1,42 M $". */
export function formatCompact(value: number) {
  return `${compact.format(value)} $`;
}
