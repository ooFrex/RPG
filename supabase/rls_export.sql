-- Exporta o que está VALENDO hoje no seu Supabase (políticas de RLS, permissões e buckets),
-- para guardar no repositório e conferir mudanças. Este arquivo só LÊ; não altera nada.
-- Como usar: Supabase → SQL Editor → rode cada consulta → botão "Export" (CSV/JSON) ou copie o resultado
-- e cole em supabase/rls_policies_snapshot.md (ou transforme em CREATE POLICY).

-- 1) Tabelas do app: RLS ligado?
select c.relname as tabela, c.relrowsecurity as rls_ligado, c.relforcerowsecurity as rls_forcado
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2) Políticas das tabelas (character_sheets, user_profiles, user_systems, user_prefs, shared_items, friends...)
select schemaname, tablename, policyname, permissive, roles, cmd, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Políticas do Storage (buckets ficha-assets e account-avatars)
select policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 4) Buckets: público ou privado, limite e tipos aceitos
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by name;

-- 5) Permissões (GRANT) por coluna e tabela para os papéis do app
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type, column_name;

-- 6) Funções que rodam com permissão elevada (security definer): revise cada uma
select p.proname as funcao, p.prosecdef as security_definer, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;
