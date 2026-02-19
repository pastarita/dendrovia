/**
 * SHARED EVENT BUS
 *
 * This is the ONLY communication channel between pillars at runtime.
 * Enforces loose coupling and allows parallel development.
 *
 * Philosophy: "Does this architectural separation allow two people to work
 * on the project without speaking to each other? If yes, the interface is
 * defined correctly."
 */

import type { FileTreeNode, Hotspot, DeepWikiEnrichment, StoryArc, SegmentAssets, Action, ProceduralPalette, SDFShader, ParsedFile, MycologyCatalogedEvent } from '../types/index.js';

type EventHandler<T = any> = (data: T) => void | Promise<void>;

type AnyEventHandler = (event: string, data?: any) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private anyHandlers = new Set<AnyEventHandler>();
  private debug = false;

  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * Subscribe to a typed event (preferred).
   * Type is inferred from the event name when using GameEvents constants.
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void;
  /** Subscribe to an untyped/custom event (extensibility fallback). */
  on(event: string, handler: EventHandler): () => void;
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Subscribe to ALL events. Handler receives (event, data).
   * Returns unsubscribe function.
   */
  onAny(handler: AnyEventHandler): () => void {
    this.anyHandlers.add(handler);
    return () => {
      this.anyHandlers.delete(handler);
    };
  }

  /**
   * Emit a typed event (preferred).
   * Payload type is enforced when using GameEvents constants.
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): Promise<void>;
  /** Emit an untyped/custom event (extensibility fallback). */
  emit(event: string, data?: unknown): Promise<void>;
  async emit(event: string, data?: unknown): Promise<void> {
    if (this.debug) {
      console.debug('[shared/event-bus]', 'Event emitted', { event, data });
    }

    const handlers = this.handlers.get(event);

    // Execute specific handlers + anyHandlers in parallel
    const promises: (void | Promise<void>)[] = [];

    if (handlers) {
      for (const handler of handlers) {
        promises.push(handler(data));
      }
    }

    for (const handler of this.anyHandlers) {
      promises.push(handler(event, data));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /** One-time typed event subscription. */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void;
  /** One-time untyped event subscription (extensibility fallback). */
  once(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      handler(data);
    });
  }

  /**
   * Clear all handlers for an event
   */
  off(event: string): void {
    this.handlers.delete(event);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}

/**
 * EVENT CONTRACTS
 *
 * These define the exact shape of data passed between pillars.
 * NEVER change these without updating all consumers.
 *
 * Events are split into two lifecycle phases:
 *   - BuildEvents:   Emitted during the CHRONOS → IMAGINARIUM build pipeline.
 *   - RuntimeEvents: Emitted during gameplay.
 *
 * Import BuildEvents or RuntimeEvents directly. The combined GameEvents
 * re-export is deprecated.
 */

// ── Build-time Events ─────────────────────────────────────────────
//
// Emitted during the CHRONOS → IMAGINARIUM build pipeline.
// Not available at runtime — consumed before the app starts.

/** Build-time events emitted during the CHRONOS → IMAGINARIUM pipeline. */
export const BuildEvents = {
  /** CHRONOS → IMAGINARIUM: AST parsing complete, file data ready. */
  PARSE_COMPLETE: 'build:parse:complete',
  /** IMAGINARIUM → ARCHITECTUS: SDF shaders compiled for rendering. */
  SHADERS_COMPILED: 'build:shaders:compiled',
  /** IMAGINARIUM → ARCHITECTUS: Procedural palette generated from topology. */
  PALETTE_GENERATED: 'build:palette:generated',
  /** IMAGINARIUM → ARCHITECTUS: Mycology specimens cataloged for 3D placement. */
  MYCOLOGY_CATALOGED: 'build:mycology:cataloged',
  /** IMAGINARIUM → ARCHITECTUS: Story arc derived from commit topology. */
  STORY_ARC_DERIVED: 'build:storyarc:derived',
  /** IMAGINARIUM → ARCHITECTUS: Segment assets distilled and ready. */
  SEGMENT_DISTILLED: 'build:segment:distilled',
} as const;

