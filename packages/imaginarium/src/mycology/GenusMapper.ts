/**
 * GenusMapper — classifies source files into fungal genera.
 *
 * Maps ~20 canonical genera to specific code characteristics.
 * Each genus has distinct morphological traits that visually encode
 * the code property. Primary genus = highest-scoring match.
 *
 * Species epithet = deterministic hash of file path + properties.
 */

import type { ParsedFile, Hotspot, CodeTopology } from '@dendrovia/shared';
import { hashString } from '../utils/hash';
import type {
  FungalGenus,
  FungalTaxonomy,
  FungalDivision,
  FungalClass,
  FungalOrder,
  FungalFamily,
} from './types';

// ---------------------------------------------------------------------------
// Genus scoring criteria
// ---------------------------------------------------------------------------

interface GenusProfile {
  genus: FungalGenus;
  score: (file: ParsedFile, ctx: FileContext) => number;
}

export interface FileContext {
  isEntryPoint: boolean;
  isConfig: boolean;
  isTest: boolean;
  isDeprecated: boolean;
  dependentCount: number;  // how many files import this
  dependencyCount: number; // how many files this imports
  hotspot: Hotspot | undefined;
  avgComplexity: number;
  maxLoc: number;
  fileAge: number;         // ms since last modified (relative to newest)
  commitCount: number;     // how many commits touched this file
}

const ENTRY_POINT_PATTERNS = /\/(index|main|app|server|entry|boot)\.[^/]+$/i;
const CONFIG_PATTERNS = /\/(config|\.env|settings|constants|env|\.rc|tsconfig|package\.json|jest\.config)/i;
const TEST_PATTERNS = /\/(test|spec|__tests__|__mocks__)\b/i;
const DEPRECATED_PATTERNS = /\/(deprecated|legacy|old|archive|dead)/i;
const DEBUG_PATTERNS = /\/(debug|dev|devtools|__debug__|playground|sandbox)/i;
const LOG_PATTERNS = /\/(log|logger|logging|monitor|telemetry|analytics)/i;
const MIDDLEWARE_PATTERNS = /\/(middleware|adapter|proxy|wrapper|interceptor|bridge)/i;
const DATA_PATTERNS = /\/(db|database|model|schema|repository|dao|orm|query|migration)/i;
const EVENT_PATTERNS = /\/(event|emitter|listener|subscriber|handler|dispatch|bus|pubsub)/i;
const PIPELINE_PATTERNS = /\/(pipe|pipeline|transform|stream|chain)/i;

