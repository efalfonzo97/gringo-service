# Gringo Service

Plataforma de gestión para un técnico de refrigeración y electrodomésticos (aires acondicionados, heladeras, lavarropas). Un desarrollo de Vincular.

Stack: Next.js (App Router) en Vercel + Supabase (Auth y Postgres con RLS). Misma base que En qué la gasto.

## Qué tiene

- **Hoy (dashboard):** agenda del día con accesos a WhatsApp y Google Maps, botones para empezar y terminar trabajos, calendario mensual con los días ocupados, indicadores (trabajos de hoy, ingresos del mes, por cobrar, stock bajo), casos sin agendar y pendientes de atención.
- **Casos:** reparaciones, instalaciones, mantenimientos y presupuestos. Estados (pendiente, agendado, en curso, esperando repuesto, terminado, cancelado), seguimiento con notas, fotos, garantía y link para agregarlo a Google Calendar.
  - **Balance del caso:** precio, cobrado, repuestos del stock (a costo), repuestos comprados, viáticos y otros gastos → mano de obra / ganancia. Cobros y gastos del caso quedan también en Finanzas.
  - **Revisión programada:** al crear el caso se elige recordar una revisión a 3, 6 o 12 meses (instalaciones y mantenimientos vienen en 6).
- **Recordatorios:** aparecen en Hoy (vencidos y próximos 7 días) y en el calendario. Desde cada uno: mensaje de WhatsApp armado para el cliente, agendar el service (queda resuelto), posponer, marcar listo o pasarlo a Google Calendar para que avise el celular.
- **Clientes:** datos de contacto, equipos de cada cliente (tipo, marca, modelo, capacidad, ubicación), fotos, recordatorios, historial de casos y total facturado.
- **Stock:** ítems con categorías editables, mínimo de reposición, costo y precio. Compras y ajustes; los repuestos usados en un caso se descuentan solos. Una compra puede cargarse también como gasto.
- **Finanzas:** ingresos y gastos por día, semana, mes, año o período; ganancia y margen; gráficos por categoría. "Por cobrar" incluye todo caso con precio cargado y saldo pendiente.

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor > New query**, pegar el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecutarlo. Después, en otra query, lo mismo con [`supabase/migrations/0002_fotos_categorias_recordatorios.sql`](supabase/migrations/0002_fotos_categorias_recordatorios.sql) (fotos, categorías y recordatorios; se puede volver a correr sin problema).
3. En **Authentication > URL Configuration**, poner la URL de Vercel como *Site URL* (por ejemplo `https://gringo-service.vercel.app`) y agregar `https://gringo-service.vercel.app/**` en *Redirect URLs*.
4. En **Project Settings > API** copiar la *Project URL* y la clave *anon / publishable*.

### 2. Vercel

1. Importar el repo de GitHub en [vercel.com/new](https://vercel.com/new).
2. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Cada push a `main` se publica solo.

### 3. Primer uso

1. Entrar a la app y crear la cuenta del técnico.
2. Una vez creada, en Supabase **Authentication > Sign In / Providers** se puede desactivar *Allow new users to sign up* para que nadie más se registre.
3. En el celular: abrir la app en el navegador y "Agregar a pantalla de inicio".

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```
