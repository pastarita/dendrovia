/**
 * Mock upstream data specimens typed against @dendrovia/shared.
 * Each specimen wraps a real shared type with pillar/variant metadata
 * for the OrnateFrame zoo grid.
 */
import type {
  Hotspot,
  ParsedCommit,
  ParsedFile,
  Monster,
  Spell,
  Quest,
  Item,
  FungalSpecimen,
  ProceduralPalette,
  SDFShader,
  DendriteConfig,
  GameWorldState,
  MeshManifestEntry,
  AssetManifest,
} from '@dendrovia/shared';
import type { PillarId, FrameVariant } from '@dendrovia/oculus';

/* ------------------------------------------------------------------ */
/*  Discriminated union for specimen payloads                          */
/* ------------------------------------------------------------------ */

export type SpecimenKind =
  | 'hotspot'
  | 'commit'
  | 'parsed-file'
  | 'monster'
  | 'spell'
  | 'quest'
  | 'item'
  | 'fungal'
  | 'palette'
  | 'sdf-shader'
  | 'dendrite-config'
  | 'world-state'
  | 'oculus-inventory'
  | 'oculus-tokens'
  | 'mesh-entry'
  | 'asset-manifest';

interface SpecimenBase {
  id: string;
  pillar: PillarId;
  variant: FrameVariant;
  title: string;
  icon: string;
  kind: SpecimenKind;
}

export interface HotspotSpecimen extends SpecimenBase {
  kind: 'hotspot';
  data: Hotspot;
}
export interface CommitSpecimen extends SpecimenBase {
  kind: 'commit';
  data: ParsedCommit;
}
export interface ParsedFileSpecimen extends SpecimenBase {
  kind: 'parsed-file';
  data: ParsedFile;
}
export interface MonsterSpecimen extends SpecimenBase {
  kind: 'monster';
  data: Monster;
}
export interface SpellSpecimen extends SpecimenBase {
  kind: 'spell';
  data: Spell;
}
export interface QuestSpecimen extends SpecimenBase {
  kind: 'quest';
  data: Quest;
}
export interface ItemSpecimen extends SpecimenBase {
  kind: 'item';
  data: Item;
}
export interface FungalSpecimenEntry extends SpecimenBase {
  kind: 'fungal';
  data: FungalSpecimen;
}
export interface PaletteSpecimen extends SpecimenBase {
  kind: 'palette';
  data: ProceduralPalette;
}
export interface SDFShaderSpecimen extends SpecimenBase {
  kind: 'sdf-shader';
  data: SDFShader;
}
export interface DendriteConfigSpecimen extends SpecimenBase {
  kind: 'dendrite-config';
  data: DendriteConfig;
}
export interface WorldStateSpecimen extends SpecimenBase {
  kind: 'world-state';
  data: GameWorldState;
}
export interface OculusInventorySpecimen extends SpecimenBase {
  kind: 'oculus-inventory';
  data: { primitives: number; hooks: number; components: number; tests: number };
}
export interface OculusTokensSpecimen extends SpecimenBase {
  kind: 'oculus-tokens';
  data: { palette: string[]; spacingSteps: number; timingCurves: number };
}
export interface MeshEntrySpecimen extends SpecimenBase {
  kind: 'mesh-entry';
  data: MeshManifestEntry;
}
export interface AssetManifestSpecimen extends SpecimenBase {
  kind: 'asset-manifest';
  data: AssetManifest;
}

export type Specimen =
  | HotspotSpecimen
  | CommitSpecimen
  | ParsedFileSpecimen
  | MonsterSpecimen
  | SpellSpecimen
  | QuestSpecimen
  | ItemSpecimen
  | FungalSpecimenEntry
  | PaletteSpecimen
  | SDFShaderSpecimen
  | DendriteConfigSpecimen
  | WorldStateSpecimen
  | OculusInventorySpecimen
  | OculusTokensSpecimen
  | MeshEntrySpecimen
  | AssetManifestSpecimen;

/* ------------------------------------------------------------------ */
/*  CHRONOS specimens                                                  */
/* ------------------------------------------------------------------ */