const GENUS_PROFILES: GenusProfile[] = [
  {
    genus: 'Amanita',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.isEntryPoint) s += 40;
      if (f.complexity > 15) s += 20;
      if (ctx.dependentCount > 5) s += 15;
      if (f.loc > 200) s += 10;
      return s;
    },
  },
  {
    genus: 'Agaricus',
    score: (f, ctx) => {
      let s = 10; // baseline — fallback genus
      if (f.complexity >= 3 && f.complexity <= 10) s += 8;
      if (f.loc >= 50 && f.loc <= 300) s += 5;
      if (!ctx.isEntryPoint && !ctx.isConfig && !ctx.isTest) s += 5;
      return s;
    },
  },
  {
    genus: 'Boletus',
    score: (f, ctx) => {
      let s = 0;
      if (DATA_PATTERNS.test(f.path)) s += 45;
      if (f.path.match(/\.(sql|prisma|drizzle)/i)) s += 30;
      if (ctx.dependentCount >= 3 && ctx.dependentCount <= 8) s += 10;
      return s;
    },
  },
  {
    genus: 'Cantharellus',
    score: (f, ctx) => {
      let s = 0;
      if (EVENT_PATTERNS.test(f.path)) s += 45;
      if (f.path.match(/observable|subject|signal/i)) s += 25;
      return s;
    },
  },
  {
    genus: 'Russula',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.isConfig) s += 50;
      if (f.complexity <= 2) s += 10;
      if (f.language === 'json' || f.language === 'yaml' || f.language === 'toml') s += 25;
      return s;
    },
  },
  {
    genus: 'Lactarius',
    score: (f, ctx) => {
      let s = 0;
      if (f.path.match(/stream|generator|iterator|async.*gen|observable/i)) s += 45;
      if (PIPELINE_PATTERNS.test(f.path)) s += 15;
      return s;
    },
  },
  {
    genus: 'Coprinus',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.hotspot && ctx.hotspot.churnRate > 20) s += 35;
      if (ctx.commitCount > 30) s += 20;
      if (f.loc < 100) s += 5;
      return s;
    },
  },
  {
    genus: 'Mycena',
    score: (f, ctx) => {
      let s = 0;
      if (f.loc < 50) s += 40;
      if (f.complexity <= 3) s += 15;
      if (f.path.match(/util|helper|lib/i)) s += 10;
      return s;
    },
  },
  {
    genus: 'Armillaria',
    score: (f, ctx) => {
      let s = 0;
      if (f.loc > 500) s += 20;
      if (ctx.dependentCount > 10) s += 30;
      if (f.complexity > 10) s += 15;
      return s;
    },
  },
  {
    genus: 'Trametes',
    score: (f, ctx) => {
      let s = 0;
      if (MIDDLEWARE_PATTERNS.test(f.path)) s += 50;
      if (ctx.dependencyCount >= 2 && ctx.dependentCount >= 2) s += 15;
      return s;
    },
  },
  {
    genus: 'Ganoderma',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.fileAge > 365 * 24 * 60 * 60 * 1000) s += 20; // >1 year old
      if (ctx.hotspot === undefined || ctx.hotspot.churnRate < 3) s += 20;
      if (ctx.dependentCount > 5) s += 15;
      if (f.loc > 200) s += 10;
      return s;
    },
  },
  {
    genus: 'Cordyceps',
    score: (f, ctx) => {
      let s = 0;
      if (f.path.match(/decorator|patch|monkey|plugin|extend|mixin|hook/i)) s += 45;
      if (f.path.match(/override|inject|intercept/i)) s += 20;
      return s;
    },
  },
  {
    genus: 'Morchella',
    score: (f, ctx) => {
      let s = 0;
      if (f.complexity > 20) s += 40;
      if (f.complexity > 12 && f.loc > 100) s += 20;
      return s;
    },
  },
  {
    genus: 'Pleurotus',
    score: (f, ctx) => {
      let s = 0;
      if (LOG_PATTERNS.test(f.path)) s += 50;
      if (f.path.match(/side.?effect|effect/i)) s += 15;
      return s;
    },
  },
  {
    genus: 'Psilocybe',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.isTest) s += 30;
      if (DEBUG_PATTERNS.test(f.path)) s += 45;
      if (f.path.match(/mock|stub|fake|fixture/i)) s += 20;
      return s;
    },
  },
  {
    genus: 'Hericium',
    score: (f, ctx) => {
      let s = 0;
      if (f.path.match(/pure|functional|fp|immutable/i)) s += 40;
      if (f.complexity <= 5 && ctx.dependencyCount <= 2) s += 15;
      if (f.path.match(/util|helper/i) && f.complexity <= 4) s += 10;
      return s;
    },
  },
  {
    genus: 'Xylaria',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.isDeprecated) s += 50;
      if (f.path.match(/\.bak|\.old|\.dead/i)) s += 30;
      if (ctx.dependentCount === 0 && ctx.dependencyCount === 0) s += 15;
      return s;
    },
  },
  {
    genus: 'Clavaria',
    score: (f, ctx) => {
      let s = 0;
      if (PIPELINE_PATTERNS.test(f.path)) s += 35;
      if (f.complexity <= 6 && ctx.dependencyCount <= 3) s += 15;
      if (ctx.dependentCount <= 1 && ctx.dependencyCount >= 1) s += 10;
      return s;
    },
  },
  {
    genus: 'Phallus',
    score: (f, ctx) => {
      let s = 0;
      // High complexity relative to LOC = dense/smelly
      if (f.loc > 0 && f.complexity / f.loc > 0.1) s += 30;
      if (f.complexity > 15 && ctx.hotspot !== undefined) s += 20;
      if (ctx.commitCount > 20 && f.complexity > 10) s += 15;
      return s;
    },
  },
  {
    genus: 'Tuber',
    score: (f, ctx) => {
      let s = 0;
      if (ctx.dependentCount === 0) s += 25;
      if (f.path.match(/internal|private|_/i)) s += 20;
      if (f.path.match(/hidden|secret/i)) s += 15;
      return s;
    },
  },
];

