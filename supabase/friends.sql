-- Sistema de amizade. Pode rodar mais de uma vez. Rode DEPOIS de public_profile.sql.
--
-- Como funciona:
--   * cada conta tem um CÓDIGO DE AMIGO (8 letras/números) que ela passa para quem quiser;
--   * quem recebe o código manda um pedido; o outro aceita (ou recusa) e vira amigo;
--   * se os dois mandarem pedido um ao outro, a amizade é aceita na hora;
--   * amigos enxergam foto, banner, bio e as publicações públicas um do outro,
--     mesmo que o "perfil público" esteja desligado;
--   * tudo passa por funções (security definer): as tabelas não têm policy de leitura/escrita direta.

create table if not exists public.friend_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  created_at timestamptz not null default now()
);
alter table public.friend_codes enable row level security;

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester    uuid not null references auth.users(id) on delete cascade,
  addressee    uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_uidx on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_req_idx on public.friendships (requester);
create index if not exists friendships_adr_idx on public.friendships (addressee);
alter table public.friendships enable row level security;

-- meu código (cria na primeira vez)
create or replace function public.my_friend_code()
returns text language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); c text; n int := 0; i int;
begin
  if u is null then raise exception 'Entre na sua conta para usar amigos.'; end if;
  select f.code into c from public.friend_codes f where f.user_id = u;
  if c is not null then return c; end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1);
    end loop;
    begin
      insert into public.friend_codes (user_id, code) values (u, c);
      return c;
    exception when unique_violation then
      select f.code into c from public.friend_codes f where f.user_id = u;
      if c is not null then return c; end if;
      n := n + 1;
      if n > 10 then raise exception 'Não consegui gerar o código. Tente de novo.'; end if;
    end;
  end loop;
end $$;
revoke all on function public.my_friend_code() from public, anon;
grant execute on function public.my_friend_code() to authenticated;

-- interna: manda o pedido (ou aceita, se a outra pessoa já tinha mandado). Retorna 'sent' | 'accepted' | 'pending' | 'friends'
create or replace function public._friend_send(me uuid, target uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare f public.friendships%rowtype;
begin
  if me is null then raise exception 'Entre na sua conta para usar amigos.'; end if;
  if target is null then raise exception 'Código não encontrado.'; end if;
  if me = target then raise exception 'Esse é o seu próprio código.'; end if;
  select * into f from public.friendships x
    where least(x.requester, x.addressee) = least(me, target) and greatest(x.requester, x.addressee) = greatest(me, target);
  if found then
    if f.status = 'accepted' then return 'friends'; end if;
    if f.requester = me then return 'pending'; end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = f.id;
    return 'accepted';
  end if;
  if (select count(*) from public.friendships x where x.requester = me and x.status = 'pending') >= 30 then
    raise exception 'Você já tem muitos pedidos pendentes. Espere alguns serem respondidos.';
  end if;
  insert into public.friendships (requester, addressee) values (me, target);
  return 'sent';
end $$;
revoke all on function public._friend_send(uuid, uuid) from public, anon, authenticated;

-- pedido por código
create or replace function public.friend_request(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')); t uuid;
begin
  if char_length(c) <> 8 then raise exception 'O código tem 8 letras e números.'; end if;
  select f.user_id into t from public.friend_codes f where f.code = c;
  return public._friend_send(auth.uid(), t);
end $$;
revoke all on function public.friend_request(text) from public, anon;
grant execute on function public.friend_request(text) to authenticated;

-- pedido a partir do perfil público de quem publicou um item
create or replace function public.friend_request_by_item(p_id text)
returns text language plpgsql security definer set search_path = '' as $$
declare t uuid;
begin
  select s.owner_id into t from public.shared_items s
    where s.id = p_id and s.status = 'ok'
      and coalesce((select p.public_profile from public.user_profiles p where p.user_id = s.owner_id), false);
  if t is null then raise exception 'Esse autor não aceita pedidos por aqui.'; end if;
  return public._friend_send(auth.uid(), t);
end $$;
revoke all on function public.friend_request_by_item(text) from public, anon;
grant execute on function public.friend_request_by_item(text) to authenticated;

-- aceitar ou recusar um pedido que eu recebi
create or replace function public.friend_respond(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now()
      where id = p_id and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships where id = p_id and addressee = auth.uid() and status = 'pending';
  end if;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Esse pedido não existe mais.'; end if;
end $$;
revoke all on function public.friend_respond(uuid, boolean) from public, anon;
grant execute on function public.friend_respond(uuid, boolean) to authenticated;

-- desfazer amizade, cancelar pedido enviado
create or replace function public.friend_remove(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.friendships where id = p_id and (requester = auth.uid() or addressee = auth.uid())
$$;
revoke all on function public.friend_remove(uuid) from public, anon;
grant execute on function public.friend_remove(uuid) to authenticated;

-- minha lista: amigos + pedidos (foto, banner e bio só de quem já é amigo)
create or replace function public.friend_list()
returns table(id uuid, status text, incoming boolean, display_name text, avatar_path text, banner_path text, bio text, accent text, items integer, since timestamptz)
language sql stable security definer set search_path = '' as $$
  select f.id, f.status, (f.addressee = auth.uid()),
    coalesce(nullif(p.display_name, ''), 'Agente'),
    case when f.status = 'accepted' then p.avatar_path end,
    case when f.status = 'accepted' then p.banner_path end,
    case when f.status = 'accepted' then p.bio end,
    case when f.status = 'accepted' then p.accent end,
    case when f.status = 'accepted'
      then (select count(*)::integer from public.shared_items s where s.owner_id = o.uid and s.visibility = 'public' and s.status = 'ok') else 0 end,
    coalesce(f.responded_at, f.created_at)
  from public.friendships f
  cross join lateral (select case when f.requester = auth.uid() then f.addressee else f.requester end as uid) o
  left join public.user_profiles p on p.user_id = o.uid
  where auth.uid() in (f.requester, f.addressee)
  order by (f.status = 'pending') desc, coalesce(f.responded_at, f.created_at) desc
$$;
revoke all on function public.friend_list() from public, anon;
grant execute on function public.friend_list() to authenticated;

-- publicações públicas de um amigo
create or replace function public.friend_items(p_fid uuid)
returns table(id text, kind text, campaign text, title text, thumb text, copies integer)
language sql stable security definer set search_path = '' as $$
  select s.id::text, s.kind::text, s.campaign::text, s.title::text, s.thumb::text, s.copies::integer
  from public.friendships f
  join public.shared_items s on s.owner_id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where f.id = p_fid and f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
    and s.visibility = 'public' and s.status = 'ok'
  order by s.copies desc, s.created_at desc limit 24
$$;
revoke all on function public.friend_items(uuid) from public, anon;
grant execute on function public.friend_items(uuid) to authenticated;

-- amigos podem ler a subpasta <user_id>/profile/ (foto e banner) um do outro
create or replace function public.is_friend_of(uid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee::text = uid) or (f.addressee = auth.uid() and f.requester::text = uid)))
$$;
revoke all on function public.is_friend_of(text) from public, anon;
grant execute on function public.is_friend_of(text) to authenticated;
drop policy if exists "avatars: read friends" on storage.objects;
create policy "avatars: read friends" on storage.objects for select to authenticated
  using (bucket_id = 'account-avatars' and (storage.foldername(name))[2] = 'profile' and public.is_friend_of((storage.foldername(name))[1]));
