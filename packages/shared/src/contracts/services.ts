/**
 * PILLAR SERVICE CONTRACTS
 *
 * Each pillar exposes capabilities to other pillars through typed interfaces.
 * A service contract defines WHAT a pillar provides — not HOW it implements it.
 *
 * These replace direct cross-pillar imports and formalize the capabilities
 * that currently flow through the EventBus or manual wiring.
 *
 * Design principles:
 *   1. One interface per pillar capability (not per pillar)
 *   2. Consumer doesn't know the implementor's internals
 *   3. Async-first — all cross-pillar calls may involve I/O
 *   4. Teardown is explicit — every service has destroy()
 *
 * Dependency direction:
 *   shared/contracts defines interfaces
 *   Pillar packages implement them
 *   Consumers depend on the interface, never the implementation
 */

import type {
  Character,
  Quest,
  Action,
  BattleState,
  Monster,
  ParsedFile,
  ParsedCommit,
  Hotspot,
  ContributorProfile,
  FungalSpecimen,
  SerializedMeshData,
  MeshManifestEntry,
  AssetManifest,
} from '../types/index.js';

import type {
  IGameState,
  IGameStore,
  ISaveSnapshot,
  ViewMode,
} from './state.js';

// ═══════════════════════════════════════════════════════════════
// OPERATUS — Persistence & Infrastructure
// ═══════════════════════════════════════════════════════════════

/**
 * Persistence service — save, load, and manage game state on disk.
 *
 * OPERATUS implements this. LUDUS and the app shell consume it.
 * Replaces the direct coupling between StateAdapter and LUDUS GameStore.
 *
 * @implementor OPERATUS (StatePersistence + StateAdapter + AutoSave)
 * @consumer LUDUS (hydration at startup), App shell (save/load UI)
 */
export interface IPersistence {
  /**
   * Connect to a game store for bidirectional sync.
   * On connect: hydrates the store from persisted state.
   * During gameplay: syncs store changes to persistence layer.
   */
  connect(store: IGameStore): Promise<void>;

  /** Disconnect sync and cancel pending writes. */
  disconnect(): void;

  /** Take a snapshot of current state and persist it. */
  save(trigger?: string): Promise<void>;

  /** Load state from a named save slot. Returns null if not found. */
  load(slotName?: string): Promise<ISaveSnapshot | null>;

  /** List available save slots with metadata. */
  listSlots(): Promise<SaveSlotInfo[]>;

  /** Delete a save slot. */
  deleteSlot(slotName: string): Promise<void>;

  /** Export a save as portable JSON. */
  exportSave(slotName?: string): Promise<string | null>;

  /** Import a save from JSON. */
  importSave(json: string): Promise<void>;
}

export interface SaveSlotInfo {
  key: string;
  timestamp: number;
  version: number;
  characterName?: string;
  playtimeMs?: number;
}

/**
 * Cache service — asset caching with tiered storage.
 *
 * OPERATUS implements this with memory → OPFS → IndexedDB → CDN fallback.
 * ARCHITECTUS consumes it for mesh/shader loading.
 *
 * @implementor OPERATUS (CacheManager + OPFSCache + IDBCache)
 * @consumer ARCHITECTUS (asset loading), App shell (cache management)
 */
export interface ICacheService {
  /** Get a cached asset by key. Returns null on miss. */
  get<T = unknown>(key: string): Promise<T | null>;

  /** Store an asset in the cache. */
  set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /** Check if a key exists without fetching. */
  has(key: string): Promise<boolean>;

  /** Remove a specific key. */
  delete(key: string): Promise<void>;

  /** Clear all cached data. */
  clear(): Promise<void>;

  /** Prefetch assets by key for upcoming use. */
  prefetch(keys: string[]): Promise<void>;

  /** Current cache statistics. */
  stats(): CacheStats;
}

export interface CacheOptions {
  /** Time-to-live in milliseconds. */
  ttlMs?: number;
  /** Storage tier preference: 'memory' | 'persistent'. */
  tier?: 'memory' | 'persistent';
}

export interface CacheStats {
  memoryEntries: number;
  memoryBytes: number;
  persistentEntries: number;
  persistentBytes: number;
  hitRate: number;
}

/**
 * Lifecycle service — initialization, teardown, and health.
 *
 * OPERATUS implements this. The app shell calls it once at startup.
 * Replaces the orphaned initializeOperatus() + missing destroy().
 *
 * @implementor OPERATUS (init.ts)
 * @consumer App shell (startup/shutdown)
 */
export interface ILifecycle {
  /** Initialize all OPERATUS subsystems. Call once at app startup. */
  initialize(config?: LifecycleConfig): Promise<void>;

