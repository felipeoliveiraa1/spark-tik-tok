-- =============================================================================
-- 0034 — Habilita ranking_opt_in pra todas (existentes + novas alunas)
-- =============================================================================
-- Decisao do produto: ranking eh mais valioso cheio. Trocar opt-in (poucas
-- escolhem) por opt-out (todas entram, quem nao quer sai em /conta).
--
-- Mudancas:
--   1) Default da coluna ranking_opt_in: false -> true (alunas novas ja
--      entram aparecendo no ranking)
--   2) Backfill: todas as alunas existentes com false viram true.
--      Excecao: contas CRM (role='crm_agent') nao entram no ranking.
--
-- Aluna que nao quer aparecer desabilita em /conta (RankingOptInCard).
-- =============================================================================

-- Passo 1: muda default da coluna
alter table public.profiles
  alter column ranking_opt_in set default true;

-- Passo 2: backfill alunas existentes que ainda estavam false
update public.profiles
set
  ranking_opt_in = true,
  updated_at = now()
where ranking_opt_in is distinct from true
  and (role is null or role not in ('crm_agent'));
