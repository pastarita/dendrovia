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

export type CommitType =
  | 'bug-fix'
  | 'feature'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'performance'
  | 'merge'
  | 'revert'
  | 'dependency'
  | 'breaking-change'
  | 'chore'
  | 'style'
  | 'maintenance';

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
  /** Full 13-value classification */
  type?: CommitType;
  /** Scope from conventional commits */
  scope?: string;
  /** Breaking change flag */
  isBreaking?: boolean;
  /** Classification confidence */
  confidence?: 'high' | 'medium' | 'low';
}

export interface TemporalCoupling {
  fileA: string;
  fileB: string;
  coChangeCount: number;
  strength: number;
}

export interface RepositoryMetadata {
  name: string;
  remoteUrl: string;
  currentBranch: string;
  branchCount: number;
  fileCount: number;
  commitCount: number;
  contributorCount: number;
  languages: string[];
  analyzedAt: string;
  headHash: string;
}

export interface LanguageDistribution {
  language: string;
  fileCount: number;
  locTotal: number;
  percentage: number;
}

export interface ContributorSummary {
  totalContributors: number;
  topContributor: string;
  archetypeDistribution: Record<string, number>;
}

export interface DeepWikiEnrichment {
  wikiUrl: string;
  overview?: string;
  topics?: Array<{ title: string; id: string; children?: Array<{ title: string; id: string }> }>;
  moduleDocumentation?: Record<string, string>;
  fetchedAt: string;
}

export interface CodeTopology {
  files: ParsedFile[];
  commits: ParsedCommit[];
  tree: FileTreeNode;
  hotspots: Hotspot[];
  repository?: RepositoryMetadata;
  languageDistribution?: LanguageDistribution[];
  contributorSummary?: ContributorSummary;
  temporalCouplings?: TemporalCoupling[];
  /** Optional AI-generated documentation from DeepWiki. Absent = not fetched or unavailable. */
  deepwiki?: DeepWikiEnrichment;
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
  visitedNodes: string[];
}

/**
 * LUDUS GAME TYPES
 * (Mechanics and rules)
 */

export type CharacterClass = 'tank' | 'healer' | 'dps';
export type Element = 'fire' | 'water' | 'earth' | 'air' | 'none';
export type BugType = 'null-pointer' | 'memory-leak' | 'race-condition' | 'off-by-one';

export interface CharacterStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  stats: CharacterStats;
  level: number;
  experience: number;
  spells: string[]; // Spell IDs
  statusEffects: StatusEffect[];
  cooldowns: Record<string, number>; // spellId → turns remaining
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'poison' | 'regen' | 'shield' | 'stun' | 'attack-up' | 'attack-down' | 'defense-up' | 'defense-down';
  value: number;
  remainingTurns: number;
  stackable: boolean;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  effect: SpellEffect;
  element: Element;
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'dot' | 'aoe-damage' | 'cleanse' | 'taunt' | 'revive';
  target: 'self' | 'enemy' | 'all-enemies' | 'all-allies';
  value: number;
  duration?: number;
}

export interface SpellSymbol {
  shape: 'circle' | 'triangle' | 'square' | 'star';
  element: Element;
  modifier: 'swift' | 'heavy' | 'precise' | 'chaotic';
}

export interface GrowthRates {
  hp: number;
  mana: number;
  attack: number;
  defense: number;
  speed: number;
}

/**
 * LUDUS COMBAT TYPES
 */

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export type CombatPhase =
  | { type: 'PLAYER_TURN' }
  | { type: 'ENEMY_TURN'; currentEnemyIndex: number }
  | { type: 'RESOLUTION' }
  | { type: 'VICTORY'; xpGained: number; loot: Item[] }
  | { type: 'DEFEAT'; cause: string };

export type Action =
  | { type: 'ATTACK'; targetIndex: number }
  | { type: 'CAST_SPELL'; spellId: string; targetIndex: number }
  | { type: 'DEFEND' }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'ENEMY_ACT'; enemyIndex: number };

export interface ActionLogEntry {
  turn: number;
  actor: 'player' | `enemy:${number}`;
  action: Action;
  result: string;
}

export interface Monster {
  id: string;
  name: string;
  type: BugType;
  element: Element;
  severity: 1 | 2 | 3 | 4 | 5;
  stats: CharacterStats;
  spells: string[]; // Spell IDs
  statusEffects: StatusEffect[];
  xpReward: number;
  lootTable: LootEntry[];
  sourceCommit?: string;
}

export interface LootEntry {
  itemId: string;
  chance: number; // 0-1 probability
}

export interface BattleState {
  turn: number;
  phase: CombatPhase;
  player: Character;
  enemies: Monster[];
  log: ActionLogEntry[];
  rng: RngState;
}

export interface BattleReplay {
  seed: number;
  playerClass: CharacterClass;
  playerLevel: number;
  monsterType: string;
  monsterSeverity: number;
  actions: ActionLogEntry[];
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  elementMultiplier: number;
  log: string;
}

/**
 * LUDUS ITEM TYPES
 */

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'knowledge';
  effect: ItemEffect;
}

export interface ItemEffect {
  type: 'heal-hp' | 'heal-mana' | 'buff-attack' | 'buff-defense' | 'cleanse' | 'full-restore';
  value: number;
  duration?: number;
}

/**
 * LUDUS QUEST TYPES
 */

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'bug-hunt' | 'refactor' | 'feature' | 'archaeology';
  status: 'locked' | 'available' | 'active' | 'completed';
  requirements: string[];
  rewards: QuestReward[];
}

