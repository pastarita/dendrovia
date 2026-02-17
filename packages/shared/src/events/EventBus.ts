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

import type { FileTreeNode, Hotspot, DeepWikiEnrichment, StoryArc, SegmentAssets, Action } from '../types/index.js';

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
   * Subscribe to an event
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
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
   * Emit an event to all subscribers
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
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

  /**
   * One-time event subscription
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
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
 */

export const GameEvents = {
  // ARCHITECTUS → LUDUS (Spatial events)
  PLAYER_MOVED: 'player:moved',
  BRANCH_ENTERED: 'branch:entered',
  NODE_CLICKED: 'node:clicked',
  COLLISION_DETECTED: 'collision:detected',

  // LUDUS → ARCHITECTUS (Feedback events)
  ENCOUNTER_TRIGGERED: 'encounter:triggered',
  DAMAGE_DEALT: 'damage:dealt',

  // LUDUS → OCULUS (UI updates)
  HEALTH_CHANGED: 'health:changed',
  MANA_CHANGED: 'mana:changed',
  QUEST_UPDATED: 'quest:updated',
  COMBAT_STARTED: 'combat:started',
  COMBAT_ENDED: 'combat:ended',

  // LUDUS combat granularity
  COMBAT_TURN_START: 'combat:turn:start',
  COMBAT_TURN_END: 'combat:turn:end',
  SPELL_RESOLVED: 'spell:resolved',
  STATUS_EFFECT_APPLIED: 'status:applied',
  STATUS_EFFECT_EXPIRED: 'status:expired',
  EXPERIENCE_GAINED: 'experience:gained',
  LEVEL_UP: 'level:up',
  LOOT_DROPPED: 'loot:dropped',

  // OCULUS → LUDUS (User actions)
  SPELL_CAST: 'spell:cast',
  ITEM_USED: 'item:used',
  COMBAT_ACTION: 'combat:action',

  // CHRONOS → IMAGINARIUM (Build-time events)
  PARSE_COMPLETE: 'parse:complete',
  TOPOLOGY_GENERATED: 'topology:generated',

  // IMAGINARIUM → ARCHITECTUS (Build-time events)
  SHADERS_COMPILED: 'shaders:compiled',
  PALETTE_GENERATED: 'palette:generated',
  MYCOLOGY_CATALOGED: 'mycology:cataloged',
  STORY_ARC_DERIVED: 'storyarc:derived',
  SEGMENT_DISTILLED: 'segment:distilled',

  // ARCHITECTUS runtime — segment navigation
  SEGMENT_ENTERED: 'segment:entered',

  // OPERATUS → All (Infrastructure events)
  ASSETS_LOADED: 'assets:loaded',
  STATE_PERSISTED: 'state:persisted',
  CACHE_UPDATED: 'cache:updated',
  SAVE_COMPLETED: 'save:completed',

  // Lifecycle triggers (All → OPERATUS)
  GAME_STARTED: 'game:started',
  LEVEL_LOADED: 'level:loaded',
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

export interface SegmentEnteredEvent {
  segmentId: string;
  phase: string;
  mood: string;
}

// Global singleton (lazy initialization)
let globalEventBus: EventBus | null = null;

export function getEventBus(debug = false): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(debug);
  }
  return globalEventBus;
}
