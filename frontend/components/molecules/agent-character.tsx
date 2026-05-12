import { Search, Flame, Pen, MessageCircle } from "lucide-react";
import { AGENTS, type AgentId } from "@/lib/agents";

/**
 * Stylized SVG portraits for the four Spark agents. Pure SVG so we don't
 * ship any image assets and they recolor cleanly across light/dark modes.
 *
 * Each character has the same composition (rounded square frame, abstract
 * face, glyph badge in the corner) but its own color palette + accent shape
 * to feel distinct at a glance.
 */

type Props = {
  agent: AgentId;
  size?: number;
  className?: string;
};

export function AgentCharacter({ agent, size = 96, className }: Props) {
  const a = AGENTS[agent];

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: a.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <defs>
          <radialGradient id={`bg-${agent}`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={a.bg} stopOpacity={0} />
            <stop offset="100%" stopColor={a.fg} stopOpacity={0.18} />
          </radialGradient>
        </defs>

        {/* atmosphere */}
        <rect width="100" height="100" fill={`url(#bg-${agent})`} />

        {/* accent shape — unique per agent */}
        {agent === "info" && <AccentInfo color={a.fg} />}
        {agent === "viral" && <AccentViral color={a.fg} />}
        {agent === "script" && <AccentScript color={a.fg} />}
        {agent === "help" && <AccentHelp color={a.fg} />}

        {/* head + body silhouette (shared) */}
        <Avatar color={a.fg} />
      </svg>

      {/* corner glyph badge */}
      <div
        style={{
          position: "absolute",
          right: size * 0.08,
          bottom: size * 0.08,
          width: size * 0.32,
          height: size * 0.32,
          borderRadius: size * 0.1,
          background: "rgba(255,255,255,0.92)",
          color: a.fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px -6px rgba(20,20,40,0.25)",
        }}
      >
        <a.Icon size={size * 0.18} strokeWidth={1.8} />
      </div>
    </div>
  );
}

// =================================================================
// Shared avatar silhouette
// =================================================================

function Avatar({ color }: { color: string }) {
  return (
    <g opacity={0.92}>
      {/* shoulders */}
      <path
        d="M 14 100 C 14 78 32 64 50 64 C 68 64 86 78 86 100 Z"
        fill={color}
        opacity={0.18}
      />
      {/* head */}
      <circle cx="50" cy="42" r="20" fill={color} opacity={0.25} />
      {/* highlight */}
      <circle cx="44" cy="36" r="6" fill="white" opacity={0.35} />
    </g>
  );
}

// =================================================================
// Accent shapes per agent
// =================================================================

function AccentInfo({ color }: { color: string }) {
  return (
    <g opacity={0.55}>
      <circle cx="22" cy="22" r="6" fill={color} opacity={0.25} />
      <circle cx="78" cy="28" r="4" fill={color} opacity={0.35} />
      <circle cx="84" cy="16" r="2.5" fill={color} opacity={0.45} />
      {/* lens */}
      <circle cx="32" cy="34" r="7" fill="none" stroke={color} strokeWidth="2" opacity={0.5} />
      <line x1="37" y1="39" x2="44" y2="46" stroke={color} strokeWidth="2" opacity={0.5} strokeLinecap="round" />
    </g>
  );
}

function AccentViral({ color }: { color: string }) {
  return (
    <g opacity={0.5}>
      {/* flame burst */}
      <path
        d="M 78 18 Q 82 26 78 32 Q 86 30 88 22 Q 86 14 78 18 Z"
        fill={color}
        opacity={0.7}
      />
      <path
        d="M 18 28 Q 14 22 18 16 Q 22 22 18 28 Z"
        fill={color}
        opacity={0.5}
      />
      <circle cx="74" cy="34" r="2" fill={color} opacity={0.7} />
      <circle cx="84" cy="40" r="1.5" fill={color} opacity={0.6} />
      {/* trend arrow */}
      <path
        d="M 14 56 L 24 50 L 30 54 L 40 44"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.55}
      />
    </g>
  );
}

function AccentScript({ color }: { color: string }) {
  return (
    <g opacity={0.55}>
      {/* speech bubble with lines */}
      <rect
        x="62"
        y="10"
        width="28"
        height="20"
        rx="6"
        fill={color}
        opacity={0.18}
      />
      <line x1="68" y1="17" x2="84" y2="17" stroke={color} strokeWidth="1.5" opacity={0.6} strokeLinecap="round" />
      <line x1="68" y1="22" x2="80" y2="22" stroke={color} strokeWidth="1.5" opacity={0.6} strokeLinecap="round" />
      {/* pen */}
      <line x1="14" y1="20" x2="22" y2="12" stroke={color} strokeWidth="2.5" opacity={0.55} strokeLinecap="round" />
      <path d="M 22 12 L 24 14 L 16 22 L 14 20 Z" fill={color} opacity={0.45} />
      {/* sparkles */}
      <circle cx="58" cy="38" r="2" fill={color} opacity={0.6} />
      <circle cx="86" cy="44" r="1.5" fill={color} opacity={0.55} />
    </g>
  );
}

function AccentHelp({ color }: { color: string }) {
  return (
    <g opacity={0.55}>
      {/* question marks floating */}
      <text x="78" y="22" fontSize="14" fontWeight="700" fill={color} opacity={0.7}>
        ?
      </text>
      <text x="18" y="32" fontSize="10" fontWeight="700" fill={color} opacity={0.6}>
        ?
      </text>
      {/* heart (mentor warmth) */}
      <path
        d="M 78 38 C 76 35 71 36 71 40 C 71 43 75 46 78 48 C 81 46 85 43 85 40 C 85 36 80 35 78 38 Z"
        fill={color}
        opacity={0.55}
      />
      <circle cx="14" cy="50" r="1.5" fill={color} opacity={0.5} />
    </g>
  );
}
