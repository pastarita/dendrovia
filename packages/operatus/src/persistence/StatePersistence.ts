/**
 * State Persistence
 *
 * Zustand-compatible persistence layer for game save state.
 * Uses IndexedDB as the storage backend with:
 *   - Versioned save formats with migration chains
 *   - LZ-string compression for save data
 *   - Corruption detection and recovery
 *   - GameEvents.STATE_PERSISTED emission on save
 *
 * Design: Creates a Zustand `StateStorage` adapter that plugs
 * directly into the `persist` middleware.
 */

import type { GameSaveState, Character, Quest } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('OPERATUS', 'persistence');

// ── IndexedDB Storage Backend ────────────────────────────────────

const DB_NAME = 'dendrovia-saves';
const STORE_NAME = 'saves';
const DB_VERSION = 1;

/** Raw envelope stored in IndexedDB */
interface SaveEnvelope {
  key: string;
  version: number;
  data: string;
  timestamp: number;
  checksum: string;
}

class SaveDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(key: string): Promise<SaveEnvelope | undefined> {
    await this.init();
    const tx = this.db!.transaction(STORE_NAME, 'readonly');
    return this.request(tx.objectStore(STORE_NAME).get(key));
  }

  async put(envelope: SaveEnvelope): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    await this.request(tx.objectStore(STORE_NAME).put(envelope));
  }

  async remove(key: string): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    await this.request(tx.objectStore(STORE_NAME).delete(key));
  }

  async listKeys(): Promise<string[]> {
    await this.init();
    const tx = this.db!.transaction(STORE_NAME, 'readonly');
    return this.request(tx.objectStore(STORE_NAME).getAllKeys() as IDBRequest<string[]>);
  }
}

// ── Compression ──────────────────────────────────────────────────

/**
 * Simple UTF-16 compression for save data.
 * If lz-string is available at runtime, it will be used via dynamic import.
 * Falls back to raw JSON if unavailable (keeps zero hard dependencies).
 */
let compressImpl: ((input: string) => string) | null = null;
let decompressImpl: ((input: string) => string | null) | null = null;

async function loadCompression(): Promise<void> {
  if (compressImpl) return;
  try {
    const lz = await import('lz-string');
    compressImpl = lz.compressToUTF16;
    decompressImpl = lz.decompressFromUTF16;
  } catch {
    // lz-string not installed — use passthrough
    compressImpl = (s) => s;
    decompressImpl = (s) => s;
  }
}

function compress(data: string): string {
  return compressImpl ? compressImpl(data) : data;
}

function decompress(data: string): string | null {
  return decompressImpl ? decompressImpl(data) : data;
}

// ── Checksum ─────────────────────────────────────────────────────

/** Simple FNV-1a hash for corruption detection */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// ── Save State Migrations ────────────────────────────────────────

export type MigrationFn = (oldState: any) => any;

/**
 * Registry of version → version+1 migrations.
 * Each migration transforms the save data shape.
 *
 * Usage:
 *   registerMigration(1, (v1State) => ({ ...v1State, newField: 'default' }))
 */
const migrations = new Map<number, MigrationFn>();

export function registerMigration(fromVersion: number, fn: MigrationFn): void {
  migrations.set(fromVersion, fn);
}

/** Run the migration chain from `fromVersion` to `toVersion` */
function migrate(data: any, fromVersion: number, toVersion: number): any {
  let current = data;
  for (let v = fromVersion; v < toVersion; v++) {
    const fn = migrations.get(v);
    if (!fn) {
      throw new Error(`Missing migration from v${v} to v${v + 1}`);
    }
    current = fn(current);
  }
  return current;
}

// ── Zustand Storage Adapter ──────────────────────────────────────

/** Current save format version — increment when changing GameSaveState shape */
export const SAVE_VERSION = 2;

// ── Built-in Migrations ─────────────────────────────────────────

/**
 * v1 -> v2: Rename `player` -> `character`, nest flat health/mana into `stats`,
 * add inventory, gameFlags, playtimeMs, and full Character fields.
 */
registerMigration(1, (v1: any) => {
  const player = v1.player ?? v1.character ?? {};

  // Migrate flat health/mana to nested stats (or preserve if already nested)
  const stats = player.stats ?? {
    health: player.health ?? 100,
    maxHealth: player.maxHealth ?? 100,
    mana: player.mana ?? 50,
    maxMana: player.maxMana ?? 50,
    attack: player.attack ?? 10,
    defense: player.defense ?? 5,
    speed: player.speed ?? 5,
  };

  const character = {
    id: player.id ?? 'player-1',
    name: player.name ?? 'Explorer',
    class: player.class ?? 'dps',
    stats,
    level: player.level ?? 1,
    experience: player.experience ?? 0,
    spells: player.spells ?? [],
    statusEffects: player.statusEffects ?? [],
    cooldowns: player.cooldowns ?? {},
  };

  // Remove old `player` key, add new fields
  const { player: _removed, health: _h, maxHealth: _mh, mana: _m, maxMana: _mm, ...rest } = v1;

  return {
    ...rest,
    character,
    inventory: v1.inventory ?? [],
    gameFlags: v1.gameFlags ?? {},
    playtimeMs: v1.playtimeMs ?? 0,
    playerPosition: v1.playerPosition ?? [0, 0, 0],
    cameraMode: v1.cameraMode ?? 'falcon',
  };
});

