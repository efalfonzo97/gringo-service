import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnv().url,
    supabaseEnv().key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: el proxy ya refresca la sesión.
          }
        },
      },
    },
  );
}