  /** Tear down all subsystems, flush pending saves, release resources. */
  destroy(): Promise<void>;

  /** Health check — returns subsystem status. */
  health(): LifecycleHealth;
}

export interface LifecycleConfig {
  /** Enable debug logging. */
  debug?: boolean;
  /** Auto-save interval in milliseconds (0 = disabled). */
  autoSaveIntervalMs?: number;
  /** Enable service worker registration. */
  serviceWorker?: boolean;
  /** Enable cross-tab sync. */
  crossTabSync?: boolean;
}

export interface LifecycleHealth {
  initialized: boolean;
  subsystems: Record<string, 'ok' | 'degraded' | 'error'>;
}

// ═══════════════════════════════════════════════════════════════
// LUDUS — Combat & Game Logic
// ═══════════════════════════════════════════════════════════════

/**
 * Combat system — query available actions and execute turns.
 *
 * LUDUS implements this. OCULUS consumes it for the battle UI.
 * Replaces the current pattern where OCULUS emits SPELL_CAST events
 * and hopes LUDUS processes them.
 *
 * @implementor LUDUS (TurnBasedEngine + EventWiring)
 * @consumer OCULUS (BattleUI)
 */
export interface ICombatSystem {
  /** Whether a battle is currently active. */
  isActive(): boolean;

  /** Get the current battle state. Returns null if no battle. */
  getState(): BattleState | null;

  /** Get available player actions for the current turn. */
  getAvailableActions(): AvailableActions;

  /** Execute a player action. Returns the updated battle state. */
  executeAction(action: Action): BattleState;

  /** Start a new battle. */
  startBattle(enemies: Monster[], seed?: number): BattleState;
}

export interface AvailableActions {
  canAttack: boolean;
  availableSpells: string[];
  canDefend: boolean;
  canUseItem: boolean;
}

/**
 * Game session — the runtime game context with topology data.
 *
 * LUDUS implements this. The app shell creates it at startup.
 * Encapsulates the store, encounter system, quest state, and
 * CHRONOS topology data needed for encounter generation.
 *
 * @implementor LUDUS (EventWiring.createGameSession)
 * @consumer App shell (initialization), OPERATUS (persistence)
 */
export interface IGameSession {
  /** The game store instance. */
  readonly store: IGameStore;

  /** Wire all event listeners. Returns a cleanup function. */
  wireEvents(): () => void;

  /** Dispatch a combat action (delegates to the combat system). */
  dispatchCombatAction(action: Action): void;

  /** Start a battle with the given enemies. */
  startBattle(enemies: Monster[], seed?: number): void;
}

// ═══════════════════════════════════════════════════════════════
// ARCHITECTUS — Spatial & Rendering
// ═══════════════════════════════════════════════════════════════

/**
 * Spatial event source — player position, navigation, and selection.
 *
 * ARCHITECTUS implements this (via R3F components that emit events).
 * The contract formalizes what ARCHITECTUS provides to LUDUS and OCULUS.
 *
 * NOTE: This interface documents the spatial data contract. In practice,
 * ARCHITECTUS communicates via EventBus emissions. This interface exists
 * so that the event payloads have a typed specification and so that
 * future direct-call patterns (e.g., query player position) have a home.
 *
 * @implementor ARCHITECTUS (DendriteWorld, CameraRig, NodeInstances)
 * @consumer LUDUS (encounter triggers), OCULUS (minimap, breadcrumb)
 */
export interface ISpatialQuery {
  /** Current player position in world space. */
  getPlayerPosition(): [number, number, number];

  /** Current view mode. */
  getViewMode(): ViewMode;

  /** The branch/directory the player is currently inside. */
  getCurrentBranch(): string | null;

  /** IDs of nodes within interaction range of the player. */
  getNearbyNodes(radius: number): string[];
}

// ═══════════════════════════════════════════════════════════════
// IMAGINARIUM — Mesh & Visual Pipeline
// ═══════════════════════════════════════════════════════════════

/**
 * Mesh provider — runtime access to generated mesh data.
 *
 * Replaces the direct import from @dendrovia/imaginarium/mesh-runtime
 * that both ARCHITECTUS and OPERATUS currently use. The implementation
 * lives in IMAGINARIUM; consumers depend only on this interface.
 *
 * @implementor IMAGINARIUM (mesh-runtime)
 * @consumer ARCHITECTUS (rendering), OPERATUS (caching/serialization)
 */
export interface IMeshProvider {
  /** Generate mesh data for a fungal specimen. */
  generateMesh(specimen: FungalSpecimen): MeshGenerationResult;

  /** Deserialize cached mesh data back into a renderable format. */
  deserialize(data: SerializedMeshData): FlatMeshResult;

