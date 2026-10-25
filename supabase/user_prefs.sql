-- Preferências de aparência sincronizadas com a conta (js/cloud.js: Cloud.syncPrefs).
-- Pode rodar mais de uma vez. Requer supabase/updated_at_trigger.sql (função public.set_updated_at).
--
-- Uma linha por usuário. Guarda só a aparência: tema, cores, tamanho da fonte, alto contraste,
-- som e carrossel. Vibração, dados 3D e modo leve ficam só no aparelho (dependem do celular).
-- O app compara updated_at (carimbado pelo servidor) para saber se outro aparelho mudou.

create table if not exists public.user_prefs (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  prefs      jsonb not null default '{}'::jsonb
             check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) <= 4000),
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

drop policy if exists "user_prefs: read own" on public.user_prefs;
create policy "user_prefs: read own" on public.user_prefs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_prefs: insert own" on public.user_prefs;
create policy "user_prefs: insert own" on public.user_prefs
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_prefs: update own" on public.user_prefs;
create policy "user_prefs: update own" on public.user_prefs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_prefs: delete own" on public.user_prefs;
create policy "user_prefs: delete own" on public.user_prefs
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.user_prefs from anon, authenticated;
grant select, delete on public.user_prefs to authenticated;
grant insert (prefs) on public.user_prefs to authenticated;
grant update (prefs) on public.user_prefs to authenticated;

drop trigger if exists trg_user_prefs_updated_at on public.user_prefs;
create trigger trg_user_prefs_updated_at
  before insert or update on public.user_prefs
  for each row execute function public.set_updated_at();
