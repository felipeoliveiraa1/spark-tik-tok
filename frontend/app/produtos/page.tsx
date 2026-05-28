"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ArrowRight, Plus, Sparkles } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { LoadingSplash } from "@/components/atoms/loading-splash";

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

function ProductsBody({ desktop = false }: { desktop?: boolean }) {
  const { products, loading } = useProducts();
  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-12 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "pt-2"}>
        {desktop && (
          <>
            <div className="text-eyebrow text-spark-brand">
              💄 Catálogo
            </div>
            <h1 className="mt-3 text-fluid-headline font-extrabold tracking-tight leading-[1.02]">
              Seus produtos 📦
            </h1>
          </>
        )}
        <p className={`text-fluid-body text-spark-ink-50 max-w-[520px] ${desktop ? "mt-3" : "px-4 mt-2"}`}>
          Seu catálogo. Cadastra a ficha que você gerou no agente Info pra ter tudo organizado. ✨
        </p>

        <div className={`mt-5 ${desktop ? "" : "px-4"}`}>
          <Link
            href="/produtos/novo"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand active:scale-95 transition-transform duration-300 ease-premium"
          >
            <Plus size={14} strokeWidth={2.5} />
            Adicionar produto
          </Link>
        </div>
      </div>

      <div className={`mt-8 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando produtos" />
        ) : products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className={`grid gap-3 ${desktop ? "grid-cols-3 max-w-[920px]" : "grid-cols-1"}`}>
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 hover:border-spark-brand/30 hover-lift shadow-rest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70 overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} strokeWidth={1.7} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold truncate">{p.name}</div>
                    <div className="text-[11.5px] text-spark-ink-50 truncate">
                      {p.category ?? "—"} · {p.price_range ?? "preço n/d"}
                    </div>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
                </div>
                {p.target_audience && (
                  <div className="mt-2 text-[12px] text-spark-ink-70 line-clamp-2 leading-snug">
                    {p.target_audience}
                  </div>
                )}
                <div className="mt-2 text-[10.5px] text-spark-ink-35 font-mono">{timeAgo(p.created_at)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        📦
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem produto ainda 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        1. Vai em <strong>Agentes ✨</strong> e abre o agente <strong>Info</strong> no Gemini ou
        ChatGPT.<br />
        2. Cola foto/nome do produto, recebe a ficha completa.<br />
        3. Volta aqui e clica em <strong>Adicionar produto</strong> pra cadastrar 💕
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
        <Link href="/agentes">
          <SButton variant="ghost" size="md" IconRight={Sparkles}>
            Ver agentes
          </SButton>
        </Link>
        <Link href="/produtos/novo">
          <SButton variant="primary" size="md" IconRight={Plus}>
            Cadastrar agora
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ProductsMobile() {
  return (
    <>
      <MobileHeader
        variant="editorial"
        eyebrow="💄 CATÁLOGO"
        title="Seus produtos"
        back={{ href: "/" }}
      />
      <ProductsBody />
      <BottomNav active="produtos" />
    </>
  );
}

function ProductsDesktop() {
  return <ProductsBody desktop />;
}

export default function ProdutosPage() {
  return <ResponsiveShell mobile={<ProductsMobile />} desktop={<ProductsDesktop />} active="produtos" />;
}
