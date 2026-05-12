import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Pen, Copy, Upload, ChevronRight, Sparkle, Send, Paperclip, Package, Flame } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { ChatInputBar } from "@/components/layout/chat-input-bar";
import { UserBubble } from "@/components/molecules/user-bubble";
import { AgentBubble } from "@/components/molecules/agent-bubble";
import { SuggestChips } from "@/components/molecules/suggest-chips";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { SBadge } from "@/components/atoms/s-badge";
import { SButton } from "@/components/atoms/s-button";
import { AgentTile } from "@/components/atoms/agent-tile";
import { type AgentId } from "@/lib/agents";

function ChatStream() {
  return (
    <>
      <UserBubble attachment="nac-product.jpg · 2.1 MB">quero criar scripts pro NAC Always Fit</UserBubble>

      <AgentBubble agent="info">Analisei o produto. Olha a ficha resumida:</AgentBubble>

      <div className="px-4 mb-3.5">
        <div className="rounded-[18px] overflow-hidden border border-spark-hairline bg-spark-surface">
          <div className="flex gap-3 p-3 items-start">
            <PhotoPlaceholder height={72} radius={12} label="nac" className="w-[72px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold">NAC Always Fit</div>
              <div className="text-[11.5px] text-spark-ink-50 mt-0.5">Suplemento · Saúde</div>
              <div className="mt-1.5 flex gap-1 flex-wrap">
                <SBadge tone="brand">Mulheres 25–45</SBadge>
                <SBadge>R$ 89–149</SBadge>
              </div>
            </div>
          </div>
          <div className="p-2.5 px-3.5 border-t border-spark-hairline flex gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">Dor</div>
              <div className="text-[12.5px] text-spark-ink mt-0.5 leading-[1.35]">
                Cansaço, falta de foco, pele opaca
              </div>
            </div>
            <div className="w-px bg-spark-hairline" />
            <div className="flex-1">
              <div className="text-[10px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">Forte</div>
              <div className="text-[12.5px] text-spark-ink mt-0.5 leading-[1.35]">
                Antioxidante, ANVISA, diário
              </div>
            </div>
          </div>
          <Link
            href="/produtos/nac-always-fit"
            className="block p-2.5 bg-spark-surface-sunken text-[12px] font-semibold text-spark-ink-70 text-center"
          >
            Ver ficha completa →
          </Link>
        </div>
      </div>

      <AgentBubble agent="info">Quer que eu busque os virais desse produto?</AgentBubble>
      <SuggestChips items={["Sim, busca virais", "Pular pra scripts", "Ver concorrentes"]} />

      <UserBubble>sim, busca os virais</UserBubble>

      <AgentBubble agent="viral">Encontrei 8 vídeos bombando esse mês. Top 3:</AgentBubble>

      <div className="overflow-x-auto no-scrollbar px-4 pb-3.5">
        <div className="flex gap-2.5 lg:grid lg:grid-cols-3 lg:gap-3">
          {[
            { v: "2.3M", r: "R$ 45k", q: "isso aqui mudou minha vida em 7 dias" },
            { v: "890k", r: "R$ 18k", q: "minha mãe não acreditou quando contei" },
            { v: "1.2M", r: "R$ 22k", q: "gastei R$ 99 e foi a melhor compra do ano" },
          ].map((c, i) => (
            <div
              key={i}
              className="w-[168px] lg:w-auto shrink-0 rounded-2xl overflow-hidden bg-spark-surface border border-spark-hairline"
            >
              <div className="relative">
                <PhotoPlaceholder height={196} radius={0} label="" />
                <div className="absolute top-2 left-2 px-1.5 py-[3px] rounded-md bg-black/60 text-white text-[10px] font-bold font-mono">
                  {c.v}
                </div>
                <div className="absolute bottom-2 left-2 px-1.5 py-[3px] rounded-md text-white text-[10px] font-bold" style={{ background: "oklch(0.62 0.16 150)" }}>
                  {c.r}
                </div>
              </div>
              <div className="p-2.5 text-[11.5px] leading-[1.35] text-spark-ink-70 italic">
                &ldquo;{c.q}…&rdquo;
              </div>
            </div>
          ))}
        </div>
      </div>

      <SuggestChips items={["Criar 10 scripts agora", "Ver mais virais", "Quero outro produto"]} />

      <UserBubble>cria 10 hooks com base nos virais</UserBubble>

      <AgentBubble agent="script">Tá pronto. 10 hooks com gatilho cerebral identificado:</AgentBubble>

      <div className="px-4 mb-3.5">
        <div className="rounded-[18px] border border-spark-hairline bg-spark-surface overflow-hidden">
          <div className="p-3 border-b border-spark-hairline flex items-center gap-2">
            <Pen size={16} strokeWidth={1.7} className="text-agent-script-fg" />
            <div className="text-[13px] font-bold flex-1">10 hooks · NAC Always Fit</div>
            <div className="text-[11px] text-spark-ink-50 font-mono">v1</div>
          </div>
          {[
            { n: 1, h: "\"Você já reparou que sua tia que toma 3 chás por dia tem mais energia?\"", t: "Identificação" },
            { n: 2, h: "\"Gastei R$ 89 e hoje ninguém me acredita que sou mãe de 3.\"", t: "Prova social" },
            { n: 3, h: "\"Se você tem mais de 30 e acorda cansada, esse vídeo é pra você.\"", t: "Curiosidade" },
          ].map((row, i) => (
            <div
              key={i}
              className={`p-3 flex gap-2.5 ${i < 2 ? "border-b border-spark-hairline" : ""}`}
            >
              <div className="w-[22px] h-[22px] rounded-md shrink-0 bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center text-[11px] font-bold font-mono">
                {row.n}
              </div>
              <div className="flex-1">
                <div className="text-[13px] leading-[1.4]">{row.h}</div>
                <div className="mt-1.5 flex gap-1.5">
                  <SBadge tone="brand">{row.t}</SBadge>
                  <SBadge tone="good">🔥 alto</SBadge>
                </div>
              </div>
            </div>
          ))}
          <div className="p-3 bg-spark-surface-sunken flex gap-2 items-center">
            <SButton size="sm" variant="ghost" Icon={Copy}>
              Copiar tudo
            </SButton>
            <SButton size="sm" variant="ghost" Icon={Upload}>
              Exportar
            </SButton>
            <div className="flex-1" />
            <Link
              href="/scripts/nac-always-fit"
              className="text-[11px] text-spark-ink-50 font-mono hover:text-spark-ink transition-colors"
            >
              + 7 hooks
            </Link>
          </div>
        </div>
      </div>

      <SuggestChips items={["Gerar mais 10", "Variação humor", "Variação medo"]} />
    </>
  );
}

