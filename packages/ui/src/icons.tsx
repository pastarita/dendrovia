"use client";

import type { CSSProperties, ReactElement } from "react";

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

// ── Pillar Icons (simple fidelity — optimized for 16-20px sidebar use) ──────

export function ChronosIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <rect x="22" y="14" width="56" height="72" rx="5" fill="#d4a574"/>
      <ellipse cx="22" cy="36" rx="7" ry="18" fill="#8b7355"/>
      <ellipse cx="78" cy="64" rx="7" ry="18" fill="#8b7355"/>
      <line x1="28" y1="28" x2="72" y2="28" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="28" y1="50" x2="72" y2="50" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <line x1="28" y1="72" x2="72" y2="72" stroke="#8b7355" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M50,68 L50,50 L40,38 M50,50 L60,38" stroke="#4a3822" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="#7fa9f5" strokeWidth="2.5" opacity="0.6"/>
    </svg>
  );
}

export function ImaginariumIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <ellipse cx="22" cy="50" rx="8" ry="12" fill="#9b6dd8"/>
      <line x1="30" y1="50" x2="40" y2="50" stroke="#e5d4ff" strokeWidth="4" strokeLinecap="round"/>
      <polygon points="50,28 40,38 40,62 50,72 60,62 60,38" fill="none" stroke="#c6a0f6" strokeWidth="3"/>
      <line x1="60" y1="42" x2="82" y2="26" stroke="#c6a0f6" strokeWidth="3" strokeLinecap="round"/>
      <line x1="60" y1="50" x2="85" y2="50" stroke="#e5d4ff" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="60" y1="58" x2="82" y2="74" stroke="#9b6dd8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="85" cy="26" r="4" fill="#c6a0f6"/>
      <circle cx="88" cy="50" r="4.5" fill="#e5d4ff"/>
      <circle cx="85" cy="74" r="4" fill="#9b6dd8"/>
    </svg>
  );
}

export function ArchitectusIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <rect x="38" y="18" width="24" height="62" fill="#5a8dd8"/>
      <polygon points="50,8 32,22 68,22" fill="#8ab4f8"/>
      <rect x="34" y="80" width="32" height="6" fill="#5a8dd8"/>
      <line x1="76" y1="12" x2="24" y2="88" stroke="#f8c98a" strokeWidth="4" opacity="0.65" strokeLinecap="round"/>
      <line x1="50" y1="86" x2="40" y2="96" stroke="#8ab4f8" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="86" x2="60" y2="96" stroke="#8ab4f8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="5" fill="#1e3a5f" opacity="0.7"/>
    </svg>
  );
}

export function LudusIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <path d="M50,75 L50,55 M50,55 L40,42 M50,55 L60,42" stroke="#5fa876" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35"/>
      <circle cx="40" cy="42" r="3" fill="#5fa876" opacity="0.4"/>
      <circle cx="60" cy="42" r="3" fill="#5fa876" opacity="0.4"/>
      <rect x="25" y="48" width="50" height="28" rx="6" fill="#81c995"/>
      <path d="M34,62 L48,62 M41,55 L41,69" stroke="#5fa876" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="63" cy="56" r="5" fill="#b8e6c9"/>
      <circle cx="63" cy="68" r="5" fill="#b8e6c9"/>
    </svg>
  );
}

export function OculusIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <path d="M5,50 Q50,18 95,50 Q50,82 5,50 Z" fill="#f5a97f"/>
      <circle cx="50" cy="50" r="18" fill="#d88957"/>
      <polygon points="50,35 62,42.5 62,57.5 50,65 38,57.5 38,42.5" fill="#f5a97f" opacity="0.5"/>
      <circle cx="50" cy="50" r="9" fill="#5f3d2d"/>
      <circle cx="45" cy="45" r="3.5" fill="#ffd4b8"/>
      <path d="M5,50 Q50,18 95,50" stroke="#5f3d2d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M5,50 Q50,82 95,50" stroke="#5f3d2d" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function OperatusIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <rect x="20" y="78" width="60" height="8" rx="2" fill="#6b7280"/>
      <rect x="12" y="47" width="76" height="7" rx="3.5" fill="#6b7280"/>
      <path d="M50,54 L50,78" stroke="#6b7280" strokeWidth="6" strokeLinecap="round"/>
      <path d="M50,54 L34,70" stroke="#6b7280" strokeWidth="4" strokeLinecap="round"/>
      <path d="M50,54 L66,70" stroke="#6b7280" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="50" cy="35" r="18" fill="#9ca3af"/>
      <circle cx="50" cy="35" r="6" fill="#6b7280"/>
      <circle cx="84" cy="16" r="4" fill="#60a5fa"/>
    </svg>
  );
}

