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

type EventHandler<T = any> = (data: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
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
   * Emit an event to all subscribers
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    if (this.debug) {
      console.log(`[EventBus] ${event}`, data);
    }

    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Execute handlers in parallel
    await Promise.all(
      Array.from(handlers).map(handler => handler(data))
    );
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

  // OCULUS → LUDUS (User actions)
  SPELL_CAST: 'spell:cast',
  ITEM_USED: 'item:used',

  // CHRONOS → IMAGINARIUM (Build-time events)
  PARSE_COMPLETE: 'parse:complete',
  TOPOLOGY_GENERATED: 'topology:generated',

  // IMAGINARIUM → ARCHITECTUS (Build-time events)
  SHADERS_COMPILED: 'shaders:compiled',
  PALETTE_GENERATED: 'palette:generated',

  // OPERATUS → All (Infrastructure events)
  ASSETS_LOADED: 'assets:loaded',
  STATE_PERSISTED: 'state:persisted',
  CACHE_UPDATED: 'cache:updated',
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
  type: 'bug' | 'merge-conflict' | 'tech-debt';
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

// Global singleton (lazy initialization)
let globalEventBus: EventBus | null = null;

export function getEventBus(debug = false): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(debug);
  }
  return globalEventBus;
}
