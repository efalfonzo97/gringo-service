/** Arma un link conservando parámetros, sin los vacíos. */
export function withQuery(path: string, params: Record<string, string | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Acepta "12.000", "12.000,50", "12000.5" y "$ 12.000". */
export function parseAmount(raw: string): number | null {
  let text = raw.replace(/[$\s]/g, "");
  if (!text) return null;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function orNull(value: string) {
  return value === "" ? null : value;
}

export function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/** Link de WhatsApp para un teléfono argentino (agrega 549 si falta), con mensaje opcional. */
export function whatsappLink(phone: string | null, text?: string) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("54")) digits = `549${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mapsLink(address: string | null, zone?: string | null) {
  if (!address) return null;
  const q = [address, zone].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** "09:30:00" → "09:30" */
export function shortTime(time: string | null) {
  return time ? time.slice(0, 5) : "";
}

/** Suma meses a una fecha YYYY-MM-DD (31/1 + 1 mes = 28/2). */
export function addMonths(date: string, months: number) {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

/** Meses enteros entre dos fechas YYYY-MM-DD. */
export function monthsBetween(from: string, to: string) {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/**
 * Link para agregar un evento a Google Calendar (así el celular avisa).
 * Con hora: evento con duración; sin hora: evento de día completo.
 */
export function googleCalendarLink(opts: { title: string; date: string; time?: string | null; minutes?: number; details?: string; location?: string | null }) {
  const compact = (d: string) => d.replace(/-/g, "");
  let dates: string;
  if (opts.time) {
    const [h, min] = opts.time.split(":").map(Number);
    const start = new Date(Date.UTC(2000, 0, 1, h, min));
    const end = new Date(start.getTime() + (opts.minutes ?? 60) * 60000);
    const hhmm = (t: Date) => `${String(t.getUTCHours()).padStart(2, "0")}${String(t.getUTCMinutes()).padStart(2, "0")}00`;
    const endDate = end.getUTCDate() > 1 ? nextDay(opts.date) : opts.date;
    dates = `${compact(opts.date)}T${hhmm(start)}/${compact(endDate)}T${hhmm(end)}`;
  } else {
    dates = `${compact(opts.date)}/${compact(nextDay(opts.date))}`;
  }
  const q = new URLSearchParams({ action: "TEMPLATE", text: opts.title, dates, ctz: "America/Argentina/Buenos_Aires" });
  if (opts.details) q.set("details", opts.details);
  if (opts.location) q.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function nextDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
