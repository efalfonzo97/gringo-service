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

/** Link de WhatsApp para un teléfono argentino (agrega 549 si falta). */
export function whatsappLink(phone: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("54")) digits = `549${digits}`;
  return `https://wa.me/${digits}`;
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
