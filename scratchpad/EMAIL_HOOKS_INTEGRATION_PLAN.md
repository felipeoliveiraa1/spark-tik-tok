# Plano de integração — Email hooks nos endpoints existentes

## Pré-requisitos (fora do escopo destes 3 endpoints — precisam existir antes)

### A. Tabela `email_events` (migration nova, ex: `0047_email_events.sql`)
```sql
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  template_slug text not null,        -- 'milestone-primeira-aula' etc
  to_email text not null,
  resend_id text,                     -- id retornado pela Resend
  status text not null default 'sent',-- sent | failed | skipped
  error text,
  meta_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_events_user on public.email_events(user_id, created_at desc);
create index if not exists idx_email_events_slug on public.email_events(template_slug, created_at desc);
-- Idempotência por (user, template, ref) — evita duplicar milestone
create unique index if not exists uniq_email_events_milestone
  on public.email_events(user_id, template_slug, (meta_json->>'ref_id'))
  where template_slug like 'milestone-%' or template_slug like 'prova-%';
```

### B. Helper `lib/journey/journey-emails.ts` (novo arquivo)
Centraliza `sendEmail()` + `INSERT email_events` + idempotência. Todos os endpoints chamam ESTE helper — jamais chamam `sendEmail()` direto pra evento de jornada.

```ts
// frontend/lib/journey/journey-emails.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resend";

export type JourneyEmailTemplate =
  | "milestone-primeira-aula"
  | "milestone-criadora"
  | "milestone-boss-fight-ready"
  | "prova-aprovada"
  | "prova-pendente";

type SendJourneyEmailInput = {
  supabase: SupabaseClient;
  userId: string;
  template: JourneyEmailTemplate;
  refId?: string | null;                // lesson_id, badge_id, proof_id, journey_id
  subject: string;
  text: string;
  html?: string;
  meta?: Record<string, unknown>;
};

/**
 * Resolve email a partir do user_id (auth.admin) e dispara.
 * Idempotente via unique index em email_events(user_id, template_slug, ref_id).
 * Fire-and-forget: nunca lanca — retorna { ok, id?, error? }.
 */
export async function sendJourneyEmail(
  input: SendJourneyEmailInput,
): Promise<{ ok: boolean; id?: string; error?: string; skipped?: boolean }> {
  const { supabase, userId, template, refId, subject, text, html, meta } = input;

  // 1) Pre-check idempotencia (evita gastar quota Resend em duplicata).
  //    Race condition ainda pode ocorrer — coberta pelo unique index no INSERT abaixo.
  const { data: existing } = await supabase
    .from("email_events")
    .select("id, resend_id")
    .eq("user_id", userId)
    .eq("template_slug", template)
    .eq("meta_json->>ref_id", refId ?? "")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, id: existing.resend_id ?? undefined, skipped: true };
  }

  // 2) Resolve email do user (auth.admin — service role)
  const { data: userRes, error: uErr } = await supabase.auth.admin.getUserById(userId);
  const toEmail = userRes?.user?.email;
  if (uErr || !toEmail) {
    await supabase.from("email_events").insert({
      user_id: userId,
      template_slug: template,
      to_email: "",
      status: "failed",
      error: `no_email_found: ${uErr?.message ?? "user has no email"}`,
      meta_json: { ref_id: refId ?? null, ...(meta ?? {}) },
    });
    return { ok: false, error: "no_email" };
  }

  // 3) Envia
  const sent = await sendEmail({
    to: toEmail,
    subject,
    text,
    html,
    tags: [
      { name: "kind", value: template },
      ...(refId ? [{ name: "ref_id", value: refId }] : []),
    ],
  });

  // 4) INSERT do event (idempotencia final via unique index)
  const { error: insErr } = await supabase.from("email_events").insert({
    user_id: userId,
    template_slug: template,
    to_email: toEmail,
    resend_id: sent.ok ? sent.id : null,
    status: sent.ok ? "sent" : "failed",
    error: sent.ok ? null : sent.error,
    meta_json: { ref_id: refId ?? null, ...(meta ?? {}) },
  });
  // Se unique_violation: outro request ja gravou -> tudo bem, considera skipped
  if (insErr && insErr.code === "23505") {
    return { ok: true, skipped: true };
  }

  return sent.ok
    ? { ok: true, id: sent.id }
    : { ok: false, error: sent.error };
}
```