// ── Runtime Events ──────────────────────────────────────────────
//
// Emitted during gameplay. Consumed by the EventBus at runtime.

/** Runtime events emitted during gameplay. */
export const RuntimeEvents = {
  // ARCHITECTUS → LUDUS (Spatial events)
  /** ARCHITECTUS → LUDUS, OCULUS: Player moved to a new position. */
  PLAYER_MOVED: 'player:moved',
  /** ARCHITECTUS → LUDUS: Player entered a code branch. */
  BRANCH_ENTERED: 'branch:entered',
  /** ARCHITECTUS → LUDUS, OCULUS: Player clicked a code node. */
  NODE_CLICKED: 'node:clicked',
  /** @planned — ARCHITECTUS → LUDUS, OCULUS: Player collided with an entity. Not yet emitted. */
  COLLISION_DETECTED: 'collision:detected',

  // LUDUS → ARCHITECTUS (Feedback events)
  /** LUDUS → ARCHITECTUS: Encounter triggered at location. */
  ENCOUNTER_TRIGGERED: 'encounter:triggered',
  /** LUDUS → ARCHITECTUS: Damage dealt in combat (for VFX). */
  DAMAGE_DEALT: 'damage:dealt',

  // LUDUS → OCULUS (UI updates)
  /** LUDUS → OCULUS: Entity health changed. */
  HEALTH_CHANGED: 'health:changed',
  /** LUDUS → OCULUS: Entity mana changed. */
  MANA_CHANGED: 'mana:changed',
  /** LUDUS → OCULUS: Quest status updated. */
  QUEST_UPDATED: 'quest:updated',
  /** LUDUS → OCULUS: Combat encounter started. */
  COMBAT_STARTED: 'combat:started',
  /** LUDUS → all: Combat encounter ended. */
  COMBAT_ENDED: 'combat:ended',

  // LUDUS combat granularity
  /** LUDUS → OCULUS: Combat turn started. */
  COMBAT_TURN_START: 'combat:turn:start',
  /** LUDUS → OCULUS: Combat turn ended. */
  COMBAT_TURN_END: 'combat:turn:end',
  /** LUDUS → OCULUS: Spell resolved with effect. */
  SPELL_RESOLVED: 'spell:resolved',
  /** LUDUS → OCULUS: Status effect applied to entity. */
  STATUS_EFFECT_APPLIED: 'status:applied',
  /** LUDUS → OCULUS: Status effect expired on entity. */
  STATUS_EFFECT_EXPIRED: 'status:expired',
  /** LUDUS → all: Experience gained from combat. */
  EXPERIENCE_GAINED: 'experience:gained',
  /** LUDUS → all: Character leveled up. */
  LEVEL_UP: 'level:up',
  /** LUDUS → all: Loot dropped from defeated enemy. */
  LOOT_DROPPED: 'loot:dropped',

  // OCULUS → LUDUS (User actions)
  /** OCULUS → LUDUS: Player cast a spell. */
  SPELL_CAST: 'spell:cast',
  /** OCULUS → LUDUS: Player used an item. */
  ITEM_USED: 'item:used',
  /** any → LUDUS: Generic combat action dispatched. */
  COMBAT_ACTION: 'combat:action',

  // CHRONOS → all (Topology — dual lifecycle: build-time + runtime)
  /** CHRONOS → IMAGINARIUM, OCULUS, OPERATUS: Topology generated from git data. Dual-lifecycle: emitted at build-time by CHRONOS and at runtime by DendroviaQuest. */
  TOPOLOGY_GENERATED: 'topology:generated',

  // OPERATUS → all (Infrastructure events)
  /** OPERATUS → all: Assets loaded and ready. */
  ASSETS_LOADED: 'assets:loaded',
  /** OPERATUS → all: State persisted to storage. */
  STATE_PERSISTED: 'state:persisted',
  /** OPERATUS → all: Cache entry updated. */
  CACHE_UPDATED: 'cache:updated',
  /** OPERATUS → all: Save completed. */
  SAVE_COMPLETED: 'save:completed',

  // Lifecycle triggers (all → OPERATUS)
  /** all → OPERATUS: Game session started. */
  GAME_STARTED: 'game:started',
  /** all → OPERATUS: Level loaded and ready. */
  LEVEL_LOADED: 'level:loaded',
} as const;

