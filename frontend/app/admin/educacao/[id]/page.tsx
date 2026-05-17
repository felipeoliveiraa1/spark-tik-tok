import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { EducacaoForm } from "../_educacao-form";
import { youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function EditarAulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("education_videos")
    .select("*")
    .eq("slug", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <EducacaoForm
      mode="edit"
      originalId={data.slug}
      initial={{
        slug: data.slug,
        title: data.title,
        description: data.description ?? "",
        category: data.category ?? "",
        youtube_url: data.youtube_id ? youtubeWatchUrl(data.youtube_id) : "",
        cover_url: data.cover_url ?? "",
        duration_seconds: data.duration_seconds ?? 0,
        order_index: data.order_index ?? 0,
        is_published: data.is_published,
      }}
    />
  );
}
