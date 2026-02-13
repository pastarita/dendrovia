/**
 * PromptBuilder — maps CodeTopology metadata to AI art prompts.
 * Deterministic for same topology input.
 */

import type { CodeTopology } from '@dendrovia/shared';

const STRUCTURE_THRESHOLDS = {
  sapling: 10,
  young: 30,
  mature: 80,
  ancient: 200,
};

const LANGUAGE_MATERIALS: Record<string, string> = {
  typescript: 'crystalline blue circuits, digital lattice',
  javascript: 'golden filaments, electric web',
  rust: 'oxidized copper branches, forged iron',
  python: 'organic vines, bioluminescent tendrils',
  go: 'clean geometric pipes, teal conduits',
  java: 'amber resin channels, ancient temple structure',
  c: 'raw silicon pathways, bare metal architecture',
  cpp: 'complex machinery, interlocking gears',
  ruby: 'deep red gemstone growth, crystal formation',
  html: 'structural scaffolding, warm framework',
  css: 'flowing fabric, layered veils',
  json: 'data streams, green matrix patterns',
};

export function buildPrompt(topology: CodeTopology): string {
  const fileCount = topology.files.length;
  const avgComplexity = fileCount > 0
    ? topology.files.reduce((s, f) => s + f.complexity, 0) / fileCount
    : 5;
  const hotspots = topology.hotspots ?? [];
  const avgChurn = hotspots.length > 0
    ? hotspots.reduce((s, h) => s + h.churnRate, 0) / hotspots.length
    : 0;

  // Determine structure
  let structure: string;
  if (fileCount < STRUCTURE_THRESHOLDS.sapling) {
    structure = 'minimalist sapling with clean lines';
  } else if (fileCount < STRUCTURE_THRESHOLDS.young) {
    structure = 'young tree with sparse branches';
  } else if (fileCount < STRUCTURE_THRESHOLDS.mature) {
    structure = 'mature tree with spreading canopy';
  } else if (fileCount < STRUCTURE_THRESHOLDS.ancient) {
    structure = 'massive ancient tree with deep roots';
  } else {
    structure = 'colossal world-tree, fractal branching into infinity';
  }

  // Determine mood from complexity
  let mood: string;
  if (avgComplexity > 15) {
    mood = 'dark, intricate, cyberpunk aesthetic, tangled';
  } else if (avgComplexity > 8) {
    mood = 'detailed, textured, organic complexity';
  } else if (avgComplexity > 4) {
    mood = 'balanced, natural, harmonious';
  } else {
    mood = 'clean, geometric, minimalist, Monument Valley style';
  }

  // Determine wear from churn
  let wear: string;
  if (avgChurn > 20) {
    wear = 'weathered, battle-scarred, ancient marks';
  } else if (avgChurn > 8) {
    wear = 'lived-in, subtle wear patterns';
  } else {
    wear = 'pristine, crystalline, untouched';
  }

  // Determine material from dominant language
  const langCounts = new Map<string, number>();
  for (const f of topology.files) {
    langCounts.set(f.language, (langCounts.get(f.language) ?? 0) + 1);
  }
  const dominantLang = [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'default';
  const material = LANGUAGE_MATERIALS[dominantLang] ?? 'abstract digital patterns';

  return [
    structure,
    mood,
    wear,
    material,
    'digital art, dark background, glowing edges, SDF aesthetic, no text',
  ].join(', ');
}
