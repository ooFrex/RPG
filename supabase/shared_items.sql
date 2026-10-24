-- Biblioteca online: sistemas e personagens compartilhados por link (js/share.js).
-- Pode rodar mais de uma vez. Aplique ANTES de publicar o front novo.
-- Requer supabase/updated_at_trigger.sql (função public.set_updated_at).
--
-- Modelo:
--   * quem publica escolhe: 'unlisted' (só quem tem o link abre) ou 'public' (marketplace: aparece na aba Biblioteca).
--   * abrir por link passa pela função get_shared(): a tabela em si não deixa listar os não listados.
--   * moderação: denúncias de 5 contas escondem o item sozinho; você revisa e restaura no SQL Editor (fim do arquivo).
--   * Se você já aplicou a versão anterior deste arquivo, é só rodar este de novo: ele atualiza tudo.

create table if not exists public.shared_items (
  id          text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('sistema', 'personagem')),
  campaign    text not null check (campaign in ('op', 'coc', 'nova')),
  title       text not null check (char_length(title) between 1 and 80),
  summary     text check (summary is null or char_length(summary) <= 300),
  author_name text check (author_name is null or char_length(author_name) <= 40),
  payload     jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 400000),
  thumb       text,
  version     int  not null default 1,
  visibility  text not null default 'unlisted' check (visibility in ('private', 'unlisted', 'public')),
  status      text not null default 'ok' check (status in ('ok', 'hidden')),
  copies      int  not null default 0,
  reports     int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- foto pequena (miniatura JPEG gerada no app) para o marketplace
