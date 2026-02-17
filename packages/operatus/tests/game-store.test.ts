/**
 * GameStore Tests
 *
 * Tests all Zustand store actions and state mutations.
 * The persist middleware will fail silently (no IndexedDB in test),
 * but all actions are testable via getState()/setState().
 */

import './setup.js';
import { beforeEach, describe, expect, test } from 'bun:test';
import { getGameSaveSnapshot, useGameStore } from '../src/persistence/GameStore.js';

// Reset store before each test to avoid cross-contamination
beforeEach(() => {
  useGameStore.getState().reset();
});

describe('GameStore — initial state', () => {
  test('has default character', () => {
    const { character } = useGameStore.getState();
    expect(character.id).toBe('player-1');
    expect(character.name).toBe('Explorer');
    expect(character.class).toBe('dps');
    expect(character.level).toBe(1);
    expect(character.experience).toBe(0);
  });

  test('has default stats', () => {
    const { character } = useGameStore.getState();
    expect(character.stats.health).toBe(100);
    expect(character.stats.maxHealth).toBe(100);
    expect(character.stats.mana).toBe(50);
    expect(character.stats.maxMana).toBe(50);
    expect(character.stats.attack).toBe(10);
    expect(character.stats.defense).toBe(5);
  });

  test('starts with empty collections', () => {
    const state = useGameStore.getState();
    expect(state.quests).toEqual([]);
    expect(state.visitedNodes.size).toBe(0);
    expect(state.unlockedKnowledge).toEqual([]);
    expect(state.inventory).toEqual([]);
    expect(state.playtimeMs).toBe(0);
  });

  test('starts with default world position', () => {
    const { worldPosition, cameraMode } = useGameStore.getState();
    expect(worldPosition).toEqual([0, 0, 0]);
    expect(cameraMode).toBe('falcon');
  });

  test('transient state has correct defaults', () => {
    const state = useGameStore.getState();
    expect(state.isMenuOpen).toBe(false);
    expect(state.currentAnimation).toBeNull();
  });
});

describe('GameStore — character actions', () => {
  test('setCharacter updates character fields', () => {
    useGameStore.getState().setCharacter({ name: 'Wizard' });
    expect(useGameStore.getState().character.name).toBe('Wizard');
    // Other fields preserved
    expect(useGameStore.getState().character.level).toBe(1);
  });

  test('updateStats updates character stats', () => {
    useGameStore.getState().updateStats({ attack: 20, defense: 15 });
    const { stats } = useGameStore.getState().character;
    expect(stats.attack).toBe(20);
    expect(stats.defense).toBe(15);
    // Untouched stats preserved
    expect(stats.health).toBe(100);
  });
});

describe('GameStore — combat actions', () => {
  test('takeDamage reduces health', () => {
    useGameStore.getState().takeDamage(30);
    expect(useGameStore.getState().character.stats.health).toBe(70);
  });

  test('takeDamage clamps at 0', () => {
    useGameStore.getState().takeDamage(999);
    expect(useGameStore.getState().character.stats.health).toBe(0);
  });

  test('heal increases health', () => {
    useGameStore.getState().takeDamage(50);
    useGameStore.getState().heal(20);
    expect(useGameStore.getState().character.stats.health).toBe(70);
  });

  test('heal clamps at maxHealth', () => {
    useGameStore.getState().takeDamage(10);
    useGameStore.getState().heal(999);
    expect(useGameStore.getState().character.stats.health).toBe(100);
  });

  test('spendMana returns true and deducts when sufficient', () => {
    const result = useGameStore.getState().spendMana(20);
    expect(result).toBe(true);
    expect(useGameStore.getState().character.stats.mana).toBe(30);
  });

  test('spendMana returns false when insufficient', () => {
    const result = useGameStore.getState().spendMana(999);
    expect(result).toBe(false);
    expect(useGameStore.getState().character.stats.mana).toBe(50);
  });
});

describe('GameStore — experience and leveling', () => {
  test('gainExperience adds xp', () => {
    useGameStore.getState().gainExperience(50);
    expect(useGameStore.getState().character.experience).toBe(50);
  });

  test('gainExperience triggers level up at threshold', () => {
    // Level 1 → needs 100 xp (level * 100)
    useGameStore.getState().gainExperience(100);
    const { character } = useGameStore.getState();
    expect(character.level).toBe(2);
    expect(character.experience).toBe(0);
  });

  test('level up increases max stats and refills', () => {
    useGameStore.getState().gainExperience(100);
    const { stats } = useGameStore.getState().character;
    expect(stats.maxHealth).toBe(110);
    expect(stats.health).toBe(110); // Refilled on level up
    expect(stats.maxMana).toBe(55);
    expect(stats.mana).toBe(55);
  });

  test('excess xp carries over after level up', () => {
    useGameStore.getState().gainExperience(130);
    const { character } = useGameStore.getState();
    expect(character.level).toBe(2);
    expect(character.experience).toBe(30);
  });

  test('xp below threshold does not level up', () => {
    useGameStore.getState().gainExperience(99);
    expect(useGameStore.getState().character.level).toBe(1);
    expect(useGameStore.getState().character.experience).toBe(99);
  });
});

