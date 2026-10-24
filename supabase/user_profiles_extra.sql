-- Perfil personalizável: bio, banner e cor de destaque.
-- Rode no SQL Editor do Supabase. O banner usa o mesmo bucket privado account-avatars (pasta <user_id>/).
alter table public.user_profiles
  add column if not exists bio text check (bio is null or char_length(bio) <= 200),
  add column if not exists banner_path text,
  add column if not exists accent text check (accent is null or accent ~ '^#[0-9a-fA-F]{6}$');