export interface PersistenceConfig {
  /** Storage key prefix (default: 'dendrovia-save') */
  name?: string;
  /** Enable compression (default: true) */
  compress?: boolean;
  /** Current save format version (default: SAVE_VERSION) */
  version?: number;
  /** Emit events on save (default: true) */
  emitEvents?: boolean;
}

/**
 * Create a Zustand-compatible StateStorage adapter.
 *
 * Usage with Zustand persist middleware:
 * ```ts
 * import { persist } from 'zustand/middleware';
 * import { createDendroviaStorage } from '@dendrovia/operatus';
 *
 * const store = create(persist(stateCreator, {
 *   name: 'dendrovia-save',
 *   storage: createDendroviaStorage(),
 * }));
 * ```
 */
export function createDendroviaStorage(config: PersistenceConfig = {}) {
  const {
    name = 'dendrovia-save',
    compress: useCompression = true,
    version = SAVE_VERSION,
    emitEvents = true,
  } = config;

  const saveDb = new SaveDatabase();
  let compressionReady = false;

  return {
    getItem: async (key: string): Promise<any | null> => {
      if (useCompression && !compressionReady) {
        await loadCompression();
        compressionReady = true;
      }

      const envelope = await saveDb.get(key);
      if (!envelope) return null;

      // Decompress
      const raw = useCompression ? decompress(envelope.data) : envelope.data;
      if (raw === null) {
        log.warn({ key }, 'Save data corrupted (decompression failed)');
        return null;
      }

      // Verify checksum
      const expectedChecksum = fnv1a(raw);
      if (expectedChecksum !== envelope.checksum) {
        log.warn({ key }, 'Save data corrupted (checksum mismatch)');
        return null;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        log.warn({ key }, 'Save data corrupted (invalid JSON)');
        return null;
      }

      // Run migrations if version mismatch
      if (envelope.version < version) {
        try {
          parsed.state = migrate(parsed.state, envelope.version, version);
        } catch (e) {
          log.error({ err: e, key }, 'Migration failed');
          return null;
        }
      }

      return parsed;
    },

    setItem: async (key: string, value: any): Promise<void> => {
      if (useCompression && !compressionReady) {
        await loadCompression();
        compressionReady = true;
      }

      const raw = JSON.stringify(value);
      const checksum = fnv1a(raw);
      const data = useCompression ? compress(raw) : raw;

      const envelope: SaveEnvelope = {
        key,
        version,
        data,
        timestamp: Date.now(),
        checksum,
      };

      await saveDb.put(envelope);

      if (emitEvents) {
        const eventBus = getEventBus();
        await eventBus.emit(GameEvents.STATE_PERSISTED, {
          key,
          timestamp: envelope.timestamp,
          size: data.length,
        });
      }
    },

    removeItem: async (key: string): Promise<void> => {
      await saveDb.remove(key);
    },
  };
}

// ── Save Slot Management ─────────────────────────────────────────

export interface SaveSlot {
  key: string;
  timestamp: number;
  version: number;
}

/**
 * List all save slots.
 */
export async function listSaveSlots(): Promise<SaveSlot[]> {
  const db = new SaveDatabase();
  const keys = await db.listKeys();
  const slots: SaveSlot[] = [];

  for (const key of keys) {
    const envelope = await db.get(key);
    if (envelope) {
      slots.push({
        key: envelope.key,
        timestamp: envelope.timestamp,
        version: envelope.version,
      });
    }
  }

  return slots.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Delete a save slot.
 */
export async function deleteSaveSlot(key: string): Promise<void> {
  const db = new SaveDatabase();
  await db.remove(key);
}

/**
 * Export a save slot as a JSON string (for sharing/backup).
 */
export async function exportSave(key: string): Promise<string | null> {
  const db = new SaveDatabase();
  const envelope = await db.get(key);
  if (!envelope) return null;

  return JSON.stringify(envelope);
}

/**
 * Import a save slot from a JSON string.
 */
export async function importSave(json: string): Promise<void> {
  const envelope = JSON.parse(json) as SaveEnvelope;
  const db = new SaveDatabase();
  await db.put(envelope);
}
