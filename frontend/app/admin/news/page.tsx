"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Newspaper, Pencil } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  reading_minutes: number;
  is_new: boolean;
  published_at: string;
};

export default function AdminNewsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<NewsRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/news?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { news: NewsRow[] };
      setItems(data.news);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const confirm = useConfirm();
  const toast = useToast();
  const remove = async (slug: string) => {
    const ok = await confirm({
      title: "Despublicar essa notícia?",
      description: `"${slug}" some do feed das alunas. Você pode reescrever depois.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/news/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Notícia removida 💕");
      await load();
    } else {
      toast.error("Não consegui remover agora");
    }
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={555} className="opacity-50" />

        <div className="relative max-w-[960px] mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro painel
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-eyebrow text-spark-brand">
                <Newspaper size={13} strokeWidth={2.5} />
                ✦ news
              </div>
              <h1
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                jornal do <span className="text-grad-brand">método.</span>
              </h1>
              <p className="mt-4 text-[14px] text-spark-ink-70 font-semibold">
                {items.length} {items.length === 1 ? "artigo publicado" : "artigos publicados"}
              </p>
            </div>
            <SButton
              variant="primary"
              Icon={Plus}
              onClick={() => router.push("/admin/news/novo")}
            >
              Novo artigo
            </SButton>
          </div>
        </div>
      </section>

      {/* Lista */}
      <div className="max-w-[960px] mx-auto mt-8">
        {loading ? (
          <div className="text-center text-[13px] text-spark-ink-50 py-16 italic">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline p-12 text-center">
              <div className="text-[48px] mb-3">📰</div>
              <div className="font-display lowercase text-[22px] text-spark-ink leading-tight">
                ainda sem matéria.
              </div>
              <p className="text-[13px] text-spark-ink-50 mt-3 max-w-[40ch] mx-auto">
                Clica em &quot;Novo artigo&quot; pra escrever a primeira do jornal.
              </p>
            </div>
          </SectionReveal>
        ) : (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
              {items.map((n, i) => (
                <div
                  key={n.id}
                  className={`group flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-spark-brand-soft/30 ${
                    i > 0 ? "border-t border-spark-hairline" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <SBadge tone="brand">{n.category}</SBadge>
                      {n.is_new && <SBadge tone="good">novo</SBadge>}
                    </div>
                    <div className="text-[15px] font-extrabold text-spark-ink truncate group-hover:text-spark-brand-deep transition-colors">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-spark-ink-50 mt-1 font-mono truncate">
                      /{n.slug} · {new Date(n.published_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Link
                    href={`/admin/news/${n.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-spark-surface-sunken text-[12.5px] font-extrabold text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-all duration-300"
                  >
                    <Pencil size={12} strokeWidth={2.5} />
                    Editar
                  </Link>
                  <button
                    onClick={() => remove(n.slug)}
                    className="w-10 h-10 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-300"
                    title="Remover"
                    aria-label="Remover"
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          </SectionReveal>
        )}
      </div>
    </div>
  );
}
