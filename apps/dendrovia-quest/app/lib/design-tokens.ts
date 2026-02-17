/**
 * Design Tokens — Extracted from the Dendrovia Symbol-Driven Design System.
 *
 * Core palette, 6 pillar palettes, 3 class tints, RPG class data,
 * WorldEntry interface, and pillar server registry.
 */

import type { CharacterClass } from '@dendrovia/shared';

// ─── Core Design Tokens ─────────────────────────────────────

export const T = {
  // Core palette
  bg: '#0d0b0a',
  bgDeep: '#070605',
  parchment: '#f5e6d3',
  stone: '#4a4543',
  stoneLight: '#6b6563',

  // Pillar palettes
  chronos: { primary: '#d4a574', secondary: '#8b7355', accent: '#e8d7c3', shadow: '#4a3822', active: '#dda15e' },
  architectus: { primary: '#8ab4f8', secondary: '#5a8dd8', accent: '#c8e0ff', shadow: '#1e3a5f', active: '#5dbaff' },
  ludus: { primary: '#81c995', secondary: '#5fa876', accent: '#b8e6c9', shadow: '#2d4d3a', active: '#5ff59f' },
  imaginarium: { primary: '#c6a0f6', secondary: '#9b6dd8', accent: '#e5d4ff', shadow: '#4a2d5f' },
  oculus: { primary: '#f5a97f', secondary: '#d88957', accent: '#ffd4b8' },
  operatus: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db', shadow: '#374151' },

  // Class-specific (mapped to pillar essences)
  tank: { color: '#8ab4f8', glow: '#5a8dd822', border: '#5a8dd8', bg: '#1e3a5f18' },
  healer: { color: '#d4a574', glow: '#8b735522', border: '#8b7355', bg: '#4a382218' },
  dps: { color: '#ef6b6b', glow: '#c9858122', border: '#c98581', bg: '#5f2d2d18' },
} as const;

// ─── WorldEntry Interface ───────────────────────────────────

export interface WorldEntry {
  slug: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  status: 'playable' | 'analyzing' | 'pending';
  stats: {
    fileCount: number;
    commitCount: number;
    hotspotCount: number;
    contributorCount: number;
    languages: Array<{ language: string; fileCount: number; percentage: number }>;
  };
  magnitude: { score: number; tier: string; symbol: string };
  tincture: { hex: string; name: string };
  framePillar: string;
}

// ─── Character Class Data ───────────────────────────────────

export interface ClassPalette {
  readonly color: string;
  readonly glow: string;
  readonly border: string;
  readonly bg: string;
}

export interface ClassData {
  id: CharacterClass;
  name: string;
  role: string;
  archetype: string;
  flavor: string;
  spells: string[];
  stats: { hp: number; mp: number; atk: number; def: number };
  palette: ClassPalette;
}

export const CLASSES: ClassData[] = [
  {
    id: 'tank',
    name: 'Infrastructure Dev',
    role: 'TANK',
    archetype: 'The Renderer',
    flavor: 'Structural precision. Columns that never fall.',
    spells: ['Mutex Lock', 'Load Balancer', 'Firewall', 'Deadlock'],
    stats: { hp: 150, mp: 50, atk: 5, def: 15 },
    palette: T.tank,
  },
  {
    id: 'healer',
    name: 'Bug Fixer',
    role: 'HEALER',
    archetype: 'The Archaeologist',
    flavor: 'Patience and restoration. Time heals all regressions.',
    spells: ['Try-Catch', 'Rollback', 'Garbage Collect', 'Patch'],
    stats: { hp: 100, mp: 100, atk: 3, def: 8 },
    palette: T.healer,
  },
  {
    id: 'dps',
    name: 'Feature Dev',
    role: 'DPS',
    archetype: 'The Mechanics',
    flavor: 'Glass cannon. Ship fast, break things, ship fixes faster.',
    spells: ['SQL Injection', 'Fork Bomb', 'Buffer Overflow', 'Regex Nuke'],
    stats: { hp: 80, mp: 75, atk: 15, def: 5 },
    palette: T.dps,
  },
];

// ─── Pillar Playground Servers ──────────────────────────────

export const PILLAR_SERVERS = [
  { name: 'CHRONOS', port: 3011, color: T.chronos.primary },
  { name: 'IMAGINARIUM', port: 3012, color: T.imaginarium.primary },
  { name: 'ARCHITECTUS', port: 3013, color: T.architectus.primary },
  { name: 'LUDUS', port: 3014, color: T.ludus.primary },
  { name: 'OCULUS', port: 3015, color: T.oculus.primary },
  { name: 'OPERATUS', port: 3016, color: T.operatus.primary },
];
