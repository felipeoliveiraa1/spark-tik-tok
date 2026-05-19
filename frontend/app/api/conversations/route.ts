import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { AGENTS, type AgentId } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_AGENTS: AgentId[] = ["info", "viral", "script", "help"];

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: folders, error: folderErr }, { data: conversations, error: convErr }] = await Promise.all([
    supabase
      .from("conversation_folders")
      .select("id, name, is_default, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("conversations")
      .select("id, folder_id, agent, title, preview, message_count, created_at, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  if (folderErr || convErr) {
    return NextResponse.json(
      { error: folderErr?.message ?? convErr?.message ?? "db_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ folders: folders ?? [], conversations: conversations ?? [] });
}

type CreateBody = { agent?: AgentId; title?: string; folder_id?: string | null };

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const agent = body.agent && VALID_AGENTS.includes(body.agent) ? body.agent : null;
  if (!agent) return NextResponse.json({ error: "invalid_agent" }, { status: 400 });
  if (AGENTS[agent]?.hidden) {
    return NextResponse.json(
      { error: "agent_disabled", message: `Agente ${agent} está temporariamente desativado.` },
      { status: 403 },
    );
  }

  let folderId = body.folder_id ?? null;
  if (!folderId) {
    const { data: defaultFolder } = await supabase
      .from("conversation_folders")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    folderId = defaultFolder?.id ?? null;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      folder_id: folderId,
      agent,
      title: body.title?.trim() || "Nova conversa",
    })
    .select("id, folder_id, agent, title, preview, message_count, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
