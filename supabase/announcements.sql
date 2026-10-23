-- Avisos em pop-up (js/announce.js). Pode rodar mais de uma vez. Leitura pública só do que está ativo e dentro da data; ninguém escreve pelo app.
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null check (char_length(body) between 1 and 400),
  image_path text check (image_path is null or image_path ~ '^[A-Za-z0-9_./-]{1,120}$'),   -- arquivo no bucket ficha-assets
  cta_label  text check (cta_label is null or char_length(cta_label) between 1 and 30),
  cta_url    text check (cta_url is null or cta_url ~ '^https://'),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "Anyone can read active announcements" on public.announcements;
create policy "Anyone can read active announcements" on public.announcements
  for select to anon, authenticated
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to anon, authenticated;
-- Para anunciar (no SQL Editor):
-- insert into public.announcements (title, body, cta_label, cta_url) values ('Novidade', 'Texto curto do aviso.', 'Saiba mais', 'https://...');
