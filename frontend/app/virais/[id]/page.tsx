import Link from "next/link";
import { ArrowLeft, Upload, Play, Eye, Heart, MessageCircle, DollarSign, ChevronRight, Pen, ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SectionHead } from "@/components/atoms/section-head";
import { SButton } from "@/components/atoms/s-button";

const metrics = [
  { Icon: Eye, v: "2.3M", l: "views", color: "oklch(0.18 0.02 285)" },
  { Icon: Heart, v: "187k", l: "likes", color: "oklch(0.18 0.02 285)" },
  { Icon: MessageCircle, v: "4.2k", l: "comments", color: "oklch(0.18 0.02 285)" },
  { Icon: DollarSign, v: "R$45k", l: "receita", color: "oklch(0.62 0.16 150)" },
];

const structure = [
  { i: "🎯", label: "Hook", t: "0–3s", body: "\"isso aqui mudou minha vida em 7 dias…\"", color: "oklch(0.6 0.22 25)" },
  { i: "⚠️", label: "Problema", t: "3–8s", body: "Mostra o cansaço, pele opaca, falta de energia.", color: "oklch(0.6 0.18 60)" },
  { i: "💡", label: "Solução", t: "8–18s", body: "Apresenta o produto como descoberta. \"uma amiga me passou.\"", color: "oklch(0.62 0.16 150)" },
  { i: "📢", label: "CTA", t: "18–22s", body: "\"tá no link aí em cima, corre que tem pouquinho.\"", color: "oklch(0.55 0.22 305)" },
];

const transcript =
  "Gente, isso aqui mudou minha vida em 7 dias e eu não tô brincando. Eu tava acordando arrasada, sem energia, com a pele opaca…";

const transcriptFull =
  "Gente, isso aqui mudou minha vida em 7 dias e eu não tô brincando. Eu tava acordando arrasada, sem energia, com a pele opaca, sem vontade de fazer nada. Aí uma amiga me passou esse frasco aqui e falou pra eu testar 7 dias. No quarto dia eu já tava acordando bem, no sétimo eu fui pra academia 6h da manhã. Tá no link aí em cima, corre que tem pouquinho…";

const similarVirals = [
  { v: "890k", q: "minha mãe não acreditou…", who: "@dramaequeen" },
  { v: "1.2M", q: "gastei R$ 99 e foi a melhor…", who: "@laurinhabh" },
  { v: "2.1M", q: "comprei achando que era furada", who: "@beautyhacks" },
];

