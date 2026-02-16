/**
 * Auto-Save System
 *
 * Provides three layers of save protection:
 *   1. Throttled interval saves (every 30s by default)
 *   2. Event-driven saves on significant game events
 *   3. Emergency save on beforeunload (tab close/navigate away)
 *
 * Integrates with the EventBus for save triggers and the
 * GameStore for state access.
 */

import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { useGameStore, getGameSaveSnapshot } from './GameStore';

const log = createLogger('OPERATUS', 'autosave');

export interface AutoSaveConfig {
  /** Interval in ms between auto-saves (default: 30000 = 30s) */
  interval?: number;
  /** Enable emergency save on beforeunload (default: true) */
  emergencySave?: boolean;
  /** Enable event-driven saves (default: true) */
  eventDrivenSaves?: boolean;
  /** localStorage key for emergency saves (default: 'dendrovia-emergency-save') */
  emergencyKey?: string;
}

const DEFAULT_CONFIG: Required<AutoSaveConfig> = {
  interval: 30_000,
  emergencySave: true,
  eventDrivenSaves: true,
  emergencyKey: 'dendrovia-emergency-save',
};

export class AutoSave {
  private config: Required<AutoSaveConfig>;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: Array<() => void> = [];
  private lastSaveTime = 0;
  private enabled = false;

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the auto-save system.
   * Call this after the game store has hydrated.
   */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    // Layer 1: Interval-based auto-save
    this.intervalId = setInterval(() => {
      this.save('interval');
    }, this.config.interval);

    // Layer 2: Event-driven saves
    if (this.config.eventDrivenSaves) {
      this.setupEventSaves();
    }

    // Layer 3: Emergency save on beforeunload
    if (this.config.emergencySave && typeof window !== 'undefined') {
      this.beforeUnloadHandler = this.beforeUnloadHandler.bind(this);
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  /**
   * Stop the auto-save system.
   */
  stop(): void {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  /**
   * Manually trigger a save.
   * Respects a minimum 5-second cooldown to prevent save spam.
   */
  async save(trigger: string = 'manual'): Promise<void> {
    const now = Date.now();
    const MIN_COOLDOWN = 5_000;

    if (now - this.lastSaveTime < MIN_COOLDOWN) {
      return; // Too soon since last save
    }

    this.lastSaveTime = now;

    // The Zustand persist middleware handles the actual write.
    // We trigger it by making a no-op state update that touches
    // persisted fields, or we directly call the persist API.
    try {
      // Force persist middleware to write current state
      // Touch state to trigger persist write
      const state = useGameStore.getState();
      useGameStore.setState({ character: { ...state.character } });

      // Emit SAVE_COMPLETED (fire-and-forget)
      const eventBus = getEventBus();
      eventBus.emit(GameEvents.SAVE_COMPLETED, {
        trigger,
        timestamp: Date.now(),
      }).catch(() => {});
    } catch (err) {
      log.warn({ trigger, err }, 'Auto-save failed');
    }
  }

  /**
   * Check if an emergency save exists in localStorage.
   */
  hasEmergencySave(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.config.emergencyKey) !== null;
  }

  /**
   * Load the emergency save data (if any).
   */
  getEmergencySave(): Record<string, unknown> | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.config.emergencyKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Clear the emergency save after successful IndexedDB load.
   */
  clearEmergencySave(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.emergencyKey);
    }
  }

  /** Whether auto-save is currently running */
  get isRunning(): boolean {
    return this.enabled;
  }

  /** Timestamp of the last successful save */
  get lastSaveTimestamp(): number {
    return this.lastSaveTime;
  }

  // ── Private ─────────────────────────────────────────────────────

  private setupEventSaves(): void {
    const eventBus = getEventBus();

    // Save on quest completion
    const unsubQuest = eventBus.on(GameEvents.QUEST_UPDATED, (data: any) => {
      if (data?.status === 'completed') {
        this.save('quest-completed');
      }
    });
    this.unsubscribers.push(unsubQuest);

    // Save on combat end (player survived)
    const unsubCombat = eventBus.on(GameEvents.COMBAT_ENDED, () => {
      this.save('combat-ended');
    });
    this.unsubscribers.push(unsubCombat);

    // Save on entering a new branch/zone
    const unsubBranch = eventBus.on(GameEvents.BRANCH_ENTERED, () => {
      this.save('branch-entered');
    });
    this.unsubscribers.push(unsubBranch);
  }

  private beforeUnloadHandler(): void {
    // Emergency: synchronously dump state to localStorage
    // IndexedDB is async and may not complete before tab closes,
    // so localStorage is the last resort.
    try {
      const snapshot = getGameSaveSnapshot();
      localStorage.setItem(
        this.config.emergencyKey,
        JSON.stringify(snapshot),
      );
    } catch {
      // localStorage full or unavailable — nothing we can do
    }
  }
}