function ChatMobile() {
  return (
    <>
      <div className="pt-14 pl-3 pr-3 pb-2.5 flex items-center gap-1.5 border-b border-spark-hairline">
        <Link href="/chat" className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold truncate">NAC Always Fit</div>
          <div className="text-[11px] text-spark-ink-50 font-mono">Auto · 4 agentes ativos</div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex-1 overflow-auto pt-4 pb-2">
        <ChatStream />
      </div>

      <ChatInputBar />
    </>
  );
}

const desktopArtifacts: { Icon: typeof Package; title: string; sub: string; agent: AgentId }[] = [
  { Icon: Package, title: "NAC Always Fit", sub: "Ficha de produto", agent: "info" },
  { Icon: Flame, title: "8 virais salvos", sub: "Carousel", agent: "viral" },
  { Icon: Pen, title: "10 hooks v1", sub: "Tabela completa", agent: "script" },
];

const nextSteps = ["Gerar variação humor", "Criar versão 30s", "Buscar virais USA"];

function ChatDesktop() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-3.5 border-b border-spark-hairline flex items-center gap-2.5">
        <div>
          <div className="text-[14px] font-bold">NAC Always Fit · scripts</div>
          <div className="text-[11px] text-spark-ink-50 font-mono">
            Auto · 4 agentes ativos · iniciada há 38min
          </div>
        </div>
        <div className="flex-1" />
        <SButton size="sm" variant="ghost" Icon={Upload}>
          Exportar
        </SButton>
        <SButton size="sm" variant="ghost" Icon={MoreHorizontal} />
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto py-5">
          <div className="max-w-[760px] mx-auto px-4">
            <ChatStream />

            <div className="mt-5 p-3.5 rounded-2xl bg-spark-surface border border-spark-hairline">
              <div className="flex gap-2.5 items-start">
                <Paperclip size={18} strokeWidth={1.7} className="text-spark-ink-50 mt-1" />
                <div className="flex-1 text-[14px] text-spark-ink-50 py-1">cria 10 variações com humor</div>
                <div className="w-[38px] h-[38px] rounded-[10px] text-white flex items-center justify-center bg-brand-grad shrink-0">
                  <Send size={16} strokeWidth={1.7} />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5 text-[11px] text-spark-ink-50">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-spark-surface-sunken">
                  <Sparkle size={11} strokeWidth={1.7} /> Auto
                </span>
                <span className="font-mono">@ pra escolher agente · ⏎ enviar</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-[360px] border-l border-spark-hairline p-4.5 bg-spark-surface-elev overflow-auto">
          <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
            Artefatos da conversa
          </div>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {desktopArtifacts.map((a) => (
              <button
                key={a.title}
                className="p-3 rounded-xl bg-spark-surface border border-spark-hairline flex items-center gap-2.5 text-left hover:border-spark-ink/30 transition-colors"
              >
                <AgentTile agent={a.agent} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{a.title}</div>
                  <div className="text-[11px] text-spark-ink-50">{a.sub}</div>
                </div>
                <ChevronRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
              </button>
            ))}
          </div>

          <div className="mt-6 text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
            Próximos passos
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {nextSteps.map((t) => (
              <button
                key={t}
                className="px-3 py-2.5 rounded-[10px] bg-spark-surface border border-spark-hairline text-[13px] font-semibold flex items-center justify-between hover:border-spark-ink/30 transition-colors"
              >
                {t}
                <ChevronRight size={13} strokeWidth={1.7} className="text-spark-ink-35" />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ResponsiveShell mobile={<ChatMobile />} desktop={<ChatDesktop />} active="chat" />;
}
