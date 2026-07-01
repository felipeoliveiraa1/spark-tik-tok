-- =============================================================================
-- 0045 — Remove aula placeholder de J2 e J3
-- =============================================================================
-- J2 e J3 tinham a aula 'aula-boas-vindas' seedada no 0039 (era placeholder
-- pra dar tela funcional no dev). Agora que J2/J3 estao visiveis pras alunas
-- como cards locked no hub, essa aula placeholder eh perigosa: se aluna
-- completar J1 e desbloquear J2, ela veria "## Bem-vinda ... Essa e uma
-- aula placeholder" + marcaria concluida com 10 XP + Boss Fight aceitaria
-- print reciclado -> J2 vira completed em minutos.
--
-- Fix: apagar essas aulas. Hub de J2/J3 vai mostrar empty state ("Aulas
-- chegando") quando aluna chegar la, sem burlar mecanica.
--
-- Idempotente: DELETE so remove se existir + so quando nao foi completed
-- por ninguem (protege progress historico).
-- =============================================================================

delete from public.journey_lessons
where slug = 'aula-boas-vindas'
  and journey_id in (
    select id from public.journeys
    where slug in ('jornada-2-adolescente', 'jornada-3-adulta')
  )
  and not exists (
    select 1 from public.journey_lesson_progress p
    where p.lesson_id = journey_lessons.id and p.completed = true
  );
