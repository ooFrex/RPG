-- updated_at carimbado pelo servidor (relógio do Postgres), não pelo celular.
-- O controle de conflito do js/cloud.js compara esse valor; com o relógio do aparelho errado ele falhava.
-- APLIQUE ESTE ARQUIVO ANTES de publicar o front novo (o front não envia mais updated_at). Pode rodar mais de uma vez.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- valor padrão para linhas novas
alter table public.character_sheets alter column updated_at set default now();
alter table public.user_profiles    alter column updated_at set default now();

drop trigger if exists trg_character_sheets_updated_at on public.character_sheets;
create trigger trg_character_sheets_updated_at
  before insert or update on public.character_sheets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before insert or update on public.user_profiles
  for each row execute function public.set_updated_at();
