/**
 * Save/Load System — Game State Persistence
 *
 * Pure serialization/deserialization of game state.
 * No IO — callers handle actual file/localStorage operations.
 *
 * Format: JSON with a version tag for forward-compatibility.
 */

import type {
  Character,
  Quest,
  GameSaveState,
  CharacterStats,
  StatusEffect,
} from '@dendrovia/shared';
import type { Inventory, InventorySlot } from '../inventory/InventorySystem';
import type { EncounterState } from '../encounter/EncounterSystem';
import type { BattleStatistics } from '../progression/ProgressionSystem';
import { createBattleStatistics } from '../progression/ProgressionSystem';
import { createEncounterState } from '../encounter/EncounterSystem';
import { createInventory } from '../inventory/InventorySystem';

// ─── Save Format ────────────────────────────────────────────

export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  character: SerializedCharacter;
  inventory: SerializedInventory;
  quests: Quest[];
  completedQuestIds: string[];
  encounterState: SerializedEncounterState;
  battleStats: BattleStatistics;
  knowledge: string[];
  gameFlags: Record<string, boolean>;
  playtimeMs: number;
}

/** Character without non-serializable fields */
interface SerializedCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  stats: CharacterStats;
  spells: string[];
  // statusEffects and cooldowns not saved — ephemeral
}

interface SerializedInventory {
  items: InventorySlot[];
  maxSlots: number;
}

interface SerializedEncounterState {
  stepsSinceLastEncounter: number;
  defeatedBosses: string[];
  defeatedMinibosses: string[];
  defeatedBugs: string[];
}

// ─── Serialize ──────────────────────────────────────────────

export function serializeGameState(
  character: Character,
  inventory: Inventory,
  quests: Quest[],
  encounterState: EncounterState,
  battleStats: BattleStatistics,
  knowledge: string[] = [],
  gameFlags: Record<string, boolean> = {},
  playtimeMs: number = 0,
): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    character: {
      id: character.id,
      name: character.name,
      class: character.class,
      level: character.level,
      experience: character.experience,
      stats: { ...character.stats },
      spells: [...character.spells],
    },
    inventory: {
      items: inventory.items.map(s => ({ ...s })),
      maxSlots: inventory.maxSlots,
    },
    quests: quests.map(q => ({ ...q, rewards: [...q.rewards] })),
    completedQuestIds: quests.filter(q => q.status === 'completed').map(q => q.id),
    encounterState: {
      stepsSinceLastEncounter: encounterState.stepsSinceLastEncounter,
      defeatedBosses: Array.from(encounterState.defeatedBosses),
      defeatedMinibosses: Array.from(encounterState.defeatedMinibosses),
      defeatedBugs: Array.from(encounterState.defeatedBugs),
    },
    battleStats: { ...battleStats },
    knowledge,
    gameFlags: { ...gameFlags },
    playtimeMs,
  };
}

