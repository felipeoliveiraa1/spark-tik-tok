"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ArrowRight, Sparkle } from "lucide-react";
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
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-3"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          💄 Catálogo
        </div>
        <h1 className={`mt-1 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[36px]" : "text-[24px]"}`}>
          Seus produtos 📦
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Tudo que você já analisou com a Informação. Cada produto vira base pros próximos scripts. ✨
        </p>
      </div>

      <div className={`mt-6 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando produtos" />
        ) : products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className={`grid gap-2.5 ${desktop ? "grid-cols-3 max-w-[920px]" : "grid-cols-1"}`}>
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className="rounded-2xl bg-spark-surface border border-spark-hairline p-3.5 hover:border-spark-ink/30 transition-colors"
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
        Abre o chat e manda uma foto ou o nome do produto pra Informação. Ela monta uma ficha
        completa e salva aqui. ✨
      </p>
      <div className="mt-4">
        <Link href="/chat">
          <SButton variant="primary" size="md" IconRight={Sparkle}>
            Abrir o chat
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ProductsMobile() {
  return (
    <>
      <MobileHeader title="Produtos 📦" />
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