// ---------------------------------------------------------------------------
// Latin species epithet generation
// ---------------------------------------------------------------------------

const SPECIES_PREFIXES = [
  'albi', 'aureo', 'brevi', 'calci', 'digi', 'erythr', 'ferr',
  'glabr', 'holo', 'infra', 'junct', 'lati', 'macro', 'nigr',
  'oligo', 'poly', 'quasi', 'rubr', 'semi', 'tenu', 'ultra',
  'vari', 'xero', 'zygo',
];

const SPECIES_SUFFIXES = [
  'ensis', 'oides', 'iana', 'ata', 'ica', 'alis', 'osa',
  'ella', 'ula', 'ina', 'aria', 'ista', 'fera', 'gena',
  'phila', 'cola', 'morpha', 'spora', 'carpa', 'derma',
];

function generateSpeciesEpithet(filePath: string, genus: FungalGenus): string {
  const hash = hashString(`${filePath}:${genus}`);
  const prefixIdx = parseInt(hash.slice(0, 4), 16) % SPECIES_PREFIXES.length;
  const suffixIdx = parseInt(hash.slice(4, 8), 16) % SPECIES_SUFFIXES.length;
  return `${SPECIES_PREFIXES[prefixIdx]}${SPECIES_SUFFIXES[suffixIdx]}`;
}

// ---------------------------------------------------------------------------
// Taxonomy derivation
// ---------------------------------------------------------------------------

function deriveDivision(genus: FungalGenus, ctx: FileContext): FungalDivision {
  // Basidiomycota: broad, visible interfaces (many exports / dependents)
  const basidioGenera: FungalGenus[] = [
    'Amanita', 'Agaricus', 'Boletus', 'Cantharellus', 'Russula',
    'Lactarius', 'Coprinus', 'Mycena', 'Armillaria',
  ];
  // Zygomycota: bridging modules
  const zygoGenera: FungalGenus[] = ['Trametes', 'Clavaria'];

  if (zygoGenera.includes(genus)) return 'Zygomycota';
  if (basidioGenera.includes(genus)) return 'Basidiomycota';
  return 'Ascomycota';
}

function deriveClass(division: FungalDivision, genus: FungalGenus): FungalClass {
  switch (division) {
    case 'Basidiomycota':
      return genus === 'Lactarius' ? 'Tremellomycetes' : 'Agaricomycetes';
    case 'Ascomycota':
      return genus === 'Cordyceps' || genus === 'Xylaria' ? 'Sordariomycetes' : 'Eurotiomycetes';
    case 'Zygomycota':
      return 'Mucoromycetes';
  }
}

function deriveOrder(genus: FungalGenus): FungalOrder {
  const orderMap: Record<FungalGenus, FungalOrder> = {
    Amanita: 'Agaricales',
    Agaricus: 'Agaricales',
    Mycena: 'Agaricales',
    Coprinus: 'Agaricales',
    Armillaria: 'Agaricales',
    Pleurotus: 'Agaricales',
    Boletus: 'Boletales',
    Lactarius: 'Russulales',
    Russula: 'Russulales',
    Hericium: 'Russulales',
    Cantharellus: 'Cantharellales',
    Clavaria: 'Cantharellales',
    Trametes: 'Polyporales',
    Ganoderma: 'Polyporales',
    Psilocybe: 'Agaricales',
    Morchella: 'Agaricales',
    Cordyceps: 'Xylariales',
    Xylaria: 'Xylariales',
    Phallus: 'Agaricales',
    Tuber: 'Boletales',
  };
  return orderMap[genus];
}

