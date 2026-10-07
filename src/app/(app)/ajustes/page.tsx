import { getContext } from "@/lib/data";
import { signOut } from "@/app/login/actions";
import { updateBusiness } from "../actions";
import { Submit } from "@/components/submit";
import { PageHeader } from "@/components/ui";

export default async function SettingsPage({ searchParams }: PageProps<"/ajustes">) {
  const params = await searchParams;
  const { business, supabase } = await getContext();
  const { data: user } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Ajustes" subtitle={user.user?.email} />
      <form action={updateBusiness} className="card space-y-4">
        <h2 className="font-semibold">Negocio</h2>
        <div>
          <label className="label" htmlFor="name">Nombre</label>
          <input className="input" id="name" name="name" defaultValue={business.name} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Teléfono</label>
          <input className="input" id="phone" name="phone" type="tel" defaultValue={business.phone ?? ""} />
        </div>
        {params.ok === "1" && <p className="text-sm text-accent">Guardado.</p>}
        <Submit>Guardar</Submit>
      </form>

      <section className="card space-y-2 text-sm text-muted">
        <h2 className="font-semibold text-foreground">En el celular</h2>
        <p>Abrí la app en el navegador y elegí “Agregar a pantalla de inicio” para usarla como una app más.</p>
      </section>

      <form action={signOut}>
        <button className="btn-ghost w-full">Cerrar sesión</button>
      </form>
    </div>
  );
}
