/**
 * LoreGenerator — produces tiered knowledge lore for each specimen.
 *
 * Each mushroom carries inspectable lore — the "knowledge collectible" mechanic.
 * Tier determined by rarity of the code property combination.
 * Deterministic: same file properties -> identical lore.
 */

import type { ParsedFile, Hotspot, CodeTopology } from '@dendrovia/shared';
import type { MushroomLore, LoreTier, FungalGenus, FungalTaxonomy } from './types';
import type { FileContext } from './GenusMapper';
import { hashString } from '../utils/hash';

// ---------------------------------------------------------------------------
// Tier assignment
// ---------------------------------------------------------------------------

function assignTier(file: ParsedFile, ctx: FileContext, genus: FungalGenus): LoreTier {
  let rarityScore = 0;

  // High complexity is uncommon
  if (file.complexity > 15) rarityScore += 2;
  else if (file.complexity > 8) rarityScore += 1;

  // Hub nodes are rare
  if (ctx.dependentCount > 10) rarityScore += 3;
  else if (ctx.dependentCount > 5) rarityScore += 1;

  // Very old/stable files are notable
  if (ctx.fileAge > 180 * 24 * 60 * 60 * 1000) rarityScore += 1; // >6 months
  if (ctx.fileAge > 365 * 24 * 60 * 60 * 1000) rarityScore += 2; // >1 year

  // Hotspots add rarity
  if (ctx.hotspot) {
    if (ctx.hotspot.riskScore > 0.8) rarityScore += 2;
    else if (ctx.hotspot.riskScore > 0.5) rarityScore += 1;
  }

  // Unusual genera are rarer
  const rareGenera: FungalGenus[] = ['Cordyceps', 'Morchella', 'Tuber', 'Armillaria'];
  if (rareGenera.includes(genus)) rarityScore += 2;

  // Very large files
  if (file.loc > 1000) rarityScore += 1;
  if (file.loc > 2000) rarityScore += 2;

  if (rarityScore >= 8) return 'legendary';
  if (rarityScore >= 6) return 'epic';
  if (rarityScore >= 4) return 'rare';
  if (rarityScore >= 2) return 'uncommon';
  return 'common';
}

// ---------------------------------------------------------------------------
// Title generation
// ---------------------------------------------------------------------------

function generateTitle(taxonomy: FungalTaxonomy, file: ParsedFile): string {
  const genusLower = taxonomy.genus.toLowerCase();
  const langSuffix = file.language ? `var. ${file.language}` : '';
  return `${taxonomy.genus} ${taxonomy.species} ${langSuffix}`.trim();
}

// ---------------------------------------------------------------------------
// Flavor text templates
// ---------------------------------------------------------------------------

