import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Flame, Pen } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { SBadge } from "@/components/atoms/s-badge";
import { SButton } from "@/components/atoms/s-button";

const sections = [
  {
    t: "Sobre",
    v: "Suplemento à base de N-acetilcisteína. Aliada da função respiratória, antioxidante e energia diária. Formulação aprovada pela ANVISA.",
  },
  {
    t: "Público",
    v: "Mulheres de 25 a 45 anos com rotina cansativa, que buscam energia natural sem cafeína. Mães, autônomas, profissionais de saúde.",
    tags: ["25–45", "Mulheres", "Profissional"],
  },
  {
    t: "Dores que resolve",
    list: ["Cansaço crônico ao acordar", "Falta de foco no trabalho", "Pele opaca e olheiras", "Imunidade baixa em estresse"],
  },
  {
    t: "Pontos fortes",
    list: ["Antioxidante de uso diário", "Aprovação ANVISA visível", "Sem cafeína (público sensível)", "Pode tomar com café da manhã"],
  },
];

const competidores = [
  { n: "Marca X", p: "R$ 120", diff: "+ caro", color: "oklch(0.6 0.22 25)" },
  { n: "Marca Y", p: "R$ 95", diff: "= preço", color: "oklch(0.5 0.014 285)" },
  { n: "Marca Z", p: "R$ 79", diff: "− barato", color: "oklch(0.62 0.16 150)" },
];

function PriceCard() {
  return (
    <div className="p-3.5 rounded-2xl flex items-center gap-3 bg-brand-grad-soft">
      <div>
        <div className="text-[11px] font-bold text-spark-brand-deep uppercase tracking-[0.06em]">
          Faixa de preço
        </div>
        <div className="text-[22px] font-extrabold font-mono text-spark-ink tracking-[-0.02em]">
          R$ 89–149
        </div>
      </div>
      <div className="w-px h-9 bg-black/10" />
      <div>
        <div className="text-[11px] font-bold text-spark-brand-deep uppercase tracking-[0.06em]">
          Margem média
        </div>
        <div className="text-[22px] font-extrabold font-mono text-spark-ink tracking-[-0.02em]">62%</div>
      </div>
    </div>
  );
}

function Sections() {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <div key={s.t}>
          <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-2">
            {s.t}
          </div>
          {s.v && <p className="text-[14px] leading-[1.5] text-spark-ink m-0">{s.v}</p>}
          {s.tags && (
            <div className="mt-2 flex gap-1.5">
              {s.tags.map((t) => (
                <SBadge key={t}>{t}</SBadge>
              ))}
            </div>
          )}
          {s.list && (
            <ul className="mt-1 flex flex-col">
              {s.list.map((l) => (
                <li key={l} className="flex gap-2 text-[14px] leading-[1.5] py-1">
                  <span className="text-spark-brand font-bold">·</span>
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div>
        <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-2">
          Concorrentes
        </div>
        <div className="flex flex-col gap-1.5">
          {competidores.map((c) => (
            <div
              key={c.n}
              className="px-3 py-2.5 rounded-xl bg-spark-surface border border-spark-hairline flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-md bg-spark-surface-sunken" />
              <div className="flex-1 text-[13.5px] font-semibold">{c.n}</div>
              <div className="text-[12.5px] text-spark-ink-50 font-mono">{c.p}</div>
              <div className="text-[11px] font-bold" style={{ color: c.color }}>
                {c.diff}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductMobile() {
  return (
    <>
      <div className="pt-14 px-3 pb-2 flex items-center justify-between">
        <Link
          href="/produtos"
          className="w-9 h-9 rounded-full bg-white/85 backdrop-blur text-spark-ink flex items-center justify-center"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <button className="w-9 h-9 rounded-full bg-white/85 backdrop-blur text-spark-ink flex items-center justify-center">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-4">
          <PhotoPlaceholder ratio={1.1} label="hero photo" radius={20} />
          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <SBadge tone="brand">Suplemento</SBadge>
              <SBadge>Saúde</SBadge>
            </div>
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em] mt-2 leading-[1.1]">
              NAC Always Fit
            </h1>
            <div className="text-[13px] text-spark-ink-50 mt-1">
              Analisado por <span className="font-bold text-agent-info-fg">@info</span> · há 2h
            </div>
          </div>

          <div className="mt-[18px]">
            <PriceCard />
          </div>

          <div className="mt-[22px]">
            <Sections />
          </div>

          <div className="h-20" />
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-[18px] border-t border-spark-hairline bg-white/95 backdrop-blur flex gap-2">
        <SButton size="md" variant="ghost" Icon={Flame} full>
          Virais
        </SButton>
        <SButton size="md" variant="primary" Icon={Pen} full>
          Criar scripts
        </SButton>
      </div>
    </>
  );
}

function ProductDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <Link href="/produtos" className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors">
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pros produtos
      </Link>

      <div className="mt-5 grid grid-cols-[1fr_1.4fr] gap-10 items-start">
        <div className="sticky top-8">
          <PhotoPlaceholder ratio={1} label="hero photo" radius={24} />
          <div className="mt-5 flex gap-2">
            <SButton variant="ghost" Icon={Flame} full>
              Buscar virais
            </SButton>
            <SButton variant="primary" Icon={Pen} full>
              Criar scripts
            </SButton>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <SBadge tone="brand">Suplemento</SBadge>
            <SBadge>Saúde</SBadge>
          </div>
          <h1 className="text-[38px] font-extrabold tracking-[-0.02em] mt-2 leading-[1.1]">
            NAC Always Fit
          </h1>
          <div className="text-[13px] text-spark-ink-50 mt-1">
            Analisado por <span className="font-bold text-agent-info-fg">@info</span> · há 2h
          </div>

          <div className="mt-5">
            <PriceCard />
          </div>

          <div className="mt-7">
            <Sections />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return <ResponsiveShell mobile={<ProductMobile />} desktop={<ProductDesktop />} active="produtos" />;
}
