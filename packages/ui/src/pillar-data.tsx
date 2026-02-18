/**
 * Pillar metadata — plain data, no "use client" directive.
 * Safe to import from both server and client components.
 */

import type { PillarName } from "./domain-registry";

export interface PillarMeta {
  name: PillarName;
  hex: string;
  hexDim: string;
  tincture: string;
  port: number;
  emoji: string;
  subtitle: string;
}

export const PILLAR_META: Record<PillarName, PillarMeta> = {
  ARCHITECTUS: {
    name: "ARCHITECTUS",
    hex: "#3B82F6",
    hexDim: "#2563eb",
    tincture: "Azure",
    port: 3011,
    emoji: "\u{1F3DB}\uFE0F",
    subtitle: "The Architect \u2014 3D Rendering Engine",
  },
  CHRONOS: {
    name: "CHRONOS",
    hex: "#c77b3f",
    hexDim: "#a5632f",
    tincture: "Amber",
    port: 3012,
    emoji: "\u{1F4DC}",
    subtitle: "The Chronicler \u2014 Git History + AST Parsing",
  },
  IMAGINARIUM: {
    name: "IMAGINARIUM",
    hex: "#A855F7",
    hexDim: "#7c3aed",
    tincture: "Purpure",
    port: 3013,
    emoji: "\u{1F3A8}",
    subtitle: "The Dreamer \u2014 Procedural Art Generation",
  },
  LUDUS: {
    name: "LUDUS",
    hex: "#EF4444",
    hexDim: "#dc2626",
    tincture: "Gules",
    port: 3014,
    emoji: "\u{1F3AE}",
    subtitle: "The Player \u2014 Game Mechanics + Rules",
  },
  OCULUS: {
    name: "OCULUS",
    hex: "#22C55E",
    hexDim: "#16a34a",
    tincture: "Vert",
    port: 3015,
    emoji: "\u{1F441}\uFE0F",
    subtitle: "The Seer \u2014 UI + Navigation",
  },
  OPERATUS: {
    name: "OPERATUS",
    hex: "#6B7280",
    hexDim: "#4b5563",
    tincture: "Sable",
    port: 3016,
    emoji: "\u{1F4BE}",
    subtitle: "The Operator \u2014 Infrastructure + Persistence",
  },
};
