/**
 * turbo-colors — Pillar-branded ANSI colorizer for turbo dev output.
 *
 * Pure library: no side effects, no process management.
 * Canonical color source: lib/heraldry/types.ts
 *
 * Note: OPERATUS uses #6B7280 (lighter gray) instead of Sable #1F2937
 * for terminal readability on dark backgrounds.
 */

// ── Types ───────────────────────────────────────────────────────

interface PillarColor {
  hex: string;
  r: number;
  g: number;
  b: number;
  emoji: string;
  tincture: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function fg24(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function bold(): string {
  return '\x1b[1m';
}

function reset(): string {
  return '\x1b[0m';
}

// ── Color Registries ────────────────────────────────────────────

const PILLAR_COLORS: Record<string, PillarColor> = {
  'architectus': { hex: '#3B82F6', ...hexToRgb('#3B82F6'), emoji: '🏛️', tincture: 'Azure' },
  'chronos':     { hex: '#c77b3f', ...hexToRgb('#c77b3f'), emoji: '📜', tincture: 'Amber' },
  'imaginarium': { hex: '#A855F7', ...hexToRgb('#A855F7'), emoji: '🎨', tincture: 'Purpure' },
  'ludus':       { hex: '#EF4444', ...hexToRgb('#EF4444'), emoji: '🎮', tincture: 'Gules' },
  'oculus':      { hex: '#22C55E', ...hexToRgb('#22C55E'), emoji: '👁️', tincture: 'Vert' },
  'operatus':    { hex: '#6B7280', ...hexToRgb('#6B7280'), emoji: '💾', tincture: 'Sable' },
};

const SUPPORT_COLORS: Record<string, PillarColor> = {
  'shared':            { hex: '#FFD700', ...hexToRgb('#FFD700'), emoji: '🔗', tincture: 'Or' },
  'engine':            { hex: '#3B82F6', ...hexToRgb('#3B82F6'), emoji: '⚙️', tincture: 'Azure' },
  'proof-of-concept':  { hex: '#CD853F', ...hexToRgb('#CD853F'), emoji: '🧪', tincture: 'Tenné' },
  'ui':                { hex: '#E5E7EB', ...hexToRgb('#E5E7EB'), emoji: '🎨', tincture: 'Argent' },
  'quest':             { hex: '#E5E7EB', ...hexToRgb('#E5E7EB'), emoji: '🌳', tincture: 'Argent' },
};

// ── Line Coloring ───────────────────────────────────────────────

// Match turbo output prefixes like:
//   @dendrovia/playground-architectus:dev: ...
//   @dendrovia/chronos:dev: ...
//   dendrovia-quest:dev: ...
const PREFIX_REGEX = /^((?:@dendrovia\/(?:playground-)?|dendrovia-)(\w[\w-]*)):(\w+):(.*)/;

export function colorizeLine(line: string): string {
  const match = line.match(PREFIX_REGEX);
  if (!match) return line;

  const [, fullPackage, pkgName, taskName, rest] = match;

  const color = PILLAR_COLORS[pkgName] ?? SUPPORT_COLORS[pkgName];
  if (!color) return line;

  const coloredPrefix = `${bold()}${fg24(color.r, color.g, color.b)}${fullPackage}:${taskName}:${reset()}`;
  return `${coloredPrefix}${rest}`;
}