alter table public.shared_items add column if not exists thumb text;
-- tabelas criadas antes do modo Privado: atualiza a regra (pode rodar mais de uma vez)
alter table public.shared_items drop constraint if exists shared_items_visibility_check;
alter table public.shared_items add constraint shared_items_visibility_check check (visibility in ('private', 'unlisted', 'public'));
alter table public.shared_items drop constraint if exists shared_items_thumb_check;
alter table public.shared_items add constraint shared_items_thumb_check
  check (thumb is null or (char_length(thumb) <= 40000 and thumb ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$'));

create index if not exists shared_items_owner_idx  on public.shared_items (owner_id, created_at desc);
create index if not exists shared_items_public_idx on public.shared_items (campaign, kind, created_at desc) where visibility = 'public' and status = 'ok';

alter table public.shared_items enable row level security;

-- leitura direta da tabela: só o catálogo público e as linhas do próprio dono
drop policy if exists "shared: read public or own" on public.shared_items;
create policy "shared: read public or own" on public.shared_items
  for select to anon, authenticated
  using ((visibility = 'public' and status = 'ok') or owner_id = auth.uid());

drop policy if exists "shared: insert own" on public.shared_items;
create policy "shared: insert own" on public.shared_items
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "shared: update own" on public.shared_items;
create policy "shared: update own" on public.shared_items
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "shared: delete own" on public.shared_items;
create policy "shared: delete own" on public.shared_items
  for delete to authenticated
  using (owner_id = auth.uid());

-- privilégios por coluna: o dono escolhe visibility, mas nunca status, copies, reports nem version
revoke all on public.shared_items from anon, authenticated;
-- só as colunas que a tela usa: owner_id, reports, payload e origin_key NÃO são legíveis direto (o conteúdo vem por get_shared; os meus itens, por my_items)
grant select (id, kind, campaign, title, summary, author_name, thumb, version, copies, visibility, status, created_at, updated_at) on public.shared_items to anon, authenticated;
grant insert (kind, campaign, title, summary, author_name, payload, thumb, visibility) on public.shared_items to authenticated;
grant update (title, summary, author_name, payload, thumb, visibility) on public.shared_items to authenticated;
grant delete on public.shared_items to authenticated;

-- updated_at do servidor + versão sobe quando o conteúdo muda
drop trigger if exists trg_shared_items_updated_at on public.shared_items;
create trigger trg_shared_items_updated_at
  before insert or update on public.shared_items
  for each row execute function public.set_updated_at();

create or replace function public.shared_items_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    if new.owner_id is null then raise exception 'login obrigatório'; end if;
    perform pg_advisory_xact_lock(hashtext(new.owner_id::text));  -- duas publicações ao mesmo tempo não furam os limites
    if (select count(*) from public.shared_items where owner_id = new.owner_id) >= 60 then
      raise exception 'limite de 60 itens publicados por conta';
    end if;
    if (select count(*) from public.shared_items where owner_id = new.owner_id and created_at > now() - interval '1 hour') >= 15 then
      raise exception 'muitas publicações seguidas: tente de novo mais tarde';
    end if;
    if new.visibility = 'public' and (select count(*) from public.shared_items where owner_id = new.owner_id and visibility = 'public') >= 30 then
      raise exception 'limite de 30 itens no marketplace por conta';
    end if;
  elsif tg_op = 'UPDATE' then
    perform pg_advisory_xact_lock(hashtext(new.owner_id::text));
    if new.payload is distinct from old.payload then new.version := old.version + 1; end if;
    if new.visibility = 'public' and old.visibility <> 'public'
       and (select count(*) from public.shared_items where owner_id = new.owner_id and visibility = 'public') >= 30 then
      raise exception 'limite de 30 itens no marketplace por conta';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_shared_items_guard on public.shared_items;
create trigger trg_shared_items_guard
  before insert or update on public.shared_items
  for each row execute function public.shared_items_guard();

-- abrir por link (qualquer pessoa, logada ou não). Não devolve o dono; esconde itens ocultados.
drop function if exists public.get_shared(text);
create function public.get_shared(p_id text)
returns table (id text, kind text, campaign text, title text, summary text, author_name text, thumb text,
               payload jsonb, version int, copies int, created_at timestamptz, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.kind, s.campaign, s.title, s.summary, s.author_name, s.thumb, s.payload, s.version, s.copies, s.created_at, s.updated_at
  from public.shared_items s
  where s.id = p_id and s.status = 'ok' and (s.visibility <> 'private' or s.owner_id = auth.uid())
$$;
revoke all on function public.get_shared(text) from public;
grant execute on function public.get_shared(text) to anon, authenticated;

-- contagem real de cópias: 1 por conta por item
create table if not exists public.shared_copies (
  item_id text not null references public.shared_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
alter table public.shared_copies enable row level security;
revoke all on public.shared_copies from anon, authenticated;

create or replace function public.register_copy(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.shared_copies (item_id, user_id)
  select s.id, auth.uid() from public.shared_items s where s.id = p_id and s.status = 'ok'
  on conflict do nothing;
  if found then update public.shared_items set copies = copies + 1 where id = p_id; end if;
end;
$$;
revoke all on function public.register_copy(text) from public;
grant execute on function public.register_copy(text) to authenticated;

-- denúncias: 1 por conta por item; só contas com mais de 7 dias contam para esconder (5 delas escondem o item até você revisar)
create table if not exists public.shared_reports (
  item_id text not null references public.shared_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason  text check (reason is null or char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
alter table public.shared_reports enable row level security;
revoke all on public.shared_reports from anon, authenticated;

create or replace function public.report_shared(p_id text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'login obrigatório'; end if;
  insert into public.shared_reports (item_id, user_id, reason)
  select s.id, auth.uid(), left(p_reason, 300) from public.shared_items s where s.id = p_id
  on conflict do nothing;
  if found then
    if exists (select 1 from auth.users u where u.id = auth.uid() and u.created_at < now() - interval '7 days') then
      update public.shared_items set reports = reports + 1, status = case when reports + 1 >= 5 then 'hidden' else status end where id = p_id;
    end if;
  end if;
end;
$$;
revoke all on function public.report_shared(text, text) from public;
grant execute on function public.report_shared(text, text) to authenticated;

-- meus itens e o vínculo de origem (a tabela não deixa ler owner_id direto)
create or replace function public.my_items()
returns table (id text, kind text, campaign text, title text, version int, copies int, visibility text, status text, thumb text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.kind, s.campaign, s.title, s.version, s.copies, s.visibility, s.status, s.thumb, s.updated_at
  from public.shared_items s where s.owner_id = auth.uid() order by s.updated_at desc limit 100
$$;
revoke all on function public.my_items() from public;
grant execute on function public.my_items() to authenticated;

create or replace function public.my_origin(p_key text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare r text;
begin
  select s.id into r from public.shared_items s where s.owner_id = auth.uid() and s.origin_key = p_key limit 1;
  return r;
end $$;
revoke all on function public.my_origin(text) from public;
grant execute on function public.my_origin(text) to authenticated;

-- busca do marketplace: índices para o ilike '%termo%' continuar rápido quando o catálogo crescer
create extension if not exists pg_trgm with schema extensions;
create index if not exists shared_items_title_trgm  on public.shared_items using gin (title extensions.gin_trgm_ops);
create index if not exists shared_items_sum_trgm    on public.shared_items using gin (summary extensions.gin_trgm_ops);
create index if not exists shared_items_author_trgm on public.shared_items using gin (author_name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Curadoria (só você, no SQL Editor):
--   ver o que foi denunciado:   select id, title, reports, status from public.shared_items where reports > 0 order by reports desc;
--   tirar do marketplace:       update public.shared_items set visibility = 'unlisted' where id = 'XXXXXXXXXX';
--   apagar de vez:              delete from public.shared_items where id = 'XXXXXXXXXX';
--   esconder / restaurar:       update public.shared_items set status = 'hidden' where id = 'XXXXXXXXXX';
--                               update public.shared_items set status = 'ok', reports = 0 where id = 'XXXXXXXXXX';
-- ---------------------------------------------------------------------------
