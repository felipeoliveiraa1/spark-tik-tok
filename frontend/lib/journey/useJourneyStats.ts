"use client";

import * as React from "react";
import type { CharacterStage } from "@/lib/journey/character-stage";

export type JourneyBadge = {
  slug: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  xp_bonus: number;
  earned_at: string;
};

export type JourneyStats = {
  xp_total: number;
  character_stage: CharacterStage;
  journeys_completed_count: number;
  lessons_completed_count: number;
  proofs_approved_count: number;
  badges: JourneyBadge[];
};

/**
 * Hook compartilhado pra carregar stats agregadas da aluna.
 * Tem refresh manual e auto-refresh opcional.
 */
export function useJourneyStats(opts?: { autoRefreshMs?: number }) {
  const [stats, setStats] = React.useState<JourneyStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch("/api/me/journey-stats", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as JourneyStats;
        setStats(j);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    if (opts?.autoRefreshMs && opts.autoRefreshMs > 0) {
      const interval = window.setInterval(() => void refresh(), opts.autoRefreshMs);
      return () => window.clearInterval(interval);
    }
  }, [refresh, opts?.autoRefreshMs]);

  return { stats, loading, refresh };
}
