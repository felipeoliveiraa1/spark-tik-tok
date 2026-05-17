import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { NewsForm } from "../_news-form";

export const dynamic = "force-dynamic";

export default async function EditarArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from("news").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();

  return (
    <NewsForm
      mode="edit"
      originalSlug={data.slug}
      initial={{
        slug: data.slug,
        title: data.title,
        category: data.category,
        excerpt: data.excerpt ?? "",
        cover_url: data.cover_url ?? "",
        body_md: data.body_md ?? "",
        reading_minutes: data.reading_minutes ?? 3,
        is_new: data.is_new ?? true,
        published_at: data.published_at,
      }}
    />
  );
}
