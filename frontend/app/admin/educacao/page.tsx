"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, GraduationCap, Pencil } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
};

export default function AdminEducacaoPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<VideoRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/educacao?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { videos: VideoRow[] };
      setItems(data.videos);
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
      title: "Remover essa aula?",
      description: `A aula "${slug}" some pra todas as alunas. Você pode recriar pelo painel.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/educacao/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Aula removida 💕");
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
        <HeroBlob color="lilac" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={707} className="opacity-50" />

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
                <GraduationCap size={13} strokeWidth={2.5} />
                ✦ aulas
              </div>
              <h1
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                aulas do <span className="text-grad-brand">método.</span>
              </h1>
              <p className="mt-4 text-[14px] text-spark-ink-70 font-semibold">
                {items.length} {items.length === 1 ? "aula publicada" : "aulas publicadas"}
              </p>
            </div>
            <SButton
              variant="primary"
              Icon={Plus}
              onClick={() => router.push("/admin/educacao/nova")}
            >
              Nova aula
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
              <div className="text-[48px] mb-3">🎓</div>
              <div className="font-display lowercase text-[22px] text-spark-ink leading-tight">
                ainda sem aulas.
              </div>
              <p className="text-[13px] text-spark-ink-50 mt-3 max-w-[40ch] mx-auto">
                Cola o link do YouTube e a aula entra no ar pra todas as alunas.
              </p>
            </div>
          </SectionReveal>
        ) : (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
              {items.map((v, i) => (
                <div
                  key={v.id}
                  className={`group flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-spark-brand-soft/30 ${
                    i > 0 ? "border-t border-spark-hairline" : ""
                  }`}
                >
                  {v.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.cover_url}
                      alt=""
                      className="w-24 h-16 object-cover rounded-spark-xl border border-spark-hairline shadow-rest shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {v.category && <SBadge tone="brand">{v.category}</SBadge>}
                      {!v.is_published && <SBadge tone="warn">rascunho</SBadge>}
                    </div>
                    <div className="text-[15px] font-extrabold text-spark-ink truncate group-hover:text-spark-brand-deep transition-colors">
                      {v.title}
                    </div>
                    <div className="text-[11px] text-spark-ink-50 mt-1 font-mono truncate">
                      yt:{v.youtube_id} · /{v.slug} · ordem {v.order_index}
                    </div>
                  </div>
                  <Link
                    href={`/admin/educacao/${v.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-spark-surface-sunken text-[12.5px] font-extrabold text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-all duration-300"
                  >
                    <Pencil size={12} strokeWidth={2.5} />
                    Editar
                  </Link>
                  <button
                    onClick={() => remove(v.slug)}
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