### C. Templates em `lib/email-templates/journey.ts` (novo arquivo)
Segue padrão de `plan.ts` — exporta `buildMilestonePrimeiraAulaEmail({ firstName })`, `buildMilestoneCriadoraEmail({ firstName })`, `buildMilestoneBossFightReadyEmail({ firstName, journeyTitle })`, `buildProvaAprovadaEmail({ firstName, journeyTitle })`, `buildProvaPendenteEmail({ firstName })`. Cada uma retorna `{ subject, text, html }`. (Copywriting fora do escopo deste plano; usar `buildPlanEmailHtml` como base visual.)

---

## Endpoint 1 — `frontend/app/api/jornadas/[slug]/lesson/[lessonId]/complete/route.ts`

### Onde encaixa
Após a linha 260 (fim do `try/catch` de `evaluateBadgesForUser`) e ANTES do `return json({...})` da linha 262. É o único ponto onde já temos:
- `user.id` confirmado
- `completed=true` gravado (linha 205-213)
- `journey_lesson_progress` já inclui a aula atual → contagem retorna 1 na primeira vez
- `awardedBadges` disponível

### Import (topo do arquivo, junto com os outros)
Substituir a linha 1:
```ts
import { NextResponse, after } from "next/server";
```
E adicionar após a linha 6:
```ts
import { sendJourneyEmail } from "@/lib/journey/journey-emails";
import { buildMilestonePrimeiraAulaEmail, buildMilestoneCriadoraEmail, buildMilestoneBossFightReadyEmail } from "@/lib/email-templates/journey";
```

### Bloco de código EXATO — inserir entre linha 260 e 262
```ts
  // 6) Email hooks — fire-and-forget via after() (nao atrasa response)
  //    Milestones disparados aqui:
  //    - primeira-aula: exatamente 1 aula completada (COUNT === 1)
  //    - criadora: badge 'criadora' concedida neste request
  //    - boss-fight-ready: esta conclusao fechou TODOS os modulos publicados
  //      da jornada (all_modules_complete vira true agora, pela 1a vez)
  after(async () => {
    // 6a) Milestone: primeira aula
    try {
      const { count: totalCompleted } = await supabase
        .from("journey_lesson_progress")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      if (totalCompleted === 1) {
        // Nome pro subject/text
        const { data: p } = await supabase
          .from("profiles").select("name").eq("id", user.id).maybeSingle();
        const firstName = (p?.name ?? "").split(/\s+/)[0] || "aluna";
        const tmpl = buildMilestonePrimeiraAulaEmail({ firstName });
        await sendJourneyEmail({
          supabase,
          userId: user.id,
          template: "milestone-primeira-aula",
          refId: lessonId,           // ref pra idempotencia (1a aula = 1 lesson_id)
          subject: tmpl.subject,
          text: tmpl.text,
          html: tmpl.html,
          meta: { journey_slug: slug, lesson_id: lessonId },
        });
      }
    } catch (err) {
      console.warn("[complete] email milestone-primeira-aula:", err);
    }

    // 6b) Milestone: badge criadora concedida neste request
    try {
      const criadora = awardedBadges.find((b) => b.slug === "criadora");
      if (criadora) {
        const { data: p } = await supabase
          .from("profiles").select("name").eq("id", user.id).maybeSingle();
        const firstName = (p?.name ?? "").split(/\s+/)[0] || "aluna";
        const tmpl = buildMilestoneCriadoraEmail({ firstName });
        await sendJourneyEmail({
          supabase,
          userId: user.id,
          template: "milestone-criadora",
          refId: criadora.badge_id,  // unique por badge_id
          subject: tmpl.subject,
          text: tmpl.text,
          html: tmpl.html,
          meta: { badge_slug: "criadora" },
        });
      }
    } catch (err) {
      console.warn("[complete] email milestone-criadora:", err);
    }

    // 6c) Milestone: boss-fight-ready — esta aula fechou a jornada
    //     Detecta transicao: se, DEPOIS desta conclusao, TODAS as aulas
    //     publicadas de TODOS os modulos publicados estao completas.
    //     Idempotencia via ref_id = journey_id (unica vez por jornada).
    try {
      const { data: allModules } = await supabase
        .from("journey_modules")
        .select("id")
        .eq("journey_id", lesson.journey_id)
        .eq("is_published", true);
      const moduleIds = (allModules ?? []).map((m) => m.id as string);
      if (moduleIds.length > 0) {
        const { data: allLessons } = await supabase
          .from("journey_lessons")
          .select("id")
          .in("module_id", moduleIds)
          .eq("is_published", true);
        const lessonIds = (allLessons ?? []).map((l) => l.id as string);
        if (lessonIds.length > 0) {
          const { count: doneCount } = await supabase
            .from("journey_lesson_progress")
            .select("lesson_id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("completed", true)
            .in("lesson_id", lessonIds);
          if ((doneCount ?? 0) >= lessonIds.length) {
            const [{ data: p }, { data: j }] = await Promise.all([
              supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
              supabase.from("journeys").select("id, title").eq("id", lesson.journey_id).maybeSingle(),
            ]);
            const firstName = (p?.name ?? "").split(/\s+/)[0] || "aluna";
            const journeyTitle = j?.title ?? "sua jornada";
            const tmpl = buildMilestoneBossFightReadyEmail({ firstName, journeyTitle });
            await sendJourneyEmail({
              supabase,
              userId: user.id,
              template: "milestone-boss-fight-ready",
              refId: lesson.journey_id,   // 1 email por jornada
              subject: tmpl.subject,
              text: tmpl.text,
              html: tmpl.html,
              meta: { journey_slug: slug, journey_id: lesson.journey_id },
            });
          }
        }
      }
    } catch (err) {
      console.warn("[complete] email milestone-boss-fight-ready:", err);
    }
  });
```

