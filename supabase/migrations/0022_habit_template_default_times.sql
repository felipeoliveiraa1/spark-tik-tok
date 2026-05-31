-- =============================================================================
-- 0022 — Horarios sugeridos default no template Yara
-- =============================================================================
-- Pra alunas novas (e backfill nas existentes que nao personalizaram), o
-- template Yara ja vem com horarios sensatos pra fluxo de criadora TikTok.
-- Manter null pra habitos que acontecem ao longo do dia (agua, vendas, views).
-- =============================================================================

create or replace function public.seed_yara_template(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_habits (user_id, slug, label, emoji, category, order_index, scheduled_time)
  values
    -- A. Trabalho
    (p_user_id, 'gravei-videos',     'Gravei vídeos hoje',           '🎥', 'trabalho',  0, '09:00'),
    (p_user_id, 'postei-videos',     'Postei vídeo no TikTok Shop',  '📱', 'trabalho',  1, '11:00'),
    (p_user_id, 'vi-metricas',       'Olhei as métricas do dia',     '📊', 'trabalho',  2, '21:00'),
    (p_user_id, 'respondi-dms',      'Respondi DMs e comentários',   '💬', 'trabalho',  3, '18:00'),
    (p_user_id, 'fiz-live',          'Fiz live ou planejei próxima', '🔴', 'trabalho',  4, '20:00'),
    (p_user_id, 'estudei-conteudo',  'Vi aula ou estudei conteúdo',  '🎓', 'trabalho',  5, '14:00'),
    -- B. Pessoal
    (p_user_id, 'skincare-manha',    'Skincare da manhã',            '🌅', 'pessoal',   6, '07:00'),
    (p_user_id, 'skincare-noite',    'Skincare da noite',            '🌙', 'pessoal',   7, '22:30'),
    (p_user_id, 'suplementos',       'Tomei meus suplementos',       '💊', 'pessoal',   8, '08:00'),
    (p_user_id, 'treino',            'Treinei ou me movimentei',     '🏋️', 'pessoal',   9, '06:30'),
    (p_user_id, 'agua',              'Bebi água ao longo do dia',    '💧', 'pessoal',  10, null),
    (p_user_id, 'dormi-bem',         'Dormi 7-8h tranquila',         '🛏️', 'pessoal',  11, '23:00'),
    -- C. Resultado
    (p_user_id, 'fechei-venda',      'Fechei uma venda no TTS',      '💸', 'resultado',12, null),
    (p_user_id, 'bati-meta-views',   'Bati minha meta de views',     '📈', 'resultado',13, null)
  on conflict (user_id, slug) do nothing;
end;
$$;

-- Backfill — alunas existentes que ja tem o template seedado mas sem hora.
-- NAO mexe se ja personalizaram (scheduled_time is not null).
update public.user_habits set scheduled_time = '09:00' where slug = 'gravei-videos'    and scheduled_time is null;
update public.user_habits set scheduled_time = '11:00' where slug = 'postei-videos'    and scheduled_time is null;
update public.user_habits set scheduled_time = '21:00' where slug = 'vi-metricas'      and scheduled_time is null;
update public.user_habits set scheduled_time = '18:00' where slug = 'respondi-dms'     and scheduled_time is null;
update public.user_habits set scheduled_time = '20:00' where slug = 'fiz-live'         and scheduled_time is null;
update public.user_habits set scheduled_time = '14:00' where slug = 'estudei-conteudo' and scheduled_time is null;
update public.user_habits set scheduled_time = '07:00' where slug = 'skincare-manha'   and scheduled_time is null;
update public.user_habits set scheduled_time = '22:30' where slug = 'skincare-noite'   and scheduled_time is null;
update public.user_habits set scheduled_time = '08:00' where slug = 'suplementos'      and scheduled_time is null;
update public.user_habits set scheduled_time = '06:30' where slug = 'treino'           and scheduled_time is null;
update public.user_habits set scheduled_time = '23:00' where slug = 'dormi-bem'        and scheduled_time is null;
