/**
 * Inventory & Item System
 *
 * Manages items, loot resolution, and item usage.
 * Items are developer-themed consumables, equipment, and knowledge:
 *
 *   Consumables: Debug Log, Stack Trace, Core Dump, etc.
 *   Equipment:   Knowledge items that provide passive bonuses
 *   Knowledge:   Lore entries unlocked by exploration
 *
 * Loot resolution uses the seeded PRNG for deterministic drops.
 */

import type {
  Item,
  ItemEffect,
  LootEntry,
  Character,
  RngState,
} from '@dendrovia/shared';
import { rngNext } from '../utils/SeededRandom.js';
import {
  applyStatusEffect,
  createStatusEffect,
  cleanse,
} from '../combat/StatusEffects.js';

// ─── Item Registry ──────────────────────────────────────────

const ITEM_REGISTRY = new Map<string, Item>();

function register(item: Item): Item {
  ITEM_REGISTRY.set(item.id, item);
  return item;
}

export function getItem(id: string): Item | undefined {
  return ITEM_REGISTRY.get(id);
}

export function getItemOrThrow(id: string): Item {
  const item = ITEM_REGISTRY.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

export function getAllItems(): Item[] {
  return Array.from(ITEM_REGISTRY.values());
}

// ─── Consumable Items (Loot Drops) ──────────────────────────

register({
  id: 'item-debug-log',
  name: 'Debug Log',
  description: 'A fragment of console output. Restores a small amount of HP.',
  type: 'consumable',
  effect: { type: 'heal-hp', value: 20 },
});

register({
  id: 'item-stack-trace',
  name: 'Stack Trace',
  description: 'A detailed error trace. Restores mana to dig deeper.',
  type: 'consumable',
  effect: { type: 'heal-mana', value: 25 },
});

register({
  id: 'item-core-dump',
  name: 'Core Dump',
  description: 'A memory snapshot at crash time. Significant HP restoration.',
  type: 'consumable',
  effect: { type: 'heal-hp', value: 50 },
});

register({
  id: 'item-memory-snapshot',
  name: 'Memory Snapshot',
  description: 'Complete heap state. Restores both HP and mana.',
  type: 'consumable',
  effect: { type: 'heal-hp', value: 35 },
});

register({
  id: 'item-root-cause',
  name: 'Root Cause Analysis',
  description: 'The actual source of the bug. Temporarily boosts attack power.',
  type: 'consumable',
  effect: { type: 'buff-attack', value: 5, duration: 5 },
});

register({
  id: 'item-caffeine',
  name: 'Caffeine Boost',
  description: 'A strong coffee. Temporarily increases all stats.',
  type: 'consumable',
  effect: { type: 'buff-attack', value: 3, duration: 3 },
});

register({
  id: 'item-rubber-duck',
  name: 'Rubber Duck',
  description: 'Explain the problem to the duck. Removes all debuffs.',
  type: 'consumable',
  effect: { type: 'cleanse', value: 0 },
});

register({
  id: 'item-energy-drink',
  name: 'Energy Drink',
  description: 'Maximum caffeine. Restores a large amount of mana.',
  type: 'consumable',
  effect: { type: 'heal-mana', value: 50 },
});

register({
  id: 'item-code-review',
  name: 'Code Review',
  description: 'Peer review strengthens your defenses temporarily.',
  type: 'consumable',
  effect: { type: 'buff-defense', value: 5, duration: 3 },
});

register({
  id: 'item-pair-programming',
  name: 'Pair Programming Session',
  description: 'Two minds are better than one. Full HP and mana restore.',
  type: 'consumable',
  effect: { type: 'heal-hp', value: 100 },
});

// ─── Inventory Management ───────────────────────────────────

export interface Inventory {
  items: InventorySlot[];
  maxSlots: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export function createInventory(maxSlots: number = 20): Inventory {
  return { items: [], maxSlots };
}

/** Add an item to the inventory. Stacks if already present. */
export function addItem(inventory: Inventory, itemId: string, quantity: number = 1): Inventory {
  const existing = inventory.items.find(slot => slot.itemId === itemId);

  if (existing) {
    return {
      ...inventory,
      items: inventory.items.map(slot =>
        slot.itemId === itemId
          ? { ...slot, quantity: slot.quantity + quantity }
          : slot
      ),
    };
  }

  if (inventory.items.length >= inventory.maxSlots) {
    return inventory; // Full — silently reject
  }

  return {
    ...inventory,
    items: [...inventory.items, { itemId, quantity }],
  };
}

/** Remove items from inventory. Removes slot if quantity reaches 0. */
export function removeItem(inventory: Inventory, itemId: string, quantity: number = 1): Inventory {
  const existing = inventory.items.find(slot => slot.itemId === itemId);
  if (!existing || existing.quantity < quantity) return inventory;

  if (existing.quantity <= quantity) {
    return {
      ...inventory,
      items: inventory.items.filter(slot => slot.itemId !== itemId),
    };
  }

  return {
    ...inventory,
    items: inventory.items.map(slot =>
      slot.itemId === itemId
        ? { ...slot, quantity: slot.quantity - quantity }
        : slot
    ),
  };
}

/** Check if inventory contains an item */
export function hasItem(inventory: Inventory, itemId: string, quantity: number = 1): boolean {
  const slot = inventory.items.find(s => s.itemId === itemId);
  return slot !== undefined && slot.quantity >= quantity;
}

/** Get total count of a specific item */
export function getItemCount(inventory: Inventory, itemId: string): number {
  const slot = inventory.items.find(s => s.itemId === itemId);
  return slot?.quantity ?? 0;
}

// ─── Item Usage ─────────────────────────────────────────────

export interface UseItemResult {
  character: Character;
  consumed: boolean;
  log: string;
}

/** Use a consumable item on a character */
export function useItem(character: Character, itemId: string): UseItemResult {
  const item = getItem(itemId);
  if (!item) {
    return { character, consumed: false, log: `Unknown item: ${itemId}` };
  }

  if (item.type !== 'consumable') {
    return { character, consumed: false, log: `${item.name} is not a consumable!` };
  }

  switch (item.effect.type) {
    case 'heal-hp': {
      const newHealth = Math.min(
        character.stats.maxHealth,
        character.stats.health + item.effect.value,
      );
      const healed = newHealth - character.stats.health;
      return {
        character: {
          ...character,
          stats: { ...character.stats, health: newHealth },
        },
        consumed: true,
        log: `${character.name} uses ${item.name}, restoring ${healed} HP`,
      };
    }

    case 'heal-mana': {
      const newMana = Math.min(
        character.stats.maxMana,
        character.stats.mana + item.effect.value,
      );
      const restored = newMana - character.stats.mana;
      return {
        character: {
          ...character,
          stats: { ...character.stats, mana: newMana },
        },
        consumed: true,
        log: `${character.name} uses ${item.name}, restoring ${restored} mana`,
      };
    }

    case 'buff-attack': {
      const buff = createStatusEffect(
        'attack-up',
        item.name,
        item.effect.value,
        item.effect.duration ?? 3,
      );
      return {
        character: {
          ...character,
          statusEffects: applyStatusEffect(character.statusEffects, buff),
        },
        consumed: true,
        log: `${character.name} uses ${item.name}, ATK +${item.effect.value} for ${item.effect.duration ?? 3} turns`,
      };
    }

    case 'buff-defense': {
      const buff = createStatusEffect(
        'defense-up',
        item.name,
        item.effect.value,
        item.effect.duration ?? 3,
      );
      return {
        character: {
          ...character,
          statusEffects: applyStatusEffect(character.statusEffects, buff),
        },
        consumed: true,
        log: `${character.name} uses ${item.name}, DEF +${item.effect.value} for ${item.effect.duration ?? 3} turns`,
      };
    }

    case 'cleanse': {
      return {
        character: {
          ...character,
          statusEffects: cleanse(character.statusEffects),
        },
        consumed: true,
        log: `${character.name} uses ${item.name}, all debuffs removed!`,
      };
    }

    default:
      return { character, consumed: false, log: `Unknown item effect: ${item.effect.type}` };
  }
}

// ─── Loot Resolution ────────────────────────────────────────

/** Roll loot from a monster's loot table */
export function resolveLoot(
  lootTable: LootEntry[],
  rng: RngState,
): { items: string[]; rng: RngState } {
  const items: string[] = [];
  let currentRng = rng;

  for (const entry of lootTable) {
    const [roll, nextRng] = rngNext(currentRng);
    currentRng = nextRng;

    if (roll < entry.chance) {
      items.push(entry.itemId);
    }
  }

  return { items, rng: currentRng };
}

/** Resolve loot and add it to inventory */
export function resolveLootToInventory(
  lootTable: LootEntry[],
  inventory: Inventory,
  rng: RngState,
): { inventory: Inventory; items: string[]; rng: RngState } {
  const { items, rng: newRng } = resolveLoot(lootTable, rng);
  let updatedInventory = inventory;

  for (const itemId of items) {
    updatedInventory = addItem(updatedInventory, itemId);
  }

  return { inventory: updatedInventory, items, rng: newRng };
}
