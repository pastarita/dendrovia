/**
 * Dendrite Observatory Engine — Design Tokens
 *
 * Centralized dark-theme tokens with copper accent,
 * consistent with playground CSS vars.
 */

import type { PillarDomain, NodeStatus, RuntimeHealth } from "./types";

// ---------------------------------------------------------------------------
// Base Palette
// ---------------------------------------------------------------------------

export const DT = {
  bg: "#0a0a0a",
  panel: "#13161c",
  panelBorder: "#1e2330",
  surface: "#1a1d24",
  surfaceHover: "#22262f",

  text: "#ededed",
  textMuted: "#9ca3af",
  textDim: "#6b7280",

  accent: "#c77b3f",
  accentDim: "#a5622e",
  accentGlow: "rgba(199, 123, 63, 0.15)",

  border: "#2a2e38",
  borderSubtle: "#1e2230",

  // Edge colors
  edgePipeline: "#c77b3f",
  edgeContainment: "#3a3f4a",

  // Node sizing
  rootWidth: 220,
  rootHeight: 48,
  phaseWidth: 180,
  phaseHeight: 40,
  sectionWidth: 160,
  sectionHeight: 36,
} as const;

// ---------------------------------------------------------------------------
// Pillar Domain Colors (from DIAGRAM_CONVENTIONS)
// ---------------------------------------------------------------------------

export const PILLAR_COLORS: Record<PillarDomain, { fill: string; text: string }> = {
  chronos:       { fill: "#c77b3f", text: "#000000" },
  imaginarium:   { fill: "#A855F7", text: "#ffffff" },
  architectus:   { fill: "#3B82F6", text: "#ffffff" },
  ludus:         { fill: "#EF4444", text: "#ffffff" },
  oculus:        { fill: "#22C55E", text: "#000000" },
  operatus:      { fill: "#1F2937", text: "#ffffff" },
  shared:        { fill: "#FFD700", text: "#000000" },
  app:           { fill: "#E5E7EB", text: "#000000" },
  infra:         { fill: "#EF4444", text: "#ffffff" },
};

// ---------------------------------------------------------------------------
// Status Colors
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<NodeStatus, { fill: string; text: string }> = {
  implemented:  { fill: "#166534", text: "#ffffff" },
  partial:      { fill: "#854d0e", text: "#ffffff" },
  scaffold:     { fill: "#1e3a5f", text: "#ffffff" },
  planned:      { fill: "#3c1f5f", text: "#ffffff" },
  deprecated:   { fill: "#7f1d1d", text: "#ffffff" },
};

// ---------------------------------------------------------------------------
// Fidelity Colors (based on node kind)
// ---------------------------------------------------------------------------

export const FIDELITY_COLORS = {
  root:    { fill: "#c77b3f", text: "#000000" },
  phase:   { fill: "#2a4a6b", text: "#ffffff" },
  section: { fill: "#1a2a3b", text: "#ededed" },
} as const;

// ---------------------------------------------------------------------------
// Runtime Health Colors
// ---------------------------------------------------------------------------

export const RUNTIME_HEALTH_COLORS: Record<RuntimeHealth, { fill: string; text: string }> = {
  healthy:  { fill: "#166534", text: "#ffffff" },
  degraded: { fill: "#854d0e", text: "#ffffff" },
  error:    { fill: "#7f1d1d", text: "#ffffff" },
  idle:     { fill: "#1a1d24", text: "#6b7280" },
};
