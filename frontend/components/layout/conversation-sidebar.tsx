"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight as ArrowRightIcon,
  Check,
  X,
} from "lucide-react";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { AGENTS } from "@/lib/agents";
import {
  useConversationStore,
  type Conversation,
  type Folder as FolderType,
} from "@/lib/conversation-store";
import { cn } from "@/lib/cn";

type Profile = { name: string | null; email: string; plan_active: boolean };

function useProfile() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { profile: Profile | null };
        if (!cancelled) setProfile(data.profile);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return profile;
}

/**
 * Sidebar estilo ChatGPT — lista de pastas (acordeão) com conversas dentro.
 * Suporta criar pasta, renomear, deletar, e mover conversa entre pastas via
 * menu de 3 pontinhos.
 *
 * Persistência via `useConversationStore` (localStorage). Quando ligarmos auth
 * real, troca o storage por Supabase sem mexer nesse componente.
 */

type Props = {
  /** Chamado quando uma conversa é selecionada — útil pra fechar o drawer mobile. */
  onSelectConversation?: () => void;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function ConversationSidebar({ onSelectConversation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const store = useConversationStore();
  const profile = useProfile();

  const activeId = React.useMemo(() => {
    const match = pathname?.match(/^\/chat\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const conversationsByFolder = React.useMemo(() => {
    const map = new Map<string, Conversation[]>();
    for (const f of store.folders) map.set(f.id, []);
    const fallbackFolderId = store.defaultFolderId ?? store.folders[0]?.id ?? null;
    for (const c of [...store.conversations].sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
    )) {
      const targetId = c.folderId ?? fallbackFolderId;
      const bucket = targetId ? map.get(targetId) : undefined;
      bucket?.push(c);
    }
    return map;
  }, [store.conversations, store.folders, store.defaultFolderId]);

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const toggleCollapse = (folderId: string) =>
    setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }));

  const handleNewFolder = () => {
    const name = window.prompt("Nome da pasta:");
    if (name?.trim()) void store.createFolder(name);
  };

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "Você";
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = profile?.plan_active ? "Plano ativo" : "Plano inativo";

  return (
    <div className="flex flex-col h-full bg-spark-surface-elev">
      {/* Header */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/chat"
          onClick={onSelectConversation}
          className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-brand-grad text-white text-[13.5px] font-bold shadow-[0_6px_18px_-8px_oklch(0.5_0.22_305/0.5)]"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={16} strokeWidth={1.7} />
            Nova conversa
          </span>
          <ArrowRightIcon size={14} strokeWidth={1.7} />
        </Link>
      </div>

      {/* Folders + conversations */}
      <nav className="flex-1 overflow-auto px-2 pb-4">
        {store.folders.map((folder) => {
          const items = conversationsByFolder.get(folder.id) ?? [];
          const isCollapsed = collapsed[folder.id] === true;
          return (
            <FolderRow
              key={folder.id}
              folder={folder}
              conversations={items}
              collapsed={isCollapsed}
              activeConversationId={activeId}
              onToggle={() => toggleCollapse(folder.id)}
              onRenameFolder={(name) => void store.renameFolder(folder.id, name)}
              onDeleteFolder={
                folder.isDefault
                  ? undefined
                  : () => {
                      if (
                        window.confirm(
                          `Apagar a pasta "${folder.name}"? As conversas vão pra "Geral".`,
                        )
                      ) {
                        void store.deleteFolder(folder.id);
                      }
                    }
              }
              onSelectConversation={(id) => {
                router.push(`/chat/${id}`);
                onSelectConversation?.();
              }}
              onRenameConversation={(id, title) => void store.renameConversation(id, title)}
              onDeleteConversation={(id) => {
                if (window.confirm("Apagar esta conversa?")) {
                  void store.deleteConversation(id);
                  if (id === activeId) router.push("/chat");
                }
              }}
              onMoveConversation={(id, folderId) => void store.moveConversation(id, folderId)}
              allFolders={store.folders}
            />
          );
        })}

        <button
          onClick={handleNewFolder}
          className="w-full mt-2 px-3 py-2 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold text-spark-ink-70 hover:bg-spark-surface-sunken hover:text-spark-ink transition-colors"
        >
          <FolderPlus size={14} strokeWidth={1.7} />
          Nova pasta
        </button>
      </nav>

      {/* User footer */}
      <Link
        href="/conta"
        onClick={onSelectConversation}
        className="border-t border-spark-hairline px-3.5 py-3 flex items-center gap-2.5 hover:bg-spark-surface-sunken transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px]">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold truncate">{displayName}</div>
          <div className="text-[10.5px] text-spark-ink-50 font-mono truncate">{planLabel}</div>
        </div>
        <MoreHorizontal size={14} strokeWidth={1.7} className="text-spark-ink-50" />
      </Link>
    </div>
  );
}

// =================================================================
// FolderRow — pasta + conversas
// =================================================================

type FolderRowProps = {
  folder: FolderType;
  conversations: Conversation[];
  collapsed: boolean;
  activeConversationId: string | null;
  onToggle: () => void;
  onRenameFolder: (name: string) => void;
  onDeleteFolder?: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onMoveConversation: (id: string, folderId: string) => void;
  allFolders: FolderType[];
};

function FolderRow({
  folder,
  conversations,
  collapsed,
  activeConversationId,
  onToggle,
  onRenameFolder,
  onDeleteFolder,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onMoveConversation,
  allFolders,
}: FolderRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(folder.name);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(trimmed);
    else setName(folder.name);
    setEditing(false);
  };

  return (
    <div className="mb-1">
      <div className="group flex items-center gap-1 px-1 py-1 rounded-lg">
        <button
          onClick={onToggle}
          className="w-5 h-5 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={2} />
          ) : (
            <ChevronDown size={14} strokeWidth={2} />
          )}
        </button>
        <Folder size={13} strokeWidth={1.7} className="text-spark-ink-50 shrink-0" />
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setName(folder.name);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px] font-bold text-spark-ink"
          />
        ) : (
          <button
            onClick={onToggle}
            className="flex-1 min-w-0 text-left text-[12.5px] font-bold text-spark-ink-70 truncate hover:text-spark-ink transition-colors"
            onDoubleClick={() => setEditing(true)}
          >
            {folder.name}
          </button>
        )}
        <span className="text-[10.5px] text-spark-ink-35 font-mono">{conversations.length}</span>
        {!folder.isDefault && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-5 h-5 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={13} strokeWidth={1.7} />
            </button>
            {menuOpen && (
              <FolderMenu
                onClose={() => setMenuOpen(false)}
                onRename={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
                onDelete={
                  onDeleteFolder
                    ? () => {
                        setMenuOpen(false);
                        onDeleteFolder();
                      }
                    : undefined
                }
              />
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="ml-3.5 pl-2 border-l border-spark-hairline flex flex-col gap-0.5">
          {conversations.length === 0 ? (
            <div className="px-2.5 py-1.5 text-[11px] text-spark-ink-35 italic">vazia</div>
          ) : (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                isActive={c.id === activeConversationId}
                allFolders={allFolders}
                onSelect={() => onSelectConversation(c.id)}
                onRename={(title) => onRenameConversation(c.id, title)}
                onDelete={() => onDeleteConversation(c.id)}
                onMove={(folderId) => onMoveConversation(c.id, folderId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// =================================================================
// ConversationRow
// =================================================================

type ConversationRowProps = {
  conversation: Conversation;
  isActive: boolean;
  allFolders: FolderType[];
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMove: (folderId: string) => void;
};

function ConversationRow({
  conversation,
  isActive,
  allFolders,
  onSelect,
  onRename,
  onDelete,
  onMove,
}: ConversationRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(conversation.title);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);

  const a = AGENTS[conversation.agent];

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== conversation.title) onRename(trimmed);
    else setTitle(conversation.title);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors relative",
        isActive ? "bg-spark-surface-sunken" : "hover:bg-spark-surface-sunken/60",
      )}
    >
      <AgentCharacter agent={conversation.agent} size={22} />
      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitle(conversation.title);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px] font-semibold text-spark-ink"
          />
          <button
            onClick={commitTitle}
            className="w-5 h-5 flex items-center justify-center text-spark-brand"
          >
            <Check size={13} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="flex-1 min-w-0 text-left flex flex-col"
        >
          <span
            className={cn(
              "text-[12.5px] truncate",
              isActive ? "font-bold text-spark-ink" : "font-semibold text-spark-ink-70",
            )}
          >
            {conversation.title}
          </span>
          <span className="text-[10px] text-spark-ink-50" style={{ color: a.fg }}>
            {a.label} · {timeAgo(conversation.updatedAt)}
          </span>
        </button>
      )}

      {!editing && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-5 h-5 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={13} strokeWidth={1.7} />
        </button>
      )}

      {menuOpen && (
        <ConversationMenu
          onClose={() => {
            setMenuOpen(false);
            setMoveOpen(false);
          }}
          onRename={() => {
            setMenuOpen(false);
            setEditing(true);
          }}
          onDelete={() => {
            setMenuOpen(false);
            onDelete();
          }}
          moveOpen={moveOpen}
          onToggleMove={() => setMoveOpen((v) => !v)}
          folders={allFolders}
          currentFolderId={conversation.folderId}
          onMove={(folderId) => {
            onMove(folderId);
            setMenuOpen(false);
            setMoveOpen(false);
          }}
        />
      )}
    </div>
  );
}

