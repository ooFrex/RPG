-- Adiciona o modo "Privado" (só o dono vê). Os outros modos continuam: "unlisted" (por link) e "public" (marketplace).
alter table public.shared_items drop constraint if exists shared_items_visibility_check;
alter table public.shared_items add constraint shared_items_visibility_check check (visibility in ('private', 'unlisted', 'public'));

drop function if exists public.get_shared(text);
create function public.get_shared(p_id text)
returns table (id text, kind text, campaign text, title text, summary text, author_name text, thumb text,
               payload jsonb, version int, copies int, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.kind, s.campaign, s.title, s.summary, s.author_name, s.thumb, s.payload, s.version, s.copies, s.created_at, s.updated_at
  from public.shared_items s
  where s.id = p_id and s.status = 'ok' and (s.visibility <> 'private' or s.owner_id = auth.uid())
$$;
revoke all on function public.get_shared(text) from public;
grant execute on function public.get_shared(text) to anon, authenticated;
