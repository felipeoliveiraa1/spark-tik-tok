import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { AoVivoForm } from "../_ao-vivo-form";
import { youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function EditarLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("live_events")
    .select("*")
    .eq("slug", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <AoVivoForm
      mode="edit"
      originalId={data.slug}
      initial={{
        slug: data.slug,
        title: data.title,
        description: data.description ?? "",
        youtube_url: data.youtube_id ? youtubeWatchUrl(data.youtube_id) : "",
        cover_url: data.cover_url ?? "",
        starts_at: data.starts_at?.slice(0, 16) ?? "",
        duration_minutes: data.duration_minutes ?? 60,
        is_published: data.is_published,
      }}
    />
  );
}
