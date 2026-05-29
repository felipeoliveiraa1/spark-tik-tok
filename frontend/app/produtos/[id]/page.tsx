"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Trash2,
  Pen,
  Sparkles,
  Calendar,
  Clock,
  Target,
  Heart,
  Swords,
  Shield,
  Film,
  Anchor,
  Award,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

/**
 * /produtos/[id] — ficha editorial premium do produto.
 *
 * Layout:
 *   • Hero compacto: hero-radial + back + sticker + título Tanker
 *     + image grande + chips de categoria/preço
 *   • Magazine grid de seções (audiência, dores, pontos fortes,
 *     diferenciais, objeções, gatilhos, momentos, ângulos)
 *   • Bloco destaque com hooks prontos (cards numerados gradient)
 *   • Sazonalidade + concorrentes
 *   • Action bar flutuante (gerar scripts + apagar)
 *   • FloatingMainNav lateral
 */

type ProductDetail = {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  target_audience: string | null;
  pain_points: string[] | null;
  strengths: string[] | null;
  price_range: string | null;
  competitors: string[] | null;
  differentiators: string[] | null;
  objections: string[] | null;
  emotional_triggers: string[] | null;
  usage_moments: string[] | null;
  content_angles: string[] | null;
  hook_ideas: string[] | null;
  seasonality: string | null;
  raw_analysis: Record<string, unknown> | null;
  created_at: string;
};

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function useProduct(id: string) {
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setError("Produto não encontrado.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Falhou ao carregar o produto.");
          return;
        }
        const data = (await res.json()) as ProductDetail;
        if (!cancelled) setProduct(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, error };
}

// =================================================================
// HERO PRODUTO
// =================================================================

