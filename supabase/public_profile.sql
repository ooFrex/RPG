-- Perfil público do autor + publicação sem duplicar. Rode DEPOIS de user_profiles_extra.sql.

-- 1) o perfil só aparece para os outros se a pessoa ligar (padrão: desligado)
alter table public.user_profiles add column if not exists public_profile boolean not null default false;

-- 2) origem estável: o mesmo personagem publicado de outro aparelho atualiza em vez de duplicar
alter table public.shared_items add column if not exists origin_key text check (origin_key is null or char_length(origin_key) <= 80);
create unique index if not exists shared_items_origin_uidx on public.shared_items (owner_id, origin_key) where origin_key is not null;
grant insert (origin_key) on public.shared_items to authenticated;
grant update (origin_key) on public.shared_items to authenticated;

-- 3) perfil do autor de um item (sem expor o id do dono)
create or replace function public.get_author(p_id text)
returns table(public_profile boolean, display_name text, avatar_path text, banner_path text, bio text, accent text, items integer)
language plpgsql stable security definer set search_path = '' as $$
declare o uuid;
begin
  select s.owner_id into o from public.shared_items s where s.id = p_id and s.status = 'ok';
  if o is null then return; end if;
  return query
    select coalesce(p.public_profile, false),
      case when p.public_profile then p.display_name end, case when p.public_profile then p.avatar_path end,
      case when p.public_profile then p.banner_path end,  case when p.public_profile then p.bio end,
      case when p.public_profile then p.accent end,
      (select count(*)::integer from public.shared_items x where x.owner_id = o and x.visibility = 'public' and x.status = 'ok')
    from (select 1) d left join public.user_profiles p on p.user_id = o;
end $$;
revoke all on function public.get_author(text) from public;
grant execute on function public.get_author(text) to anon, authenticated;

-- 4) outros itens públicos do mesmo autor (pelo dono de verdade, não pelo nome digitado)
create or replace function public.author_items(p_id text)
returns table(id text, kind text, campaign text, title text, thumb text, copies integer)
language sql stable security definer set search_path = '' as $$
  select s.id::text, s.kind::text, s.campaign::text, s.title::text, s.thumb::text, s.copies::integer
  from public.shared_items s
  where s.visibility = 'public' and s.status = 'ok' and s.id <> p_id
    and s.owner_id = (select o.owner_id from public.shared_items o where o.id = p_id and o.status = 'ok')
  order by s.copies desc, s.created_at desc limit 6
$$;
revoke all on function public.author_items(text) from public;
grant execute on function public.author_items(text) to anon, authenticated;

-- 5) só a subpasta <user_id>/profile/ (foto e banner do perfil) de perfis públicos é legível; retratos das fichas continuam privados
create or replace function public.profile_is_public(uid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.public_profile from public.user_profiles p where p.user_id::text = uid), false)
$$;
revoke all on function public.profile_is_public(text) from public;
grant execute on function public.profile_is_public(text) to anon, authenticated;
drop policy if exists "avatars: read public profiles" on storage.objects;
create policy "avatars: read public profiles" on storage.objects for select to anon, authenticated
  using (bucket_id = 'account-avatars' and (storage.foldername(name))[2] = 'profile' and public.profile_is_public((storage.foldername(name))[1]));