const FLAVOR_TEMPLATES: Record<FungalGenus, string[]> = {
  Amanita: [
    'Its spotted cap towers above the forest floor, a sentinel marking the gateway to deeper code.',
    'Ancient spores drift from beneath its veil, carrying the scent of initialization.',
  ],
  Agaricus: [
    'A common sight along well-trodden paths, this humble fungus quietly serves the forest.',
    'Its pink gills darken with age, faithfully processing what the forest requires.',
  ],
  Boletus: [
    'Thick-stemmed and porous, it drinks deeply from the data streams below.',
    'Where this fungus grows, information flows freely between root and canopy.',
  ],
  Cantharellus: [
    'Golden and funnel-shaped, it channels signals through the forest like liquid sunlight.',
    'Its forking ridges carry whispered messages between distant trees.',
  ],
  Russula: [
    'Brightly colored but brittle, it snaps cleanly when the configuration changes.',
    'Its rigid structure holds the forest\'s constants in crystalline certainty.',
  ],
  Lactarius: [
    'When disturbed, it weeps a steady stream of colored latex — data flowing without end.',
    'Its milky exudate nourishes the downstream consumers in perpetual flow.',
  ],
  Coprinus: [
    'Already dissolving into ink, this ephemeral specimen will be gone by morning.',
    'Its cap deliquesces into dark liquid, a fleeting presence in the forest\'s churn.',
  ],
  Mycena: [
    'A tiny, translucent bell barely visible among the leaf litter, glowing faintly in darkness.',
    'Clustered in fairy rings, these miniature helpers illuminate forgotten corners.',
  ],
  Armillaria: [
    'Its honey-colored clusters belie the vast black rhizomorphs spreading unseen below.',
    'The largest organism in this forest, its reach extends far beyond what the eye can see.',
  ],
  Trametes: [
    'Layered in concentric zones, this shelf fungus bridges the gap between living and dead wood.',
    'Its bracket form grows laterally, adapting its shape to whatever substrate it finds.',
  ],
  Ganoderma: [
    'Lacquered and woody, this perennial bracket has endured seasons beyond counting.',
    'Its polished surface reflects the stability of the foundation it protects.',
  ],
  Cordyceps: [
    'Bright orange stalks erupt from its host, a transformation both beautiful and unsettling.',
    'It has rewritten its host\'s behavior, bending it to serve a new purpose.',
  ],
  Morchella: [
    'Its honeycomb cap conceals labyrinthine passages of extraordinary complexity.',
    'Hollow inside, its pitted surface maps the intricate logic within.',
  ],
  Pleurotus: [
    'Growing sideways from the substrate, it observes the forest from an oblique angle.',
    'Its oyster-shaped cap fans out, catching every side-effect that drifts past.',
  ],
  Psilocybe: [
    'Small and unassuming, its wavy cap bruises blue at the slightest touch.',
    'Only those who seek it find it — a tool for altering perception of the code.',
  ],
  Hericium: [
    'Cascading white spines hang like frozen waterfalls, defying conventional fungal form.',
    'No cap, no gills — pure function expressed as branching, flowing structure.',
  ],
  Xylaria: [
    'Black and finger-like, it rises from the decay of code long abandoned.',
    'A monument to what once lived, now slowly returning its substance to the forest.',
  ],
  Clavaria: [
    'Simple coral-like branches reach upward, unburdened by complexity.',
    'Its minimal form traces a clean, linear path through the forest floor.',
  ],
  Phallus: [
    'An unmistakable odor announces its presence long before it becomes visible.',
    'Its olive slime layer attracts attention from every passing process.',
  ],
  Tuber: [
    'Hidden entirely beneath the surface, only the initiated know where to look.',
    'Prized for its hidden value, this subterranean treasure reveals nothing to the casual observer.',
  ],
};

function generateFlavorText(genus: FungalGenus, file: ParsedFile): string {
  const templates = FLAVOR_TEMPLATES[genus];
  // Deterministic selection based on file path hash
  const hash = hashString(file.path);
  const idx = parseInt(hash.slice(0, 4), 16) % templates.length;
  return templates[idx]!;
}

// ---------------------------------------------------------------------------
// Code insight generation
// ---------------------------------------------------------------------------