function ProductHero({
  product,
  desktop,
}: {
  product: ProductDetail;
  desktop: boolean;
}) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: desktop ? "72px" : "48px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
      <HeroBlob color="peach" variant={2} className="top-10 -right-40 w-[480px] h-[480px]" />
      <SparkleField count={12} seed={329} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        {/* Back */}
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro catálogo
          </Link>
        </SectionReveal>

        <div className={cn("mt-6 grid gap-8", desktop ? "grid-cols-[1fr_1.2fr]" : "grid-cols-1")}>
          {/* Image */}
          <SectionReveal direction={desktop ? "left" : "up"} delay={100}>
            <div className="relative">
              <div className="relative rounded-spark-3xl overflow-hidden bg-gradient-to-br from-spark-brand-soft via-spark-surface to-amber-100 shadow-hero aspect-square">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-30 mix-blend-overlay"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.45) 0%, transparent 40%)",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={120} strokeWidth={1.2} className="text-spark-ink-35" />
                    </div>
                  </>
                )}

                {/* Sticker no canto */}
                {desktop && (
                  <div className="absolute -bottom-6 -right-6">
                    <Sticker text="FICHA · TTS · 2026 · " emoji="📦" size={110} />
                  </div>
                )}
              </div>
            </div>
          </SectionReveal>

          {/* Title block */}
          <div className="flex flex-col justify-center">
            <SectionReveal direction="right" delay={150}>
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ ficha completa
              </div>
            </SectionReveal>

            <SectionReveal direction="up" delay={250} durationMs={800}>
              <h1
                className="mt-4 font-display lowercase leading-[0.92] tracking-tight text-spark-ink"
                style={{ fontSize: desktop ? "clamp(2.25rem, 4vw, 4rem)" : "clamp(1.875rem, 7vw, 2.75rem)" }}
              >
                {product.name.toLowerCase()}
              </h1>
            </SectionReveal>

            <SectionReveal direction="up" delay={400}>
              <div className="mt-6 flex flex-wrap gap-2">
                {product.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full glass border border-spark-hairline text-[11.5px] font-extrabold text-spark-ink tracking-tight">
                    {product.category}
                  </span>
                )}
                {product.price_range && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-grad text-white text-[11.5px] font-extrabold tracking-tight shadow-lift-brand">
                    💰 {product.price_range}
                  </span>
                )}
                {product.seasonality && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-spark-surface border border-spark-hairline text-[11.5px] font-extrabold text-spark-ink-70 tracking-tight">
                    <Calendar size={11} strokeWidth={2.5} />
                    {product.seasonality.length > 32
                      ? product.seasonality.slice(0, 30) + "…"
                      : product.seasonality}
                  </span>
                )}
              </div>
            </SectionReveal>

            <SectionReveal direction="up" delay={550}>
              <div className="mt-7 flex items-center gap-2 text-[11.5px] text-spark-ink-50 font-mono">
                <Clock size={11} strokeWidth={2} />
                cadastrado em{" "}
                {new Date(product.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// MAGAZINE CARDS (audiência, listas, etc)
// =================================================================

function InfoCard({
  emoji,
  title,
  children,
  variant = "default",
  delay = 0,
}: {
  emoji?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "brand" | "highlight";
  delay?: number;
}) {
  const variantClass =
    variant === "brand"
      ? "bg-spark-brand-soft/40 border-spark-brand/20"
      : variant === "highlight"
        ? "bg-spark-ink text-white border-spark-ink"
        : "bg-spark-surface border-spark-hairline";

  return (
    <SectionReveal direction="up" delay={delay}>
      <div className={cn("rounded-spark-2xl border p-6 shadow-rest", variantClass)}>
        <div className="flex items-center gap-2 mb-4">
          {emoji && (
            <span className="text-[20px] leading-none" aria-hidden>
              {emoji}
            </span>
          )}
          <h2
            className={cn(
              "text-eyebrow",
              variant === "highlight" ? "text-white/70" : "text-spark-brand",
            )}
          >
            {title}
          </h2>
        </div>
        {children}
      </div>
    </SectionReveal>
  );
}

function BulletList({ items, variant = "default" }: { items: string[]; variant?: "default" | "white" }) {
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li
          key={s}
          className={cn(
            "flex items-start gap-2.5 text-[13.5px] leading-snug",
            variant === "white" ? "text-white/90" : "text-spark-ink-70",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full",
              variant === "white" ? "bg-white/70" : "bg-spark-brand",
            )}
          />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex items-center px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[12px] font-extrabold tracking-tight"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// =================================================================
// HOOKS DESTAQUE
// =================================================================

function HooksHighlight({ hooks, delay }: { hooks: string[]; delay: number }) {
  return (
    <SectionReveal direction="up" delay={delay}>
      <div className="relative overflow-hidden rounded-spark-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 text-white p-6 sm:p-8 shadow-hero">
        <SparkleField count={8} seed={711} color="rgba(255,255,255,0.6)" className="opacity-70" />
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-blob-1"
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Anchor size={16} strokeWidth={2.4} />
            <span className="text-eyebrow text-white/80">hooks prontos</span>
          </div>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
          >
            os ganchos<br />que fazem parar.
          </h2>

          <ol className="mt-6 space-y-3">
            {hooks.map((h, i) => (
              <li
                key={h}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/15"
              >
                <span className="shrink-0 w-8 h-8 rounded-full bg-white text-spark-brand-deep text-[13px] font-extrabold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
                <span className="text-[14px] leading-snug font-medium">{h}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// CONTENT GRID
// =================================================================

function ContentGrid({
  product,
  desktop,
}: {
  product: ProductDetail;
  desktop: boolean;
}) {
  const pains = toStringList(product.pain_points);
  const strengths = toStringList(product.strengths);
  const competitors = toStringList(product.competitors);
  const differentiators = toStringList(product.differentiators);
  const objections = toStringList(product.objections);
  const triggers = toStringList(product.emotional_triggers);
  const moments = toStringList(product.usage_moments);
  const angles = toStringList(product.content_angles);
  const hooks = toStringList(product.hook_ideas);

  return (
    <section className={`relative ${desktop ? "py-16 px-12" : "py-10 px-5"}`}>
      <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
        {/* Público-alvo em destaque */}
        {product.target_audience && (
          <SectionReveal direction="up">
            <div className="mb-6 rounded-spark-2xl bg-gradient-to-br from-spark-brand-soft via-spark-surface to-amber-50 border border-spark-brand/20 p-6 sm:p-8 shadow-rest">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} strokeWidth={2.4} className="text-spark-brand-deep" />
                <span className="text-eyebrow text-spark-brand-deep">público-alvo</span>
              </div>
              <p className="text-fluid-lead text-spark-ink leading-snug max-w-[58ch]">
                {product.target_audience}
              </p>
            </div>
          </SectionReveal>
        )}

        {/* Hooks em destaque PRIMEIRO (são o item mais valioso) */}
        {hooks.length > 0 && (
          <div className="mb-6">
            <HooksHighlight hooks={hooks} delay={80} />
          </div>
        )}

        {/* Grid 2 colunas em desktop, 1 em mobile */}
        <div className={`grid gap-4 ${desktop ? "grid-cols-2" : "grid-cols-1"}`}>
          {pains.length > 0 && (
            <InfoCard emoji={<Heart size={18} strokeWidth={2.2} className="text-spark-brand" />} title="dores que resolve" delay={120}>
              <BulletList items={pains} />
            </InfoCard>
          )}
          {strengths.length > 0 && (
            <InfoCard emoji="💪" title="pontos fortes" delay={160}>
              <BulletList items={strengths} />
            </InfoCard>
          )}
          {differentiators.length > 0 && (
            <InfoCard emoji={<Award size={18} strokeWidth={2.2} className="text-spark-brand" />} title="diferenciais únicos" variant="brand" delay={200}>
              <BulletList items={differentiators} />
            </InfoCard>
          )}
          {triggers.length > 0 && (
            <InfoCard emoji="💗" title="gatilhos emocionais" delay={240}>
              <ChipList items={triggers} />
            </InfoCard>
          )}
          {objections.length > 0 && (
            <InfoCard emoji={<Shield size={18} strokeWidth={2.2} className="text-spark-brand" />} title="objeções a quebrar" delay={280}>
              <ul className="space-y-2.5">
                {objections.map((o) => (
                  <li
                    key={o}
                    className="text-[13.5px] text-spark-ink-70 leading-snug italic relative pl-4"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 text-[18px] leading-none text-spark-brand"
                    >
                      &ldquo;
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}
          {moments.length > 0 && (
            <InfoCard emoji={<Target size={18} strokeWidth={2.2} className="text-spark-brand" />} title="momentos de uso" delay={320}>
              <BulletList items={moments} />
            </InfoCard>
          )}
          {angles.length > 0 && (
            <InfoCard emoji={<Film size={18} strokeWidth={2.2} className="text-spark-brand" />} title="ângulos de conteúdo" delay={360}>
              <BulletList items={angles} />
            </InfoCard>
          )}
          {competitors.length > 0 && (
            <InfoCard emoji={<Swords size={18} strokeWidth={2.2} className="text-spark-brand" />} title="concorrentes" delay={400}>
              <ChipList items={competitors} />
            </InfoCard>
          )}
          {product.seasonality && (
            <InfoCard emoji="📅" title="sazonalidade" delay={440}>
              <p className="text-[13.5px] text-spark-ink-70 leading-relaxed">
                {product.seasonality}
              </p>
            </InfoCard>
          )}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// ACTION BAR FLUTUANTE
// =================================================================

function ActionBar({
  onDelete,
  deleting,
  desktop,
}: {
  onDelete: () => void;
  deleting: boolean;
  desktop: boolean;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 px-4 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
    >
      <div
        className={cn(
          "mx-auto pointer-events-auto glass rounded-full shadow-lift flex items-center gap-2 p-2",
          desktop ? "max-w-[760px]" : "max-w-full",
        )}
      >
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Apagar"
          className="inline-flex items-center justify-center w-12 h-12 rounded-full text-spark-ink-70 hover:text-bad hover:bg-bad/10 transition-colors duration-300 disabled:opacity-50"
        >
          <Trash2 size={16} strokeWidth={2.2} />
        </button>
        <div className="flex-1 text-[12px] text-spark-ink-50 px-2 hidden sm:block">
          Bora gerar scripts pra esse produto?
        </div>
        <Link
          href="/agentes"
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep"
        >
          <Pen size={14} strokeWidth={2.5} />
          Gerar scripts
          <ArrowUpRight
            size={14}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </div>
  );
}

// =================================================================
// BODY
// =================================================================

function ProductBody({ id, desktop = false }: { id: string; desktop?: boolean }) {
  const router = useRouter();
  const { product, loading, error } = useProduct(id);
  const [deleting, setDeleting] = React.useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const remove = async () => {
    const ok = await confirm({
      title: "Apagar esse produto?",
      description: "A ficha some do seu catálogo. Você pode cadastrar de novo se quiser. 💕",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Produto removido 💕");
      router.push("/produtos");
    } else {
      toast.error("Não consegui remover agora");
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Abrindo a ficha" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        <SparkleField count={8} seed={42} className="opacity-50" />
        <div className="px-6 py-32 text-center max-w-[480px] mx-auto relative">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            opa, sumiu.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug">
            {error ?? "Erro desconhecido."}
          </p>
          <Link
            href="/produtos"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 96 : 160 }}
    >
      <ProductHero product={product} desktop={desktop} />
      <ContentGrid product={product} desktop={desktop} />
      <ActionBar onDelete={remove} deleting={deleting} desktop={desktop} />
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function MobileWrap({ id }: { id: string }) {
  return <ProductBody id={id} />;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<MobileWrap id={id} />}
        desktop={<ProductBody id={id} desktop />}
        active="produtos"
        customSidebar
      />
      <FloatingMainNav active="produtos" />
    </>
  );
}

void Sparkles;