/**
 * All game events — build-time and runtime combined.
 *
 * @deprecated Import `BuildEvents` or `RuntimeEvents` directly.
 * This combined object is provided for backward compatibility.
 */
export const GameEvents = {
  ...RuntimeEvents,
  ...BuildEvents,
} as const;

/**
 * Event Payload Types
 */

export interface PlayerMovedEvent {
  position: [number, number, number];
  branchId: string;
  velocity: [number, number, number];
}

export interface BranchEnteredEvent {
  branchId: string;
  filePath: string;
  depth: number;
}

export interface NodeClickedEvent {
  nodeId: string;
  filePath: string;
  position: [number, number, number];
}

export interface EncounterTriggeredEvent {
  type: 'bug' | 'boss' | 'miniboss' | 'merge-conflict' | 'tech-debt';
  severity: number;
  position: [number, number, number];
}

export interface QuestUpdatedEvent {
  questId: string;
  status: 'started' | 'in-progress' | 'completed';
  title: string;
  description: string;
}

export interface SpellCastEvent {
  spellId: string;
  targetId?: string;
  casterId: string;
}

export interface CombatTurnEvent {
  turn: number;
  phase: 'player' | 'enemy';
}

export interface SpellResolvedEvent {
  spellId: string;
  casterId: string;
  targetId: string;
  effectType: string;
  value: number;
}

export interface StatusEffectEvent {
  targetId: string;
  effectId: string;
  effectType: string;
  remainingTurns: number;
}

export interface ExperienceGainedEvent {
  characterId: string;
  amount: number;
  totalExperience: number;
}

export interface LevelUpEvent {
  characterId: string;
  newLevel: number;
  statChanges: Record<string, number>;
}

export interface LootDroppedEvent {
  monsterId: string;
  items: Array<{ itemId: string; name: string }>;
}

export interface DamageDealtEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  element: string;
}

export interface CombatStartedEvent {
  monsterId: string;
  monsterName: string;
  monsterType: string;
  severity: number;
  monsterHealth: number;
  monsterMaxHealth: number;
}

export interface CombatEndedEvent {
  outcome: 'victory' | 'defeat';
  turns: number;
  xpGained?: number;
}

export interface HealthChangedEvent {
  entityId: string;
  current: number;
  max: number;
  delta: number;
}

export interface ManaChangedEvent {
  entityId: string;
  current: number;
  max: number;
  delta: number;
}

export interface ItemUsedEvent {
  itemId: string;
  characterId?: string;
}

export interface CombatActionEvent {
  action: Action;
}

/** @planned — Not yet emitted by ARCHITECTUS. Will be wired when collision physics are implemented. */
export interface CollisionDetectedEvent {
  entityId: string;
  collidedWith: string;
  position: [number, number, number];
}

// ── OPERATUS Infrastructure Event Payloads ───────────────────────

export interface AssetsLoadedEvent {
  assetCount: number;
  manifest: unknown | null;
  /** True if loading partially failed */
  partial?: boolean;
}

export interface CacheUpdatedEvent {
  path: string;
  action: 'set' | 'delete' | 'clear' | 'evict';
  /** Byte size (for set operations) */
  size?: number;
}

export interface SaveCompletedEvent {
  trigger: string;
  timestamp: number;
}

export interface GameStartedEvent {
  timestamp: number;
}