function generateCodeInsight(file: ParsedFile, ctx: FileContext, genus: FungalGenus): string {
  const parts: string[] = [];

  // Basic stats
  parts.push(`${file.language} module, ${file.loc} lines`);

  // Complexity
  if (file.complexity > 15) {
    parts.push(`cyclomatic complexity ${file.complexity} (high)`);
  } else if (file.complexity > 8) {
    parts.push(`cyclomatic complexity ${file.complexity} (moderate)`);
  } else {
    parts.push(`cyclomatic complexity ${file.complexity} (low)`);
  }

  // Role
  if (ctx.isEntryPoint) parts.push('entry point');
  if (ctx.isConfig) parts.push('configuration');
  if (ctx.dependentCount > 5) parts.push(`imported by ${ctx.dependentCount} modules`);

  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Domain knowledge (for rare+ tiers)
// ---------------------------------------------------------------------------

const PATTERN_HINTS: Array<{ pattern: RegExp; knowledge: string }> = [
  { pattern: /observer|event.*emitter|pubsub|subscribe/i, knowledge: 'Implements the Observer pattern via event emission' },
  { pattern: /factory|create.*instance|build/i, knowledge: 'Factory pattern — creates instances without exposing construction logic' },
  { pattern: /singleton|instance|global.*bus/i, knowledge: 'Singleton pattern — ensures a single shared instance' },
  { pattern: /adapter|wrapper|bridge|compat/i, knowledge: 'Adapter pattern — bridges incompatible interfaces' },
  { pattern: /middleware|pipeline|chain/i, knowledge: 'Pipeline/Middleware pattern — processes data through sequential stages' },
  { pattern: /cache|memoize|store/i, knowledge: 'Caching strategy — trades memory for computation speed' },
  { pattern: /decorator|enhance|augment/i, knowledge: 'Decorator pattern — extends behavior without modifying source' },
  { pattern: /strategy|policy|algorithm/i, knowledge: 'Strategy pattern — encapsulates interchangeable algorithms' },
  { pattern: /reducer|state.*machine|finite/i, knowledge: 'State machine — manages transitions between discrete states' },
  { pattern: /proxy|intercept|trap/i, knowledge: 'Proxy pattern — controls access to the underlying object' },
];

function generateDomainKnowledge(
  file: ParsedFile,
  ctx: FileContext,
  tier: LoreTier,
): string | undefined {
  if (tier === 'common' || tier === 'uncommon') return undefined;

  // Pattern detection
  for (const { pattern, knowledge } of PATTERN_HINTS) {
    if (pattern.test(file.path)) return knowledge;
  }

  // Hub node insight
  if (ctx.dependentCount > 10) {
    return `Hub node in its subgraph — ${ctx.dependentCount} modules depend on this`;
  }

  // Age insight
  if (ctx.fileAge > 365 * 24 * 60 * 60 * 1000 && ctx.commitCount < 5) {
    return 'Ancient and stable — has survived many seasons virtually unchanged';
  }

  // Hotspot insight
  if (ctx.hotspot && ctx.hotspot.riskScore > 0.7) {
    return `High-risk hotspot (risk ${(ctx.hotspot.riskScore * 100).toFixed(0)}%) — frequent changes in complex code`;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Code snippet extraction
// ---------------------------------------------------------------------------

function generateCodeSnippet(file: ParsedFile): string | undefined {
  // We don't have file contents in CodeTopology, so generate a representative signature
  const ext = file.path.split('.').pop() ?? '';
  const name = file.path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'module';

  switch (ext) {
    case 'ts':
    case 'tsx':
      return `export function ${name}(/* ${file.complexity} branches */): void`;
    case 'js':
    case 'jsx':
      return `module.exports.${name} = function(/* ${file.loc} lines */)`;
    case 'rs':
      return `pub fn ${name}() -> Result<(), Error>`;
    case 'py':
      return `def ${name}(*, complexity=${file.complexity}):`;
    case 'go':
      return `func ${name}() error`;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateLore(
  file: ParsedFile,
  ctx: FileContext,
  taxonomy: FungalTaxonomy,
): MushroomLore {
  const tier = assignTier(file, ctx, taxonomy.genus);
  const title = generateTitle(taxonomy, file);
  const flavorText = generateFlavorText(taxonomy.genus, file);
  const codeInsight = generateCodeInsight(file, ctx, taxonomy.genus);
  const domainKnowledge = generateDomainKnowledge(file, ctx, tier);
  const codeSnippet = tier !== 'common' ? generateCodeSnippet(file) : undefined;

  return {
    tier,
    title,
    flavorText,
    codeInsight,
    domainKnowledge,
    codeSnippet,
  };
}

export { assignTier };