// ── Domain Icons (compact sidebar representations) ──────────────────────────

export function MuseumsIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <rect x="15" y="25" width="70" height="55" rx="2" fill="#4a3822" opacity="0.5"/>
      <rect x="22" y="80" width="56" height="6" fill="#8b7355"/>
      <rect x="25" y="30" width="8" height="50" fill="#d4a574"/>
      <rect x="67" y="30" width="8" height="50" fill="#d4a574"/>
      <path d="M25,30 Q50,6 75,30" stroke="#d4a574" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="50" cy="16" r="3" fill="#ffd43b" opacity="0.6"/>
      <rect x="40" y="42" width="20" height="16" rx="1" fill="#f5ead6" stroke="#8b7355" strokeWidth="1.5"/>
      <rect x="36" y="65" width="8" height="15" fill="#d4a574"/>
      <rect x="48" y="58" width="8" height="22" fill="#d4a574"/>
      <rect x="60" y="62" width="8" height="18" fill="#d4a574"/>
      <circle cx="40" cy="72" r="2" fill="#7fa9f5" opacity="0.6"/>
      <circle cx="64" cy="70" r="2" fill="#7fa9f5" opacity="0.6"/>
    </svg>
  );
}

export function ZoosIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <path d="M50,82 L50,48 M50,48 L38,34 M50,48 L62,34 M38,34 L30,24 M38,34 L44,24 M62,34 L56,24 M62,34 L70,24" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
      <circle cx="30" cy="24" r="2.5" fill="#7fa9f5" opacity="0.5"/>
      <circle cx="70" cy="24" r="2.5" fill="#7fa9f5" opacity="0.5"/>
      <rect x="20" y="82" width="60" height="5" rx="1" fill="#8b7355"/>
      <path d="M38,45 Q38,30 50,30 Q62,30 62,45 L62,82 L38,82 Z" fill="#f5ead6" opacity="0.7" stroke="#d4a574" strokeWidth="1.5"/>
      <circle cx="46" cy="55" r="3" fill="#69db7c"/>
      <circle cx="54" cy="62" r="2.5" fill="#69db7c" opacity="0.7"/>
      <circle cx="50" cy="72" r="2" fill="#69db7c" opacity="0.5"/>
      <rect x="22" y="50" width="12" height="32" rx="2" fill="#f5ead6" opacity="0.5" stroke="#d4a574" strokeWidth="1"/>
      <circle cx="28" cy="65" r="2" fill="#69db7c" opacity="0.6"/>
      <rect x="66" y="55" width="12" height="27" rx="2" fill="#f5ead6" opacity="0.5" stroke="#d4a574" strokeWidth="1"/>
      <circle cx="72" cy="68" r="2" fill="#69db7c" opacity="0.6"/>
    </svg>
  );
}

export function HallsIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <polygon points="50,18 10,90 90,90" fill="#4a3822" opacity="0.6"/>
      <polygon points="50,22 15,88 85,88" fill="#d4a574" opacity="0.3"/>
      <line x1="50" y1="22" x2="20" y2="88" stroke="#d4a574" strokeWidth="3"/>
      <line x1="50" y1="22" x2="80" y2="88" stroke="#d4a574" strokeWidth="3"/>
      <line x1="30" y1="55" x2="70" y2="55" stroke="#8b7355" strokeWidth="1.5" opacity="0.5"/>
      <line x1="22" y1="72" x2="78" y2="72" stroke="#8b7355" strokeWidth="1.5" opacity="0.5"/>
      <line x1="15" y1="88" x2="85" y2="88" stroke="#8b7355" strokeWidth="2"/>
      <rect x="44" y="26" width="12" height="18" rx="6" fill="#4a3822"/>
      <rect x="47" y="32" width="6" height="12" fill="#c4b5fd" opacity="0.4"/>
      <line x1="50" y1="44" x2="42" y2="56" stroke="#4a3822" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="44" x2="58" y2="56" stroke="#4a3822" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="32" r="2.5" fill="#7fa9f5" opacity="0.7"/>
      <circle cx="42" cy="56" r="2" fill="#7fa9f5" opacity="0.5"/>
      <circle cx="58" cy="56" r="2" fill="#7fa9f5" opacity="0.5"/>
    </svg>
  );
}

