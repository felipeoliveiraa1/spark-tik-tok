import Link from "next/link";
import { Send, Sparkle, Package, ArrowRight, ChevronRight, Paperclip, Newspaper } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AgentTile } from "@/components/atoms/agent-tile";
import { SectionHead } from "@/components/atoms/section-head";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { ProgressBar } from "@/components/atoms/progress-bar";
import { SBadge } from "@/components/atoms/s-badge";
import { USER, NEWS, NEWS_CATEGORIES } from "@/lib/mock";
import { type AgentId } from "@/lib/agents";

const shortcuts: { agent: AgentId; t: string; s: string; href: string }[] = [
  { agent: "info", t: "Analisar\nproduto", s: "Sobe a foto", href: "/chat?agent=info" },
  { agent: "viral", t: "Virais da\nsemana", s: "Top 10 BR · USA", href: "/chat?agent=viral" },
  { agent: "script", t: "Criar\nscripts", s: "Hooks com IA", href: "/chat?agent=script" },
  { agent: "help", t: "Tirar\ndúvidas", s: "Suporte da Shop", href: "/chat?agent=help" },
];

const recent = [
  { id: "p1", t: "Hidratante NAC Always Fit", s: "2 conversas · 10 scripts", when: "há 2h", color: "oklch(0.85 0.05 30)" },
  { id: "p2", t: "Massageador facial", s: "5 scripts gerados", when: "ontem", color: "oklch(0.85 0.05 200)" },
  { id: "p3", t: "Esmalte gel UV", s: "1 conversa", when: "3 dias", color: "oklch(0.85 0.05 320)" },
];

