import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

/** Cliente de Supabase en el navegador (para subir fotos directo a Storage). */
export function createBrowserSupabase() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
