/**
 * SHARED TYPE DEFINITIONS
 *
 * These types are the "Contract" between pillars.
 * They define the shape of data structures that cross pillar boundaries.
 */

/**
 * CHRONOS OUTPUT TYPES
 * (What the archaeologist discovers)
 */

export interface ParsedFile {
  path: string;
  hash: string;
  language: string;
  complexity: number; // Cyclomatic complexity
  loc: number; // Lines of code
  lastModified: Date;
  author: string;
}

export interface ParsedCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: string[];
  insertions: number;
  deletions: number;
  isBugFix: boolean;
  isFeature: boolean;
  isMerge: boolean;
}

export interface CodeTopology {
  files: ParsedFile[];
  commits: ParsedCommit[];
  tree: FileTreeNode;
  hotspots: Hotspot[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  metadata?: ParsedFile;
}

export interface Hotspot {
  path: string;
  churnRate: number; // Number of commits touching this file
  complexity: number;
  riskScore: number; // Combined metric
}

/**
 * IMAGINARIUM OUTPUT TYPES
 * (What the artist creates)
 */

export interface ProceduralPalette {
  primary: string; // Hex color
  secondary: string;
  accent: string;
  background: string;
  glow: string;
  mood: 'warm' | 'cool' | 'neutral';
}

export interface SDFShader {
  id: string;
  glsl: string; // Shader source code
  parameters: Record<string, number>; // Tunable parameters
  complexity: number; // Instruction count estimate
}

export interface NoiseFunction {
  type: 'simplex' | 'perlin' | 'worley' | 'fbm';
  octaves: number;
  frequency: number;
  amplitude: number;
  seed: number;
}

export interface LSystemRule {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
  angle: number;
}

/**
 * ARCHITECTUS RUNTIME TYPES
 * (What the engine needs)
 */

export interface DendriteConfig {
  sdfShader: SDFShader;
  palette: ProceduralPalette;
  lSystem: LSystemRule;
  rootPosition: [number, number, number];
  scale: number;
}

export interface GameWorldState {
  playerPosition: [number, number, number];
  cameraMode: 'falcon' | 'player';
  currentBranch: string;
  visitedNodes: Set<string>;
}

/**
 * LUDUS GAME TYPES
 * (Mechanics and rules)
 */

export interface Character {
  id: string;
  name: string;
  class: 'tank' | 'healer' | 'dps';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  effect: SpellEffect;
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'buff' | 'debug';
  value: number;
  duration?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'bug-hunt' | 'refactor' | 'feature' | 'archaeology';
  status: 'locked' | 'available' | 'active' | 'completed';
  requirements: string[]; // Quest IDs that must be completed first
  rewards: QuestReward[];
}

export interface QuestReward {
  type: 'experience' | 'item' | 'knowledge';
  value: number | string;
}

export interface Bug {
  id: string;
  type: 'null-pointer' | 'memory-leak' | 'race-condition' | 'off-by-one';
  severity: 1 | 2 | 3 | 4 | 5;
  health: number;
  position: [number, number, number];
  sourceCommit: string;
}

/**
 * OCULUS UI TYPES
 * (What the player sees)
 */

export interface HUDState {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  activeQuest?: Quest;
  minimap: boolean;
}

export interface MillerColumn {
  depth: number;
  items: MillerColumnItem[];
  selected: number;
}

export interface MillerColumnItem {
  id: string;
  label: string;
  type: 'file' | 'directory' | 'function' | 'class';
  icon?: string;
}

/**
 * OPERATUS INFRASTRUCTURE TYPES
 * (How data is stored/loaded)
 */

export interface AssetManifest {
  version: string;
  shaders: Record<string, string>; // id → file path
  palettes: Record<string, string>;
  topology: string; // Path to topology.json
  checksum: string;
  mycology?: {
    specimens: string;    // path to specimens.json
    network: string;      // path to network.json
    assetDir: string;     // path to svg asset directory
    specimenCount: number;
  };
}

export interface GameSaveState {
  timestamp: number;
  character: Character;
  quests: Quest[];
  visitedNodes: string[];
  unlockedKnowledge: string[];
}

/**
 * MYCOLOGY TYPES
 * (Forest floor specimens and mycelial networks)
 */

export interface FungalSpecimen {
  id: string;
  filePath: string;
  taxonomy: {
    division: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  morphology: {
    capShape: string;
    capWidth: number;
    capHeight: number;
    gillAttachment: string;
    gillCount: number;
    stem: {
      height: number;
      thickness: number;
      bulbous: boolean;
      rooting: boolean;
      ringed: boolean;
    };
    sporePrintColor: string;
    bioluminescence: string;
    sizeClass: string;
    spots: boolean;
    scaleColor: string;
    gillColor: string;
  };
  lore: MushroomLore;
  placement: {
    position: [number, number, number];
    hostTree?: string;
    substrate: string;
    clusterSize: number;
    rotation: number;
    scale: number;
  };
  assets: {
    svgPath?: string;
    meshDataPath?: string;
  };
}

export interface MushroomLore {
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  title: string;
  flavorText: string;
  codeInsight: string;
  domainKnowledge?: string;
  codeSnippet?: string;
  discoveredAt?: number;
}

export interface MycelialNetwork {
  nodes: Array<{
    id: string;
    genus: string;
    connections: number;
    isHub: boolean;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    signalTypes: string[];
    strength: number;
    bidirectional: boolean;
  }>;
  clusters: Array<{
    id: string;
    nodeIds: string[];
    internalEdges: number;
    externalEdges: number;
    density: number;
  }>;
  hubNodes: string[];
}

export interface MycologyCatalogedEvent {
  specimenCount: number;
  networkEdgeCount: number;
  manifestPath: string;
}
