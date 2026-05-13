"use client";

import * as React from "react";
import { type AgentId } from "@/lib/agents";

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
  folderId: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type StoreSnapshot = {
  folders: Folder[];
  conversations: Conversation[];
};

const STORAGE_KEY = "spark.conversations.v1";
const MESSAGES_KEY = "spark.messages.v1";

const DEFAULT_FOLDER_ID = "geral";

const SEED: StoreSnapshot = {
  folders: [{ id: DEFAULT_FOLDER_ID, name: "Geral", order: 0, isDefault: true }],
  conversations: [],
};

function loadFromStorage(): StoreSnapshot {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.conversations)) return SEED;
    if (!parsed.folders.some((f) => f.isDefault)) {
      parsed.folders.unshift(SEED.folders[0]);
    }
    return parsed;
  } catch {
    return SEED;
  }
}

function saveToStorage(snapshot: StoreSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode — ignore */
  }
}

function loadMessages(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

function saveMessages(all: Record<string, ChatMessage[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function useConversationStore() {
  const [snapshot, setSnapshot] = React.useState<StoreSnapshot>(SEED);

  React.useEffect(() => {
    setSnapshot(loadFromStorage());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSnapshot(loadFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = React.useCallback((updater: (s: StoreSnapshot) => StoreSnapshot) => {
    setSnapshot((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const createFolder = React.useCallback(
    (name: string) => {
      const id = randomId("folder");
      mutate((s) => ({
        ...s,
        folders: [...s.folders, { id, name: name.trim() || "Sem nome", order: s.folders.length }],
      }));
      return id;
    },
    [mutate],
  );

  const renameFolder = React.useCallback(
    (id: string, name: string) => {
      mutate((s) => ({
        ...s,
        folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
      }));
    },
    [mutate],
  );

  const deleteFolder = React.useCallback(
    (id: string) => {
      mutate((s) => {
        const folder = s.folders.find((f) => f.id === id);
        if (!folder || folder.isDefault) return s;
        return {
          folders: s.folders.filter((f) => f.id !== id),
          conversations: s.conversations.map((c) =>
            c.folderId === id ? { ...c, folderId: DEFAULT_FOLDER_ID } : c,
          ),
        };
      });
    },
    [mutate],
  );

  const createConversation = React.useCallback(
    (input: { agent: AgentId; title?: string; folderId?: string }) => {
      const id = randomId("conv");
      mutate((s) => ({
        ...s,
        conversations: [
          {
            id,
            title: input.title?.trim() || "Nova conversa",
            agent: input.agent,
            folderId: input.folderId ?? DEFAULT_FOLDER_ID,
            preview: "",
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
          ...s.conversations,
        ],
      }));
      return id;
    },
    [mutate],
  );

  const renameConversation = React.useCallback(
    (id: string, title: string) => {
      mutate((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
      }));
    },
    [mutate],
  );

  const moveConversation = React.useCallback(
    (id: string, folderId: string) => {
      mutate((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, folderId } : c)),
      }));
    },
    [mutate],
  );

  const deleteConversation = React.useCallback(
    (id: string) => {
      mutate((s) => ({
        ...s,
        conversations: s.conversations.filter((c) => c.id !== id),
      }));
      const all = loadMessages();
      delete all[id];
      saveMessages(all);
    },
    [mutate],
  );

  const touchConversation = React.useCallback(
    (id: string, patch: { preview?: string; messageCount?: number; title?: string }) => {
      mutate((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      }));
    },
    [mutate],
  );

  return {
    folders: snapshot.folders,
    conversations: snapshot.conversations,
    defaultFolderId: DEFAULT_FOLDER_ID,
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

export function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  React.useEffect(() => {
    const all = loadMessages();
    setMessages(all[conversationId] ?? []);
  }, [conversationId]);

  const writeAll = React.useCallback(
    (next: ChatMessage[]) => {
      setMessages(next);
      const all = loadMessages();
      all[conversationId] = next;
      saveMessages(all);
    },
    [conversationId],
  );

  const append = React.useCallback(
    (msg: Omit<ChatMessage, "id" | "createdAt">) => {
      const full: ChatMessage = {
        ...msg,
        id: randomId("msg"),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, full];
        const all = loadMessages();
        all[conversationId] = next;
        saveMessages(all);
        return next;
      });
      return full.id;
    },
    [conversationId],
  );

  const updateLast = React.useCallback(
    (patch: Partial<ChatMessage>) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], ...patch };
        const all = loadMessages();
        all[conversationId] = next;
        saveMessages(all);
        return next;
      });
    },
    [conversationId],
  );

  return { messages, append, updateLast, writeAll };
}
