"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkle, ArrowRight, Package, Newspaper } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { VISIBLE_AGENTS, AGENTS, type AgentId } from "@/lib/agents";
import { useConversationStore } from "@/lib/conversation-store";

type Profile = { name: string | null; email: string };

type RecentProduct = { id: string; name: string; category: string | null; created_at: string };
type RecentNews = { id: string; slug: string; category: string; title: string; reading_minutes: number; published_at: string; is_new: boolean };

function useDashboardData() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [products, setProducts] = React.useState<RecentProduct[]>([]);
  const [news, setNews] = React.useState<RecentNews[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meRes, prodRes, newsRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/news", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (meRes.ok) {
        const data = (await meRes.json()) as { profile: Profile | null };
        setProfile(data.profile);
      }
      if (prodRes.ok) {
        const data = (await prodRes.json()) as { products: RecentProduct[] };
        setProducts(data.products.slice(0, 4));
      }
      if (newsRes.ok) {
        const data = (await newsRes.json()) as { news: RecentNews[] };
        setNews(data.news.slice(0, 3));
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, products, news };
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function ShortcutCard({ agent, onStart }: { agent: AgentId; onStart: (a: AgentId) => void }) {
  const a = AGENTS[agent];
  return (
    <button
      onClick={() => onStart(agent)}
      className="text-left p-4 rounded-2xl bg-spark-surface border border-spark-hairline flex items-start gap-3.5 hover:border-spark-ink/30 transition-colors"
    >
      <AgentCharacter agent={agent} size={72} />
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[15px] font-extrabold tracking-[-0.01em]">{a.label}</div>
        <div className="text-[12px] text-spark-ink-50 mt-1 leading-snug">{a.description}</div>
      </div>
    </button>
  );
}

function HomeBody({ desktop = false }: { desktop?: boolean }) {
  const router = useRouter();
  const store = useConversationStore();
  const { profile, products, news } = useDashboardData();
  const [creating, setCreating] = React.useState<AgentId | null>(null);

  const firstName = (profile?.name?.trim() || profile?.email?.split("@")[0] || "criadora").split(/\s+/)[0];

  const start = async (agent: AgentId) => {
    if (creating) return;
    setCreating(agent);
    try {
      const id = await store.createConversation({
        agent,
        title: `Conversa com ${AGENTS[agent].label}`,
      });
      router.push(`/chat/${id}`);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className={`text-[13px] font-bold text-spark-brand tracking-[0.06em] uppercase ${desktop ? "" : ""}`}>
          Oi, {firstName} 💖
        </div>
        <h1 className={`mt-1.5 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[42px]" : "text-[30px]"}`}>
          O que vamos
          <br />
          criar hoje? ✨
        </h1>

        <Link
          href="/chat"
          className={`mt-5 block rounded-[22px] relative overflow-hidden text-white bg-brand-grad-hero shadow-[0_20px_40px_-20px_oklch(0.55_0.24_340/0.45)] ${desktop ? "p-7 max-w-[640px]" : "p-[18px]"}`}
        >
          <div className="flex items-center gap-1.5 opacity-90 text-[11px] font-bold uppercase tracking-[0.08em]">
            ✨ Nova conversa
          </div>
          <div className={`mt-2.5 font-bold tracking-[-0.015em] leading-[1.25] ${desktop ? "text-[24px]" : "text-[19px]"}`}>
            &ldquo;Sobe a foto do produto, eu cuido do resto. 💅&rdquo;
          </div>
          <div className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-bold">
            Abrir chat <ArrowRight size={14} strokeWidth={1.7} />
          </div>
        </Link>
      </div>

      <div className={`mt-7 ${desktop ? "" : "px-4"}`}>
        <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
          Atalhos 💕
        </div>
        <div className={`grid gap-2.5 ${desktop ? "grid-cols-4 max-w-[920px]" : "grid-cols-2"}`}>
          {VISIBLE_AGENTS.map((a) => (
            <ShortcutCard key={a.id} agent={a.id} onStart={start} />
          ))}
        </div>
      </div>

      <div className={`mt-7 grid gap-5 ${desktop ? "grid-cols-2 max-w-[920px]" : "grid-cols-1 px-4"}`}>
        <SectionLink
          href="/produtos"
          title="Seus produtos 📦"
          icon={Package}
          empty={products.length === 0}
          emptyHint="Manda uma foto pro chat com a Informação pra criar a primeira ficha. 💄"
        >
          <div className="flex flex-col gap-2 mt-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-spark-surface-sunken hover:bg-spark-surface transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-spark-surface flex items-center justify-center text-spark-ink-70">
                  <Package size={16} strokeWidth={1.7} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold truncate">{p.name}</div>
                  <div className="text-[11px] text-spark-ink-50 truncate">{p.category ?? "—"}</div>
                </div>
                <div className="text-[10.5px] text-spark-ink-35 font-mono">{timeAgo(p.created_at)}</div>
              </Link>
            ))}
          </div>
        </SectionLink>

        <SectionLink
          href="/news"
          title="News da Aline 📰"
          icon={Newspaper}
          empty={news.length === 0}
          emptyHint="Quando a Aline publicar uma nota, ela aparece aqui. ✨"
        >
          <div className="flex flex-col gap-2 mt-3">
            {news.map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.slug}`}
                className="p-2.5 rounded-xl bg-spark-surface-sunken hover:bg-spark-surface transition-colors block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] font-bold text-spark-brand">
                    {n.category}
                  </span>
                  {n.is_new && (
                    <span className="text-[9px] uppercase font-bold px-1.5 rounded-md bg-good text-white">
                      Novo
                    </span>
                  )}
                </div>
                <div className="text-[13px] font-bold line-clamp-2 leading-snug">{n.title}</div>
                <div className="text-[11px] text-spark-ink-50 mt-1 font-mono">
                  {n.reading_minutes}min · {timeAgo(n.published_at)}
                </div>
              </Link>
            ))}
          </div>
        </SectionLink>
      </div>
    </div>
  );
}

function SectionLink({
  href,
  title,
  icon: Icon,
  empty,
  emptyHint,
  children,
}: {
  href: string;
  title: string;
  icon: typeof Package;
  empty: boolean;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[12px] font-bold text-spark-ink tracking-[0.04em] uppercase">
          <Icon size={14} strokeWidth={1.7} />
          {title}
        </div>
        <Link href={href} className="text-[12px] font-semibold text-spark-brand inline-flex items-center gap-1">
          Abrir <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      {empty ? (
        <div className="mt-3 p-4 rounded-xl bg-spark-surface-sunken text-[12.5px] text-spark-ink-50 leading-snug">
          {emptyHint}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function HomeMobile() {
  return (
    <>
      <AppHeader />
      <HomeBody />
      <BottomNav active="home" />
    </>
  );
}

function HomeDesktop() {
  return <HomeBody desktop />;
}

export default function HomePage() {
  return <ResponsiveShell mobile={<HomeMobile />} desktop={<HomeDesktop />} active="home" />;
}
