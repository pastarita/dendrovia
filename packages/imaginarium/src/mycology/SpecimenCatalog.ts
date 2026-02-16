/**
 * SpecimenCatalog — the complete registry.
 *
 * Takes CodeTopology, produces the full set of FungalSpecimen objects.
 * Deterministic: same topology -> identical catalog.
 */

import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import type {
  FungalSpecimen,
  MushroomPlacement,
  SubstrateType,
  FungalGenus,
} from './types';
import { buildTaxonomy, buildFileContext, buildCoChurnMap, type FileContext } from './GenusMapper';
import { generateMorphology } from './MorphologyGenerator';
import { generateLore } from './LoreGenerator';
import { hashString } from '../utils/hash';

// ---------------------------------------------------------------------------
// File filtering — skip trivial files
// ---------------------------------------------------------------------------

const TRIVIAL_PATTERNS = /(^|\/)(\.gitignore|\.editorconfig|\.prettierrc|\.eslintignore|LICENSE|CHANGELOG|yarn\.lock|package-lock|bun\.lockb)/i;
const MIN_LOC = 3; // at least 3 lines to be cataloged

function shouldCatalog(file: ParsedFile): boolean {
  if (TRIVIAL_PATTERNS.test(file.path)) return false;
  if (file.loc < MIN_LOC) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Placement generation
// ---------------------------------------------------------------------------

function derivePlacement(
  file: ParsedFile,
  ctx: FileContext,
  genus: FungalGenus,
  index: number,
  totalFiles: number,
): MushroomPlacement {
  // Deterministic positioning using file hash
  const hash = hashString(file.path);
  const h1 = parseInt(hash.slice(0, 8), 16);
  const h2 = parseInt(hash.slice(8, 16), 16);
  const h3 = parseInt(hash.slice(16, 24), 16);

  // Spread specimens in a circular forest layout
  const angle = (h1 / 0xFFFFFFFF) * Math.PI * 2;
  const radius = 5 + (h2 / 0xFFFFFFFF) * 45; // 5-50 units from center
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = 0; // ground level (adjusted by substrate)

  // Substrate based on genus + context
  const substrate = deriveSubstrate(genus, ctx);

  // Cluster size based on genus
  const clusterSize = deriveClusterSize(genus, file);

  // Rotation from hash
  const rotation = (h3 / 0xFFFFFFFF) * Math.PI * 2;

  // Scale based on LOC
  const baseScale = file.loc < 50 ? 0.5 : file.loc < 200 ? 0.8 : file.loc < 500 ? 1.0 : 1.3;
  const scale = baseScale * (0.9 + (h1 % 100) / 500); // slight variation

  // Host tree = nearest directory
  const hostTree = file.path.split('/').slice(0, -1).join('/') || undefined;

  return {
    position: [x, y, z],
    hostTree,
    substrate,
    clusterSize,
    rotation,
    scale,
  };
}

function deriveSubstrate(genus: FungalGenus, ctx: FileContext): SubstrateType {
  if (genus === 'Tuber') return 'subterranean';
  if (genus === 'Xylaria' || genus === 'Pleurotus') return 'deadwood';
  if (genus === 'Trametes' || genus === 'Ganoderma') return 'bark';
  if (ctx.isDeprecated) return 'deadwood';
  if (genus === 'Mycena' || genus === 'Coprinus') return 'leaf-litter';
  return 'soil';
}

function deriveClusterSize(genus: FungalGenus, file: ParsedFile): number {
  // Mycena grows in fairy rings
  if (genus === 'Mycena') return Math.max(5, Math.min(30, Math.floor(file.loc / 5)));
  // Coprinus clusters
  if (genus === 'Coprinus') return Math.max(3, Math.min(12, Math.floor(file.loc / 10)));
  // Armillaria forms clusters
  if (genus === 'Armillaria') return Math.max(3, Math.min(8, 3));
  // Most are solitary or small groups
  return 1;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function catalogize(topology: CodeTopology): FungalSpecimen[] {
  const filesToCatalog = topology.files.filter(shouldCatalog);
  const coChurnMap = buildCoChurnMap(topology);
  const specimens: FungalSpecimen[] = [];

  for (let i = 0; i < filesToCatalog.length; i++) {
    const file = filesToCatalog[i]!;
    const ctx = buildFileContext(file, topology, coChurnMap);
    const taxonomy = buildTaxonomy(file, ctx);
    const morphology = generateMorphology(file, ctx, taxonomy.genus);
    const lore = generateLore(file, ctx, taxonomy);
    const placement = derivePlacement(file, ctx, taxonomy.genus, i, filesToCatalog.length);

    const id = hashString(`specimen:${file.path}:${file.hash}`);

    specimens.push({
      id,
      filePath: file.path,
      taxonomy,
      morphology,
      lore,
      placement,
      assets: {},
    });
  }

  return specimens;
}