function deriveFamily(genus: FungalGenus): FungalFamily {
  const familyMap: Record<FungalGenus, FungalFamily> = {
    Amanita: 'Amanitaceae',
    Agaricus: 'Agaricaceae',
    Boletus: 'Boletaceae',
    Cantharellus: 'Cantharellaceae',
    Russula: 'Russulaceae',
    Lactarius: 'Russulaceae',
    Coprinus: 'Agaricaceae',
    Mycena: 'Mycenaceae',
    Armillaria: 'Marasmiaceae',
    Trametes: 'Polyporaceae',
    Ganoderma: 'Polyporaceae',
    Cordyceps: 'Xylariaceae',
    Morchella: 'Agaricaceae',
    Pleurotus: 'Tricholomataceae',
    Psilocybe: 'Agaricaceae',
    Hericium: 'Russulaceae',
    Xylaria: 'Xylariaceae',
    Clavaria: 'Cantharellaceae',
    Phallus: 'Agaricaceae',
    Tuber: 'Boletaceae',
  };
  return familyMap[genus];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildFileContext(
  file: ParsedFile,
  topology: CodeTopology,
  coChurnMap: Map<string, Set<string>>,
): FileContext {
  const hotspot = topology.hotspots.find(h => h.path === file.path);
  const newestFile = topology.files.reduce((a, b) =>
    new Date(a.lastModified).getTime() > new Date(b.lastModified).getTime() ? a : b
  );
  const fileAge = new Date(newestFile.lastModified).getTime() - new Date(file.lastModified).getTime();

  // Count co-churn connections as proxy for import relationships
  const connections = coChurnMap.get(file.path);
  const dependentCount = connections ? connections.size : 0;

  // Estimate dependency count from directory siblings
  const dir = file.path.split('/').slice(0, -1).join('/');
  const siblings = topology.files.filter(f => {
    const fDir = f.path.split('/').slice(0, -1).join('/');
    return fDir === dir && f.path !== file.path;
  });
  const dependencyCount = Math.min(siblings.length, 10);

  // Count commits touching this file
  const commitCount = topology.commits.filter(c =>
    c.filesChanged.includes(file.path)
  ).length;

  const avgComplexity = topology.files.reduce((s, f) => s + f.complexity, 0) / topology.files.length;
  const maxLoc = Math.max(...topology.files.map(f => f.loc));

  return {
    isEntryPoint: ENTRY_POINT_PATTERNS.test(file.path),
    isConfig: CONFIG_PATTERNS.test(file.path),
    isTest: TEST_PATTERNS.test(file.path),
    isDeprecated: DEPRECATED_PATTERNS.test(file.path),
    dependentCount,
    dependencyCount,
    hotspot,
    avgComplexity,
    maxLoc,
    fileAge,
    commitCount,
  };
}

export function classifyGenus(file: ParsedFile, ctx: FileContext): FungalGenus {
  let bestGenus: FungalGenus = 'Agaricus';
  let bestScore = -1;

  for (const profile of GENUS_PROFILES) {
    const score = profile.score(file, ctx);
    if (score > bestScore) {
      bestScore = score;
      bestGenus = profile.genus;
    }
  }

  return bestGenus;
}

export function buildTaxonomy(file: ParsedFile, ctx: FileContext): FungalTaxonomy {
  const genus = classifyGenus(file, ctx);
  const division = deriveDivision(genus, ctx);
  const fungalClass = deriveClass(division, genus);
  const order = deriveOrder(genus);
  const family = deriveFamily(genus);
  const species = generateSpeciesEpithet(file.path, genus);

  return {
    division,
    class: fungalClass,
    order,
    family,
    genus,
    species,
  };
}

export function buildCoChurnMap(topology: CodeTopology): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const commit of topology.commits) {
    const changed = commit.filesChanged;
    for (let i = 0; i < changed.length; i++) {
      const ci = changed[i]!;
      for (let j = i + 1; j < changed.length; j++) {
        const cj = changed[j]!;
        if (!map.has(ci)) map.set(ci, new Set());
        if (!map.has(cj)) map.set(cj, new Set());
        map.get(ci)!.add(cj);
        map.get(cj)!.add(ci);
      }
    }
  }

  return map;
}
