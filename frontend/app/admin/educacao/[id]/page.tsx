import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { LessonForm } from "../_lesson-form";
import { youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [lessonRes, modulesRes] = await Promise.all([
    supabase.from("education_videos").select("*").eq("slug", id).maybeSingle(),
    supabase
      .from("education_modules")
      .select("id, slug, title, order_index")
      .order("order_index", { ascending: true }),
  ]);

  const data = lessonRes.data;
  if (!data) notFound();

  const checklistItems = Array.isArray(data.checklist_items)
    ? (data.checklist_items as { text: string }[])
    : [];

  return (
    <LessonForm
      mode="edit"
      originalId={data.slug}
      modules={modulesRes.data ?? []}
      initial={{
        slug: data.slug,
        title: data.title,
        description: data.description ?? "",
        category: data.category ?? "",
        kind: (data.kind ?? "video") as "video" | "rich" | "checklist",
        youtube_url: data.youtube_id ? youtubeWatchUrl(data.youtube_id) : "",
        body_md: data.body_md ?? "",
        checklist_items: checklistItems,
        cover_url: data.cover_url ?? "",
        duration_seconds: data.duration_seconds ?? 0,
        order_index: data.order_index ?? 0,
        is_published: data.is_published,
        module_id: data.module_id ?? null,
      }}
    />
  );
}
