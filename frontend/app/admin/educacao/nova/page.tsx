import { getSupabaseServer } from "@/lib/supabase-server";
import { LessonForm } from "../_lesson-form";

export const dynamic = "force-dynamic";

export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const { module: moduleSlug } = await searchParams;
  const supabase = await getSupabaseServer();

  const { data: modules } = await supabase
    .from("education_modules")
    .select("id, slug, title, order_index")
    .order("order_index", { ascending: true });

  const moduleOptions = modules ?? [];

  // Se vier com ?module=slug, pré-seleciona
  const preselectedModuleId = moduleSlug
    ? moduleOptions.find((m) => m.slug === moduleSlug)?.id ?? null
    : null;

  // Próximo order_index dentro do módulo (se houver)
  let nextOrder = 0;
  if (preselectedModuleId) {
    const { data: lastLesson } = await supabase
      .from("education_videos")
      .select("order_index")
      .eq("module_id", preselectedModuleId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    nextOrder = ((lastLesson?.order_index as number) ?? -1) + 1;
  }

  return (
    <LessonForm
      mode="create"
      modules={moduleOptions}
      initial={{
        module_id: preselectedModuleId,
        order_index: nextOrder,
      }}
    />
  );
}
