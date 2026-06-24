-- =============================================================================
-- 0037 — Group redirect: revoga RPC de roles publicas (security hardening)
-- =============================================================================
-- BLOCKER detectado em review pre-lancamento: a 0036 deu GRANT EXECUTE na
-- RPC pick_next_group_redirect pra anon/authenticated. Como a anon key
-- esta no bundle JS publico (NEXT_PUBLIC_SUPABASE_ANON_KEY), qualquer
-- atacante chama a RPC direto via PostgREST e queima cap dos grupos em
-- segundos — sem deixar rastro em group_redirect_clicks (que so eh
-- preenchida pela route /grupo no Next).
--
-- Fix: revogar de anon/authenticated, manter so service_role (que eh o
-- que a rota /grupo usa via supabase service client).
-- =============================================================================

revoke execute on function public.pick_next_group_redirect from anon, authenticated;

-- Confirma que service_role mantem (default grant pra service_role nao
-- depende de REVOKE acima — service_role bypassa todos os GRANTs como
-- SUPERUSER). Mas pra deixar explicito:
grant execute on function public.pick_next_group_redirect to service_role;
