/**
 * Tests for the OCULUS Zustand store
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { useOculusStore } from '../store/useOculusStore';
import type { Quest, Bug, Spell, DeepWikiEnrichment } from '@dendrovia/shared';

function resetStore() {
  useOculusStore.setState({
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    experience: 0,
    activePanel: 'none',
    previousPanel: 'none',
    cameraMode: 'falcon',
    quests: [],
    activeQuest: null,
    battle: { active: false, enemy: null, log: [] },
    playerSpells: [],
    statusEffects: [],
    lootDrops: [],
    topology: null,
    hotspots: [],
    codeReader: { filePath: null, content: null, language: 'typescript', loading: false, error: null },
    millerSelection: [],
    isUiHovered: false,
    deepwiki: null,
    playerPosition: [0, 0, 0],
    visitedNodes: [],
  });
}

describe('useOculusStore', () => {
  beforeEach(resetStore);

  describe('health/mana', () => {
    it('sets health', () => {
      useOculusStore.getState().setHealth(75);
      expect(useOculusStore.getState().health).toBe(75);
    });

    it('sets health and maxHealth', () => {
      useOculusStore.getState().setHealth(80, 120);
      expect(useOculusStore.getState().health).toBe(80);
      expect(useOculusStore.getState().maxHealth).toBe(120);
    });

    it('sets mana', () => {
      useOculusStore.getState().setMana(30);
      expect(useOculusStore.getState().mana).toBe(30);
    });

    it('sets character from stats sub-object (T12)', () => {
      useOculusStore.getState().setCharacter({
        stats: {
          health: 90,
          maxHealth: 150,
          mana: 40,
          maxMana: 80,
          attack: 10,
          defense: 10,
          speed: 10,
        },
        level: 5,
        experience: 200,
      });
      const state = useOculusStore.getState();
      expect(state.health).toBe(90);
      expect(state.maxHealth).toBe(150);
      expect(state.mana).toBe(40);
      expect(state.maxMana).toBe(80);
      expect(state.level).toBe(5);
      expect(state.experience).toBe(200);
    });

    it('sets level/experience without stats (partial character)', () => {
      useOculusStore.getState().setCharacter({ level: 7, experience: 500 } as any);
      const state = useOculusStore.getState();
      expect(state.level).toBe(7);
      expect(state.experience).toBe(500);
      // Health/mana should remain unchanged
      expect(state.health).toBe(100);
      expect(state.mana).toBe(50);
    });
  });

  describe('panels', () => {
    it('sets active panel', () => {
      useOculusStore.getState().setActivePanel('quest-log');
      expect(useOculusStore.getState().activePanel).toBe('quest-log');
    });

    it('tracks previous panel', () => {
      useOculusStore.getState().setActivePanel('quest-log');
      useOculusStore.getState().setActivePanel('miller-columns');
      expect(useOculusStore.getState().previousPanel).toBe('quest-log');
    });

    it('toggles panel on/off', () => {
      useOculusStore.getState().togglePanel('quest-log');
      expect(useOculusStore.getState().activePanel).toBe('quest-log');
      useOculusStore.getState().togglePanel('quest-log');
      expect(useOculusStore.getState().activePanel).toBe('none');
    });
  });

  describe('quests', () => {
    const mockQuest: Quest = {
      id: 'q1',
      title: 'Fix the Bug',
      description: 'Find and fix the null pointer',
      type: 'bug-hunt',
      status: 'active',
      requirements: ['Find the file'],
      rewards: [{ type: 'experience', value: 100 }],
    };

    it('sets quests', () => {
      useOculusStore.getState().setQuests([mockQuest]);
      expect(useOculusStore.getState().quests).toHaveLength(1);
    });

    it('updates a quest', () => {
      useOculusStore.getState().setQuests([mockQuest]);
      useOculusStore.getState().updateQuest('q1', { status: 'completed' });
      expect(useOculusStore.getState().quests[0].status).toBe('completed');
    });

    it('updates active quest when it matches', () => {
      useOculusStore.getState().setQuests([mockQuest]);
      useOculusStore.getState().setActiveQuest(mockQuest);
      useOculusStore.getState().updateQuest('q1', { status: 'completed' });
      expect(useOculusStore.getState().activeQuest?.status).toBe('completed');
    });
  });

  describe('combat', () => {
    const mockBug: Bug = {
      id: 'b1',
      type: 'null-pointer',
      severity: 3,
      health: 50,
      position: [1, 2, 3],
      sourceCommit: 'abc123',
    };

    const mockSpells: Spell[] = [
      {
        id: 's1',
        name: 'Blame',
        description: 'git blame to find the culprit',
        manaCost: 10,
        cooldown: 2,
        effect: { type: 'damage', target: 'enemy', value: 15 },
        element: 'fire',
      },
    ];

    it('starts combat', () => {
      useOculusStore.getState().startCombat(mockBug, mockSpells);
      const state = useOculusStore.getState();
      expect(state.battle.active).toBe(true);
      expect(state.battle.enemy?.id).toBe('b1');
      expect(state.playerSpells).toHaveLength(1);
      expect(state.activePanel).toBe('battle-ui');
    });

    it('ends combat', () => {
      useOculusStore.getState().startCombat(mockBug, mockSpells);
      useOculusStore.getState().endCombat();
      const state = useOculusStore.getState();
      expect(state.battle.active).toBe(false);
      expect(state.battle.enemy).toBeNull();
    });

    it('adds battle log entries', () => {
      useOculusStore.getState().startCombat(mockBug, mockSpells);
      useOculusStore.getState().addBattleLog('Player used Blame!');
      expect(useOculusStore.getState().battle.log).toHaveLength(2); // initial + added
    });

    it('caps battle log at 100 entries (T14)', () => {
      useOculusStore.getState().startCombat(mockBug, mockSpells);
      // Add 110 entries (+ 1 initial = 111 total attempts)
      for (let i = 0; i < 110; i++) {
        useOculusStore.getState().addBattleLog(`Message ${i}`);
      }
      expect(useOculusStore.getState().battle.log.length).toBeLessThanOrEqual(100);
    });
  });

  describe('code reader', () => {
    it('opens code reader', () => {
      useOculusStore.getState().openCodeReader('src/main.ts', 'const x = 1;', 'typescript');
      const state = useOculusStore.getState();
      expect(state.codeReader.filePath).toBe('src/main.ts');
      expect(state.codeReader.content).toBe('const x = 1;');
      expect(state.activePanel).toBe('code-reader');
    });

    it('closes code reader', () => {
      useOculusStore.getState().openCodeReader('src/main.ts', 'const x = 1;', 'typescript');
      useOculusStore.getState().closeCodeReader();
      const state = useOculusStore.getState();
      expect(state.codeReader.filePath).toBeNull();
      expect(state.activePanel).toBe('none');
      expect(state.codeReader.loading).toBe(false);
      expect(state.codeReader.error).toBeNull();
    });

    it('sets loading when opened without content', () => {
      useOculusStore.getState().openCodeReader('src/main.ts', '', 'typescript');
      const state = useOculusStore.getState();
      expect(state.codeReader.filePath).toBe('src/main.ts');
      expect(state.codeReader.content).toBeNull();
      expect(state.codeReader.loading).toBe(true);
    });

    it('does not set loading when opened with content', () => {
      useOculusStore.getState().openCodeReader('src/main.ts', 'const x = 1;', 'typescript');
      const state = useOculusStore.getState();
      expect(state.codeReader.content).toBe('const x = 1;');
      expect(state.codeReader.loading).toBe(false);
    });

    it('sets code content', () => {
      useOculusStore.getState().openCodeReader('src/main.ts', '', 'typescript');
      useOculusStore.getState().setCodeContent('const loaded = true;');
      const state = useOculusStore.getState();
      expect(state.codeReader.content).toBe('const loaded = true;');
      expect(state.codeReader.loading).toBe(false);
      expect(state.codeReader.error).toBeNull();
    });

    it('sets code loading state', () => {
      useOculusStore.getState().setCodeLoading(true);
      expect(useOculusStore.getState().codeReader.loading).toBe(true);
      useOculusStore.getState().setCodeLoading(false);
      expect(useOculusStore.getState().codeReader.loading).toBe(false);
    });

    it('sets code error and clears loading', () => {
      useOculusStore.getState().setCodeLoading(true);
      useOculusStore.getState().setCodeError('File not found');
      const state = useOculusStore.getState();
      expect(state.codeReader.error).toBe('File not found');
      expect(state.codeReader.loading).toBe(false);
    });
  });

  describe('navigation', () => {
    it('sets miller selection', () => {
      useOculusStore.getState().setMillerSelection(['src', 'src/main.ts']);
      expect(useOculusStore.getState().millerSelection).toEqual(['src', 'src/main.ts']);
    });

    it('adds visited nodes (T13: array-based)', () => {
      useOculusStore.getState().addVisitedNode('node-1');
      useOculusStore.getState().addVisitedNode('node-2');
      expect(useOculusStore.getState().visitedNodes).toHaveLength(2);
      expect(useOculusStore.getState().visitedNodes).toContain('node-1');
    });

    it('deduplicates visited nodes (T13)', () => {
      useOculusStore.getState().addVisitedNode('node-1');
      useOculusStore.getState().addVisitedNode('node-1');
      expect(useOculusStore.getState().visitedNodes).toHaveLength(1);
    });

    it('sets player position', () => {
      useOculusStore.getState().setPlayerPosition([10, 20, 30]);
      expect(useOculusStore.getState().playerPosition).toEqual([10, 20, 30]);
    });
  });

  describe('input coordination', () => {
    it('sets ui hovered state', () => {
      useOculusStore.getState().setUiHovered(true);
      expect(useOculusStore.getState().isUiHovered).toBe(true);
      useOculusStore.getState().setUiHovered(false);
      expect(useOculusStore.getState().isUiHovered).toBe(false);
    });
  });

  describe('camera mode', () => {
    it('sets camera mode', () => {
      useOculusStore.getState().setCameraMode('player');
      expect(useOculusStore.getState().cameraMode).toBe('player');
    });
  });

  describe('status effects', () => {
    it('adds a status effect', () => {
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-1',
        effectType: 'poison',
        remainingTurns: 3,
        appliedAt: 1000,
      });
      const effects = useOculusStore.getState().statusEffects;
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe('poison');
    });

    it('upserts same effectId (updates remainingTurns)', () => {
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-1',
        effectType: 'poison',
        remainingTurns: 3,
        appliedAt: 1000,
      });
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-1',
        effectType: 'poison',
        remainingTurns: 5,
        appliedAt: 2000,
      });
      const effects = useOculusStore.getState().statusEffects;
      expect(effects).toHaveLength(1);
      expect(effects[0].remainingTurns).toBe(5);
    });

    it('removes a status effect', () => {
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-1',
        effectType: 'poison',
        remainingTurns: 3,
        appliedAt: 1000,
      });
      useOculusStore.getState().removeStatusEffect('eff-1');
      expect(useOculusStore.getState().statusEffects).toHaveLength(0);
    });

    it('multiple effects coexist', () => {
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-1',
        effectType: 'poison',
        remainingTurns: 3,
        appliedAt: 1000,
      });
      useOculusStore.getState().addStatusEffect({
        effectId: 'eff-2',
        effectType: 'shield',
        remainingTurns: 2,
        appliedAt: 1000,
      });
      expect(useOculusStore.getState().statusEffects).toHaveLength(2);
    });
  });

  describe('loot', () => {
    it('adds a loot drop', () => {
      useOculusStore.getState().addLootDrop({
        id: 'loot-1',
        monsterId: 'm1',
        items: [{ itemId: 'i1', name: 'Sword' }],
        droppedAt: 1000,
      });
      const drops = useOculusStore.getState().lootDrops;
      expect(drops).toHaveLength(1);
      expect(drops[0].items[0].name).toBe('Sword');
    });

    it('caps at 5 drops (oldest removed)', () => {
      for (let i = 0; i < 7; i++) {
        useOculusStore.getState().addLootDrop({
          id: `loot-${i}`,
          monsterId: `m${i}`,
          items: [{ itemId: `i${i}`, name: `Item ${i}` }],
          droppedAt: 1000 + i,
        });
      }
      const drops = useOculusStore.getState().lootDrops;
      expect(drops).toHaveLength(5);
      expect(drops[0].id).toBe('loot-2');
    });

    it('dismisses by id', () => {
      useOculusStore.getState().addLootDrop({
        id: 'loot-1',
        monsterId: 'm1',
        items: [{ itemId: 'i1', name: 'Sword' }],
        droppedAt: 1000,
      });
      useOculusStore.getState().addLootDrop({
        id: 'loot-2',
        monsterId: 'm2',
        items: [{ itemId: 'i2', name: 'Shield' }],
        droppedAt: 2000,
      });
      useOculusStore.getState().dismissLootDrop('loot-1');
      const drops = useOculusStore.getState().lootDrops;
      expect(drops).toHaveLength(1);
      expect(drops[0].id).toBe('loot-2');
    });
  });

  describe('deepwiki', () => {
    const mockDeepWiki: DeepWikiEnrichment = {
      wikiUrl: 'https://deepwiki.example.com/repo',
      overview: 'A sample repository for testing.',
      moduleDocumentation: { 'src/main.ts': 'Entry point of the application.' },
      fetchedAt: '2026-02-15T00:00:00Z',
    };

    it('stores deepwiki data', () => {
      useOculusStore.getState().setDeepWiki(mockDeepWiki);
      const state = useOculusStore.getState();
      expect(state.deepwiki).not.toBeNull();
      expect(state.deepwiki?.wikiUrl).toBe('https://deepwiki.example.com/repo');
      expect(state.deepwiki?.overview).toBe('A sample repository for testing.');
      expect(state.deepwiki?.moduleDocumentation?.['src/main.ts']).toBe('Entry point of the application.');
    });

    it('clears deepwiki data with null', () => {
      useOculusStore.getState().setDeepWiki(mockDeepWiki);
      expect(useOculusStore.getState().deepwiki).not.toBeNull();
      useOculusStore.getState().setDeepWiki(null);
      expect(useOculusStore.getState().deepwiki).toBeNull();
    });
  });
});