/** Serialize to JSON string */
export function saveToJSON(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

// ─── Deserialize ────────────────────────────────────────────

export interface LoadResult {
  success: boolean;
  character?: Character;
  inventory?: Inventory;
  quests?: Quest[];
  encounterState?: EncounterState;
  battleStats?: BattleStatistics;
  knowledge?: string[];
  gameFlags?: Record<string, boolean>;
  playtimeMs?: number;
  error?: string;
}

/** Parse JSON string to SaveData */
export function loadFromJSON(json: string): LoadResult {
  try {
    const raw = JSON.parse(json);
    return deserializeGameState(raw);
  } catch (e) {
    return { success: false, error: `JSON parse error: ${(e as Error).message}` };
  }
}

/** Deserialize and validate save data */
export function deserializeGameState(raw: unknown): LoadResult {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Save data is not an object' };
  }

  const data = raw as Record<string, unknown>;

  // Version check
  if (typeof data.version !== 'number') {
    return { success: false, error: 'Missing save version' };
  }

  if (data.version > SAVE_VERSION) {
    return { success: false, error: `Save version ${data.version} is newer than supported (${SAVE_VERSION})` };
  }

  // Validate character
  const charData = data.character as Record<string, unknown> | undefined;
  if (!charData || typeof charData.name !== 'string' || typeof charData.level !== 'number') {
    return { success: false, error: 'Invalid character data' };
  }

  const character: Character = {
    id: String(charData.id ?? 'char-saved'),
    name: String(charData.name),
    class: String(charData.class) as Character['class'],
    level: Number(charData.level),
    experience: Number(charData.experience ?? 0),
    stats: validateStats(charData.stats),
    spells: Array.isArray(charData.spells) ? charData.spells.map(String) : [],
    statusEffects: [],
    cooldowns: {},
  };

  // Validate inventory
  const invData = data.inventory as Record<string, unknown> | undefined;
  const inventory: Inventory = {
    items: Array.isArray(invData?.items)
      ? (invData!.items as Array<Record<string, unknown>>).map(s => ({
          itemId: String(s.itemId),
          quantity: Number(s.quantity ?? 1),
        }))
      : [],
    maxSlots: Number(invData?.maxSlots ?? 20),
  };

  // Validate quests
  const quests: Quest[] = Array.isArray(data.quests)
    ? (data.quests as Array<Record<string, unknown>>).map(q => ({
        id: String(q.id),
        title: String(q.title ?? ''),
        description: String(q.description ?? ''),
        type: String(q.type ?? 'bug-hunt') as Quest['type'],
        status: String(q.status ?? 'locked') as Quest['status'],
        requirements: Array.isArray(q.requirements) ? q.requirements.map(String) : [],
        rewards: Array.isArray(q.rewards) ? q.rewards as Quest['rewards'] : [],
      }))
    : [];

  // Validate encounter state
  const encData = data.encounterState as Record<string, unknown> | undefined;
  const encounterState: EncounterState = {
    stepsSinceLastEncounter: Number(encData?.stepsSinceLastEncounter ?? 0),
    defeatedBosses: new Set(Array.isArray(encData?.defeatedBosses) ? (encData!.defeatedBosses as string[]) : []),
    defeatedMinibosses: new Set(Array.isArray(encData?.defeatedMinibosses) ? (encData!.defeatedMinibosses as string[]) : []),
    defeatedBugs: new Set(Array.isArray(encData?.defeatedBugs) ? (encData!.defeatedBugs as string[]) : []),
  };

  // Battle stats (use defaults for missing fields)
  const battleStats: BattleStatistics = {
    ...createBattleStatistics(),
    ...(typeof data.battleStats === 'object' && data.battleStats !== null ? data.battleStats as Partial<BattleStatistics> : {}),
  };

  const knowledge = Array.isArray(data.knowledge) ? data.knowledge.map(String) : [];
  const gameFlags = typeof data.gameFlags === 'object' && data.gameFlags !== null
    ? data.gameFlags as Record<string, boolean>
    : {};
  const playtimeMs = Number(data.playtimeMs ?? 0);

  return {
    success: true,
    character,
    inventory,
    quests,
    encounterState,
    battleStats,
    knowledge,
    gameFlags,
    playtimeMs,
  };
}

// ─── Helpers ────────────────────────────────────────────────

function validateStats(raw: unknown): CharacterStats {
  const s = (raw ?? {}) as Record<string, unknown>;
  return {
    health: Number(s.health ?? 100),
    maxHealth: Number(s.maxHealth ?? 100),
    mana: Number(s.mana ?? 50),
    maxMana: Number(s.maxMana ?? 50),
    attack: Number(s.attack ?? 10),
    defense: Number(s.defense ?? 5),
    speed: Number(s.speed ?? 5),
  };
}

// ─── Quick Save/Load (full round-trip) ──────────────────────

/** Create a save snapshot from current session state */
export function createSaveSnapshot(
  character: Character,
  inventory: Inventory,
  quests: Quest[],
  encounterState: EncounterState,
  battleStats: BattleStatistics,
  knowledge: string[] = [],
  gameFlags: Record<string, boolean> = {},
  playtimeMs: number = 0,
): string {
  const data = serializeGameState(
    character, inventory, quests, encounterState,
    battleStats, knowledge, gameFlags, playtimeMs,
  );
  return saveToJSON(data);
}

/** Validate a save file without loading it */
export function validateSave(json: string): { valid: boolean; error?: string; version?: number } {
  try {
    const raw = JSON.parse(json);
    if (typeof raw !== 'object' || raw === null) return { valid: false, error: 'Not an object' };
    if (typeof raw.version !== 'number') return { valid: false, error: 'No version' };
    if (typeof raw.character !== 'object') return { valid: false, error: 'No character' };
    return { valid: true, version: raw.version };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}
