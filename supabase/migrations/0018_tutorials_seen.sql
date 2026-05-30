-- =============================================================================
-- 0018 — Tutorials seen tracking (cross-device tour persistence)
-- =============================================================================
-- Persiste no banco quais tours guiados a aluna ja completou, em vez de so
-- localStorage. Assim a tela /home (ou /agentes etc) nao abre o tour de novo
-- quando ela troca de device, limpa cache do navegador ou faz logout/login.
--
-- Armazenado como array de strings (keys "home", "agentes", "produtos"...)
-- diretamente em profiles pra evitar JOIN — tabela separada seria overkill
-- porque sao poucos tours e a leitura sempre acontece junto do profile load.
-- =============================================================================

alter table public.profiles
  add column if not exists tutorials_seen text[] not null default '{}'::text[];

-- Index pra GIN nao eh necessario aqui — arrays sao pequenos (max 10-15 keys)
-- e o lookup eh sempre por owner (auth.uid()), nao por valor dentro do array.

-- RLS ja existente nas profiles cobre — owner-only read/write via policy
-- "profiles_self" (ou equivalente). Sem policy nova necessaria.
