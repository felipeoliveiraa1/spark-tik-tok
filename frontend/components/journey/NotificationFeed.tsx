"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  icon_url: string | null;
  ref_url: string | null;
  read_at: string | null;
  created_at: string;
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  const m = Math.round(ms / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

const KIND_EMOJI: Record<string, string> = {
  badge_earned: "🏆",
  proof_submitted: "📤",
  proof_approved: "✅",
  proof_rejected: "❌",
  journey_complete: "🎉",
  comment_reply: "💬",
};

/**
 * Sininho de notificacoes pra cabecalho. Mostra count unread, abre
 * dropdown com lista. Marca todas lidas quando abrir.
 */
export function NotificationFeed({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const ref = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/me/journey-notifications", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as {
          notifications: Notification[];
          unread_count: number;
        };
        setNotifications(j.notifications);
        setUnreadCount(j.unread_count);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // Poll a cada 60s
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  // Click fora fecha
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
    );
    await fetch("/api/me/journey-notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        className="relative w-9 h-9 rounded-full bg-spark-surface border border-spark-hairline shadow-rest flex items-center justify-center hover:bg-spark-surface-sunken transition-colors"
      >
        <Bell size={15} strokeWidth={2.2} className="text-spark-ink-70" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-spark-brand text-white text-[9px] font-extrabold flex items-center justify-center"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[90vw] bg-spark-surface border border-spark-hairline rounded-spark-xl shadow-lift overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-spark-hairline flex items-center justify-between">
            <div>
              <div className="text-eyebrow text-spark-ink-50">Notificações</div>
              <div className="text-[12.5px] text-spark-ink-70">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-spark-brand-deep hover:underline inline-flex items-center gap-1"
              >
                <Check size={11} /> Marcar lidas
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center text-spark-ink-50">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-spark-ink-50 text-[12.5px]">
                Sem notificações ainda.
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    {n.ref_url ? (
                      <Link
                        href={n.ref_url}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 hover:bg-spark-surface-sunken/50 transition-colors border-b border-spark-hairline",
                          !n.read_at && "bg-spark-brand-soft/20",
                        )}
                      >
                        <NotificationContent n={n} />
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-spark-hairline",
                          !n.read_at && "bg-spark-brand-soft/20",
                        )}
                      >
                        <NotificationContent n={n} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({ n }: { n: Notification }) {
  return (
    <>
      <span className="text-xl shrink-0" aria-hidden style={{ lineHeight: 1 }}>
        {KIND_EMOJI[n.kind] ?? "✨"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-spark-ink text-[12.5px]">{n.title}</div>
        {n.body && (
          <div className="text-[11.5px] text-spark-ink-70 mt-0.5 line-clamp-2">{n.body}</div>
        )}
        <div className="text-[10.5px] text-spark-ink-35 mt-1">{fmtRelative(n.created_at)}</div>
      </div>
      {!n.read_at && (
        <span
          className="w-2 h-2 rounded-full bg-spark-brand mt-1.5 shrink-0"
          aria-label="não lida"
        />
      )}
    </>
  );
}
