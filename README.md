# Gringo Service

Plataforma de gestión para un técnico de refrigeración y electrodomésticos (aires acondicionados, heladeras, lavarropas). Un desarrollo de Vincular.

Stack: Next.js (App Router) en Vercel + Supabase (Auth y Postgres con RLS). Misma base que En qué la gasto.

## Qué tiene

- **Hoy (dashboard):** agenda del día con accesos a WhatsApp y Google Maps, botones para empezar y terminar trabajos, calendario mensual con los días ocupados, indicadores (trabajos de hoy, ingresos del mes, por cobrar, stock bajo), casos sin agendar y pendientes de atención.
- **Casos:** reparaciones, instalaciones, mantenimientos y presupuestos. Estados (pendiente, agendado, en curso, esperando repuesto, terminado, cancelado), seguimiento con notas en el tiempo, repuestos usados desde el stock, presupuesto y cobros parciales, garantía.
- **Clientes:** datos de contacto, equipos de cada cliente (tipo, marca, modelo, capacidad, ubicación), historial de casos y total facturado.
- **Stock:** repuestos, insumos, gas y herramientas con mínimo de reposición, costo y precio. Compras y ajustes; los repuestos usados en un caso se descuentan solos. Una compra puede cargarse también como gasto.
- **Finanzas:** ingresos y gastos por día, semana, mes, año o período; ganancia y margen; gráficos por categoría; casos por cobrar. Los cobros de un caso entran solos como ingreso.

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor > New query**, pegar el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecutarlo.
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