describe('GameStore — quest actions', () => {
  const testQuest = {
    id: 'q1',
    title: 'Explore the Tree',
    description: 'Find the root branch',
    status: 'active' as const,
    objectives: [],
  };

  test('addQuest appends to quest list', () => {
    useGameStore.getState().addQuest(testQuest);
    expect(useGameStore.getState().quests).toHaveLength(1);
    expect(useGameStore.getState().quests[0].id).toBe('q1');
  });

  test('updateQuestStatus changes status for matching quest', () => {
    useGameStore.getState().addQuest(testQuest);
    useGameStore.getState().updateQuestStatus('q1', 'completed');
    expect(useGameStore.getState().quests[0].status).toBe('completed');
  });

  test('updateQuestStatus ignores non-matching quest', () => {
    useGameStore.getState().addQuest(testQuest);
    useGameStore.getState().updateQuestStatus('nonexistent', 'completed');
    expect(useGameStore.getState().quests[0].status).toBe('active');
  });
});

describe('GameStore — collection actions', () => {
  test('visitNode adds to Set', () => {
    useGameStore.getState().visitNode('node-a');
    useGameStore.getState().visitNode('node-b');
    const { visitedNodes } = useGameStore.getState();
    expect(visitedNodes.size).toBe(2);
    expect(visitedNodes.has('node-a')).toBe(true);
    expect(visitedNodes.has('node-b')).toBe(true);
  });

  test('visitNode deduplicates', () => {
    useGameStore.getState().visitNode('node-a');
    useGameStore.getState().visitNode('node-a');
    expect(useGameStore.getState().visitedNodes.size).toBe(1);
  });

  test('unlockKnowledge adds to array', () => {
    useGameStore.getState().unlockKnowledge('lore-1');
    expect(useGameStore.getState().unlockedKnowledge).toEqual(['lore-1']);
  });

  test('unlockKnowledge deduplicates', () => {
    useGameStore.getState().unlockKnowledge('lore-1');
    useGameStore.getState().unlockKnowledge('lore-1');
    expect(useGameStore.getState().unlockedKnowledge).toEqual(['lore-1']);
  });

  test('addItem appends to inventory', () => {
    const item = { id: 'sword-1', name: 'Iron Sword', type: 'weapon' as const, rarity: 'common' as const };
    useGameStore.getState().addItem(item);
    expect(useGameStore.getState().inventory).toHaveLength(1);
    expect(useGameStore.getState().inventory[0].id).toBe('sword-1');
  });

  test('removeItem filters by id', () => {
    const item1 = { id: 'i1', name: 'Potion', type: 'consumable' as const, rarity: 'common' as const };
    const item2 = { id: 'i2', name: 'Scroll', type: 'consumable' as const, rarity: 'common' as const };
    useGameStore.getState().addItem(item1);
    useGameStore.getState().addItem(item2);
    useGameStore.getState().removeItem('i1');
    expect(useGameStore.getState().inventory).toHaveLength(1);
    expect(useGameStore.getState().inventory[0].id).toBe('i2');
  });
});

describe('GameStore — misc actions', () => {
  test('setWorldPosition updates position', () => {
    useGameStore.getState().setWorldPosition([1, 2, 3]);
    expect(useGameStore.getState().worldPosition).toEqual([1, 2, 3]);
  });

  test('setCameraMode switches mode', () => {
    useGameStore.getState().setCameraMode('player');
    expect(useGameStore.getState().cameraMode).toBe('player');
  });

  test('setMenuOpen toggles menu state', () => {
    useGameStore.getState().setMenuOpen(true);
    expect(useGameStore.getState().isMenuOpen).toBe(true);
  });

  test('setGameFlag sets boolean flags', () => {
    useGameStore.getState().setGameFlag('tutorial_complete', true);
    expect(useGameStore.getState().gameFlags.tutorial_complete).toBe(true);
  });

  test('addPlaytime accumulates', () => {
    useGameStore.getState().addPlaytime(1000);
    useGameStore.getState().addPlaytime(2000);
    expect(useGameStore.getState().playtimeMs).toBe(3000);
  });

  test('reset restores initial state', () => {
    useGameStore.getState().takeDamage(50);
    useGameStore.getState().visitNode('n1');
    useGameStore.getState().addPlaytime(5000);
    useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(state.character.stats.health).toBe(100);
    expect(state.visitedNodes.size).toBe(0);
    expect(state.playtimeMs).toBe(0);
  });
});

describe('getGameSaveSnapshot', () => {
  test('returns serializable snapshot', () => {
    useGameStore.getState().visitNode('node-x');
    useGameStore.getState().addPlaytime(1234);

    const snap = getGameSaveSnapshot();
    expect(snap.timestamp).toBeGreaterThan(0);
    expect(snap.character.id).toBe('player-1');
    expect(Array.isArray(snap.visitedNodes)).toBe(true);
    expect(snap.visitedNodes).toContain('node-x');
    expect(snap.playtimeMs).toBe(1234);
  });

  test('snapshot visitedNodes is an array (not Set)', () => {
    useGameStore.getState().visitNode('a');
    useGameStore.getState().visitNode('b');
    const snap = getGameSaveSnapshot();
    expect(Array.isArray(snap.visitedNodes)).toBe(true);
    expect(snap.visitedNodes).toHaveLength(2);
  });
});