  /** Serialize mesh data for caching. */
  serialize(mesh: FlatMeshResult): SerializedMeshData;

  /** Get the genus-specific mesh pipeline for a specimen. */
  getPipeline(genusId: string): MeshPipelineInfo;
}

/** The output of mesh generation — positions, normals, indices. */
export interface FlatMeshResult {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  faceCount: number;
}

export interface MeshGenerationResult {
  mesh: FlatMeshResult;
  manifest: MeshManifestEntry;
}

export interface MeshPipelineInfo {
  genusId: string;
  operations: string[];
}

// ═══════════════════════════════════════════════════════════════
// CHRONOS — Topology Data
// ═══════════════════════════════════════════════════════════════

/**
 * Topology provider — access to parsed codebase data.
 *
 * CHRONOS produces this at build-time. At runtime, the data is loaded
 * from generated JSON files. This interface abstracts whether the data
 * comes from a monolithic topology.json or chunked segment files.
 *
 * @implementor CHRONOS (build-time generation), App shell (runtime loading)
 * @consumer LUDUS (encounter generation), ARCHITECTUS (tree rendering),
 *           OCULUS (code reader, minimap)
 */
export interface ITopologyProvider {
  /** All parsed files in the codebase. */
  getFiles(): ParsedFile[];

  /** All parsed commits. */
  getCommits(): ParsedCommit[];

  /** Hotspot files (high churn + complexity). */
  getHotspots(): Hotspot[];

  /** Contributor profiles for NPC generation. */
  getContributors(): ContributorProfile[];

  /** Whether segment-level loading is available. */
  isSegmented(): boolean;

  /** Load a specific segment's topology (when segmented). */
  loadSegment?(segmentId: string): Promise<SegmentTopology>;
}

export interface SegmentTopology {
  segmentId: string;
  files: ParsedFile[];
  hotspots: Hotspot[];
}

// ═══════════════════════════════════════════════════════════════
// Service Registry
// ═══════════════════════════════════════════════════════════════

/**
 * Central service registry — the app shell wires pillar implementations
 * to these interfaces at startup. Consumers look up services by interface.
 *
 * This replaces the implicit wiring where pillars reach into each other's
 * internals or rely on EventBus side effects for initialization.
 *
 * Usage:
 *   // App shell (wiring):
 *   const registry = createServiceRegistry();
 *   registry.register('persistence', new OperatusPersistence());
 *   registry.register('combat', new LudusCombatSystem());
 *
 *   // Consumer (usage):
 *   const persistence = registry.get('persistence');
 *   await persistence.save();
 */
export interface IServiceRegistry {
  register<K extends keyof ServiceMap>(name: K, service: ServiceMap[K]): void;
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K];
  has(name: keyof ServiceMap): boolean;
}

/**
 * The complete service map. Add entries as new services are formalized.
 *
 * This is the typed lookup table — ensures registry.get('persistence')
 * returns IPersistence, not unknown.
 */
export interface ServiceMap {
  persistence: IPersistence;
  cache: ICacheService;
  lifecycle: ILifecycle;
  combat: ICombatSystem;
  spatial: ISpatialQuery;
  mesh: IMeshProvider;
  topology: ITopologyProvider;
}

// ── Migration Notes ─────────────────────────────────────────────
//
// Adoption is incremental. Each service can be formalized independently:
//
// Phase 1 — IPersistence:
//   OPERATUS StateAdapter already does this. Refactor to implement
//   IPersistence, then LUDUS imports the interface instead of
//   coupling to StateAdapter's concrete class.
//
// Phase 2 — ICombatSystem:
//   Extract from LUDUS TurnBasedEngine + EventWiring. OCULUS BattleUI
//   calls ICombatSystem.executeAction() instead of emitting SPELL_CAST
//   events and hoping LUDUS picks them up.
//
// Phase 3 — IMeshProvider:
//   IMAGINARIUM mesh-runtime already exports the right functions.
//   Wrap in an IMeshProvider adapter. ARCHITECTUS and OPERATUS
//   import the interface from shared, not @dendrovia/imaginarium.
//
// Phase 4 — ITopologyProvider:
//   Abstract whether topology comes from monolithic JSON or segments.
//   LUDUS createGameSession takes ITopologyProvider instead of
//   raw files/commits/hotspots arrays.
//
// Phase 5 — ISpatialQuery:
//   ARCHITECTUS exposes position/branch data. Currently event-only;
//   ISpatialQuery adds a pull-based alternative for components that
//   need current position without subscribing to every move event.
//
// Phase 6 — IServiceRegistry:
//   Wire it all together in the app shell. Each pillar registers its
//   service implementation. Consumers look up by interface name.