const chronosHotspot: HotspotSpecimen = {
  id: 'chr-hotspot',
  pillar: 'chronos',
  variant: 'modal',
  title: 'High-Risk Hotspot',
  icon: '\u{1F525}',
  kind: 'hotspot',
  data: {
    path: 'src/engine/renderer.ts',
    churnRate: 47,
    complexity: 83,
    riskScore: 0.91,
  },
};

const chronosCommit: CommitSpecimen = {
  id: 'chr-commit',
  pillar: 'chronos',
  variant: 'panel',
  title: 'Parsed Commit',
  icon: '\u{1F4DD}',
  kind: 'commit',
  data: {
    hash: 'a3f7c91',
    message: 'feat(engine): add frustum culling for dendrite LOD',
    author: 'dendro-dev',
    date: new Date('2026-01-28T14:32:00Z'),
    filesChanged: ['src/engine/renderer.ts', 'src/engine/culling.ts', 'src/types.ts'],
    insertions: 142,
    deletions: 38,
    isBugFix: false,
    isFeature: true,
    isMerge: false,
    type: 'feature',
    scope: 'engine',
    confidence: 'high',
  },
};

const chronosFile: ParsedFileSpecimen = {
  id: 'chr-file',
  pillar: 'chronos',
  variant: 'compact',
  title: 'Parsed File',
  icon: '\u{1F4C4}',
  kind: 'parsed-file',
  data: {
    path: 'packages/shared/src/types/index.ts',
    hash: 'e8b2d4f',
    language: 'TypeScript',
    complexity: 12,
    loc: 614,
    lastModified: new Date('2026-02-10T09:15:00Z'),
    author: 'dendro-dev',
  },
};

/* ------------------------------------------------------------------ */
/*  LUDUS specimens                                                    */
/* ------------------------------------------------------------------ */

const ludusMonster: MonsterSpecimen = {
  id: 'lud-monster',
  pillar: 'ludus',
  variant: 'modal',
  title: 'Bug Creature',
  icon: '\u{1F41B}',
  kind: 'monster',
  data: {
    id: 'bug-nullptr-3',
    name: 'Dereferex the Void',
    type: 'null-pointer',
    element: 'air',
    severity: 4,
    stats: {
      health: 180,
      maxHealth: 180,
      mana: 60,
      maxMana: 60,
      attack: 28,
      defense: 14,
      speed: 22,
    },
    spells: ['void-lance', 'null-shroud'],
    statusEffects: [],
    xpReward: 320,
    lootTable: [
      { itemId: 'knowledge-ptr-safety', chance: 0.4 },
      { itemId: 'potion-mana-sm', chance: 0.7 },
    ],
    sourceCommit: 'a3f7c91',
  },
};

const ludusSpell: SpellSpecimen = {
  id: 'lud-spell',
  pillar: 'ludus',
  variant: 'panel',
  title: 'Spell Card',
  icon: '\u{2728}',
  kind: 'spell',
  data: {
    id: 'refactor-blast',
    name: 'Refactor Blast',
    description: 'Restructures enemy code patterns, dealing damage over time',
    manaCost: 25,
    cooldown: 3,
    effect: {
      type: 'dot',
      target: 'enemy',
      value: 18,
      duration: 3,
    },
    element: 'fire',
  },
};

const ludusQuest: QuestSpecimen = {
  id: 'lud-quest',
  pillar: 'ludus',
  variant: 'compact',
  title: 'Active Quest',
  icon: '\u{1F4DC}',
  kind: 'quest',
  data: {
    id: 'quest-hotspot-hunt',
    title: 'Hotspot Hunter',
    description: 'Investigate the 3 highest-risk files in the repository',
    type: 'bug-hunt',
    status: 'active',
    requirements: [
      'Defeat renderer.ts guardian',
      'Analyze parser.ts complexity',
      'Refactor utils.ts coupling',
    ],
    rewards: [
      { type: 'experience', value: 500 },
      { type: 'knowledge', value: 'cyclomatic-mastery' },
    ],
  },
};

