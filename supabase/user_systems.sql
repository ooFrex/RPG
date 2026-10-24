-- Sistemas próprios sincronizados com a conta (js/cloud.js: Cloud.syncSystems).
-- Pode rodar mais de uma vez. Requer supabase/updated_at_trigger.sql (função public.set_updated_at).
--
-- Cada linha é um sistema da biblioteca do usuário (nome, versão, molde, capa).
-- O app compara updated_at (carimbado pelo servidor) para detectar mudança em outro aparelho.

create table if not exists public.user_systems (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  entry      jsonb not null check (jsonb_typeof(entry) = 'object' and pg_column_size(entry) <= 400000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_systems_user_idx on public.user_systems (user_id, updated_at desc);

alter table public.user_systems enable row level security;

drop policy if exists "user_systems: read own" on public.user_systems;
create policy "user_systems: read own" on public.user_systems
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_systems: insert own" on public.user_systems;
create policy "user_systems: insert own" on public.user_systems
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_systems: update own" on public.user_systems;
create policy "user_systems: update own" on public.user_systems
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_systems: delete own" on public.user_systems;
create policy "user_systems: delete own" on public.user_systems
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.user_systems from anon, authenticated;
grant select, delete on public.user_systems to authenticated;
grant insert (name, entry) on public.user_systems to authenticated;
grant update (name, entry) on public.user_systems to authenticated;

-- updated_at do servidor
drop trigger if exists trg_user_systems_updated_at on public.user_systems;
create trigger trg_user_systems_updated_at
  before insert or update on public.user_systems
  for each row execute function public.set_updated_at();

-- limite por conta (evita encher o banco): 100 sistemas
create or replace function public.user_systems_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  if new.user_id is null then raise exception 'login obrigatório'; end if;
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (select count(*) from public.user_systems where user_id = new.user_id) >= 100 then
    raise exception 'limite de 100 sistemas por conta';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_user_systems_guard on public.user_systems;
create trigger trg_user_systems_guard
  before insert on public.user_systems
  for each row execute function public.user_systems_guard();