function PlayerCard() {
  return (
    <div className="relative rounded-[18px] overflow-hidden" style={{ background: "#0E0E12" }}>
      <div
        className="relative"
        style={{
          aspectRatio: "9/16",
          background: "linear-gradient(180deg, oklch(0.35 0.05 290), oklch(0.2 0.04 320))",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
            <Play size={26} strokeWidth={1.7} fill="currentColor" />
          </div>
        </div>
        <div className="absolute left-3.5 right-3.5 bottom-3.5 text-white">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20" />
            <div>
              <div className="text-[13px] font-bold">@fitmari</div>
              <div className="text-[10.5px] opacity-70 font-mono">postado em 02/05</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViralMobile() {
  return (
    <>
      <div className="pt-14 px-3 pb-2 flex items-center justify-between">
        <Link
          href="/virais"
          className="w-9 h-9 rounded-full bg-white/85 backdrop-blur text-spark-ink flex items-center justify-center"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold">Dissecação do viral</div>
        <button className="w-9 h-9 rounded-full bg-white/85 backdrop-blur text-spark-ink flex items-center justify-center">
          <Upload size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex-1 overflow-auto pb-[90px]">
        <div className="px-4">
          <PlayerCard />

          <div className="mt-3.5 p-3 rounded-2xl bg-spark-surface border border-spark-hairline grid grid-cols-4 gap-2">
            {metrics.map((m) => (
              <div key={m.l} className="text-center">
                <m.Icon size={16} strokeWidth={1.7} className="mx-auto mb-1" style={{ color: m.color }} />
                <div className="text-[13px] font-extrabold font-mono" style={{ color: m.color }}>
                  {m.v}
                </div>
                <div className="text-[9.5px] text-spark-ink-50 uppercase tracking-[0.06em] mt-0.5">
                  {m.l}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[22px]">
            <SectionHead className="px-0">Estrutura do vídeo</SectionHead>
          </div>
          <div className="flex flex-col gap-2">
            {structure.map((s) => (
              <div key={s.label} className="p-3 rounded-[14px] bg-spark-surface border border-spark-hairline">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="text-base">{s.i}</div>
                  <div className="text-[13px] font-extrabold" style={{ color: s.color }}>
                    {s.label}
                  </div>
                  <div className="flex-1" />
                  <div className="text-[11px] text-spark-ink-50 font-mono">{s.t}</div>
                </div>
                <div className="text-[13.5px] leading-[1.45] text-spark-ink italic">{s.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-[22px]">
            <SectionHead className="px-0">Transcrição</SectionHead>
          </div>
          <div className="p-3 rounded-[14px] bg-spark-surface-sunken text-[13px] leading-[1.55] text-spark-ink-70">
            <p className="m-0">&ldquo;{transcript}&rdquo;</p>
            <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-spark-brand">
              Ler completo <ChevronRight size={11} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-[22px] border-t border-spark-hairline bg-white/95 backdrop-blur">
        <SButton variant="primary" size="md" full Icon={Pen} IconRight={ArrowRight}>
          Criar script inspirado nesse
        </SButton>
      </div>
    </>
  );
}

function ViralDesktop() {
  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 overflow-auto p-7">
        <Link href="/virais" className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors">
          <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pros virais
        </Link>

        <div className="mt-4 flex gap-6">
          <div className="w-[280px] shrink-0">
            <PlayerCard />
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-spark-ink-50 font-mono">
              🇧🇷 BR · postado 02/05 · 6 dias
            </div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mt-1.5 leading-[1.15]">
              &ldquo;Isso aqui mudou minha vida em 7 dias…&rdquo;
            </h1>
            <div className="mt-1.5 text-[14px] text-spark-ink-50">@fitmari · NAC Always Fit</div>

            <div className="mt-4 p-3.5 rounded-[14px] bg-spark-surface border border-spark-hairline grid grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div key={m.l}>
                  <m.Icon size={14} strokeWidth={1.7} style={{ color: m.color }} />
                  <div
                    className="text-[18px] font-extrabold font-mono mt-1 tracking-[-0.01em]"
                    style={{ color: m.color }}
                  >
                    {m.v}
                  </div>
                  <div className="text-[10.5px] text-spark-ink-50 uppercase tracking-[0.06em]">
                    {m.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
              Estrutura
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {structure.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-spark-surface border border-spark-hairline"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{s.i}</span>
                    <span className="text-[12px] font-extrabold" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <div className="flex-1" />
                    <span className="text-[10.5px] text-spark-ink-50 font-mono">{s.t}</span>
                  </div>
                  <div className="text-[12.5px] text-spark-ink-70 leading-[1.4] italic">{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
            Transcrição completa
          </div>
          <div className="mt-2 p-4 rounded-[14px] bg-spark-surface-sunken text-[13.5px] leading-[1.6] text-spark-ink-70">
            &ldquo;{transcriptFull}&rdquo;
          </div>
        </div>
      </div>

      <aside className="w-[340px] border-l border-spark-hairline p-4.5 bg-spark-surface-elev overflow-auto flex flex-col gap-3">
        <SButton variant="primary" full Icon={Pen} IconRight={ArrowRight}>
          Criar script inspirado
        </SButton>

        <div className="mt-1.5 text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
          Virais semelhantes
        </div>
        {similarVirals.map((c, i) => (
          <Link
            key={i}
            href={`/virais/v${i + 2}`}
            className="flex gap-2.5 p-2.5 rounded-xl bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors"
          >
            <div
              className="w-14 h-20 rounded-lg shrink-0"
              style={{
                background:
                  "repeating-linear-gradient(45deg, oklch(0.965 0.005 290) 0 8px, oklch(0.93 0.006 285) 8px 9px)",
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold font-mono">{c.v}</div>
              <div className="text-[11.5px] text-spark-ink-70 mt-1 leading-[1.35] italic">
                &ldquo;{c.q}…&rdquo;
              </div>
              <div className="text-[10.5px] text-spark-ink-50 mt-1">{c.who}</div>
            </div>
          </Link>
        ))}
      </aside>
    </div>
  );
}

export default function ViralDetailPage() {
  return <ResponsiveShell mobile={<ViralMobile />} desktop={<ViralDesktop />} active="virais" />;
}
