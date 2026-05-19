"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Trash2, Pen, Flame } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";

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

function ProductBody({ id, desktop = false }: { id: string; desktop?: boolean }) {
  const router = useRouter();
  const { product, loading, error } = useProduct(id);
  const [deleting, setDeleting] = React.useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const remove = async () => {
    const ok = await confirm({
      title: "Apagar esse produto?",
      description: "A ficha some do seu catálogo. Você pode analisar de novo pelo chat com a Informação. 💕",
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
    return <LoadingSplash message="Abrindo a ficha" />;
  }
  if (error || !product) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro desconhecido."}
        <div className="mt-3">
          <Link href="/produtos" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  const pains = toStringList(product.pain_points);
  const strengths = toStringList(product.strengths);
  const competitors = toStringList(product.competitors);

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[760px]" : "px-4 pt-4"}>
        {!desktop && (
          <Link href="/produtos" className="inline-flex items-center gap-1.5 text-[13px] text-spark-ink-50">
            <ArrowLeft size={14} strokeWidth={1.7} />
            Produtos
          </Link>
        )}
        <div className={`mt-${desktop ? "0" : "3"} flex items-start gap-4`}>
          <div className="w-20 h-20 rounded-2xl bg-spark-surface-sunken overflow-hidden shrink-0 flex items-center justify-center text-spark-ink-50">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={28} strokeWidth={1.7} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`font-extrabold tracking-[-0.02em] leading-tight ${desktop ? "text-[32px]" : "text-[22px]"}`}>
              {product.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.category && <SBadge>{product.category}</SBadge>}
              {product.price_range && <SBadge tone="brand">{product.price_range}</SBadge>}
            </div>
          </div>
        </div>

        {product.target_audience && (
          <Section title="Público-alvo">
            <p className="text-[14px] text-spark-ink-70 leading-relaxed">{product.target_audience}</p>
          </Section>
        )}

        {pains.length > 0 && (
          <Section title="Dores que resolve">
            <ul className="space-y-1.5">
              {pains.map((p) => (
                <li key={p} className="text-[14px] text-spark-ink-70 leading-snug">
                  · {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {strengths.length > 0 && (
          <Section title="Pontos fortes">
            <ul className="space-y-1.5">
              {strengths.map((s) => (
                <li key={s} className="text-[14px] text-spark-ink-70 leading-snug">
                  · {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {competitors.length > 0 && (
          <Section title="Concorrentes">
            <div className="flex flex-wrap gap-1.5">
              {competitors.map((c) => (
                <SBadge key={c}>{c}</SBadge>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-7 flex flex-wrap gap-2">
          <Link href="/chat">
            <SButton variant="primary" size="md" Icon={Pen}>
              Gerar scripts
            </SButton>
          </Link>
          <Link href="/virais">
            <SButton variant="ghost" size="md" Icon={Flame}>
              Ver virais
            </SButton>
          </Link>
          <SButton variant="ghost" size="md" Icon={Trash2} onClick={remove} disabled={deleting}>
            Apagar
          </SButton>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function MobileWrap({ id }: { id: string }) {
  return (
    <>
      <div className="pt-12 px-4 pb-2 flex items-center gap-2">
        <Link href="/produtos" className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Produto</div>
      </div>
      <ProductBody id={id} />
      <BottomNav active="produtos" />
    </>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<MobileWrap id={id} />}
      desktop={<ProductBody id={id} desktop />}
      active="produtos"
    />
  );
}
