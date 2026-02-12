/**
 * Dendrovia Pillar Registry
 *
 * Defines the 6 pillars and their checkout locations.
 */

import type { Pillar } from "./types";

export interface DendroviaConfig {
  name: string;
  devProfile: string;
  chatProfile: string;
  layout: {
    columns: number;
    rows: number;
    margin: number;
  };
  pillars: Pillar[];
}

export const DENDROVIA_CONFIG: DendroviaConfig = {
  name: "Dendrovia Six-Pillar Architecture",
  devProfile: "Default", // Can be customized in iTerm preferences
  chatProfile: "Default",
  layout: {
    columns: 3,
    rows: 2,
    margin: 20,
  },
  pillars: [
    {
      id: "CHRONOS",
      name: "The Archaeologist",
      path: "/Users/Patmac/denroot/CHRONOS/dendrovia",
      shortCode: "CHR",
      description: "Git + AST Parsing",
      primaryPackage: "packages/chronos",
      emoji: "📜",
    },
    {
      id: "IMAGINARIUM",
      name: "The Compiler",
      path: "/Users/Patmac/denroot/IMAGINARIUM/dendrovia",
      shortCode: "IMG",
      description: "AI → Shader Distillation",
      primaryPackage: "packages/imaginarium",
      emoji: "🎨",
    },
    {
      id: "ARCHITECTUS",
      name: "The Renderer",
      path: "/Users/Patmac/denroot/ARCHITECTUS/dendrovia",
      shortCode: "ARC",
      description: "WebGPU Rendering",
      primaryPackage: "packages/architectus",
      emoji: "🏛️",
    },
    {
      id: "LUDUS",
      name: "The Mechanics",
      path: "/Users/Patmac/denroot/LUDUS/dendrovia",
      shortCode: "LUD",
      description: "Game Logic",
      primaryPackage: "packages/ludus",
      emoji: "🎮",
    },
    {
      id: "OCULUS",
      name: "The Interface",
      path: "/Users/Patmac/denroot/OCULUS/dendrovia",
      shortCode: "OCU",
      description: "UI/UX Components",
      primaryPackage: "packages/oculus",
      emoji: "👁️",
    },
    {
      id: "OPERATUS",
      name: "The Infrastructure",
      path: "/Users/Patmac/denroot/OPERATUS/dendrovia",
      shortCode: "OPR",
      description: "Asset Loading & Caching",
      primaryPackage: "packages/operatus",
      emoji: "💾",
    },
  ],
};
