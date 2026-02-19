/**
 * GameStore Tests
 *
 * Tests all Zustand store actions and state mutations.
 * The persist middleware will fail silently (no IndexedDB in test),
 * but all actions are testable via getState()/setState().
 */

import './setup.js';
import { describe, test, expect, beforeEach } from 'bun:test';
import { useSaveStateStore, getSaveStateSnapshot } from '../src/persistence/SaveStateStore.js';

// Reset store before each test to avoid cross-contamination
beforeEach(() => {
  useSaveStateStore.getState().reset();
});

describe('GameStore — initial state', () => {
  test('has default character', () => {
    const { character } = useSaveStateStore.getState();
    expect(character.id).toBe('player-1');
    expect(character.name).toBe('Explorer');
    expect(character.class).toBe('dps');
    expect(character.level).toBe(1);
    expect(character.experience).toBe(0);
  });

  test('has default stats', () => {
    const { character } = useSaveStateStore.getState();
    expect(character.stats.health).toBe(100);
    expect(character.stats.maxHealth).toBe(100);
    expect(character.stats.mana).toBe(50);
    expect(character.stats.maxMana).toBe(50);
    expect(character.stats.attack).toBe(10);
    expect(character.stats.defense).toBe(5);
  });

  test('starts with empty collections', () => {
    const state = useSaveStateStore.getState();
    expect(state.quests).toEqual([]);
    expect(state.visitedNodes.size).toBe(0);
    expect(state.unlockedKnowledge).toEqual([]);
    expect(state.inventory).toEqual([]);
    expect(state.playtimeMs).toBe(0);
  });

  test('starts with default world position', () => {
    const { playerPosition, cameraMode } = useSaveStateStore.getState();
    expect(playerPosition).toEqual([0, 0, 0]);
    expect(cameraMode).toBe('falcon');
  });

  test('transient state has correct defaults', () => {
    const state = useSaveStateStore.getState();
    expect(state.isMenuOpen).toBe(false);
    expect(state.currentAnimation).toBeNull();
  });
});

describe('GameStore — character actions', () => {
  test('setCharacter updates character fields', () => {
    useSaveStateStore.getState().setCharacter({ name: 'Wizard' });
    expect(useSaveStateStore.getState().character.name).toBe('Wizard');
    // Other fields preserved
    expect(useSaveStateStore.getState().character.level).toBe(1);
  });

  test('updateStats updates character stats', () => {
    useSaveStateStore.getState().updateStats({ attack: 20, defense: 15 });
    const { stats } = useSaveStateStore.getState().character;
    expect(stats.attack).toBe(20);
    expect(stats.defense).toBe(15);
    // Untouched stats preserved
    expect(stats.health).toBe(100);
  });
});

describe('GameStore — combat actions', () => {
  test('takeDamage reduces health', () => {
    useSaveStateStore.getState().takeDamage(30);
    expect(useSaveStateStore.getState().character.stats.health).toBe(70);
  });

  test('takeDamage clamps at 0', () => {
    useSaveStateStore.getState().takeDamage(999);
    expect(useSaveStateStore.getState().character.stats.health).toBe(0);
  });

  test('heal increases health', () => {
    useSaveStateStore.getState().takeDamage(50);
    useSaveStateStore.getState().heal(20);
    expect(useSaveStateStore.getState().character.stats.health).toBe(70);
  });

  test('heal clamps at maxHealth', () => {
    useSaveStateStore.getState().takeDamage(10);
    useSaveStateStore.getState().heal(999);
    expect(useSaveStateStore.getState().character.stats.health).toBe(100);
  });

  test('spendMana returns true and deducts when sufficient', () => {
    const result = useSaveStateStore.getState().spendMana(20);
    expect(result).toBe(true);
    expect(useSaveStateStore.getState().character.stats.mana).toBe(30);
  });

  test('spendMana returns false when insufficient', () => {
    const result = useSaveStateStore.getState().spendMana(999);
    expect(result).toBe(false);
    expect(useSaveStateStore.getState().character.stats.mana).toBe(50);
  });
});

describe('GameStore — experience and leveling', () => {
  test('gainExperience adds xp', () => {
    useSaveStateStore.getState().gainExperience(50);
    expect(useSaveStateStore.getState().character.experience).toBe(50);
  });

  test('gainExperience triggers level up at threshold', () => {
    // Level 1 → needs 100 xp (level * 100)
    useSaveStateStore.getState().gainExperience(100);
    const { character } = useSaveStateStore.getState();
    expect(character.level).toBe(2);
    expect(character.experience).toBe(0);
  });

  test('level up increases max stats and refills', () => {
    useSaveStateStore.getState().gainExperience(100);
    const { stats } = useSaveStateStore.getState().character;
    expect(stats.maxHealth).toBe(110);
    expect(stats.health).toBe(110); // Refilled on level up
    expect(stats.maxMana).toBe(55);
    expect(stats.mana).toBe(55);
  });

  test('excess xp carries over after level up', () => {
    useSaveStateStore.getState().gainExperience(130);
    const { character } = useSaveStateStore.getState();
    expect(character.level).toBe(2);
    expect(character.experience).toBe(30);
  });

  test('xp below threshold does not level up', () => {
    useSaveStateStore.getState().gainExperience(99);
    expect(useSaveStateStore.getState().character.level).toBe(1);
    expect(useSaveStateStore.getState().character.experience).toBe(99);
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
    useSaveStateStore.getState().addQuest(testQuest);
    expect(useSaveStateStore.getState().quests).toHaveLength(1);
    expect(useSaveStateStore.getState().quests[0].id).toBe('q1');
  });

  test('updateQuestStatus changes status for matching quest', () => {
    useSaveStateStore.getState().addQuest(testQuest);
    useSaveStateStore.getState().updateQuestStatus('q1', 'completed');
    expect(useSaveStateStore.getState().quests[0].status).toBe('completed');
  });

  test('updateQuestStatus ignores non-matching quest', () => {
    useSaveStateStore.getState().addQuest(testQuest);
    useSaveStateStore.getState().updateQuestStatus('nonexistent', 'completed');
    expect(useSaveStateStore.getState().quests[0].status).toBe('active');
  });
});

