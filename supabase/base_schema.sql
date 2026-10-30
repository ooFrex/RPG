-- BASE DO BANCO: tabelas character_sheets e user_profiles, buckets e policies de storage.
-- Rode ESTE arquivo PRIMEIRO num projeto novo (antes de updated_at_trigger.sql, user_profiles_extra.sql e os demais).
--
-- ATENÇÃO: este arquivo foi RECONSTRUÍDO a partir do que o código do app usa e do que o README descreve (conferido em 19/10/2026).
-- Ele não foi exportado do seu projeto. Antes de rodar num projeto que JÁ está em produção:
--   1) rode supabase/rls_export.sql e guarde o resultado (é o retrato real do que está valendo);
--   2) compare com o que está abaixo. Tudo aqui é idempotente (create if not exists / drop policy if exists), mas as policies
--      têm os nomes escolhidos aqui: se no seu projeto elas têm outros nomes, a mesma regra ficará duplicada (inofensivo, só redundante).
--      Se as regras do seu projeto forem MAIS restritivas que estas, prefira as suas e atualize este arquivo.
--   3) quando bater, troque este arquivo pelo export real (ou ajuste-o) para o repositório descrever o banco de verdade.
-- Suposições: character_sheets.id é uuid; o app grava name, sheet, campaign, user_id (updated_at vem do trigger).

-- ---------------------------------------------------------------------------
-- 1) character_sheets: uma linha por personagem (OP ou CoC) de cada conta
-- ---------------------------------------------------------------------------
create table if not exists public.character_sheets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign   text not null default 'op',
  name       text,
  sheet      jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- tabelas antigas podem não ter alguma coluna
alter table public.character_sheets add column if not exists campaign   text not null default 'op';
alter table public.character_sheets add column if not exists created_at timestamptz not null default now();
alter table public.character_sheets add column if not exists updated_at timestamptz not null default now();
-- NOT VALID: vale para linhas novas sem falhar por causa de dado antigo (rode "validate constraint" quando quiser conferir tudo)
alter table public.character_sheets drop constraint if exists character_sheets_campaign_check;
alter table public.character_sheets add constraint character_sheets_campaign_check check (campaign in ('op', 'coc')) not valid;

create index if not exists character_sheets_user_idx on public.character_sheets (user_id, campaign, updated_at desc);

alter table public.character_sheets enable row level security;

drop policy if exists "sheets: read own" on public.character_sheets;
create policy "sheets: read own" on public.character_sheets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "sheets: insert own" on public.character_sheets;
create policy "sheets: insert own" on public.character_sheets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "sheets: update own" on public.character_sheets;
create policy "sheets: update own" on public.character_sheets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sheets: delete own" on public.character_sheets;
create policy "sheets: delete own" on public.character_sheets
  for delete to authenticated using (user_id = auth.uid());

-- visitantes (anon) não enxergam nada
revoke all on public.character_sheets from anon;

-- ---------------------------------------------------------------------------
-- 2) user_profiles: nome e foto da conta (bio, banner, accent e public_profile vêm de user_profiles_extra.sql e public_profile.sql)
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 60),
  avatar_path  text,
  updated_at   timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "profiles: read own" on public.user_profiles;
create policy "profiles: read own" on public.user_profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "profiles: insert own" on public.user_profiles;
create policy "profiles: insert own" on public.user_profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "profiles: update own" on public.user_profiles;
create policy "profiles: update own" on public.user_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "profiles: delete own" on public.user_profiles;
create policy "profiles: delete own" on public.user_profiles
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.user_profiles from anon;
-- (outras pessoas só veem o perfil de alguém pelas funções security definer de public_profile.sql e friends.sql)

-- ---------------------------------------------------------------------------
-- 3) Buckets
--    ficha-assets    : PÚBLICO, só leitura (logos, fundos, ícones; você envia pelo painel)
--    account-avatars : PRIVADO, cada conta só mexe na própria pasta <user_id>/
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ficha-assets', 'ficha-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('account-avatars', 'account-avatars', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4) Policies do Storage (storage.objects)
--    ficha-assets: leitura pública; ninguém grava pelo app (sem policy de insert/update/delete).
--    account-avatars: dono lê/grava/troca/apaga SÓ dentro de <user_id>/.
--    (as policies extras de leitura para amigos e perfis públicos estão em friends.sql e public_profile.sql)
-- ---------------------------------------------------------------------------
drop policy if exists "assets: public read" on storage.objects;
create policy "assets: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'ficha-assets');

drop policy if exists "avatars: read own" on storage.objects;
create policy "avatars: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'account-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: insert own" on storage.objects;
create policy "avatars: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'account-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'account-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'account-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'account-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Sugestão (opcional, no painel Storage > account-avatars): limite de tamanho (ex.: 2 MB) e tipos image/jpeg, image/png, image/webp.
