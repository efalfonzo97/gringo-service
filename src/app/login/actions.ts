"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

/** Traduce los errores de Supabase a algo que se entienda. */
function explain(error: { message: string; code?: string; status?: number }) {
  const code = error.code ?? "";
  const msg = error.message.toLowerCase();
  if (code === "email_not_confirmed" || msg.includes("not confirmed"))
    return "Falta confirmar el email: abrí el link que te llegó (revisá spam). Si no llegó, en Supabase > Authentication > Users podés confirmarlo a mano.";
  if (code === "invalid_credentials" || msg.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "Ese email ya tiene cuenta. Usá “Ya tengo cuenta” para entrar.";
  if (code === "signup_disabled" || msg.includes("signups not allowed")) return "El registro de cuentas nuevas está desactivado en Supabase.";
  if (code === "over_email_send_rate_limit" || msg.includes("rate limit"))
    return "Supabase limita los emails de confirmación (pocos por hora). Esperá un rato o confirmá el usuario a mano en Supabase > Authentication > Users.";
  if (code === "weak_password") return "La contraseña es muy débil para la configuración de Supabase.";
  if (msg.includes("invalid api key") || error.status === 401) return "La clave de Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) no es válida para este proyecto.";
  if (msg.includes("fetch failed") || msg.includes("enotfound")) return "No se pudo conectar con Supabase: revisá NEXT_PUBLIC_SUPABASE_URL.";
  return `Error de Supabase: ${error.message}`;
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: explain(error) };
  redirect("/");
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: explain(error) };
  if (data.session) redirect("/");
  return { message: "Te mandamos un email para confirmar la cuenta. Abrilo desde este dispositivo." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
