import { Sparkle } from "lucide-react";

/**
 * Slim banner shown at the top of the app while we don't have real backend data.
 * Hidden on the public landing/login to keep the marketing pages clean.
 */
export function PreviewBanner() {
  return (
    <div className="bg-brand-grad text-white text-[11px] font-semibold px-4 py-1.5 flex items-center justify-center gap-1.5 tracking-[-0.005em]">
      <Sparkle size={12} strokeWidth={1.7} />
      Preview · dados de exemplo · em breve com IA conectada
    </div>
  );
}
