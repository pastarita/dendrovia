/**
 * Cross-Tab State Synchronization
 *
 * Keeps game state consistent across multiple browser tabs:
 *   - BroadcastChannel for state propagation
 *   - Web Locks API for leader election (single-writer guarantee)
 *   - Only the leader tab performs auto-saves
 *   - Follower tabs receive state updates via broadcast
 *
 * Gracefully degrades:
 *   - No BroadcastChannel → single-tab mode (no sync)
 *   - No Web Locks → all tabs are leaders (last-write-wins)
 */

import { useGameStore } from '../persistence/GameStore';

export interface CrossTabConfig {
  /** BroadcastChannel name (default: 'dendrovia-sync') */
  channelName?: string;
  /** Web Lock name for leader election (default: 'dendrovia-leader') */
  lockName?: string;
  /** Debounce outgoing broadcasts in ms (default: 500) */
  broadcastDebounce?: number;
}

export type TabRole = 'leader' | 'follower' | 'solo';

export interface TabStatus {
  role: TabRole;
  tabId: string;
  channelAvailable: boolean;
  locksAvailable: boolean;
}

const DEFAULT_CONFIG: Required<CrossTabConfig> = {
  channelName: 'dendrovia-sync',
  lockName: 'dendrovia-leader',
  broadcastDebounce: 500,
};

interface SyncMessage {
  type: 'STATE_UPDATE' | 'LEADER_ANNOUNCE' | 'SAVE_REQUEST';
  tabId: string;
  timestamp: number;
  payload?: any;
}

export class CrossTabSync {
  private config: Required<CrossTabConfig>;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private role: TabRole = 'solo';
  private unsubscribe: (() => void) | null = null;
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingBroadcast: any = null;
  private onRoleChange: ((role: TabRole) => void) | null = null;

  constructor(config: Partial<CrossTabConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  /**
   * Set a callback for when this tab's role changes.
   */
  setRoleChangeCallback(cb: (role: TabRole) => void): void {
    this.onRoleChange = cb;
  }

  /**
   * Start cross-tab sync. Returns the initial tab role.
   */
  async start(): Promise<TabRole> {
    const hasChannel = typeof BroadcastChannel !== 'undefined';
    const hasLocks = typeof navigator !== 'undefined' && 'locks' in navigator;

    if (!hasChannel) {
      // No BroadcastChannel — single-tab mode
      this.role = 'solo';
      return this.role;
    }

    // Set up BroadcastChannel
    this.channel = new BroadcastChannel(this.config.channelName);
    this.channel.addEventListener('message', this.handleMessage.bind(this));

    // Attempt leader election
    if (hasLocks) {
      this.electLeader();
    } else {
      // No Web Locks — everyone is a leader (last-write-wins)
      this.setRole('leader');
    }

    // Subscribe to store changes and broadcast to other tabs
    this.unsubscribe = useGameStore.subscribe((state, prevState) => {
      if (this.role !== 'follower') {
        this.debouncedBroadcast(state);
      }
    });

    return this.role;
  }

  /**
   * Stop cross-tab sync and clean up.
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.broadcastTimer !== null) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.role = 'solo';
  }

  /**
   * Get current tab status.
   */
  getStatus(): TabStatus {
    return {
      role: this.role,
      tabId: this.tabId,
      channelAvailable: typeof BroadcastChannel !== 'undefined',
      locksAvailable: typeof navigator !== 'undefined' && 'locks' in navigator,
    };
  }

  /** Whether this tab is the leader (should perform auto-saves) */
  get isLeader(): boolean {
    return this.role === 'leader' || this.role === 'solo';
  }

  // ── Private ─────────────────────────────────────────────────────

  private setRole(role: TabRole): void {
    const prev = this.role;
    this.role = role;
    if (prev !== role && this.onRoleChange) {
      this.onRoleChange(role);
    }
  }

  /**
   * Attempt exclusive leader election via Web Locks API.
   * The lock is held for the lifetime of the tab.
   * When the leader tab closes, the lock is released and
   * the next waiting tab acquires it.
   */
  private electLeader(): void {
    navigator.locks.request(
      this.config.lockName,
      { mode: 'exclusive' },
      () => {
        // We acquired the lock — this tab is the leader
        this.setRole('leader');

        // Announce leadership
        this.broadcast({
          type: 'LEADER_ANNOUNCE',
          tabId: this.tabId,
          timestamp: Date.now(),
        });

        // Hold the lock indefinitely (never resolve the promise)
        return new Promise<void>(() => {});
      },
    ).catch(() => {
      // Could not acquire lock — we're a follower
      // (This only happens if the API throws, not if we're waiting)
    });

    // While waiting for the lock, we're a follower
    this.setRole('follower');
  }

  private handleMessage(event: MessageEvent<SyncMessage>): void {
    const msg = event.data;

    // Ignore our own messages
    if (msg.tabId === this.tabId) return;

    switch (msg.type) {
      case 'STATE_UPDATE': {
        if (this.role === 'follower' && msg.payload) {
          // Apply incoming state from leader (deserialize Set)
          const incoming = msg.payload;
          if (incoming.visitedNodes && Array.isArray(incoming.visitedNodes)) {
            incoming.visitedNodes = new Set(incoming.visitedNodes);
          }
          useGameStore.setState(incoming, false);
        }
        break;
      }

      case 'LEADER_ANNOUNCE': {
        // Another tab claimed leadership
        if (this.role !== 'leader') {
          this.setRole('follower');
        }
        break;
      }

      case 'SAVE_REQUEST': {
        // A follower wants the leader to save
        if (this.role === 'leader') {
          // Trigger persist middleware write
          const state = useGameStore.getState();
          useGameStore.setState({ character: { ...state.character } });
        }
        break;
      }
    }
  }

  /**
   * Debounced broadcast to avoid flooding the channel.
   */
  private debouncedBroadcast(state: any): void {
    // Serialize Set<string> for transport
    const serialized: any = {};
    const persistKeys = ['character', 'quests', 'visitedNodes', 'unlockedKnowledge', 'worldPosition', 'inventory', 'gameFlags', 'playtimeMs'];

    for (const key of persistKeys) {
      const val = state[key];
      if (val instanceof Set) {
        serialized[key] = Array.from(val);
      } else {
        serialized[key] = val;
      }
    }

    this.pendingBroadcast = serialized;

    if (this.broadcastTimer !== null) return; // Already scheduled

    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = null;
      if (this.pendingBroadcast) {
        this.broadcast({
          type: 'STATE_UPDATE',
          tabId: this.tabId,
          timestamp: Date.now(),
          payload: this.pendingBroadcast,
        });
        this.pendingBroadcast = null;
      }
    }, this.config.broadcastDebounce);
  }

  private broadcast(msg: SyncMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // Channel closed or message too large — silently ignore
      }
    }
  }
}
