-- Gringo Service 0002: fotos, categorías de stock y recordatorios.
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Se puede volver a correr sin problema.

-- --- Categorías de stock editables ---

create table if not exists public.stock_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- La categoría del ítem pasa a ser el nombre de la categoría (texto libre).
alter table public.stock_items drop constraint if exists stock_items_category_check;
alter table public.stock_items alter column category set default 'Repuesto';
update public.stock_items set category = case category
  when 'repuesto' then 'Repuesto'
  when 'insumo' then 'Insumo'
  when 'gas' then 'Gas refrigerante'
  when 'herramienta' then 'Herramienta'
  else category end
where category in ('repuesto', 'insumo', 'gas', 'herramienta');

-- Categorías iniciales para cada negocio (los nuevos las reciben solos).
create or replace function public.seed_business_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.stock_categories (owner_id, name)
  select new.owner_id, c from unnest(array['Repuesto', 'Insumo', 'Gas refrigerante', 'Herramienta']) as c
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists business_seed_defaults on public.business;
create trigger business_seed_defaults after insert on public.business
for each row execute function public.seed_business_defaults();

insert into public.stock_categories (owner_id, name)
select b.owner_id, c from public.business b
cross join unnest(array['Repuesto', 'Insumo', 'Gas refrigerante', 'Herramienta']) as c
on conflict do nothing;

insert into public.stock_categories (owner_id, name)
select distinct owner_id, category from public.stock_items
on conflict do nothing;

-- --- Fotos de clientes y casos ---

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  path text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index if not exists photos_client on public.photos (client_id, created_at);
create index if not exists photos_job on public.photos (job_id);

-- Carpeta privada en Storage: cada usuario solo ve su carpeta (photos/<user_id>/...).
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "gringo: fotos propias" on storage.objects;
create policy "gringo: fotos propias" on storage.objects for all to authenticated
using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- --- Recordatorios (revisiones, services, llamados) ---

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,        -- caso que lo originó
  equipment_id uuid references public.equipment(id) on delete set null,
  due_date date not null,
  title text not null,
  notes text,
  status text not null default 'pendiente' check (status in ('pendiente', 'hecho', 'descartado')),
  done_job_id uuid references public.jobs(id) on delete set null,   -- caso con el que se resolvió
  created_at timestamptz not null default now()
);
create index if not exists reminders_owner_due on public.reminders (owner_id, status, due_date);
create index if not exists reminders_client on public.reminders (client_id);

-- --- Seguridad: cada usuario solo ve y toca lo suyo ---

do $$
declare t text;
begin
  foreach t in array array['stock_categories', 'photos', 'reminders'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo el dueño" on public.%I', t);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;
