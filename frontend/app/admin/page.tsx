import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getCounts() {
  const supabase = await getSupabaseServer();
  const [news, videos, lives, users] = await Promise.all([
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("education_videos").select("id", { count: "exact", head: true }),
    supabase.from("live_events").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    news: news.count ?? 0,
    videos: videos.count ?? 0,
    lives: lives.count ?? 0,
    users: users.count ?? 0,
  };
}

export default async function AdminHome() {
  const counts = await getCounts();
  return (
    <div className="max-w-[920px] mx-auto">
      <h1 className="text-[28px] lg:text-[34px] font-extrabold tracking-[-0.02em]">
        Painel admin ✨
      </h1>
      <p className="text-[14px] text-spark-ink-50 mt-2">
        Gerencie o que aparece pra todas as alunas. Mudanças entram em ar instantaneamente.
      </p>

      <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Notícias publicadas" value={counts.news} emoji="📰" />
        <StatCard label="Videoaulas" value={counts.videos} emoji="🎓" />
        <StatCard label="Lives ao vivo" value={counts.lives} emoji="🔴" />
        <StatCard label="Alunas cadastradas" value={counts.users} emoji="💖" />
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard
          href="/admin/news"
          emoji="📰"
          title="Gerenciar News"
          desc="Criar, editar e despublicar artigos do jornal da Yara."
        />
        <ActionCard
          href="/admin/educacao"
          emoji="🎓"
          title="Gerenciar Educação"
          desc="Adicionar videoaulas do YouTube, organizar categorias."
        />
        <ActionCard
          href="/admin/ao-vivo"
          emoji="🔴"
          title="Agendar Lives"
          desc="Marcar encontros ao vivo via YouTube Live. Replay automático."
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-5">
      <div className="text-[24px]">{emoji}</div>
      <div className="mt-2 text-[28px] font-extrabold font-mono tracking-tight">{value}</div>
      <div className="text-[12px] text-spark-ink-50 mt-0.5">{label}</div>
    </div>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-spark-surface border border-spark-hairline p-5 hover:border-spark-brand/40 hover:bg-spark-brand-soft/40 transition-colors block"
    >
      <div className="text-[28px]">{emoji}</div>
      <div className="mt-2 text-[16px] font-extrabold">{title}</div>
      <p className="text-[13px] text-spark-ink-50 mt-1">{desc}</p>
    </Link>
  );
}
