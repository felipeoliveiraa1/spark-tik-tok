"use client";

import * as React from "react";
import Link from "next/link";
import {
  Save,
  Minus,
  Plus,
  Check,
  ChevronDown,
  Flame,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";
import {
  type CheckinRow,
  type Mood,
  MOOD_OPTIONS,
  TTS_GOALS,
  calcAdherence,
  emptyCheckin,
  todayBrazil,
} from "@/lib/checkin-config";

/**
 * /rotina/hoje — Check-in diário da aluna.
 *
 * Sections em accordion (3 abertas + 2 fechadas por default):
 *   ☀️ Trabalho       — contadores de vídeos + 4 toggles
 *   💕 Autocuidado    — 5 toggles
 *   📊 Resultados     — 3 KPIs numéricos (colapsada)
 *   🌷 Reflexão       — mood + energia + nota
 *
 * Carrega o check-in de hoje (se existir) e faz UPSERT no save.
 * Mostra % aderência TTS em tempo real no header.
 */

function useTodayCheckin(): {
  checkin: CheckinRow | null;
  loading: boolean;
  setCheckin: React.Dispatch<React.SetStateAction<CheckinRow | null>>;
} {
  const [checkin, setCheckin] = React.useState<CheckinRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const today = todayBrazil();
    fetch(`/api/checkins?date=${today}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { checkin: CheckinRow | null } | null) => {
        setCheckin(data?.checkin ?? emptyCheckin(today));
      })
      .catch(() => setCheckin(emptyCheckin(today)))
      .finally(() => setLoading(false));
  }, []);
  return { checkin, loading, setCheckin };
}

// =================================================================
// Sub-componentes
// =================================================================

function SectionHeader({
  emoji,
  title,
  hint,
  open,
  onToggle,
  badge,
}: {
  emoji: string;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className="text-[24px] leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-extrabold text-spark-ink tracking-tight">{title}</div>
        {hint && (
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5 leading-snug">{hint}</div>
        )}
      </div>
      {badge && (
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-spark-brand-soft text-spark-brand-deep">
          {badge}
        </span>
      )}
      <ChevronDown
        size={16}
        strokeWidth={2.2}
        className={cn(
          "text-spark-ink-50 transition-transform duration-200 shrink-0",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

function Stepper({
  label,
  emoji,
  value,
  goal,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number;
  goal: number;
  onChange: (v: number) => void;
}) {
  const reached = value >= goal;
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5 transition-colors",
        reached
          ? "bg-good/10 border-good/30"
          : "bg-spark-surface-sunken/40 border-spark-hairline",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[18px]">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold text-spark-ink">{label}</div>
          <div className="text-[11px] text-spark-ink-50">
            Meta TTS: <strong>{goal}</strong>
          </div>
        </div>
        {reached && (
          <span className="text-[10.5px] font-extrabold text-good uppercase tracking-wider">
            ✓ Bateu
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="Diminuir"
          className="w-11 h-11 rounded-xl bg-white border border-spark-hairline flex items-center justify-center text-spark-ink active:scale-95 transition-transform disabled:opacity-40"
          disabled={value <= 0}
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center">
          <span
            className={cn(
              "font-extrabold tracking-tight text-[26px]",
              reached ? "text-good" : "text-spark-ink",
            )}
          >
            {value}
          </span>
          <span className="text-spark-ink-50 text-[15px] font-bold">/{goal}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label="Aumentar"
          className="w-11 h-11 rounded-xl bg-white border border-spark-hairline flex items-center justify-center text-spark-ink active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ToggleCard({
  emoji,
  label,
  hint,
  checked,
  onToggle,
}: {
  emoji: string;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "w-full text-left rounded-2xl border p-3.5 flex items-center gap-3 transition-all active:scale-[0.98]",
        checked
          ? "bg-good/10 border-good/40"
          : "bg-spark-surface-sunken/40 border-spark-hairline hover:border-spark-brand/30",
      )}
    >
      <span className="text-[22px] shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight">{label}</div>
        {hint && (
          <div className="text-[11px] text-spark-ink-50 mt-0.5 leading-snug">{hint}</div>
        )}
      </div>
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          checked ? "bg-good text-white" : "bg-white border border-spark-hairline",
        )}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </div>
    </button>
  );
}

function NumberInput({
  label,
  emoji,
  placeholder,
  prefix,
  suffix,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [local, setLocal] = React.useState(value != null ? String(value) : "");
  React.useEffect(() => {
    setLocal(value != null ? String(value) : "");
  }, [value]);
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-spark-ink mb-1.5">
        <span className="text-[15px]">{emoji}</span>
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-[14px] text-spark-ink-50 font-bold pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={local}
          onChange={(e) => {
            const v = e.target.value.replace(",", ".");
            setLocal(e.target.value);
            if (v === "") {
              onChange(null);
            } else {
              const n = parseFloat(v);
              if (Number.isFinite(n) && n >= 0) onChange(n);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand",
            prefix ? "pl-10" : "pl-3.5",
            suffix ? "pr-12" : "pr-3.5",
          )}
        />
        {suffix && (
          <span className="absolute right-3.5 text-[12px] text-spark-ink-50 font-bold pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (v: Mood | null) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOOD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? null : opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-2xl border p-2 flex flex-col items-center gap-1 transition-all active:scale-95",
              active
                ? "bg-spark-brand-soft border-spark-brand shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.4)]"
                : "bg-spark-surface-sunken/40 border-spark-hairline hover:border-spark-brand/30",
            )}
          >
            <span className={cn("text-[28px] transition-transform", active && "scale-110")}>
              {opt.emoji}
            </span>
            <span className="text-[10px] font-bold text-spark-ink-70">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function EnergySlider({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-spark-ink mb-2">
        ⚡ Energia do dia
      </label>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? null : n)}
              aria-pressed={active}
              className={cn(
                "py-2.5 rounded-xl border text-[13px] font-extrabold transition-all active:scale-95",
                active
                  ? "bg-brand-grad text-white border-spark-brand"
                  : "bg-spark-surface-sunken/40 border-spark-hairline text-spark-ink-50 hover:text-spark-ink",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// Body principal
// =================================================================

type SectionState = {
  trabalho: boolean;
  pessoal: boolean;
  resultados: boolean;
  reflexao: boolean;
};

function RotinaHojeBody({ desktop = false }: { desktop?: boolean }) {
  const toast = useToast();
  const { checkin, loading, setCheckin } = useTodayCheckin();
  const [saving, setSaving] = React.useState(false);
  const [sections, setSections] = React.useState<SectionState>({
    trabalho: true,
    pessoal: true,
    resultados: false,
    reflexao: true,
  });

  const update = React.useCallback(
    <K extends keyof CheckinRow>(key: K, value: CheckinRow[K]) => {
      setCheckin((c) => (c ? { ...c, [key]: value } : c));
    },
    [setCheckin],
  );

  const adherence = React.useMemo(
    () => (checkin ? calcAdherence(checkin) : 0),
    [checkin],
  );

  // Conta atividades marcadas pra mostrar no botão de save
  const completedCount = React.useMemo(() => {
    if (!checkin) return 0;
    let n = 0;
    if (checkin.videos_posted >= TTS_GOALS.videos_posted) n += 1;
    if (checkin.videos_recorded >= TTS_GOALS.videos_recorded) n += 1;
    if (checkin.live_chat_done) n += 1;
    if (checkin.live_shop_done) n += 1;
    if (checkin.analytics_done) n += 1;
    if (checkin.comms_done) n += 1;
    if (checkin.skincare_morning) n += 1;
    if (checkin.skincare_night) n += 1;
    if (checkin.supplementation) n += 1;
    if (checkin.gym) n += 1;
    if (checkin.sleep_hygiene) n += 1;
    return n;
  }, [checkin]);

  const handleSave = async () => {
    if (!checkin) return;
    setSaving(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(checkin),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        checkin?: CheckinRow;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Não consegui salvar agora.");
        return;
      }
      if (data.checkin) setCheckin(data.checkin);
      const adh = data.checkin ? calcAdherence(data.checkin) : 0;
      toast.success(`Check-in salvo! ${adh}% da rotina TTS hoje 💕`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !checkin) {
    return <LoadingSplash message="Carregando seu dia" />;
  }

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-28"}`}>
      <div className={desktop ? "max-w-[680px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              📊 Check-in de Hoje
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Como foi seu dia? ✨
            </h1>
          </>
        )}

        {/* HEADER COM % ADERÊNCIA + ATALHOS */}
        <div className="rounded-3xl bg-brand-grad-hero text-white p-5 overflow-hidden relative shadow-[0_12px_32px_-16px_oklch(0.55_0.24_340/0.45)] mb-5">
          <div
            aria-hidden
            className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl pointer-events-none"
          />
          <div className="relative flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(adherence / 100) * 276.46} 276.46`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[22px] font-extrabold">{adherence}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
                Rotina TTS hoje
              </div>
              <div className="mt-1 text-[16px] font-extrabold leading-tight">
                {adherence >= 80
                  ? "Tá voando! 🚀"
                  : adherence >= 50
                    ? "Tá rolando bem 💕"
                    : adherence > 0
                      ? "Bora dar gás ✨"
                      : "Marca o que já fez 👇"}
              </div>
              <div className="mt-1 text-[12px] opacity-90">
                {completedCount} de 11 itens completos
              </div>
            </div>
          </div>
        </div>

        {/* ATALHOS PRA OUTRAS SUB-ROTAS */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <Link
            href="/rotina/evolucao"
            className="rounded-2xl bg-spark-surface border border-spark-hairline p-3 flex items-center gap-2.5 hover:border-spark-brand/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
              <TrendingUp size={16} strokeWidth={2} />
            </div>
            <div className="text-[12px] font-extrabold leading-tight">
              Evolução
              <div className="text-[10.5px] font-semibold text-spark-ink-50 mt-0.5">
                KPIs + gráficos
              </div>
            </div>
          </Link>
          <Link
            href="/rotina/referencia"
            className="rounded-2xl bg-spark-surface border border-spark-hairline p-3 flex items-center gap-2.5 hover:border-spark-brand/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
              <BookOpen size={16} strokeWidth={2} />
            </div>
            <div className="text-[12px] font-extrabold leading-tight">
              Rotina TTS
              <div className="text-[10.5px] font-semibold text-spark-ink-50 mt-0.5">
                Dia ideal completo
              </div>
            </div>
          </Link>
        </div>

        {/* SEÇÕES */}
        <div className="space-y-3">
          {/* TRABALHO */}
          <section className="rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden">
            <SectionHeader
              emoji="☀️"
              title="Trabalho"
              hint="Vídeos, lives, análise, comunicação"
              open={sections.trabalho}
              onToggle={() => setSections((s) => ({ ...s, trabalho: !s.trabalho }))}
            />
            {sections.trabalho && (
              <div className="px-4 pb-4 space-y-2.5">
                <Stepper
                  label="Vídeos postados"
                  emoji="📱"
                  value={checkin.videos_posted}
                  goal={TTS_GOALS.videos_posted}
                  onChange={(v) => update("videos_posted", v)}
                />
                <Stepper
                  label="Vídeos gravados (lote)"
                  emoji="🎬"
                  value={checkin.videos_recorded}
                  goal={TTS_GOALS.videos_recorded}
                  onChange={(v) => update("videos_recorded", v)}
                />
                <ToggleCard
                  emoji="🔴"
                  label="Live Bate-papo (manhã)"
                  hint="Conexão com a comunidade no café"
                  checked={checkin.live_chat_done}
                  onToggle={() => update("live_chat_done", !checkin.live_chat_done)}
                />
                <ToggleCard
                  emoji="🛍️"
                  label="Live Shop (noite)"
                  hint="Vendas em tempo real"
                  checked={checkin.live_shop_done}
                  onToggle={() => update("live_shop_done", !checkin.live_shop_done)}
                />
                <ToggleCard
                  emoji="📊"
                  label="Análise de métricas"
                  hint="Retenção, ganchos, faturamento"
                  checked={checkin.analytics_done}
                  onToggle={() => update("analytics_done", !checkin.analytics_done)}
                />
                <ToggleCard
                  emoji="💬"
                  label="Lote de comunicação"
                  hint="Comentários, WhatsApp, e-mail"
                  checked={checkin.comms_done}
                  onToggle={() => update("comms_done", !checkin.comms_done)}
                />
              </div>
            )}
          </section>

          {/* PESSOAL */}
          <section className="rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden">
            <SectionHeader
              emoji="💕"
              title="Autocuidado"
              hint="Skincare, suplementos, academia, sono"
              open={sections.pessoal}
              onToggle={() => setSections((s) => ({ ...s, pessoal: !s.pessoal }))}
            />
            {sections.pessoal && (
              <div className="px-4 pb-4 space-y-2.5">
                <ToggleCard
                  emoji="☀️"
                  label="Skincare manhã"
                  checked={checkin.skincare_morning}
                  onToggle={() => update("skincare_morning", !checkin.skincare_morning)}
                />
                <ToggleCard
                  emoji="🌙"
                  label="Skincare noite"
                  checked={checkin.skincare_night}
                  onToggle={() => update("skincare_night", !checkin.skincare_night)}
                />
                <ToggleCard
                  emoji="💊"
                  label="Suplementação"
                  checked={checkin.supplementation}
                  onToggle={() => update("supplementation", !checkin.supplementation)}
                />
                <ToggleCard
                  emoji="🏋️"
                  label="Academia"
                  checked={checkin.gym}
                  onToggle={() => update("gym", !checkin.gym)}
                />
                <ToggleCard
                  emoji="🛌"
                  label="Higiene do sono"
                  hint="Sem tela depois das 22h"
                  checked={checkin.sleep_hygiene}
                  onToggle={() => update("sleep_hygiene", !checkin.sleep_hygiene)}
                />
              </div>
            )}
          </section>

          {/* RESULTADOS */}
          <section className="rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden">
            <SectionHeader
              emoji="📊"
              title="Resultados do dia"
              hint="3 números (opcional)"
              open={sections.resultados}
              onToggle={() => setSections((s) => ({ ...s, resultados: !s.resultados }))}
            />
            {sections.resultados && (
              <div className="px-4 pb-4 space-y-3">
                <NumberInput
                  label="Vendas (Live Shop + dia)"
                  emoji="💰"
                  placeholder="0,00"
                  prefix="R$"
                  value={checkin.sales_brl}
                  onChange={(v) => update("sales_brl", v)}
                />
                <NumberInput
                  label="Comissão estimada"
                  emoji="💵"
                  placeholder="0,00"
                  prefix="R$"
                  value={checkin.commission_brl}
                  onChange={(v) => update("commission_brl", v)}
                />
                <NumberInput
                  label="Views totais"
                  emoji="👀"
                  placeholder="0"
                  value={checkin.total_views}
                  onChange={(v) => update("total_views", v == null ? null : Math.round(v))}
                />
              </div>
            )}
          </section>

          {/* REFLEXÃO */}
          <section className="rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden">
            <SectionHeader
              emoji="🌷"
              title="Como você se sentiu hoje?"
              open={sections.reflexao}
              onToggle={() => setSections((s) => ({ ...s, reflexao: !s.reflexao }))}
            />
            {sections.reflexao && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-spark-ink mb-2">
                    😊 Humor
                  </label>
                  <MoodPicker
                    value={checkin.mood}
                    onChange={(v) => update("mood", v)}
                  />
                </div>
                <EnergySlider
                  value={checkin.energy_level}
                  onChange={(v) => update("energy_level", v)}
                />
                <div>
                  <label className="block text-[12.5px] font-bold text-spark-ink mb-1.5">
                    📝 Nota livre (opcional)
                  </label>
                  <textarea
                    value={checkin.notes ?? ""}
                    onChange={(e) => update("notes", e.target.value.slice(0, 500))}
                    placeholder="O que você quer lembrar desse dia?"
                    rows={3}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* SAVE BAR */}
        <div
          className={cn(
            desktop
              ? "mt-8"
              : "mt-6 fixed bottom-0 inset-x-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+88px)] bg-white/95 backdrop-blur border-t border-spark-hairline z-10",
          )}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-grad text-white text-[15px] font-extrabold shadow-[0_8px_24px_-12px_oklch(0.55_0.24_340/0.5)] active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
          >
            <Save size={16} strokeWidth={2.2} />
            {saving ? "Salvando..." : "Salvar check-in ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Page
// =================================================================

function RotinaHojeMobile() {
  return (
    <>
      <MobileHeader title="Check-in de Hoje 🌷" back={{ href: "/" }} />
      <RotinaHojeBody />
      <BottomNav active="rotina" />
    </>
  );
}

function RotinaHojeDesktop() {
  return <RotinaHojeBody desktop />;
}

export default function RotinaHojePage() {
  return (
    <ResponsiveShell
      mobile={<RotinaHojeMobile />}
      desktop={<RotinaHojeDesktop />}
      active="rotina"
    />
  );
}

// Suprime warning de Flame não usado — preserva import pro futuro streak inline
void Flame;
