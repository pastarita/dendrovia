/**
 * Multiplayer Client — WebSocket-Based State Sync
 *
 * Provides real-time multiplayer for Dendrovia:
 *   - WebSocket connection with auto-reconnect (exponential backoff)
 *   - Offline message queue (buffered until reconnect)
 *   - Player position broadcasting
 *   - Presence tracking (who's online, where they are)
 *   - EventBus integration for game events
 *
 * Designed for SpaceTimeDB but works with any WebSocket backend
 * that speaks JSON messages.
 *
 * This is a STRETCH GOAL — the game works fully offline/single-player
 * without this module.
 */

// ── Types ────────────────────────────────────────────────────────

export interface MultiplayerConfig {
  /** WebSocket server URL */
  url: string;
  /** Game/database name (default: 'dendrovia') */
  dbName?: string;
  /** Max reconnect attempts (default: 10, 0 = infinite) */
  maxReconnects?: number;
  /** Initial reconnect delay in ms (default: 1000) */
  baseDelay?: number;
  /** Max reconnect delay in ms (default: 30000) */
  maxDelay?: number;
  /** Send heartbeat every N ms (default: 30000, 0 = disabled) */
  heartbeatInterval?: number;
  /** Max queued messages while offline (default: 100) */
  maxQueueSize?: number;
}

export interface PlayerPresence {
  id: string;
  name: string;
  position: [number, number, number];
  zone: string;
  lastSeen: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface MultiplayerMessage {
  type: string;
  payload: any;
  timestamp: number;
  senderId?: string;
}

type MessageHandler = (msg: MultiplayerMessage) => void;

// ── Client ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<MultiplayerConfig> = {
  url: 'ws://localhost:3010',
  dbName: 'dendrovia',
  maxReconnects: 10,
  baseDelay: 1000,
  maxDelay: 30_000,
  heartbeatInterval: 30_000,
  maxQueueSize: 100,
};

export class MultiplayerClient {
  private config: Required<MultiplayerConfig>;
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: MultiplayerMessage[] = [];
  private handlers = new Map<string, Set<MessageHandler>>();
  private players = new Map<string, PlayerPresence>();
  private playerId: string | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;

  constructor(config: Partial<MultiplayerConfig> & { url: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set a callback for connection state changes.
   */
  setStateChangeCallback(cb: (state: ConnectionState) => void): void {
    this.onStateChange = cb;
  }

  /**
   * Connect to the multiplayer server.
   */
  async connect(playerId?: string): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return;

    this.playerId = playerId ?? this.playerId ?? crypto.randomUUID();
    this.setState('connecting');

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.setState('connected');
          this.reconnectAttempts = 0;

          // Send identity
          this.sendRaw({
            type: 'IDENTIFY',
            payload: {
              playerId: this.playerId,
              dbName: this.config.dbName,
            },
            timestamp: Date.now(),
          });

          // Flush queued messages
          this.flushQueue();

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (_event) => {
          this.stopHeartbeat();

          if (this.state !== 'disconnected') {
            // Unexpected close — attempt reconnect
            this.attemptReconnect();
          }
        };

        this.ws.onerror = () => {
          if (this.state === 'connecting') {
            reject(new Error('WebSocket connection failed'));
          }
        };
      } catch (err) {
        this.setState('disconnected');
        reject(err);
      }
    });
  }

  /**
   * Disconnect from the server.
   */
  disconnect(): void {
    this.setState('disconnected');
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.players.clear();
  }

  /**
   * Send a message to the server.
   * If disconnected, queues the message for later delivery.
   */
  send(type: string, payload: any): void {
    const msg: MultiplayerMessage = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.playerId ?? undefined,
    };

    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw(msg);
    } else {
      this.enqueue(msg);
    }
  }

  /**
   * Subscribe to a specific message type.
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  // ── Game-Specific Methods ──────────────────────────────────────

  /**
   * Broadcast player position to other players.
   */
  updatePosition(position: [number, number, number], zone: string): void {
    this.send('POSITION_UPDATE', { position, zone });
  }

  /**
   * Get all currently known player presences.
   */
  getPlayers(): PlayerPresence[] {
    return Array.from(this.players.values());
  }

  /**
   * Get a specific player's presence.
   */
  getPlayer(id: string): PlayerPresence | undefined {
    return this.players.get(id);
  }

  /** Current connection state */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /** Number of queued messages */
  get queueSize(): number {
    return this.messageQueue.length;
  }

  /** Number of connected players */
  get playerCount(): number {
    return this.players.size;
  }

  // ── Private ─────────────────────────────────────────────────────

  private setState(state: ConnectionState): void {
    const prev = this.state;
    this.state = state;
    if (prev !== state) {
      this.onStateChange?.(state);
    }
  }

  private sendRaw(msg: MultiplayerMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(event: MessageEvent): void {
    let msg: MultiplayerMessage;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return; // Malformed message
    }

    // Handle built-in message types
    switch (msg.type) {
      case 'PLAYER_JOIN': {
        const presence = msg.payload as PlayerPresence;
        this.players.set(presence.id, presence);
        break;
      }

      case 'PLAYER_LEAVE': {
        this.players.delete(msg.payload?.id);
        break;
      }

      case 'POSITION_UPDATE': {
        const { playerId, position, zone } = msg.payload ?? {};
        if (playerId && this.players.has(playerId)) {
          const player = this.players.get(playerId)!;
          player.position = position;
          player.zone = zone;
          player.lastSeen = Date.now();
        }
        break;
      }

      case 'PRESENCE_SYNC': {
        // Full presence list from server
        const presences = msg.payload?.players as PlayerPresence[] | undefined;
        if (presences) {
          this.players.clear();
          for (const p of presences) {
            this.players.set(p.id, p);
          }
        }
        break;
      }

      case 'PONG':
        // Heartbeat response — no action needed
        break;
    }

    // Dispatch to custom handlers
    const handlers = this.handlers.get(msg.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(msg);
        } catch (err) {
          console.warn(`[OPERATUS] Message handler error (${msg.type}):`, err);
        }
      }
    }

    // Also dispatch wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(msg);
        } catch {}
      }
    }
  }

  private enqueue(msg: MultiplayerMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      // Drop oldest message
      this.messageQueue.shift();
    }
    this.messageQueue.push(msg);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.sendRaw(msg);
    }
  }

  private attemptReconnect(): void {
    if (this.config.maxReconnects > 0 && this.reconnectAttempts >= this.config.maxReconnects) {
      this.setState('disconnected');
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const delay = Math.min(this.config.baseDelay * 2 ** (this.reconnectAttempts - 1), this.config.maxDelay);
    const jitter = delay * 0.2 * Math.random();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // connect() will trigger another attemptReconnect via onclose
      });
    }, delay + jitter);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setInterval(() => {
      this.sendRaw({
        type: 'PING',
        payload: null,
        timestamp: Date.now(),
      });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
