/**
 * Tests for the OCULUS Zustand store
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { useOculusStore } from '../store/useOculusStore';
import type { Quest, Bug, Spell } from '@dendrovia/shared';

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
    topology: null,
    hotspots: [],
    codeReader: { filePath: null, content: null, language: 'typescript' },
    millerSelection: [],
    isUiHovered: false,
    playerPosition: [0, 0, 0],
    visitedNodes: new Set<string>(),
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

    it('sets character stats', () => {
      useOculusStore.getState().setCharacter({
        health: 90,
        maxHealth: 150,
        mana: 40,
        level: 5,
      });
      const state = useOculusStore.getState();
      expect(state.health).toBe(90);
      expect(state.maxHealth).toBe(150);
      expect(state.mana).toBe(40);
      expect(state.level).toBe(5);
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
        effect: { type: 'damage', value: 15 },
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
    });
  });

  describe('navigation', () => {
    it('sets miller selection', () => {
      useOculusStore.getState().setMillerSelection(['src', 'src/main.ts']);
      expect(useOculusStore.getState().millerSelection).toEqual(['src', 'src/main.ts']);
    });

    it('adds visited nodes', () => {
      useOculusStore.getState().addVisitedNode('node-1');
      useOculusStore.getState().addVisitedNode('node-2');
      expect(useOculusStore.getState().visitedNodes.size).toBe(2);
      expect(useOculusStore.getState().visitedNodes.has('node-1')).toBe(true);
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
});