export function GymsIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <path d="M50,14 L50,28 M50,28 L38,38 M50,28 L62,38" stroke="#d4a574" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <circle cx="38" cy="38" r="2.5" fill="#d4a574" opacity="0.5"/>
      <circle cx="62" cy="38" r="2.5" fill="#d4a574" opacity="0.5"/>
      <circle cx="50" cy="50" r="20" fill="none" stroke="#8b7355" strokeWidth="2" opacity="0.4"/>
      <circle cx="50" cy="50" r="13" fill="none" stroke="#d4a574" strokeWidth="2.5" opacity="0.5"/>
      <circle cx="50" cy="50" r="6" fill="#7fa9f5" opacity="0.7"/>
      <circle cx="50" cy="50" r="2" fill="#f5ead6"/>
      <circle cx="50" cy="14" r="2" fill="#5ff59f" opacity="0.7"/>
      <rect x="24" y="78" width="52" height="8" rx="2" fill="#4a3822"/>
      <rect x="26" y="79" width="48" height="6" rx="1.5" fill="#8b7355"/>
      <circle cx="36" cy="82" r="2" fill="#7fa9f5" opacity="0.5"/>
      <circle cx="50" cy="82" r="2" fill="#5ff59f"/>
      <circle cx="64" cy="82" r="2" fill="#7fa9f5" opacity="0.5"/>
    </svg>
  );
}

export function GeneratorsIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#8b7355" strokeWidth="1.5" opacity="0.3"/>
      <circle cx="50" cy="50" r="20" fill="none" stroke="#d4a574" strokeWidth="2" opacity="0.4"/>
      <polygon points="50,32 40,42 40,58 50,68 60,58 60,42" fill="#ffa94d" opacity="0.6"/>
      <polygon points="50,38 46,44 46,56 50,62 54,56 54,44" fill="#f5ead6" opacity="0.4"/>
      <path d="M52,40 L48,50 L54,50 L50,60" stroke="#4a3822" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="50" y1="32" x2="50" y2="14" stroke="#7fa9f5" strokeWidth="2" strokeLinecap="round"/>
      <line x1="50" y1="14" x2="40" y2="6" stroke="#7fa9f5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="50" y1="14" x2="60" y2="6" stroke="#7fa9f5" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="40" cy="6" r="3" fill="#ffa94d"/>
      <circle cx="60" cy="6" r="3" fill="#ffa94d"/>
      <line x1="38" y1="62" x2="22" y2="78" stroke="#7fa9f5" strokeWidth="2" strokeLinecap="round"/>
      <line x1="62" y1="62" x2="78" y2="78" stroke="#7fa9f5" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="78" r="3" fill="#ffa94d"/>
      <circle cx="78" cy="78" r="3" fill="#ffa94d"/>
    </svg>
  );
}

export function SpatialDocsIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <path d="M50,20 L50,85" stroke="#4a3822" strokeWidth="2" opacity="0.3"/>
      <path d="M50,85 L18,25 L50,20 Z" fill="#f5ead6"/>
      <path d="M50,85 L82,25 L50,20 Z" fill="#f5ead6"/>
      <line x1="28" y1="45" x2="46" y2="45" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="30" y1="55" x2="44" y2="55" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="32" y1="65" x2="42" y2="65" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <line x1="54" y1="45" x2="72" y2="45" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="56" y1="55" x2="70" y2="55" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="58" y1="65" x2="68" y2="65" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <polygon points="72,18 60,38 72,36" fill="#d4a574" opacity="0.6" stroke="#8b7355" strokeWidth="1"/>
      <line x1="50" y1="20" x2="50" y2="10" stroke="#4a3822" strokeWidth="2" strokeLinecap="round"/>
      <line x1="50" y1="10" x2="42" y2="4" stroke="#8b7355" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="50" y1="10" x2="58" y2="4" stroke="#8b7355" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="42" cy="4" r="2.5" fill="#74c0fc"/>
      <circle cx="58" cy="4" r="2.5" fill="#74c0fc"/>
      <circle cx="50" cy="10" r="2" fill="#d4a574"/>
    </svg>
  );
}