export interface LevelLoadedEvent {
  levelId: string;
  /** Asset paths to preload for this level */
  assetPaths?: string[];
}

export interface TopologyGeneratedEvent {
  tree: FileTreeNode;
  hotspots: Hotspot[];
  deepwiki?: DeepWikiEnrichment;
}

export interface StoryArcDerivedEvent {
  arc: StoryArc;
  segmentCount: number;
}

export interface SegmentDistilledEvent {
  segmentId: string;
  assets: SegmentAssets;
}

// ── Build-time Event Payloads ─────────────────────────────────

export interface ParseCompleteEvent {
  files: ParsedFile[];
}

export interface ShadersCompiledEvent {
  shaders: SDFShader[];
}

/** Palette generation emits the palette directly. */
export type PaletteGeneratedEvent = ProceduralPalette;

export interface StatePersistedEvent {
  key: string;
  timestamp: number;
  size: number;
}

// Re-export MycologyCatalogedEvent from types (already defined there)
export type { MycologyCatalogedEvent };

// ── Build Event Map ──────────────────────────────────────────────

/** Maps build-time event string literals to their payload types. */
export interface BuildEventMap {
  'build:parse:complete': ParseCompleteEvent;
  'build:shaders:compiled': ShadersCompiledEvent;
  'build:palette:generated': PaletteGeneratedEvent;
  'build:mycology:cataloged': MycologyCatalogedEvent;
  'build:storyarc:derived': StoryArcDerivedEvent;
  'build:segment:distilled': SegmentDistilledEvent;
}

// ── Runtime Event Map ────────────────────────────────────────────

/** Maps runtime event string literals to their payload types. */
export interface RuntimeEventMap {
  // ARCHITECTUS → LUDUS (Spatial events)
  'player:moved': PlayerMovedEvent;
  'branch:entered': BranchEnteredEvent;
  'node:clicked': NodeClickedEvent;
  'collision:detected': CollisionDetectedEvent;

  // LUDUS → ARCHITECTUS (Feedback events)
  'encounter:triggered': EncounterTriggeredEvent;
  'damage:dealt': DamageDealtEvent;

  // LUDUS → OCULUS (UI updates)
  'health:changed': HealthChangedEvent;
  'mana:changed': ManaChangedEvent;
  'quest:updated': QuestUpdatedEvent;
  'combat:started': CombatStartedEvent;
  'combat:ended': CombatEndedEvent;

  // LUDUS combat granularity
  'combat:turn:start': CombatTurnEvent;
  'combat:turn:end': CombatTurnEvent;
  'spell:resolved': SpellResolvedEvent;
  'status:applied': StatusEffectEvent;
  'status:expired': StatusEffectEvent;
  'experience:gained': ExperienceGainedEvent;
  'level:up': LevelUpEvent;
  'loot:dropped': LootDroppedEvent;

  // OCULUS → LUDUS (User actions)
  'spell:cast': SpellCastEvent;
  'item:used': ItemUsedEvent;
  'combat:action': CombatActionEvent;

  // CHRONOS → all (Topology — dual lifecycle)
  'topology:generated': TopologyGeneratedEvent;

  // OPERATUS → all (Infrastructure events)
  'assets:loaded': AssetsLoadedEvent;
  'state:persisted': StatePersistedEvent;
  'cache:updated': CacheUpdatedEvent;
  'save:completed': SaveCompletedEvent;

  // Lifecycle triggers (all → OPERATUS)
  'game:started': GameStartedEvent;
  'level:loaded': LevelLoadedEvent;
}

// ── Combined Event Map ───────────────────────────────────────────

/**
 * Full event map — all build-time and runtime events.
 * Used by EventBus typed overloads.
 */
export interface EventMap extends BuildEventMap, RuntimeEventMap {}

// Global singleton (lazy initialization)
let globalEventBus: EventBus | null = null;

export function getEventBus(debug = false): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(debug);
  }
  return globalEventBus;
}
