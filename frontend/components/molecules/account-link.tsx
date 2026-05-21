"use client";

import * as React from "react";
import Link from "next/link";

/**
 * Atalho redondo pro /conta — usado no trailing dos headers mobile.
 * Mostra a inicial da aluna (fetcha /api/me uma vez ao montar).
 */
export function AccountLink() {
  const [initial, setInitial] = React.useState<string>("👤");

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: { name?: string | null; email?: string } } | null) => {
        if (cancelled || !data?.profile) return;
        const src = data.profile.name?.trim() || data.profile.email?.split("@")[0] || "";
        if (src) setInitial(src.charAt(0).toUpperCase());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/conta"
      aria-label="Minha conta"
      className="w-10 h-10 rounded-full text-white flex items-center justify-center font-extrabold text-[14px] bg-brand-grad active:scale-95 transition-transform shadow-[0_4px_12px_-4px_oklch(0.55_0.24_340/0.45)]"
    >
      {initial}
    </Link>
  );
}