### Notas sobre este endpoint
- Boss-fight-ready foi movido pra cá (conforme sugestão do briefing) porque `/api/jornadas/[slug]/route.ts` é GET puro — dispararia email a CADA reload. Aqui só dispara na transição real (aula que fecha o último módulo).
- Idempotência do `email_events(user_id, template_slug, ref_id)` garante que se aluna re-clicar "completar" e conta cair pra 2 aulas (não cai — endpoint é idempotente por `already_completed`), nunca duplica.
- `after()` está sendo importado como named import de `next/server` (já usado em `frontend/app/grupo/route.ts:2` — padrão do projeto).

---

## Endpoint 2 — `frontend/app/api/jornadas/[slug]/proof/route.ts`

### Onde encaixa
Após linha 212 (fim do `INSERT journey_notifications`) e ANTES do `return json({...})` da linha 214. Nesse ponto:
- `proof.id` já existe
- `status` já é `"pending"` ou `"auto_approved"`
- `journey` (com título) já foi buscado

### Import (topo)
Substituir linha 1:
```ts
import { NextResponse, after } from "next/server";
```
E adicionar após linha 8:
```ts
import { sendJourneyEmail } from "@/lib/journey/journey-emails";
import { buildProvaAprovadaEmail, buildProvaPendenteEmail } from "@/lib/email-templates/journey";
```

Também precisa incluir `title` no `SELECT` da linha 78-81:
```ts
  const { data: journey } = await supabase
    .from("journeys")
    .select("id, slug, title, is_admin_only")
    .eq("slug", slug)
    .maybeSingle();
```