export function FoundryIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <circle cx="50" cy="55" r="25" fill="#ff6b6b" opacity="0.1"/>
      <path d="M30,55 L30,50 L42,42 L70,42 L70,55 Z" fill="#d4a574"/>
      <path d="M30,55 L42,55 L70,55 L70,60 L30,60 Z" fill="#8b7355"/>
      <path d="M26,60 L74,60 L74,66 L26,66 Z" fill="#4a3822"/>
      <line x1="42" y1="66" x2="36" y2="80" stroke="#4a3822" strokeWidth="4" strokeLinecap="round"/>
      <line x1="58" y1="66" x2="64" y2="80" stroke="#4a3822" strokeWidth="4" strokeLinecap="round"/>
      <line x1="62" y1="26" x2="48" y2="42" stroke="#8b7355" strokeWidth="4" strokeLinecap="round"/>
      <rect x="58" y="18" width="12" height="10" rx="2" fill="#d4a574"/>
      <path d="M52,38 L50,32 L56,30" stroke="#ff6b6b" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="48" cy="28" r="2" fill="#ff6b6b"/>
      <circle cx="42" cy="32" r="1.5" fill="#ff6b6b" opacity="0.7"/>
      <circle cx="56" cy="24" r="1.5" fill="#ffa94d" opacity="0.8"/>
      <circle cx="42" cy="76" r="2" fill="#ff6b6b" opacity="0.5"/>
      <circle cx="58" cy="78" r="1.5" fill="#ff6b6b" opacity="0.4"/>
      <circle cx="82" cy="28" r="6" fill="none" stroke="#7fa9f5" strokeWidth="1.5" opacity="0.6"/>
      <path d="M80,28 L82,30 L86,24" stroke="#7fa9f5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── Dendrovia Hub Icon ──────────────────────────────────────────────────────

export function DendroviaIcon({ size = 20, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={style}>
      <circle cx="16" cy="16" r="15" fill="#1a1514" stroke="#4a3822" strokeWidth="1"/>
      <path d="M16 28L16 13" stroke="#f5e6d3" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 13Q11 9 6 5" stroke="#c77b3f" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M16 13Q12 11 8 8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M16 13Q14 8 12 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M16 13Q18 8 20 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M16 13Q20 11 24 8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M16 13Q21 9 26 5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="6" cy="5" r="1.5" fill="#c77b3f"/>
      <circle cx="8" cy="8" r="1.5" fill="#6b7280"/>
      <circle cx="12" cy="4" r="1.5" fill="#A855F7"/>
      <circle cx="20" cy="4" r="1.5" fill="#3B82F6"/>
      <circle cx="24" cy="8" r="1.5" fill="#EF4444"/>
      <circle cx="26" cy="5" r="1.5" fill="#22C55E"/>
    </svg>
  );
}

// ── Lookup helpers ──────────────────────────────────────────────────────────

const PILLAR_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  ARCHITECTUS: ArchitectusIcon,
  CHRONOS: ChronosIcon,
  IMAGINARIUM: ImaginariumIcon,
  LUDUS: LudusIcon,
  OCULUS: OculusIcon,
  OPERATUS: OperatusIcon,
};

const DOMAIN_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  museums: MuseumsIcon,
  zoos: ZoosIcon,
  halls: HallsIcon,
  gyms: GymsIcon,
  generators: GeneratorsIcon,
  "spatial-docs": SpatialDocsIcon,
  foundry: FoundryIcon,
};

export function PillarIcon({ pillar, size = 20, style }: IconProps & { pillar: string }): ReactElement {
  const Icon = PILLAR_ICONS[pillar.toUpperCase()];
  if (!Icon) return <span style={{ width: size, height: size, display: "inline-block" }} />;
  return <Icon size={size} style={style} />;
}

export function DomainIcon({ domain, size = 20, style }: IconProps & { domain: string }): ReactElement {
  const Icon = DOMAIN_ICONS[domain];
  if (!Icon) return <span style={{ width: size, height: size, display: "inline-block" }} />;
  return <Icon size={size} style={style} />;
}
