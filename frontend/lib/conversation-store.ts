"use client";

import * as React from "react";
import { type AgentId } from "@/lib/agents";

/**
 * Conversation + folder store backed by Supabase (via /api/conversations,
 * /api/folders). All reads go through a single SWR-like fetch on mount; writes
 * use optimistic mutations so the UI stays snappy.
 */

export type Folder = {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  agent: AgentId;
  folderId: string | null;
  preview: string;
  updatedAt: string;
  messageCount: number;
};

export type MessageAttachment = {
  url: string;
  mime?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: MessageAttachment[] | null;
  createdAt: string;
};

type ApiFolder = {
  id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

type ApiConversation = {
  id: string;
  agent: AgentId;
  folder_id: string | null;
  title: string;
  preview: string;
  message_count: number;
  updated_at: string;
  created_at: string;
};

type ApiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: MessageAttachment[] | null;
  created_at: string;
};

function adaptFolder(f: ApiFolder): Folder {
  return { id: f.id, name: f.name, order: f.sort_order, isDefault: f.is_default };
}

function adaptConversation(c: ApiConversation): Conversation {
  return {
    id: c.id,
    title: c.title,
    agent: c.agent,
    folderId: c.folder_id,
    preview: c.preview,
    updatedAt: c.updated_at,
    messageCount: c.message_count,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// =================================================================
// Store hook — list / mutate folders + conversations
// =================================================================

export function useConversationStore() {
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const data = await fetchJson<{ folders: ApiFolder[]; conversations: ApiConversation[] }>(
        "/api/conversations",
      );
      setFolders(data.folders.map(adaptFolder));
      setConversations(data.conversations.map(adaptConversation));
    } catch {
      /* user not auth'd or transient failure — sidebar just stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const defaultFolderId = folders.find((f) => f.isDefault)?.id ?? null;

  const createFolder = React.useCallback(async (name: string) => {
    const created = await fetchJson<ApiFolder>("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const folder = adaptFolder(created);
    setFolders((prev) => [...prev, folder]);
    return folder.id;
  }, []);

  const renameFolder = React.useCallback(async (id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    await fetchJson(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
  }, []);

  const deleteFolder = React.useCallback(
    async (id: string) => {
      const fallbackId = defaultFolderId;
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setConversations((prev) =>
        prev.map((c) => (c.folderId === id ? { ...c, folderId: fallbackId } : c)),
      );
      await fetchJson(`/api/folders/${id}`, { method: "DELETE" });
    },
    [defaultFolderId],
  );

  const createConversation = React.useCallback(
    async (input: { agent: AgentId; title?: string; folderId?: string | null }) => {
      const created = await fetchJson<ApiConversation>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({
          agent: input.agent,
          title: input.title,
          folder_id: input.folderId ?? null,
        }),
      });
      const conv = adaptConversation(created);
      setConversations((prev) => [conv, ...prev]);
      return conv.id;
    },
    [],
  );

  const renameConversation = React.useCallback(async (id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetchJson(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  }, []);

  const moveConversation = React.useCallback(async (id: string, folderId: string | null) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, folderId } : c)));
    await fetchJson(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ folder_id: folderId }),
    });
  }, []);

  const deleteConversation = React.useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      try {
        await fetchJson(`/api/conversations/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("delete conversation failed", err);
        // Reverte a remoção otimista se o servidor falhou.
        await refresh();
        throw err;
      }
    },
    [refresh],
  );

  const touchConversation = React.useCallback(
    (id: string, patch: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
        ),
      );
    },
    [],
  );

  return {
    folders,
    conversations,
    loading,
    defaultFolderId,
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    createConversation,
    renameConversation,
    moveConversation,
    deleteConversation,
    touchConversation,
  };
}

// =================================================================
// Per-conversation message hook
// =================================================================

export function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchJson<{ messages: ApiMessage[] }>(
          `/api/conversations/${conversationId}/messages`,
        );
        if (cancelled) return;
        setMessages(
          data.messages
            .filter((m): m is ApiMessage & { role: "user" | "assistant" } => m.role !== "system")
            .map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              attachments: m.attachments ?? null,
              createdAt: m.created_at,
            })),
        );
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const appendLocal = React.useCallback(
    (msg: Omit<ChatMessage, "id" | "createdAt" | "attachments"> & { attachments?: MessageAttachment[] | null }) => {
      const full: ChatMessage = {
        attachments: msg.attachments ?? null,
        role: msg.role,
        content: msg.content,
        id: `tmp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, full]);
      return full.id;
    },
    [],
  );

  const updateLastLocal = React.useCallback((patch: Partial<ChatMessage>) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });
  }, []);

  return { messages, loading, appendLocal, updateLastLocal };
}