### Bloco de código EXATO — inserir entre linha 212 e 214
```ts
  // Email hook — fire-and-forget via after()
  //   status='auto_approved' -> prova-aprovada
  //   status='pending'       -> prova-pendente
  //   status='rejected'      -> disparado pelo endpoint admin (fora deste)
  after(async () => {
    try {
      const { data: p } = await supabase
        .from("profiles").select("name").eq("id", user.id).maybeSingle();
      const firstName = (p?.name ?? "").split(/\s+/)[0] || "aluna";
      const journeyTitle = journey.title ?? "sua jornada";

      if (status === "auto_approved") {
        const tmpl = buildProvaAprovadaEmail({ firstName, journeyTitle });
        await sendJourneyEmail({
          supabase,
          userId: user.id,
          template: "prova-aprovada",
          refId: proof.id,
          subject: tmpl.subject,
          text: tmpl.text,
          html: tmpl.html,
          meta: {
            journey_slug: slug,
            proof_id: proof.id,
            ocr_confidence: ocrConfidence,
            ocr_detected_sales: ocrSales,
          },
        });
      } else if (status === "pending") {
        const tmpl = buildProvaPendenteEmail({ firstName });
        await sendJourneyEmail({
          supabase,
          userId: user.id,
          template: "prova-pendente",
          refId: proof.id,
          subject: tmpl.subject,
          text: tmpl.text,
          html: tmpl.html,
          meta: {
            journey_slug: slug,
            proof_id: proof.id,
            ocr_confidence: ocrConfidence,
          },
        });
      }
    } catch (err) {
      console.warn("[proof] email hook:", err);
    }
  });
```

### Notas sobre este endpoint
- Rejeição (`status='rejected'`) NÃO é setada aqui — sempre vem de endpoint admin de moderação. Adiado conforme briefing.
- `refId=proof.id` garante que se aluna reenviar (e passar pelo guard de "already_submitted"), cada proof novo dispara 1 email seu.
- Guard `!isAdmin -> 503` das linhas 60-71 continua bloqueando aluna real — quando destravar, o hook funciona.

---

## Endpoint 3 — `frontend/lib/journey/badge-engine.ts`

### Decisão de arquitetura
NÃO adicionar `sendEmail` dentro de `evaluateBadgesForUser`. Motivos:
1. Badge engine é chamado de múltiplos lugares (complete, proof, futuros endpoints) — vira acoplamento oculto.
2. Já usamos o retorno `awardedBadges` no endpoint 1 para disparar `milestone-criadora` (bloco 6b acima). Isso é mais explícito e testável.
3. Boss-fight-ready NÃO é uma badge → tem que ser detectado pela transição de completar aula (feito no bloco 6c acima), não no engine.

### Mudança mínima em `badge-engine.ts`
Nenhuma mudança de código necessária. O engine já retorna `AwardedBadge[]` com `slug` — endpoint 1 já filtra `find((b) => b.slug === "criadora")`.

### Se houver OUTRAS badges de milestone no futuro
Adicionar template + slug ao helper e criar mais um `.find()` no bloco 6b, seguindo o mesmo padrão. Manter regra: **um `sendJourneyEmail` por slug de badge**, não um loop genérico (subject/copy varia por badge).

---

## Ordem de deploy sugerida
1. Migration `0047_email_events.sql` (tabela + índice único).
2. `lib/email-templates/journey.ts` (5 templates novos).
3. `lib/journey/journey-emails.ts` (helper).
4. Edits nos 2 endpoints (complete + proof).
5. Testar em admin (isAdmin bypassa proof-503) → verificar `email_events` populado.
6. Verificar Resend dashboard → tags `kind=milestone-primeira-aula` etc.

## Checklist de idempotência
- [ ] Aluna completa aula 1 → `milestone-primeira-aula` (ref=lesson_id). Reset local + re-complete NÃO dispara (endpoint retorna `already_completed`).
- [ ] Aluna ganha badge criadora 1x → `milestone-criadora` (ref=badge_id). Badge engine já skipa via `user_badges` PK.
- [ ] Aluna fecha último módulo → `milestone-boss-fight-ready` (ref=journey_id). Se cair em outra aula de módulo já concluído (impossível pelo gate), unique index bloqueia.
- [ ] Aluna envia prova → `prova-aprovada` OU `prova-pendente` (ref=proof.id). Reenvio bloqueado por guard `already_submitted`, mas unique index é defesa-em-profundidade.
