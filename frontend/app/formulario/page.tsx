"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Loader2,
  Phone,
  User,
  AtSign,
  TrendingUp,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { cn } from "@/lib/cn";

/**
 * /formulario — pagina publica de captacao de leads (linkada na bio do
 * TikTok). Multi-step form com visual premium magazine. Salva em /api/leads.
 *
 * Steps:
 *   0. Welcome
 *   1. Nome
 *   2. Telefone
 *   3. @ TikTok
 *   4. Ja vende?
 *   5. (se sim) Faturamento
 *   6. Thank you (redireciona pra /formulario/obrigada apos save)
 */

type RevenueRange = "ate_5k" | "de_5k_a_20k" | "de_20k_a_50k" | "acima_50k";

const REVENUE_OPTIONS: { value: RevenueRange; label: string; emoji: string }[] = [
  { value: "ate_5k", label: "Até R$ 5 mil", emoji: "🌱" },
  { value: "de_5k_a_20k", label: "R$ 5 a 20 mil", emoji: "🌿" },
  { value: "de_20k_a_50k", label: "R$ 20 a 50 mil", emoji: "🌳" },
  { value: "acima_50k", label: "Acima de R$ 50 mil", emoji: "🔥" },
];

function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function FormularioPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [nome, setNome] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [tiktok, setTiktok] = React.useState("");
  const [alreadySelling, setAlreadySelling] = React.useState<boolean | null>(null);
  const [revenue, setRevenue] = React.useState<RevenueRange | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Total de steps muda se a aluna disse "ja vende"
  const totalSteps = alreadySelling === true ? 6 : 5; // welcome + nome + tel + tt + vende + (revenue se sim)
  const progressPct =
    step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return nome.trim().length >= 2;
      case 2:
        return telefone.replace(/\D/g, "").length >= 10;
      case 3:
        return tiktok.replace(/^@/, "").trim().length >= 2;
      case 4:
        return alreadySelling !== null;
      case 5:
        return !alreadySelling || revenue !== null;
      default:
        return false;
    }
  })();

  const isLastStep = (alreadySelling === true && step === 5) || (alreadySelling === false && step === 4);

  const next = () => {
    if (!canAdvance) return;
    // Se ja vende = false e tá no step 4, pula direto pro submit
    if (step === 4 && alreadySelling === false) {
      void submit();
      return;
    }
    if (isLastStep) {
      void submit();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    setError(null);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    // Capta UTMs da URL atual
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const utm = {
      utm_source: params?.get("utm_source") ?? undefined,
      utm_medium: params?.get("utm_medium") ?? undefined,
      utm_campaign: params?.get("utm_campaign") ?? undefined,
      utm_content: params?.get("utm_content") ?? undefined,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          tiktok_handle: tiktok.replace(/^@/, "").trim(),
          already_selling: alreadySelling,
          revenue_range: alreadySelling ? revenue : null,
          ...utm,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não consegui enviar agora. Tenta de novo?");
        setSubmitting(false);
        return;
      }
      router.push("/formulario/obrigada");
    } catch {
      setError("Erro de rede. Tenta de novo?");
      setSubmitting(false);
    }
  };

  // ENTER avança quando possível
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canAdvance && !submitting) {
        // Evita conflito com textarea
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        next();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* BG hero radial global */}
      <div className="absolute inset-0 hero-radial -z-10" />
      <HeroBlob color="rose" variant={1} className="fixed -top-32 -left-32 w-[460px] h-[460px] -z-10" />
      <HeroBlob color="lilac" variant={2} className="fixed top-20 -right-40 w-[520px] h-[520px] -z-10" />
      <HeroBlob color="peach" variant={3} className="fixed bottom-0 left-1/3 w-[400px] h-[400px] -z-10" />
      <SparkleField count={14} seed={42} className="opacity-50 -z-10" />

      <div className="relative min-h-dvh flex flex-col lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-0">
        {/* COLUNA ESQUERDA — Form */}
        <div className="flex flex-col px-5 lg:px-12 py-6 lg:py-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-6 lg:mb-10">
            <SparkWordmark size={32} />
            {step > 0 && (
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ {step}/{totalSteps - 1}
              </div>
            )}
          </header>

          {/* Progress bar */}
          {step > 0 && (
            <div className="mb-8 h-1.5 rounded-full bg-spark-surface-sunken overflow-hidden border border-spark-hairline">
              <div
                className="h-full bg-brand-grad transition-all duration-500 ease-premium"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Step content */}
          <div className="flex-1 flex flex-col justify-center max-w-[560px] mx-auto w-full lg:mx-0">
            {step === 0 && (
              <StepWelcome onNext={next} />
            )}

            {step === 1 && (
              <StepNome value={nome} onChange={setNome} />
            )}

            {step === 2 && (
              <StepTelefone value={telefone} onChange={(v) => setTelefone(formatPhoneBR(v))} />
            )}

            {step === 3 && (
              <StepTiktok value={tiktok} onChange={setTiktok} />
            )}

            {step === 4 && (
              <StepAlreadySelling value={alreadySelling} onChange={setAlreadySelling} />
            )}

            {step === 5 && (
              <StepRevenue value={revenue} onChange={setRevenue} />
            )}

            {error && (
              <div className="mt-5 px-4 py-3 rounded-spark-xl bg-bad/10 border border-bad/20 text-bad text-[12.5px] font-extrabold">
                {error}
              </div>
            )}
          </div>

          {/* Footer com botoes */}
          <footer className="mt-8 lg:mt-10 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[13px] font-extrabold transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step > 0 && (
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance || submitting}
                className={cn(
                  "group inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-extrabold transition-all duration-300 ease-premium",
                  canAdvance && !submitting
                    ? "bg-brand-grad text-white shadow-lift-brand hover:-translate-y-0.5"
                    : "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                    Enviando...
                  </>
                ) : isLastStep ||
                  (step === 4 && alreadySelling === false) ? (
                  <>
                    Concluir
                    <Check size={14} strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    Próxima
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            )}
          </footer>
        </div>

        {/* COLUNA DIREITA — Mocks premium do app (desktop only) */}
        <aside className="hidden lg:flex relative items-center justify-center overflow-hidden">
          <MocksPanel />
        </aside>
      </div>
    </div>
  );
}