// =================================================================
// Menus
// =================================================================

function MenuContainer({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute right-0 top-6 z-50 min-w-[180px] rounded-xl bg-spark-surface border border-spark-hairline shadow-[0_18px_40px_-22px_rgba(20,20,40,0.3)] py-1 text-[12.5px]"
    >
      {children}
    </div>
  );
}

function MenuItem({
  Icon,
  children,
  onClick,
  danger,
}: {
  Icon: typeof Pencil;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-spark-surface-sunken transition-colors",
        danger ? "text-bad" : "text-spark-ink",
      )}
    >
      <Icon size={14} strokeWidth={1.7} />
      <span className="font-semibold">{children}</span>
    </button>
  );
}

function FolderMenu({
  onClose,
  onRename,
  onDelete,
}: {
  onClose: () => void;
  onRename: () => void;
  onDelete?: () => void;
}) {
  return (
    <MenuContainer onClose={onClose}>
      <MenuItem Icon={Pencil} onClick={onRename}>
        Renomear pasta
      </MenuItem>
      {onDelete && (
        <MenuItem Icon={Trash2} onClick={onDelete} danger>
          Apagar pasta
        </MenuItem>
      )}
    </MenuContainer>
  );
}

function ConversationMenu({
  onClose,
  onRename,
  onDelete,
  moveOpen,
  onToggleMove,
  folders,
  currentFolderId,
  onMove,
}: {
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  moveOpen: boolean;
  onToggleMove: () => void;
  folders: FolderType[];
  currentFolderId: string | null;
  onMove: (folderId: string) => void;
}) {
  return (
    <MenuContainer onClose={onClose}>
      <MenuItem Icon={Pencil} onClick={onRename}>
        Renomear conversa
      </MenuItem>
      <button
        onClick={onToggleMove}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-spark-surface-sunken transition-colors text-spark-ink"
      >
        <Folder size={14} strokeWidth={1.7} />
        <span className="font-semibold flex-1 text-left">Mover pra pasta…</span>
        <ChevronRight
          size={12}
          strokeWidth={2}
          className={cn("transition-transform", moveOpen && "rotate-90")}
        />
      </button>
      {moveOpen && (
        <div className="pl-7 pr-2 pb-2 flex flex-col gap-0.5">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onMove(f.id)}
              disabled={f.id === currentFolderId}
              className={cn(
                "px-2 py-1.5 rounded-md text-left text-[12px] font-semibold transition-colors",
                f.id === currentFolderId
                  ? "bg-spark-surface-sunken text-spark-ink-50 cursor-default"
                  : "hover:bg-spark-surface-sunken text-spark-ink",
              )}
            >
              {f.name}
              {f.id === currentFolderId && (
                <X size={11} strokeWidth={2} className="inline ml-1 align-middle" />
              )}
            </button>
          ))}
        </div>
      )}
      <div className="my-1 mx-2 border-t border-spark-hairline" />
      <MenuItem Icon={Trash2} onClick={onDelete} danger>
        Apagar conversa
      </MenuItem>
    </MenuContainer>
  );
}
