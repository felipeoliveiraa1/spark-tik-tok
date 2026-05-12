"use client";

import * as React from "react";
import { type AgentId } from "@/lib/agents";

/**
 * Lightweight conversation + folder store, persisted in localStorage.
 *
 * This is the MVP: client-only, works offline, migrates 1-to-1 to Supabase
 * tables (`conversations`, `conversation_folders`) when auth lands. We expose
 * a `useConversationStore()` hook that subscribes to changes across tabs via
 * the `storage` event.
 *
 * Schema kept intentionally flat and small — agents will reference
 * conversation.id when persisting their artefacts in the backend.
 */

export type Folder = {
  id: string;
  name: string;
  /** Ordering inside the sidebar */
  order: number;
  /** Default folder cannot be deleted */
  isDefault?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  agent: AgentId;
  folderId: string;
  /** Last message preview */
  preview: string;
  /** ISO timestamp of the last activity */
  updatedAt: string;
  /** Total message count (for the sidebar badge / sort) */
  messageCount: number;
};

export type StoreSnapshot = {
  folders: Folder[];
  conversations: Conversation[];
};

const STORAGE_KEY = "spark.conversations.v1";

const DEFAULT_FOLDER_ID = "geral";

const SEED: StoreSnapshot = {
  folders: [{ id: DEFAULT_FOLDER_ID, name: "Geral", order: 0, isDefault: true }],
  conversations: [
    {
      id: "c1",
      title: "NAC Always Fit",
      agent: "script",
      folderId: DEFAULT_FOLDER_ID,
      preview: "10 hooks com humor brasileiro pro suplemento…",
      updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      messageCount: 14,
    },
    {
      id: "c2",
      title: "Skincare virais essa semana",
      agent: "viral",
      folderId: DEFAULT_FOLDER_ID,
      preview: "Trouxe 5 vídeos top de beleza no BR…",
      updatedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
      messageCount: 6,
    },
    {
      id: "c3",
      title: "Como ativo afiliados na loja?",
      agent: "help",
      folderId: DEFAULT_FOLDER_ID,
      preview: "No painel seller-br, vai em Marketing → Afiliados…",
      updatedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
      messageCount: 4,
    },
  ],
};

function loadFromStorage(): StoreSnapshot {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.conversations)) return SEED;
    // Always ensure the default folder exists.
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
    // quota / private mode — silently ignore
  }
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// =================================================================
// React hook
// =================================================================

export function useConversationStore() {
  const [snapshot, setSnapshot] = React.useState<StoreSnapshot>(SEED);

  // Hydrate from localStorage on mount; mirror cross-tab edits.
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

  // ----- folders -----

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
          // Move orphaned conversations to the default folder.
          conversations: s.conversations.map((c) =>
            c.folderId === id ? { ...c, folderId: DEFAULT_FOLDER_ID } : c,
          ),
        };
      });
    },
    [mutate],
  );

  // ----- conversations -----

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
  };
}