function HomeMobile() {
  return (
    <>
      <AppHeader avatarLetter={USER.initial} />
      <div className="flex-1 overflow-auto pb-3">
        <div className="px-4">
          <div className="text-[13px] text-spark-ink-50 font-semibold">Oi, {USER.name} 👋</div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mt-1 mb-4 leading-[1.1]">
            O que vamos
            <br />
            criar hoje?
          </h1>

          <Link
            href="/chat"
            className="block p-[18px] rounded-[22px] relative overflow-hidden text-white bg-brand-grad-hero shadow-[0_20px_40px_-20px_oklch(0.5_0.22_305/0.5)]"
          >
            <div className="flex items-center gap-1.5 opacity-85 text-[11px] font-bold uppercase tracking-[0.08em]">
              <Sparkle size={12} strokeWidth={1.7} /> Nova conversa
            </div>
            <div className="mt-2.5 text-[19px] font-bold tracking-[-0.015em] leading-[1.25]">
              &ldquo;Sobe a foto do produto, eu cuido do resto.&rdquo;
            </div>
            <div className="mt-3.5 flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm text-[13px] font-medium text-white/85">
                Pergunta qualquer coisa…
              </div>
              <div
                className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center"
                style={{ color: "oklch(0.42 0.2 295)" }}
              >
                <Send size={16} strokeWidth={1.7} />
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-[22px]">
          <SectionHead>Atalhos</SectionHead>
          <div className="px-4 grid grid-cols-2 gap-2.5">
            {shortcuts.map((sc) => (
              <Link
                key={sc.agent}
                href={sc.href}
                className="p-3.5 rounded-[18px] bg-spark-surface border border-spark-hairline"
              >
                <AgentTile agent={sc.agent} size={32} />
                <div className="mt-3 text-[14px] font-bold leading-[1.2] whitespace-pre-line">{sc.t}</div>
                <div className="mt-1 text-[11px] text-spark-ink-50">{sc.s}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* News da expert — destaque */}
        <div className="mt-[22px]">
          <SectionHead action={<Link href="/news">Ver tudo</Link>}>News da Aline</SectionHead>
          <div className="px-4">
            <Link
              href={`/news/${NEWS[0].slug}`}
              className="block rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden"
            >
              <div className="relative">
                <PhotoPlaceholder label={NEWS[0].cover} radius={0} height={130} />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <SBadge tone="brand">
                    {NEWS_CATEGORIES[NEWS[0].category].emoji} {NEWS_CATEGORIES[NEWS[0].category].label}
                  </SBadge>
                  {NEWS[0].isNew && <SBadge tone="good">NOVO</SBadge>}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[14px] font-bold leading-[1.3] line-clamp-2">{NEWS[0].title}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-spark-ink-50 font-mono">
                  <span>{NEWS[0].publishedDisplay}</span>
                  <span>·</span>
                  <span>{NEWS[0].readingMinutes}min de leitura</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-[22px]">
          <SectionHead action={<Link href="/produtos">Ver tudo</Link>}>Suas últimas</SectionHead>
          <div className="px-4 flex flex-col gap-2">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/produtos/${r.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-spark-surface border border-spark-hairline"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: r.color }}
                >
                  <Package size={20} strokeWidth={1.7} className="text-spark-ink-70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{r.t}</div>
                  <div className="text-[12px] text-spark-ink-50 mt-0.5 truncate">{r.s}</div>
                </div>
                <div className="text-[11px] text-spark-ink-35 font-mono shrink-0 inline-flex items-center gap-1">
                  {r.when} <ArrowRight size={12} strokeWidth={1.7} />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="h-4" />
      </div>
      <BottomNav active="home" />
    </>
  );
}

const desktopShortcuts: { agent: AgentId; t: string; s: string; href: string }[] = [
  { agent: "info", t: "Analisar um produto", s: "Sobe a foto, recebe ficha completa", href: "/chat?agent=info" },
  { agent: "viral", t: "Virais da semana", s: "Top BR · USA com receita estimada", href: "/chat?agent=viral" },
  { agent: "script", t: "Criar 10 scripts", s: "Hooks com gatilho cerebral", href: "/chat?agent=script" },
  { agent: "help", t: "Tirar uma dúvida", s: "Suporte sobre TikTok Shop", href: "/chat?agent=help" },
];

const desktopRecent = [
  { id: "p1", t: "NAC Always Fit", s: "2 conversas · 10 scripts", when: "há 2h", color: "oklch(0.85 0.05 30)" },
  { id: "p2", t: "Massageador facial", s: "5 scripts", when: "ontem", color: "oklch(0.85 0.05 200)" },
  { id: "p3", t: "Esmalte gel UV", s: "1 conversa", when: "3 dias", color: "oklch(0.85 0.05 320)" },
  { id: "p4", t: "Babyliss profissional", s: "7 scripts", when: "4 dias", color: "oklch(0.85 0.05 80)" },
];

function HomeDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="text-[14px] font-semibold text-spark-brand tracking-[0.04em] uppercase">Painel</div>
      <h1 className="text-[42px] font-extrabold tracking-[-0.025em] mt-1.5 leading-[1.1]">
        Oi {USER.name}, o que vamos criar?
      </h1>

      <Link
        href="/chat"
        className="mt-7 block p-7 rounded-3xl text-white bg-brand-grad-hero relative overflow-hidden shadow-[0_30px_60px_-25px_oklch(0.5_0.22_305/0.5)]"
      >
        <div className="flex items-center gap-1.5 opacity-85 text-[11px] font-bold uppercase tracking-[0.1em]">
          <Sparkle size={12} strokeWidth={1.7} /> Nova conversa
        </div>
        <div className="mt-3.5 text-[28px] font-bold tracking-[-0.02em] max-w-[600px] leading-[1.2]">
          &ldquo;Sobe a foto do produto, eu cuido do resto.&rdquo;
        </div>
        <div className="mt-5 flex items-center gap-2.5">
          <div className="flex-1 px-4.5 py-3.5 rounded-2xl bg-white/20 backdrop-blur text-[14.5px] font-medium text-white/85 flex items-center gap-2.5">
            <Paperclip size={18} strokeWidth={1.7} />
            Pergunta qualquer coisa ou anexa um produto…
            <div className="flex-1" />
            <span className="text-[11px] opacity-70 font-mono">@info @viral @script @help</span>
          </div>
          <div
            className="w-[50px] h-[50px] rounded-2xl bg-white flex items-center justify-center shrink-0"
            style={{ color: "oklch(0.42 0.2 295)" }}
          >
            <Send size={20} strokeWidth={1.7} />
          </div>
        </div>
      </Link>

      <div className="mt-7 grid grid-cols-[2fr_1fr] gap-[18px]">
        <div>
          <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-2.5">
            Atalhos
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {desktopShortcuts.map((sc) => (
              <Link
                key={sc.agent}
                href={sc.href}
                className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline flex items-start gap-3 hover:border-spark-ink/30 transition-colors"
              >
                <AgentTile agent={sc.agent} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold">{sc.t}</div>
                  <div className="text-[12px] text-spark-ink-50 mt-0.5 leading-[1.4]">{sc.s}</div>
                </div>
                <ChevronRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
              </Link>
            ))}
          </div>

          <div className="mt-6 text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-2.5">
            Suas últimas
          </div>
          <div className="rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden">
            {desktopRecent.map((r, i) => (
              <Link
                key={r.id}
                href={`/produtos/${r.id}`}
                className={`px-4 py-3 flex items-center gap-3 hover:bg-spark-surface-sunken transition-colors ${i < desktopRecent.length - 1 ? "border-b border-spark-hairline" : ""}`}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                  style={{ background: r.color }}
                >
                  <Package size={18} strokeWidth={1.7} className="text-spark-ink-70" />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold">{r.t}</div>
                  <div className="text-[11.5px] text-spark-ink-50 mt-0.5">{r.s}</div>
                </div>
                <div className="text-[11px] text-spark-ink-35 font-mono">{r.when}</div>
                <ChevronRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-3.5">
          <div className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">
                Uso de maio
              </div>
              <Link href="/conta/uso" className="text-[11px] text-spark-brand font-semibold">
                Detalhes
              </Link>
            </div>
            {[
              { l: "Buscas Vyral", v: 18, max: 30, tone: "brand" as const },
              { l: "Scripts", v: 32, max: 50, tone: "warn" as const },
            ].map((u) => (
              <div key={u.l} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1.5 text-[12px]">
                  <span className="font-semibold">{u.l}</span>
                  <span className="font-mono text-spark-ink-50">
                    {u.v}/{u.max}
                  </span>
                </div>
                <ProgressBar value={u.v} max={u.max} tone={u.tone} />
              </div>
            ))}
            <div className="mt-2 px-3 py-2.5 rounded-xl bg-brand-grad-soft text-spark-brand-deep text-[12px] font-bold flex items-center gap-2">
              <Sparkle size={14} strokeWidth={1.7} /> Quer mais? Faz upgrade pro Premium
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline">
            <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase mb-2.5">
              Top viral hoje
            </div>
            <PhotoPlaceholder height={130} radius={12} label="" />
            <div className="mt-2.5 text-[13px] font-bold">
              &ldquo;comprei achando que era furada…&rdquo;
            </div>
            <div className="mt-1 text-[11px] text-spark-ink-50 font-mono">
              2.3M views · R$ 45k receita
            </div>
          </div>

          <Link
            href="/news"
            className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors block"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase inline-flex items-center gap-1.5">
                <Newspaper size={12} strokeWidth={1.7} /> News da Aline
              </div>
              {NEWS.filter((n) => n.isNew).length > 0 && (
                <SBadge tone="good">{NEWS.filter((n) => n.isNew).length} NOVOS</SBadge>
              )}
            </div>
            <div className="text-[13px] font-bold leading-[1.3] line-clamp-2">{NEWS[0].title}</div>
            <div className="mt-1.5 text-[11px] text-spark-ink-50 font-mono">
              {NEWS[0].publishedDisplay} · {NEWS[0].readingMinutes}min
            </div>
            <div className="mt-2.5 text-[11px] font-semibold text-spark-brand inline-flex items-center gap-1">
              Abrir jornal <ArrowRight size={11} strokeWidth={2} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <ResponsiveShell mobile={<HomeMobile />} desktop={<HomeDesktop />} active="home" />;
}
