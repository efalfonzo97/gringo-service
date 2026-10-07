import { LoginForm } from "./login-form";

const NOTICES: Record<string, string> = {
  migracion: "La base de datos todavía no tiene las tablas. En Supabase > SQL Editor corré el archivo supabase/migrations/0001_init.sql del repo.",
  link: "El link de confirmación venció o ya se usó. Probá entrar con tu email y contraseña; si pide confirmar, pedí uno nuevo creando la cuenta otra vez.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const notice = typeof params.aviso === "string" ? NOTICES[params.aviso] : undefined;
  const detail = typeof params.detalle === "string" ? params.detalle : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-bold">Gringo Service</h1>
        <p className="text-muted">Refrigeración y electrodomésticos.</p>
      </div>
      {notice && (
        <p className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          {notice}
          {detail && <span className="mt-1 block text-xs text-muted">{detail}</span>}
        </p>
      )}
      <LoginForm />
    </main>
  );
}