// =================================================================
// STEPS
// =================================================================

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8">
      {/* Sticker rotativo (mobile only — desktop tem painel direito) */}
      <div className="lg:hidden flex justify-start">
        <Sticker text="MÉTODO TTS · 2026 · PREMIUM · " emoji="✨" size={96} />
      </div>

      <div>
        <div className="text-eyebrow text-spark-brand-deep mb-4">✦ método tts</div>
        <h1
          className="font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
          style={{ fontSize: "clamp(2.5rem, 9vw, 5.5rem)" }}
        >
          <CharacterReveal as="span" immediate staggerMs={28} className="block text-spark-ink">
            chega de
          </CharacterReveal>
          <CharacterReveal
            as="span"
            immediate
            staggerMs={28}
            delayMs={350}
            className="block"
            charClassName="text-grad-brand"
          >
            postar no escuro.
          </CharacterReveal>
        </h1>

        <p className="mt-7 text-fluid-lead text-spark-ink-70 leading-snug font-semibold max-w-[44ch]">
          Eu sou a Yara — vou te fazer 5 perguntinhas rápidas pra entender onde você tá no TikTok Shop e te chamar pra dentro do método. Leva menos de 1 minuto 💕
        </p>

        <div className="mt-8 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onNext}
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-brand-grad text-white text-[15px] font-extrabold shadow-lift-brand transition-all duration-300 ease-premium hover:-translate-y-1"
          >
            Bora começar
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </button>
          <div className="text-[12px] text-spark-ink-50 font-mono">
            ✦ 5 perguntas · menos de 1min
          </div>
        </div>
      </div>

      {/* "O que tem dentro" — preview do método (mobile only) */}
      <div className="lg:hidden">
        <div className="text-eyebrow text-spark-brand mb-4">✦ o que tem dentro</div>
        <div className="grid grid-cols-1 gap-3">
          <PreviewCard
            emoji="✨"
            gradient="from-rose-400 via-pink-500 to-rose-500"
            label="8 agentes especialistas"
            hint="Skincare, makeup, suplementos… cada nicho com sua expert no ChatGPT/Gemini."
          />
          <PreviewCard
            emoji="🔥"
            gradient="from-orange-400 via-pink-500 to-rose-500"
            label="Rotina diária + streak"
            hint="Checklist de hábitos. Quanto mais dias seguidos, melhor o algoritmo te entrega."
          />
          <PreviewCard
            emoji="✍️"
            gradient="from-purple-400 via-pink-500 to-rose-500"
            label="Roteiros prontos pra gravar"
            hint="Método gancho → desenvolvimento → benefício → CTA. Você só fala."
          />
          <PreviewCard
            emoji="🏆"
            gradient="from-amber-400 via-orange-500 to-rose-500"
            label="Ranking de criadoras"
            hint="Faturamento + consistência viraram score. Inspiração e meta visíveis."
          />
        </div>
      </div>

      {/* Trust strip */}
      <div className="lg:hidden rounded-spark-2xl bg-spark-surface border border-spark-hairline px-5 py-4 shadow-rest">
        <div className="grid grid-cols-3 gap-3 text-center">
          <TrustBadge value="234+" label="criadoras" />
          <TrustBadge value="24h" label="resposta" />
          <TrustBadge value="0" label="spam" />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  emoji,
  gradient,
  label,
  hint,
}: {
  emoji: string;
  gradient: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift">
      <div
        className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-[22px] shadow-lift transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight leading-tight">
          {label}
        </div>
        <div className="mt-1 text-[12px] text-spark-ink-70 leading-snug font-semibold">
          {hint}
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display lowercase text-spark-ink leading-none text-[24px] tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-spark-ink-50 font-extrabold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

function StepNome({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <StepFrame
      eyebrow="✦ 01 · vamos nos conhecer"
      icon={<User size={28} strokeWidth={2.2} />}
      title="como você quer ser chamada?"
      hint="Seu primeiro nome é suficiente."
    >
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ex: Beatriz"
        maxLength={120}
        className="w-full px-5 py-4 rounded-2xl border-2 border-spark-hairline bg-spark-surface text-[18px] lg:text-[22px] text-spark-ink placeholder:text-spark-ink-35 font-semibold focus:outline-none focus:border-spark-brand transition-colors"
      />
    </StepFrame>
  );
}

function StepTelefone({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <StepFrame
      eyebrow="✦ 02 · pra te chamar"
      icon={<Phone size={28} strokeWidth={2.2} />}
      title="qual seu whatsapp?"
      hint="A gente só usa pra te mandar o convite — sem spam, prometido."
    >
      <input
        autoFocus
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(11) 98765-4321"
        maxLength={20}
        className="w-full px-5 py-4 rounded-2xl border-2 border-spark-hairline bg-spark-surface text-[18px] lg:text-[22px] text-spark-ink placeholder:text-spark-ink-35 font-semibold font-mono focus:outline-none focus:border-spark-brand transition-colors"
      />
    </StepFrame>
  );
}

function StepTiktok({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <StepFrame
      eyebrow="✦ 03 · te achar no tiktok"
      icon={<AtSign size={28} strokeWidth={2.2} />}
      title="qual seu @ no TikTok?"
      hint="A gente dá uma olhada no seu perfil pra entender teu nicho."
    >
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-spark-ink-50 text-[18px] lg:text-[22px] font-bold pointer-events-none">
          @
        </span>
        <input
          autoFocus
          type="text"
          value={value.replace(/^@/, "")}
          onChange={(e) => onChange(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
          placeholder="seuhandle"
          maxLength={60}
          className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-spark-hairline bg-spark-surface text-[18px] lg:text-[22px] text-spark-ink placeholder:text-spark-ink-35 font-semibold focus:outline-none focus:border-spark-brand transition-colors"
        />
      </div>
    </StepFrame>
  );
}

function StepAlreadySelling({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (b: boolean) => void;
}) {
  return (
    <StepFrame
      eyebrow="✦ 04 · status"
      icon={<Sparkles size={28} strokeWidth={2.2} />}
      title="você já vende no TikTok Shop?"
      hint="Sem julgamento — quero te ajudar do ponto onde você tá."
    >
      <div className="grid grid-cols-2 gap-3">
        <ChoiceCard
          active={value === true}
          onClick={() => onChange(true)}
          emoji="✅"
          label="Sim"
          hint="Já tô vendendo"
        />
        <ChoiceCard
          active={value === false}
          onClick={() => onChange(false)}
          emoji="🌱"
          label="Ainda não"
          hint="Quero começar"
        />
      </div>
    </StepFrame>
  );
}

function StepRevenue({
  value,
  onChange,
}: {
  value: RevenueRange | null;
  onChange: (r: RevenueRange) => void;
}) {
  return (
    <StepFrame
      eyebrow="✦ 05 · faturamento"
      icon={<TrendingUp size={28} strokeWidth={2.2} />}
      title="quanto você fatura por mês hoje?"
      hint="Estimativa só pra eu entender teu momento. Ninguém vê isso."
    >
      <div className="grid grid-cols-2 gap-3">
        {REVENUE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            active={value === opt.value}
            onClick={() => onChange(opt.value)}
            emoji={opt.emoji}
            label={opt.label}
          />
        ))}
      </div>
    </StepFrame>
  );
}

// =================================================================
// HELPERS
// =================================================================

function StepFrame({
  eyebrow,
  icon,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ animation: "step-in 380ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
    >
      <div className="mb-5 inline-flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center shadow-rest">
          {icon}
        </div>
        <div className="text-eyebrow text-spark-brand-deep">{eyebrow}</div>
      </div>

      <h2
        className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
        style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}
      >
        {title}
      </h2>

      <p className="mt-3 text-[14px] text-spark-ink-70 leading-relaxed font-semibold max-w-[42ch]">
        {hint}
      </p>

      <div className="mt-8">{children}</div>

      <style jsx>{`
        @keyframes step-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  emoji,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all duration-300 ease-premium",
        active
          ? "bg-spark-brand-soft border-spark-brand shadow-lift-brand -translate-y-0.5"
          : "bg-spark-surface border-spark-hairline hover:border-spark-brand/40 hover:-translate-y-0.5 hover:shadow-lift",
      )}
    >
      <div className="text-[28px] mb-2">{emoji}</div>
      <div className="text-[15px] font-extrabold text-spark-ink tracking-tight">{label}</div>
      {hint && <div className="text-[12px] text-spark-ink-50 mt-1 font-semibold">{hint}</div>}
      {active && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-widest text-spark-brand-deep">
          <Check size={11} strokeWidth={2.5} />
          escolhido
        </div>
      )}
    </button>
  );
}

// =================================================================
// MOCKS PANEL — coluna direita desktop
// =================================================================

function MocksPanel() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      {/* Sticker rotativo grande no fundo */}
      <div className="absolute top-[8%] right-[8%] opacity-90">
        <Sticker text="MÉTODO TTS · PREMIUM · 2026 · " emoji="✨" size={160} />
      </div>

      <div className="absolute bottom-[8%] left-[6%] opacity-80">
        <Sticker text="✦ COMUNIDADE · YARA · " emoji="💕" size={128} />
      </div>

      {/* Mock cards flutuantes */}
      <div className="relative grid gap-4 max-w-[420px] z-10">
        {/* Card mock: streak / rotina */}
        <div
          className="rounded-spark-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white p-6 shadow-hero"
          style={{ animation: "float-card 8s ease-in-out infinite", transform: "rotate(-3deg)" }}
        >
          <div className="text-eyebrow text-white/80">🔥 sequência atual</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-extrabold tracking-tight leading-none text-[64px]">21</span>
            <span className="text-[16px] font-extrabold opacity-90">dias seguidos</span>
          </div>
          <div className="mt-2 text-[12px] opacity-90 font-semibold">
            Você tá voando! 💕
          </div>
        </div>

        {/* Card mock: agente */}
        <div
          className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-lift"
          style={{ animation: "float-card 9s ease-in-out infinite 0.5s", transform: "rotate(2deg)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-grad-soft flex items-center justify-center text-[24px]">
              ✨
            </div>
            <div>
              <div className="text-eyebrow text-spark-brand">✦ agente</div>
              <div className="text-[14px] font-extrabold text-spark-ink mt-0.5 tracking-tight">
                Scripts da semana
              </div>
            </div>
          </div>
          <div className="mt-3 text-[12px] text-spark-ink-70 font-semibold leading-snug">
            5 roteiros prontos pra gravar, no método gancho → desenvolvimento → benefício → CTA.
          </div>
        </div>

        {/* Card mock: ranking */}
        <div
          className="rounded-spark-2xl bg-spark-ink text-white p-5 shadow-lift"
          style={{ animation: "float-card 7s ease-in-out infinite 1s", transform: "rotate(-2deg)" }}
        >
          <div className="text-eyebrow text-white/70">🏆 seu ranking</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-extrabold tracking-tight leading-none text-[42px]">#12</span>
            <span className="text-[12px] opacity-80 font-mono">de 234 criadoras</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-card {
          0%,
          100% {
            transform: var(--rot, none) translateY(0);
          }
          50% {
            transform: var(--rot, none) translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
