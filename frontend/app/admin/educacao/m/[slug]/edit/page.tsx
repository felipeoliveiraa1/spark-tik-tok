import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ModuleForm } from "../../../_module-form";

export const dynamic = "force-dynamic";

export default async function EditarModuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("education_modules")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();

  return (
    <ModuleForm
      mode="edit"
      originalSlug={data.slug}
      initial={{
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle ?? "",
        description: data.description ?? "",
        cover_url: data.cover_url ?? "",
        accent: (data.accent ?? "rose") as "rose" | "peach" | "lilac",
        order_index: data.order_index ?? 0,
        is_published: data.is_published,
      }}
    />
  );
}