export interface QuestReward {
  type: 'experience' | 'item' | 'knowledge';
  value: number | string;
}

/**
 * LUDUS ENCOUNTER TYPES
 */

export interface Bug {
  id: string;
  type: BugType;
  severity: 1 | 2 | 3 | 4 | 5;
  health: number;
  position: [number, number, number];
  sourceCommit: string;
}

export interface Encounter {
  type: 'bug' | 'boss' | 'miniboss';
  monster: Monster;
  triggerCondition: {
    filePattern?: string;
    complexity?: number;
    commitType?: string;
  };
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
    specimens: string; // path to specimens.json
    network: string; // path to network.json
    assetDir: string; // path to svg asset directory
    specimenCount: number;
  };
  /** Generated mesh assets, keyed by specimen/genus ID → file path */
  meshes?: Record<string, MeshManifestEntry>;
  /** Story arc segment data */
  storyArc?: {
    arc: string;
    segmentAssets: string;
    segmentCount: number;
  };
}

/**
 * MESH ASSET TYPES
 * (Versioned, cacheable mesh data for OPERATUS delivery)
 */

/** Manifest entry for a single mesh asset — enables OPERATUS versioning and cache invalidation. */
export interface MeshManifestEntry {
  /** Relative path to the serialized mesh file */
  path: string;
  /** SHA-256 content hash (truncated to 16 hex chars) for cache busting */
  hash: string;
  /** Mesh data format */
  format: MeshFormat;
  /** Vertex count (for progress tracking and LOD decisions) */
  vertices: number;
  /** Face/triangle count */
  faces: number;
  /** File size in bytes (for loading priority and progress) */
  size: number;
  /** Generation tier: determines fallback strategy */
  tier: MeshTier;
  /** Genus ID — links back to FungalSpecimen taxonomy */
  genusId?: string;
}

/** Serialization format of the mesh file. Consumers use this to select the deserializer. */
export type MeshFormat = 'halfedge' | 'indexed' | 'profile';

/** Generation complexity tier — determines fallback chain:
 *  If 'enriched' fails → fall back to 'base'
 *  If 'base' fails → fall back to 'parametric' (regenerate from ProfileGeometry)
 *  If 'parametric' fails → fall back to 'billboard' (SVG sprite)
 */
export type MeshTier = 'enriched' | 'base' | 'parametric' | 'billboard';

/**
 * Serialized half-edge mesh — the on-disk/over-network format.
 * All fields are plain JSON-safe values (no typed arrays, no circular refs).
 * OPERATUS caches this in IDB/OPFS with hash-based invalidation.
 */
export interface SerializedMeshData {
  /** Format version for migration support */
  version: 1;
  /** Mesh format discriminator */
  format: MeshFormat;
  /** Flat vertex positions [x,y,z, x,y,z, ...] */
  positions: number[];
  /** Flat vertex normals [nx,ny,nz, ...] — pre-computed, area-weighted */
  normals: number[];
  /** Triangle indices [i0,i1,i2, ...] */
  indices: number[];
  /** Vertex count (redundant but useful for pre-allocation) */
  vertexCount: number;
  /** Face count */
  faceCount: number;
  /** Optional: half-edge topology for consumers that need adjacency queries.
   *  Omitted when format='indexed' (GPU-only consumers don't need topology). */
  topology?: {
    halfedges: Array<{ vertex: number; face: number; next: number; prev: number; twin: number }>;
    vertexHalfedges: number[]; // per-vertex outgoing halfedge index
    faceHalfedges: number[]; // per-face one halfedge index
  };
  /** Generation metadata for debugging and versioning */
  meta?: {
    genus?: string;
    pipeline?: string[]; // ordered list of MeshOp names that produced this mesh
    generatedAt?: number; // timestamp
    sourceHash?: string; // hash of the input parameters (for determinism verification)
  };
}

export interface GameSaveState {
  timestamp: number;
  character: Character;
  quests: Quest[];
  visitedNodes: string[];
  unlockedKnowledge: string[];
  inventory: Item[];
  gameFlags: Record<string, boolean>;
  worldPosition: [number, number, number];
  cameraMode: 'falcon' | 'player';
  playtimeMs: number;
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

/**
 * STORY ARC TYPES
 * (Narrative structure derived from code topology)
 */

export type StoryPhase = 'prologue' | 'rising' | 'climax' | 'falling' | 'epilogue';

export type SegmentMood = 'serene' | 'tense' | 'chaotic' | 'triumphant' | 'mysterious';

export interface SegmentMetrics {
  fileCount: number;
  totalLoc: number;
  avgComplexity: number;
  maxComplexity: number;
  hotspotCount: number;
  avgChurn: number;
  dominantLanguage: string;
  encounterDensity: number;
}

export interface StorySegment {
  id: string;
  label: string;
  phase: StoryPhase;
  mood: SegmentMood;
  filePaths: string[];
  treePath: string;
  metrics: SegmentMetrics;
  ordinal: number;
}

export interface StoryArc {
  version: string;
  seed: string;
  segments: StorySegment[];
  totalFiles: number;
  derivedAt: string;
  topologyHash: string;
}

export interface SegmentAssets {
  segmentId: string;
  palette: ProceduralPalette;
  noise: NoiseFunction;
  lsystem: LSystemRule;
  shader: SDFShader;
  specimenIds?: string[];
}

export interface SegmentPlacement {
  segmentId: string;
  nodePaths: string[];
  centroid: [number, number, number];
  radius: number;
}
