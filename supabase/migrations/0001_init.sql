-- Gringo Service: esquema inicial
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Cada fila pertenece a un usuario (owner_id) y solo ese usuario la ve (RLS).

create extension if not exists pgcrypto;

-- Datos del negocio (uno por usuario)
create table public.business (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Gringo Service',
  phone text,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  zone text,           -- barrio / localidad
  notes text,
  created_at timestamptz not null default now()
);
create index clients_owner_name on public.clients (owner_id, name);

-- Equipos de cada cliente (aire, heladera, lavarropas...)
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null default 'aire' check (type in ('aire', 'heladera', 'lavarropas', 'freezer', 'otro')),
  brand text,
  model text,
  capacity text,       -- frigorías, litros, kg...
  location text,       -- "dormitorio", "local"...
  installed_on date,
  notes text,
  created_at timestamptz not null default now()
);
create index equipment_client on public.equipment (client_id);

-- Casos / trabajos
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number serial,
  client_id uuid not null references public.clients(id) on delete restrict,
  equipment_id uuid references public.equipment(id) on delete set null,
  kind text not null default 'reparacion' check (kind in ('reparacion', 'instalacion', 'mantenimiento', 'presupuesto')),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'agendado', 'en_curso', 'esperando_repuesto', 'terminado', 'cancelado')),
  title text not null,
  problem text,        -- lo que reporta el cliente
  diagnosis text,      -- lo que encontró el técnico
  scheduled_date date,
  scheduled_time time,
  duration_min integer not null default 60,
  price numeric(14,2) not null default 0,   -- presupuesto / total a cobrar
  warranty_until date,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);
create index jobs_owner_date on public.jobs (owner_id, scheduled_date);
create index jobs_owner_status on public.jobs (owner_id, status);

-- Seguimiento: notas en el tiempo de cada caso
create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index job_notes_job on public.job_notes (job_id, created_at);

-- Stock: repuestos, insumos, gas
create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'repuesto' check (category in ('repuesto', 'insumo', 'gas', 'herramienta')),
  unit text not null default 'u',
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  cost numeric(14,2) not null default 0,    -- último costo unitario
  price numeric(14,2) not null default 0,   -- precio de venta unitario
  location text,                            -- "camioneta", "taller"
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index stock_items_owner on public.stock_items (owner_id, name);

-- Movimientos de stock. quantity con signo: + entra, − sale.
create table public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.stock_items(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  date date not null default current_date,
  reason text not null check (reason in ('compra', 'uso', 'ajuste')),
  quantity numeric(12,2) not null check (quantity <> 0),
  unit_cost numeric(14,2),
  unit_price numeric(14,2),   -- precio cobrado al cliente cuando se usa en un caso
  note text,
  created_at timestamptz not null default now()
);
create index stock_moves_item on public.stock_moves (item_id, date);
create index stock_moves_job on public.stock_moves (job_id);

-- La cantidad del ítem se mantiene sola a partir de los movimientos.
create or replace function public.apply_stock_move() returns trigger
language plpgsql security invoker as $$
begin
  if tg_op = 'INSERT' then
    update public.stock_items set quantity = quantity + new.quantity,
      cost = case when new.reason = 'compra' and new.unit_cost is not null and new.unit_cost > 0 then new.unit_cost else cost end
    where id = new.item_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.stock_items set quantity = quantity - old.quantity where id = old.item_id;
    return old;
  end if;
  return null;
end $$;

create trigger stock_moves_apply
after insert or delete on public.stock_moves
for each row execute function public.apply_stock_move();

-- Finanzas: cada ingreso o gasto. job_id vincula cobros con su caso.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('ingreso', 'egreso')),
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'efectivo' check (method in ('efectivo', 'transferencia', 'mercadopago', 'tarjeta', 'otro')),
  description text not null default '',
  job_id uuid references public.jobs(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now()
);
create index transactions_owner_date on public.transactions (owner_id, date);
create index transactions_job on public.transactions (job_id);

-- Seguridad: cada usuario solo ve y toca lo suyo.
do $$
declare t text;
begin
  foreach t in array array['business', 'clients', 'equipment', 'jobs', 'job_notes', 'stock_items', 'stock_moves', 'transactions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;
