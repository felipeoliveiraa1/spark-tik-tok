"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ArrowUpRight, HelpCircle, Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { SplashScreen } from "@/components/atoms/splash-screen";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { type TutorialStep } from "@/lib/tutorial";

/**
 * /produtos — catálogo magazine premium.
 *
 * Estrutura cinematográfica:
 *   • SplashScreen de entrada (1.2s)
 *   • Hero radial fullscreen: blobs + sparkles + sticker + Tanker
 *     gigante "seus produtos / em destaque." + contador animado +
 *     CTA "+ adicionar produto"
 *   • Grid magazine de produtos: cards editorial com hero image,
 *     hover-lift premium, image zoom on hover
 *   • Card "+ novo" tracejado no fim do grid
 *   • Empty state premium quando vazio
 *   • FloatingMainNav lateral
 */

type ProductRow = {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  target_audience: string | null;
  price_range: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86_400_000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days}d atrás`;
  const months = Math.round(days / 30);
  return `${months}m atrás`;
}

function useProducts() {
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products: ProductRow[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { products, loading };
}

// =================================================================
// HERO — fullscreen editorial
// =================================================================

function HeroSection({
  count,
  desktop,
  onReopenTour,
}: {
  count: number;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "96px" : "72px",
      }}
    >
      {/* Blobs orgânicos */}
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />

      {/* Sparkles */}
      <SparkleField count={14} seed={104} className="opacity-70" />

      {/* Botão Tour — top-right */}
      <div
        className="absolute z-10"
        style={{
          top: desktop ? "24px" : "calc(env(safe-area-inset-top) + 12px)",
          right: desktop ? "48px" : "16px",
        }}
      >
        <button
          type="button"
          onClick={onReopenTour}
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 text-[11.5px] font-extrabold uppercase tracking-widest shadow-rest transition-all duration-300 ease-premium"
          aria-label="Refazer tour de produtos"
        >
          <HelpCircle
            size={13}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>

      {/* Conteúdo */}
      <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
        {/* Top: eyebrow + sticker */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <SectionReveal direction="down" durationMs={600}>
            <div data-tutorial-id="produtos-intro">
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ catálogo TTS
              </div>
              <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[30ch] font-semibold">
                Cada ficha que você cadastra vira fonte pra um roteiro novo.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={200}>
              <Sticker
                text="PRODUTOS · 2026 · "
                emoji="📦"
                size={132}
              />
            </SectionReveal>
          )}
        </div>

        {/* Headline gigante TANKER */}
        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="font-display lowercase leading-[0.9] tracking-tight max-w-[18ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              className="block text-spark-ink"
            >
              seus produtos
            </CharacterReveal>
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              delayMs={500}
              className="block"
              charClassName="text-grad-brand"
            >
              em destaque.
            </CharacterReveal>
          </h1>
        </SectionReveal>

        {/* Contador + CTA */}
        <SectionReveal direction="up" delay={900}>
          <div data-tutorial-id="produtos-action" className="mt-10 flex items-center gap-5 flex-wrap">
            <Link
              href="/produtos/novo"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep active:translate-y-0"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Adicionar produto
            </Link>

            <div className="inline-flex items-center gap-2 text-[13px] text-spark-ink-70 font-semibold">
              <span className="font-extrabold text-fluid-title text-spark-ink leading-none">
                <CountUp value={count} durationMs={1100} />
              </span>
              {count === 1 ? "produto cadastrado" : "produtos cadastrados"}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// GRID — cards magazine
// =================================================================

function ProductCard({ p, index }: { p: ProductRow; index: number }) {
  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
      <Link
        href={`/produtos/${p.id}`}
        className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
      >
        {/* Hero image */}
        <div className="relative aspect-[4/3] bg-spark-surface-sunken overflow-hidden">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image_url}
              alt={p.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-spark-brand-soft via-spark-surface to-amber-100 flex items-center justify-center relative">
              <span
                className="text-[80px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-transform duration-700 ease-premium group-hover:scale-110 group-hover:rotate-6"
                aria-hidden
              >
                📦
              </span>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 40%)",
                }}
              />
            </div>
          )}

          {/* Chip flutuante com categoria */}
          {p.category && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass text-[10.5px] font-extrabold text-spark-ink tracking-tight">
                {p.category}
              </span>
            </div>
          )}

          {/* Arrow on hover */}
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-2">
            {p.name}
          </h3>
          {p.target_audience && (
            <p className="mt-2 text-[12px] text-spark-ink-70 leading-snug line-clamp-2">
              {p.target_audience}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11.5px] text-spark-brand font-extrabold tracking-tight">
              {p.price_range ?? "preço n/d"}
            </span>
            <span className="text-[10.5px] text-spark-ink-50 font-mono">
              {timeAgo(p.created_at)}
            </span>
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

function AddProductCard({ delay }: { delay: number }) {
  return (
    <SectionReveal delay={delay}>
      <Link
        href="/produtos/novo"
        className="group flex flex-col items-center justify-center text-center rounded-spark-2xl border-2 border-dashed border-spark-brand/30 bg-spark-brand-soft/30 hover-lift shadow-rest p-8 min-h-full transition-colors duration-300 hover:border-spark-brand/60 hover:bg-spark-brand-soft/50"
      >
        <div className="w-16 h-16 rounded-full bg-brand-grad text-white flex items-center justify-center shadow-lift-brand transition-transform duration-300 ease-premium group-hover:rotate-90">
          <Plus size={28} strokeWidth={2.5} />
        </div>
        <div className="mt-5 text-[14px] font-extrabold text-spark-brand-deep tracking-tight">
          Adicionar novo
        </div>
        <div className="mt-1.5 text-[12px] text-spark-ink-50">
          Cole a ficha do agente Info
        </div>
      </Link>
    </SectionReveal>
  );
}

function ProductsGrid({ products, desktop }: { products: ProductRow[]; desktop: boolean }) {
  return (
    <section className={`relative ${desktop ? "py-16 px-12" : "py-12 px-5"}`}>
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-eyebrow text-spark-brand mb-3">
                ✦ {products.length} {products.length === 1 ? "item" : "itens"}
              </div>
              <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
                sua vitrine
              </h2>
            </div>
          </div>
        </SectionReveal>

        <div className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {products.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
          <AddProductCard delay={Math.min(products.length * 70, 360)} />
        </div>
      </div>
    </section>
  );
}

// =================================================================
// EMPTY STATE — premium
// =================================================================

function EmptyProducts({ desktop }: { desktop: boolean }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        desktop ? "py-24 px-12" : "py-16 px-5",
      )}
    >
      <HeroBlob color="peach" variant={2} className="-top-10 -left-20 w-[400px] h-[400px]" />
      <HeroBlob color="rose" variant={3} className="bottom-0 -right-20 w-[360px] h-[360px]" />
      <SparkleField count={10} seed={222} className="opacity-50" />

      <div className={cn("relative text-center", desktop ? "max-w-[680px] mx-auto" : "")}>
        <SectionReveal direction="scale">
          <div className="mx-auto w-24 h-24 rounded-full bg-brand-grad-soft flex items-center justify-center mb-7 shadow-lift animate-float">
            <span className="text-[48px]">📦</span>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            sem produto<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <div className="mt-8 rounded-spark-2xl glass border border-spark-hairline p-6 text-left max-w-[520px] mx-auto">
            <ol className="space-y-3 text-[14px] text-spark-ink-70 leading-snug">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  1
                </span>
                <span>
                  Abre o agente <strong className="text-spark-ink">Info</strong> em{" "}
                  <Link href="/agentes" className="text-spark-brand-deep font-extrabold hover:underline">
                    Agentes ✨
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  2
                </span>
                <span>
                  Cola foto, nome ou link do produto. Recebe a ficha completa em segundos.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  3
                </span>
                <span>
                  Volta aqui e cadastra a ficha em <strong className="text-spark-ink">+ adicionar produto</strong> 💕
                </span>
              </li>
            </ol>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={550}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agentes"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full glass border border-spark-hairline text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift"
            >
              Ver agentes
              <ArrowUpRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/produtos/novo"
              className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Cadastrar agora
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY
// =================================================================

function ProductsBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const { products, loading } = useProducts();

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 0 : "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      <HeroSection count={products.length} desktop={desktop} onReopenTour={onReopenTour} />

      <div data-tutorial-id="produtos-vitrine">
        {loading ? (
          <section className="py-24 flex justify-center">
            <LoadingSplash message="Carregando produtos" />
          </section>
        ) : products.length === 0 ? (
          <EmptyProducts desktop={desktop} />
        ) : (
          <ProductsGrid products={products} desktop={desktop} />
        )}
      </div>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function ProductsMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <ProductsBody onReopenTour={onReopenTour} />;
}

function ProductsDesktop({ onReopenTour }: { onReopenTour: () => void }) {
  return <ProductsBody desktop onReopenTour={onReopenTour} />;
}

// Steps do tour de Produtos (6 steps com variantes mobile/desktop pro nav)
function buildProdutosSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda aos produtos!",
      description:
        "Aqui fica seu catálogo. Cada produto cadastrado vira fonte pra roteiros e referência pros agentes especialistas. Em 20s te mostro tudo.",
    },
    {
      id: "intro",
      target: "produtos-intro",
      title: "Pra que serve esse catálogo",
      description:
        "Cada ficha que você cadastra fica salva aqui pra usar nos agentes e scripts. Quanto mais detalhada a ficha, melhor o roteiro que os agentes geram depois.",
    },
    {
      id: "action",
      target: "produtos-action",
      title: "Adicionar e acompanhar",
      description:
        "Botão Adicionar produto abre o formulário de ficha. Do lado, o contador mostra quantos você tem cadastrados.",
    },
    {
      id: "vitrine",
      target: "produtos-vitrine",
      title: "Sua vitrine",
      description:
        "Cards com foto, categoria, público e faixa de preço. Clica em qualquer um pra ver a ficha completa, editar ou apagar. Se não tem nenhum ainda, mostra um passo a passo.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é cadastrar 💕",
      description:
        "Quanto mais produtos cadastrados, mais material pros agentes e scripts. Se quiser refazer o tour, clica no botão ✨ Tour no canto.",
    },
  ];
}

function ProductsPageContent() {
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildProdutosSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <SplashScreen show={showSplash} minDurationMs={1000} />
      <ResponsiveShell
        mobile={<ProductsMobile onReopenTour={reopenTour} />}
        desktop={<ProductsDesktop onReopenTour={reopenTour} />}
        active="produtos"
        customSidebar
      />
      <FloatingMainNav active="produtos" />
      <TutorialOverlay
        steps={steps}
        storageKey="produtos"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function ProdutosPage() {
  return <ProductsPageContent />;
}

void Package;
