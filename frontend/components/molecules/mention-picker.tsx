"use client";

import * as React from "react";

export type MentionItem = {
  kind: "product" | "viral";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
};

type Props = {
  query: string;
  onPick: (item: MentionItem) => void;
  onClose: () => void;
};

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
};

type ViralRow = {
  id: string;
  source_video_id: string;
  product_name: string | null;
  creator: string | null;
  hook: string | null;
  thumbnail_url: string | null;
};

function useMentionable() {
  const [items, setItems] = React.useState<MentionItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pRes, vRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/virais", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      const list: MentionItem[] = [];
      if (pRes.ok) {
        const { products } = (await pRes.json()) as { products: ProductRow[] };
        for (const p of products ?? []) {
          list.push({
            kind: "product",
            id: p.id,
            title: p.name,
            subtitle: p.category ?? undefined,
            image: p.image_url ?? undefined,
          });
        }
      }
      if (vRes.ok) {
        const { virais } = (await vRes.json()) as { virais: ViralRow[] };
        for (const v of virais ?? []) {
          list.push({
            kind: "viral",
            id: v.id,
            title: v.product_name?.trim() || v.hook?.slice(0, 50) || "viral salvo",
            subtitle: v.creator ? `@${v.creator}` : undefined,
            image: v.thumbnail_url ?? undefined,
          });
        }
      }
      setItems(list);
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}

function score(item: MentionItem, q: string): number {
  if (!q) return 1;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  const haystack = norm(`${item.title} ${item.subtitle ?? ""}`);
  const needle = norm(q);
  if (haystack.startsWith(needle)) return 3;
  if (haystack.includes(needle)) return 2;
  // partial chars
  let i = 0;
  for (const c of needle) {
    i = haystack.indexOf(c, i);
    if (i < 0) return 0;
    i++;
  }
  return 1;
}

export function MentionPicker({ query, onPick, onClose }: Props) {
  const { items, loading } = useMentionable();
  const [activeIdx, setActiveIdx] = React.useState(0);

  const filtered = React.useMemo(() => {
    const scored = items
      .map((it) => ({ it, s: score(it, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);
    return scored.map((x) => x.it);
  }, [items, query]);

  React.useEffect(() => {
    setActiveIdx(0);
  }, [filtered.length, query]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const pick = filtered[activeIdx];
        if (pick) onPick(pick);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [filtered, activeIdx, onPick, onClose]);

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 max-w-[420px] mx-auto rounded-2xl bg-white border border-spark-hairline shadow-[0_18px_40px_-22px_rgba(20,20,40,0.35)] overflow-hidden z-10">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-spark-ink-50 bg-spark-surface-sunken">
        💕 Mencionar produto ou viral
      </div>
      {loading ? (
        <div className="px-3 py-4 text-[13px] text-spark-ink-50">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="px-3 py-4 text-[13px] text-spark-ink-50">
          Nada encontrado pra &ldquo;{query}&rdquo;. Salva produto ou viral antes pra mencionar aqui.
        </div>
      ) : (
        <ul className="max-h-[280px] overflow-y-auto">
          {filtered.map((it, i) => (
            <li key={`${it.kind}-${it.id}`}>
              <button
                type="button"
                onClick={() => onPick(it)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === activeIdx ? "bg-spark-brand-soft" : "hover:bg-spark-surface-sunken"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-spark-surface-sunken overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[16px]">{it.kind === "product" ? "📦" : "🔥"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold truncate">{it.title}</div>
                  <div className="text-[11px] text-spark-ink-50 truncate">
                    {it.kind === "product" ? "📦 produto" : "🔥 viral"}
                    {it.subtitle ? ` · ${it.subtitle}` : ""}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="px-3 py-2 text-[10.5px] text-spark-ink-35 border-t border-spark-hairline flex justify-between">
        <span>↑↓ navegar</span>
        <span>Enter selecionar · Esc fechar</span>
      </div>
    </div>
  );
}

/**
 * Token inserido no texto da mensagem. O backend extrai esses tokens
 * e injeta contexto rico (ficha do produto / detalhes do viral).
 *
 *   @[produto:UUID|Nome]
 *   @[viral:UUID|Hook]
 */
export function buildMentionToken(item: MentionItem): string {
  const safeTitle = item.title.replace(/[\]\\|]/g, " ").slice(0, 80);
  const kind = item.kind === "product" ? "produto" : "viral";
  return `@[${kind}:${item.id}|${safeTitle}]`;
}

const TOKEN_RE = /@\[(produto|viral):([0-9a-f-]{36})\|([^\]]+)\]/g;

export function extractMentions(
  text: string,
): { kind: "product" | "viral"; id: string; label: string }[] {
  const out: { kind: "product" | "viral"; id: string; label: string }[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    out.push({
      kind: m[1] === "produto" ? "product" : "viral",
      id: m[2],
      label: m[3],
    });
  }
  return out;
}

/**
 * Versão "limpa" do texto pra mostrar pro usuário: troca tokens por @label.
 */
export function renderMentionsAsText(text: string): string {
  return text.replace(TOKEN_RE, (_, _kind, _id, label) => `@${label}`);
}