const ludusItem: ItemSpecimen = {
  id: 'lud-item',
  pillar: 'ludus',
  variant: 'tooltip',
  title: 'Inventory Item',
  icon: '\u{1F9EA}',
  kind: 'item',
  data: {
    id: 'potion-complexity-reducer',
    name: 'Complexity Reducer',
    description: 'Reduces cyclomatic complexity by extracting functions',
    type: 'consumable',
    effect: {
      type: 'buff-attack',
      value: 15,
      duration: 3,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  IMAGINARIUM specimens                                              */
/* ------------------------------------------------------------------ */

const imagFungal: FungalSpecimenEntry = {
  id: 'img-fungal',
  pillar: 'imaginarium',
  variant: 'modal',
  title: 'Fungal Specimen',
  icon: '\u{1F344}',
  kind: 'fungal',
  data: {
    id: 'specimen-luminara',
    filePath: 'src/engine/renderer.ts',
    taxonomy: {
      division: 'Basidiomycota',
      class: 'Agaricomycetes',
      order: 'Agaricales',
      family: 'Mycenaceae',
      genus: 'Luminara',
      species: 'luminara-renderi',
    },
    morphology: {
      capShape: 'convex',
      capWidth: 3.2,
      capHeight: 1.8,
      gillAttachment: 'adnate',
      gillCount: 24,
      stem: {
        height: 4.5,
        thickness: 0.6,
        bulbous: false,
        rooting: true,
        ringed: false,
      },
      sporePrintColor: '#c4a0ff',
      bioluminescence: 'strong',
      sizeClass: 'medium',
      spots: true,
      scaleColor: '#7c3aed',
      gillColor: '#d8b4fe',
    },
    lore: {
      tier: 'rare',
      title: 'The Render Oracle',
      flavorText: 'Its glow intensifies near complex render paths',
      codeInsight: 'High cyclomatic complexity correlates with bioluminescence',
      domainKnowledge: '3D rendering pipeline',
      discoveredAt: Date.now(),
    },
    placement: {
      position: [12.5, 0.0, -8.3],
      hostTree: 'renderer-dendrite',
      substrate: 'silicon-bark',
      clusterSize: 3,
      rotation: 45,
      scale: 1.2,
    },
    assets: {
      svgPath: 'assets/specimens/luminara-renderi.svg',
    },
  },
};

const imagPalette: PaletteSpecimen = {
  id: 'img-palette',
  pillar: 'imaginarium',
  variant: 'panel',
  title: 'Procedural Palette',
  icon: '\u{1F3A8}',
  kind: 'palette',
  data: {
    primary: '#A855F7',
    secondary: '#7C3AED',
    accent: '#DDA0DD',
    background: '#1a0a2e',
    glow: 'rgba(168,85,247,0.4)',
    mood: 'cool',
  },
};

const imagShader: SDFShaderSpecimen = {
  id: 'img-shader',
  pillar: 'imaginarium',
  variant: 'compact',
  title: 'SDF Shader',
  icon: '\u{1F48E}',
  kind: 'sdf-shader',
  data: {
    id: 'sdf-dendrite-bark',
    glsl: 'float sdBark(vec3 p) { return length(p) - 1.0; }',
    parameters: { roughness: 0.7, grain: 0.4, displacement: 0.15 },
    complexity: 342,
  },
};

/* ------------------------------------------------------------------ */
/*  ARCHITECTUS specimens                                              */
/* ------------------------------------------------------------------ */

const archDendrite: DendriteConfigSpecimen = {
  id: 'arc-dendrite',
  pillar: 'architectus',
  variant: 'panel',
  title: 'Dendrite Config',
  icon: '\u{1F333}',
  kind: 'dendrite-config',
  data: {
    sdfShader: {
      id: 'sdf-dendrite-bark',
      glsl: '/* shader */\n',
      parameters: { roughness: 0.7, grain: 0.4 },
      complexity: 342,
    },
    palette: {
      primary: '#3B82F6',
      secondary: '#60a5fa',
      accent: '#93c5fd',
      background: '#0a1628',
      glow: 'rgba(59,130,246,0.3)',
      mood: 'cool',
    },
    lSystem: {
      axiom: 'F',
      rules: { F: 'F[+F]F[-F]F' },
      iterations: 5,
      angle: 25.7,
    },
    rootPosition: [0, 0, 0],
    scale: 1.5,
  },
};

const archWorldState: WorldStateSpecimen = {
  id: 'arc-world',
  pillar: 'architectus',
  variant: 'compact',
  title: 'World State',
  icon: '\u{1F30D}',
  kind: 'world-state',
  data: {
    playerPosition: [12.5, 3.2, -8.7],
    cameraMode: 'falcon',
    currentBranch: 'main',
    visitedNodes: [
      'src/index.ts',
      'src/App.tsx',
      'src/engine/renderer.ts',
      'src/engine/culling.ts',
      'packages/shared/src/types/index.ts',
      'packages/oculus/src/index.ts',
      'packages/chronos/src/parser.ts',
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  OCULUS meta specimens                                              */
/* ------------------------------------------------------------------ */

const oculusInventory: OculusInventorySpecimen = {
  id: 'ocu-inventory',
  pillar: 'oculus',
  variant: 'modal',
  title: 'Component Inventory',
  icon: '\u{1F441}',
  kind: 'oculus-inventory',
  data: { primitives: 6, hooks: 5, components: 8, tests: 20 },
};

const oculusTokens: OculusTokensSpecimen = {
  id: 'ocu-tokens',
  pillar: 'oculus',
  variant: 'panel',
  title: 'Design Tokens',
  icon: '\u{1F3AF}',
  kind: 'oculus-tokens',
  data: {
    palette: ['#f5a97f', '#d88957', '#ffd4b8', '#1a1a2e', '#0d0d1a'],
    spacingSteps: 6,
    timingCurves: 3,
  },
};

/* ------------------------------------------------------------------ */
/*  OPERATUS specimens                                                 */
/* ------------------------------------------------------------------ */

const opMesh: MeshEntrySpecimen = {
  id: 'ops-mesh',
  pillar: 'operatus',
  variant: 'panel',
  title: 'Mesh Manifest Entry',
  icon: '\u{1F9CA}',
  kind: 'mesh-entry',
  data: {
    path: 'assets/meshes/luminara-renderi.mesh.json',
    hash: 'e8b2d4f1a3c7091b',
    format: 'halfedge',
    vertices: 2048,
    faces: 3840,
    size: 147_456,
    tier: 'enriched',
    genusId: 'luminara',
  },
};

const opManifest: AssetManifestSpecimen = {
  id: 'ops-manifest',
  pillar: 'operatus',
  variant: 'compact',
  title: 'Asset Manifest',
  icon: '\u{1F4E6}',
  kind: 'asset-manifest',
  data: {
    version: '0.4.0',
    shaders: {
      'sdf-dendrite-bark': 'assets/shaders/bark.glsl',
      'sdf-cap-round': 'assets/shaders/cap-round.glsl',
      'sdf-gill-plate': 'assets/shaders/gill.glsl',
    },
    palettes: {
      'warm-amber': 'assets/palettes/warm-amber.json',
      'cool-azure': 'assets/palettes/cool-azure.json',
    },
    topology: 'assets/topology.json',
    checksum: 'sha256:a1b2c3d4e5f6',
    mycology: {
      specimens: 'assets/mycology/specimens.json',
      network: 'assets/mycology/network.json',
      assetDir: 'assets/mycology/svg/',
      specimenCount: 42,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Export all specimens                                                */
/* ------------------------------------------------------------------ */

export const ALL_SPECIMENS: Specimen[] = [
  // CHRONOS
  chronosHotspot,
  chronosCommit,
  chronosFile,
  // LUDUS
  ludusMonster,
  ludusSpell,
  ludusQuest,
  ludusItem,
  // IMAGINARIUM
  imagFungal,
  imagPalette,
  imagShader,
  // ARCHITECTUS
  archDendrite,
  archWorldState,
  // OCULUS
  oculusInventory,
  oculusTokens,
  // OPERATUS
  opMesh,
  opManifest,
];

export const PILLAR_EMOJIS: Record<PillarId, string> = {
  chronos: '\u{231B}',
  imaginarium: '\u{1F52E}',
  architectus: '\u{1F3DB}',
  ludus: '\u{2694}',
  oculus: '\u{1F441}',
  operatus: '\u{2699}',
};

export const PILLAR_LABELS: Record<PillarId, string> = {
  chronos: 'CHRONOS',
  imaginarium: 'IMAGINARIUM',
  architectus: 'ARCHITECTUS',
  ludus: 'LUDUS',
  oculus: 'OCULUS',
  operatus: 'OPERATUS',
};