describe('GameStore — collection actions', () => {
  test('visitNode adds to Set', () => {
    useSaveStateStore.getState().visitNode('node-a');
    useSaveStateStore.getState().visitNode('node-b');
    const { visitedNodes } = useSaveStateStore.getState();
    expect(visitedNodes.size).toBe(2);
    expect(visitedNodes.has('node-a')).toBe(true);
    expect(visitedNodes.has('node-b')).toBe(true);
  });

  test('visitNode deduplicates', () => {
    useSaveStateStore.getState().visitNode('node-a');
    useSaveStateStore.getState().visitNode('node-a');
    expect(useSaveStateStore.getState().visitedNodes.size).toBe(1);
  });

  test('unlockKnowledge adds to array', () => {
    useSaveStateStore.getState().unlockKnowledge('lore-1');
    expect(useSaveStateStore.getState().unlockedKnowledge).toEqual(['lore-1']);
  });

  test('unlockKnowledge deduplicates', () => {
    useSaveStateStore.getState().unlockKnowledge('lore-1');
    useSaveStateStore.getState().unlockKnowledge('lore-1');
    expect(useSaveStateStore.getState().unlockedKnowledge).toEqual(['lore-1']);
  });

  test('addItem appends to inventory', () => {
    const item = { id: 'sword-1', name: 'Iron Sword', type: 'weapon' as const, rarity: 'common' as const };
    useSaveStateStore.getState().addItem(item);
    expect(useSaveStateStore.getState().inventory).toHaveLength(1);
    expect(useSaveStateStore.getState().inventory[0].id).toBe('sword-1');
  });

  test('removeItem filters by id', () => {
    const item1 = { id: 'i1', name: 'Potion', type: 'consumable' as const, rarity: 'common' as const };
    const item2 = { id: 'i2', name: 'Scroll', type: 'consumable' as const, rarity: 'common' as const };
    useSaveStateStore.getState().addItem(item1);
    useSaveStateStore.getState().addItem(item2);
    useSaveStateStore.getState().removeItem('i1');
    expect(useSaveStateStore.getState().inventory).toHaveLength(1);
    expect(useSaveStateStore.getState().inventory[0].id).toBe('i2');
  });
});

describe('GameStore — misc actions', () => {
  test('setPlayerPosition updates position', () => {
    useSaveStateStore.getState().setPlayerPosition([1, 2, 3]);
    expect(useSaveStateStore.getState().playerPosition).toEqual([1, 2, 3]);
  });

  test('setCameraMode switches mode', () => {
    useSaveStateStore.getState().setCameraMode('player');
    expect(useSaveStateStore.getState().cameraMode).toBe('player');
  });

  test('setMenuOpen toggles menu state', () => {
    useSaveStateStore.getState().setMenuOpen(true);
    expect(useSaveStateStore.getState().isMenuOpen).toBe(true);
  });

  test('setGameFlag sets boolean flags', () => {
    useSaveStateStore.getState().setGameFlag('tutorial_complete', true);
    expect(useSaveStateStore.getState().gameFlags['tutorial_complete']).toBe(true);
  });

  test('addPlaytime accumulates', () => {
    useSaveStateStore.getState().addPlaytime(1000);
    useSaveStateStore.getState().addPlaytime(2000);
    expect(useSaveStateStore.getState().playtimeMs).toBe(3000);
  });

  test('reset restores initial state', () => {
    useSaveStateStore.getState().takeDamage(50);
    useSaveStateStore.getState().visitNode('n1');
    useSaveStateStore.getState().addPlaytime(5000);
    useSaveStateStore.getState().reset();

    const state = useSaveStateStore.getState();
    expect(state.character.stats.health).toBe(100);
    expect(state.visitedNodes.size).toBe(0);
    expect(state.playtimeMs).toBe(0);
  });
});

describe('getSaveStateSnapshot', () => {
  test('returns serializable snapshot', () => {
    useSaveStateStore.getState().visitNode('node-x');
    useSaveStateStore.getState().addPlaytime(1234);

    const snap = getSaveStateSnapshot();
    expect(snap.timestamp).toBeGreaterThan(0);
    expect(snap.character.id).toBe('player-1');
    expect(Array.isArray(snap.visitedNodes)).toBe(true);
    expect(snap.visitedNodes).toContain('node-x');
    expect(snap.playtimeMs).toBe(1234);
  });

  test('snapshot visitedNodes is an array (not Set)', () => {
    useSaveStateStore.getState().visitNode('a');
    useSaveStateStore.getState().visitNode('b');
    const snap = getSaveStateSnapshot();
    expect(Array.isArray(snap.visitedNodes)).toBe(true);
    expect(snap.visitedNodes).toHaveLength(2);
  });
});
