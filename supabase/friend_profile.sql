-- Perfil por código de amigo (link "?amigo=CÓDIGO"). Pode rodar mais de uma vez. Rode DEPOIS de friends.sql e public_profile.sql.
--
-- Quem abre o link vê o NOME sempre (é o mesmo que já aparece num pedido de amizade). Foto, banner, bio e publicações só aparecem se
-- o dono ligou o "perfil público" ou se quem abre já é amigo dele. O código de amigo só deixa MANDAR PEDIDO, nunca dá acesso a fichas.
--
-- relation: 'self' (é você) · 'friends' · 'pending_out' (você pediu) · 'pending_in' (a pessoa pediu para você) · 'none'

create or replace function public.profile_by_code(p_code text)
returns table(relation text, friendship_id uuid, display_name text, avatar_path text, banner_path text, bio text, accent text, items integer, details boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  me uuid := auth.uid(); t uuid; f public.friendships%rowtype; rel text := 'none'; pub boolean;
begin
  if char_length(c) <> 8 then return; end if;
  select fc.user_id into t from public.friend_codes fc where fc.code = c;
  if t is null then return; end if;
  if me is not null then
    if me = t then rel := 'self';
    else
      select * into f from public.friendships x
        where least(x.requester, x.addressee) = least(me, t) and greatest(x.requester, x.addressee) = greatest(me, t);
      if found then
        rel := case when f.status = 'accepted' then 'friends' when f.requester = me then 'pending_out' else 'pending_in' end;
      end if;
    end if;
  end if;
  select coalesce(p.public_profile, false) into pub from public.user_profiles p where p.user_id = t;
  pub := coalesce(pub, false) or rel in ('self', 'friends');
  return query
    select rel, case when rel in ('friends', 'pending_out', 'pending_in') then f.id end,
      coalesce(nullif(p.display_name, ''), 'Agente'),
      case when pub then p.avatar_path end, case when pub then p.banner_path end,
      case when pub then p.bio end, case when pub then p.accent end,
      case when pub then (select count(*)::integer from public.shared_items s where s.owner_id = t and s.visibility = 'public' and s.status = 'ok') else 0 end,
      pub
    from (select 1) d left join public.user_profiles p on p.user_id = t;
end $$;
revoke all on function public.profile_by_code(text) from public;
grant execute on function public.profile_by_code(text) to anon, authenticated;

-- publicações públicas de quem tem esse código (mesma regra de visibilidade)
create or replace function public.profile_items_by_code(p_code text)
returns table(id text, kind text, campaign text, title text, thumb text, copies integer)
language plpgsql stable security definer set search_path = '' as $$
declare
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  me uuid := auth.uid(); t uuid; ok boolean;
begin
  if char_length(c) <> 8 then return; end if;
  select fc.user_id into t from public.friend_codes fc where fc.code = c;
  if t is null then return; end if;
  ok := coalesce((select p.public_profile from public.user_profiles p where p.user_id = t), false) or me = t
        or (me is not null and exists (select 1 from public.friendships f where f.status = 'accepted'
            and ((f.requester = me and f.addressee = t) or (f.addressee = me and f.requester = t))));
  if not ok then return; end if;
  return query
    select s.id::text, s.kind::text, s.campaign::text, s.title::text, s.thumb::text, s.copies::integer
    from public.shared_items s where s.owner_id = t and s.visibility = 'public' and s.status = 'ok'
    order by s.copies desc, s.created_at desc limit 24;
end $$;
revoke all on function public.profile_items_by_code(text) from public;
grant execute on function public.profile_items_by_code(text) to anon, authenticated;

notify pgrst, 'reload schema';
