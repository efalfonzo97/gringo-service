import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

/** Usuario y datos del negocio. Redirige al login si no hay sesión. */
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: found, error: lookupError } = await supabase
    .from("business")
    .select("owner_id, name, phone")
    .eq("owner_id", userId)
    .maybeSingle<Business>();
  // Si la tabla no existe, falta correr supabase/migrations/0001_init.sql.
  if (lookupError) redirect(`/login?aviso=migracion&detalle=${encodeURIComponent(lookupError.message.slice(0, 120))}`);

  let business = found;
  if (!business) {
    const created = await supabase.from("business").insert({}).select("owner_id, name, phone").single<Business>();
    business = created.data ?? { owner_id: userId, name: "Gringo Service", phone: null };
  }

  return { supabase, userId, business };
});

export type AppContext = Awaited<ReturnType<typeof getContext>>;
