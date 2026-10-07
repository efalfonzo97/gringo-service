/**
 * Datos de conexión a Supabase. La URL se reduce a su origen
 * (https://xxxx.supabase.co): si en Vercel quedó pegada con /rest/v1/,
 * una barra final u otra ruta, Supabase rechaza el login con
 * "Invalid path specified in request URL".
 */
export function supabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  let url = rawUrl;
  try {
    url = new URL(/^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`).origin;
  } catch {
    // Se deja como está: el proxy muestra el error de configuración.
  }
  return { url, key };
}
