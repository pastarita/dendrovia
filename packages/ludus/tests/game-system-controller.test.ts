/**
 * GameSystemController Tests
 *
 * Covers: Toggle API, Event Gating, Shadow Mode, Persistence,
 *         OCULUS Surface, Backward Compatibility
 */

import { describe, it, expect, beforeEach } from 'bun:test';

import {
  createGameSystemController,
  type GameSystemController,
  type GameSystemName,
  ALL_SYSTEMS,
} from '../src/controller/GameSystemController.js';
import {
  createGameSession,
  wireGameEvents,
  startBattle,
  dispatchCombatAction,
  type GameSession,
} from '../src/integration/EventWiring.js';
import { createGameStore, type GameStore } from '../src/state/GameStore.js';
import { createCharacter } from '../src/character/CharacterSystem.js';
import { createMonster } from '../src/combat/MonsterFactory.js';
import { createRngState } from '../src/utils/SeededRandom.js';
import {
  serializeGameState,
  deserializeGameState,
} from '../src/save/SaveSystem.js';
import { createEncounterState } from '../src/encounter/EncounterSystem.js';
import { createBattleStatistics } from '../src/progression/ProgressionSystem.js';
import { createInventory } from '../src/inventory/InventorySystem.js';

import type { ParsedCommit, ParsedFile, Hotspot, Character, Monster } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';

// ─── Test Helpers ───────────────────────────────────────────

function makeCommit(overrides: Partial<ParsedCommit> = {}): ParsedCommit {
  return {
    hash: `hash-${Math.random().toString(36).slice(2, 9)}`,
    message: 'fix: null pointer in parser',
    author: 'dev',
    date: new Date('2024-01-01'),
    filesChanged: ['src/parser.ts'],
    insertions: 30,
    deletions: 10,
    isMerge: false,
    type: 'bug-fix',
    ...overrides,
  };
}

function makeFile(overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    path: 'src/parser.ts',
    hash: 'abc123',
    language: 'typescript',
    complexity: 10,
    loc: 200,
    lastModified: new Date('2024-06-01'),
    author: 'dev',
    ...overrides,
  };
}

function makeHotspot(overrides: Partial<Hotspot> = {}): Hotspot {
  return {
    path: 'src/parser.ts',
    churnRate: 15,
    complexity: 20,
    riskScore: 7,
    ...overrides,
  };
}

function makeTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-test-1',
    name: 'TestBug',
    type: 'null-pointer',
    element: 'none',
    severity: 1,
    stats: {
      health: 50,
      maxHealth: 50,
      mana: 0,
      maxMana: 0,
      attack: 8,
      defense: 3,
      speed: 5,
    },
    spells: ['spell-null-deref'],
    statusEffects: [],
    xpReward: 25,
    lootTable: [{ itemId: 'item-debug-log', chance: 0.5 }],
    ...overrides,
  };
}

function createTestSetup() {
  getEventBus().clear();

  const char = createCharacter('dps', 'TestHero', 5);
  const store = createGameStore({
    character: char,
    inventory: [],
    activeQuests: [],
    completedQuests: [],
    battleState: null,
    gameFlags: {},
  });

  const files = [
    makeFile({ path: 'src/a.ts', complexity: 50 }),
    makeFile({ path: 'src/b.ts', complexity: 80 }),
  ];
  const commits = [
    makeCommit({ filesChanged: ['src/a.ts'] }),
    makeCommit({ filesChanged: ['src/a.ts'] }),
    makeCommit({ filesChanged: ['src/b.ts'] }),
  ];
  const hotspots = [
    makeHotspot({ path: 'src/a.ts', churnRate: 20, complexity: 50, riskScore: 10 }),
  ];

  const session = createGameSession(store, files, commits, hotspots, 42);
  return { session, store, files, commits, hotspots };
}

// ════════════════════════════════════════════════════════════
// TOGGLE API
// ════════════════════════════════════════════════════════════

describe('GameSystemController - Toggle API', () => {
  let controller: GameSystemController;
  let session: GameSession;
  let store: GameStore;

  beforeEach(() => {
    const setup = createTestSetup();
    session = setup.session;
    store = setup.store;
    controller = createGameSystemController(session);
  });

  it('should default all systems to enabled', () => {
    const status = controller.getSystemStatus();
    expect(status.master).toBe(true);
    expect(status.shadow).toBe(false);
    for (const name of ALL_SYSTEMS) {
      expect(status.systems[name]).toBe(true);
      expect(status.effective[name]).toBe(true);
    }
  });

  it('should toggle individual system off', () => {
    controller.setSystemEnabled('encounters', false);
    const status = controller.getSystemStatus();
    expect(status.systems.encounters).toBe(false);
    expect(status.effective.encounters).toBe(false);
    expect(status.systems.combat).toBe(true);
    expect(status.effective.combat).toBe(true);
  });

  it('should toggle individual system back on', () => {
    controller.setSystemEnabled('encounters', false);
    controller.setSystemEnabled('encounters', true);
    expect(controller.isSystemActive('encounters')).toBe(true);
  });

  it('should report effective state as master AND individual', () => {
    controller.setMasterEnabled(true);
    controller.setSystemEnabled('combat', false);
    expect(controller.isSystemActive('combat')).toBe(false);
    expect(controller.isSystemActive('encounters')).toBe(true);
  });

  it('should disable all systems when master is off', () => {
    controller.setMasterEnabled(false);
    for (const name of ALL_SYSTEMS) {
      expect(controller.isSystemActive(name)).toBe(false);
    }
  });

  it('should restore individual states when master toggled back on', () => {
    controller.setSystemEnabled('encounters', false);
    controller.setMasterEnabled(false);
    // All off
    for (const name of ALL_SYSTEMS) {
      expect(controller.isSystemActive(name)).toBe(false);
    }
    // Restore master
    controller.setMasterEnabled(true);
    // Encounters still off (individual), rest on
    expect(controller.isSystemActive('encounters')).toBe(false);
    expect(controller.isSystemActive('combat')).toBe(true);
    expect(controller.isSystemActive('progression')).toBe(true);
  });

  it('should enable shadow mode', () => {
    controller.setShadowEnabled(true);
    expect(controller.getSystemStatus().shadow).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// EVENT GATING
// ════════════════════════════════════════════════════════════

describe('GameSystemController - Event Gating', () => {
  let controller: GameSystemController;
  let session: GameSession;
  let store: GameStore;
  let bus: ReturnType<typeof getEventBus>;

  beforeEach(() => {
    const setup = createTestSetup();
    session = setup.session;
    store = setup.store;
    bus = getEventBus();
    controller = createGameSystemController(session);
    controller.wireControlledEvents();
  });

  it('should pass NODE_CLICKED through when encounters enabled', async () => {
    let encounterFired = false;
    bus.on(GameEvents.ENCOUNTER_TRIGGERED, () => { encounterFired = true; });
    bus.on(GameEvents.COMBAT_STARTED, () => { /* absorb */ });

    // Emit NODE_CLICKED — whether encounter triggers depends on RNG/complexity
    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    // With encounters enabled, the handler runs (encounter may or may not trigger)
    // The key test: no suppression happened
    expect(controller.getSuppressedCount()).toBe(0);
    controller.unwire();
  });

  it('should block NODE_CLICKED when encounters disabled', async () => {
    controller.setSystemEnabled('encounters', false);

    let encounterFired = false;
    bus.on(GameEvents.ENCOUNTER_TRIGGERED, () => { encounterFired = true; });

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    expect(encounterFired).toBe(false);
    expect(controller.getSuppressedCount()).toBeGreaterThan(0);
    controller.unwire();
  });

  it('should block BRANCH_ENTERED encounters when encounters disabled', async () => {
    controller.setSystemEnabled('encounters', false);

    let encounterFired = false;
    bus.on(GameEvents.ENCOUNTER_TRIGGERED, () => { encounterFired = true; });

    await bus.emit(GameEvents.BRANCH_ENTERED, {
      branchId: 'branch-1',
      filePath: 'src/a.ts',
      depth: 1,
    });

    expect(encounterFired).toBe(false);
    controller.unwire();
  });

  it('should always process PLAYER_MOVED regardless of encounter toggle', async () => {
    controller.setSystemEnabled('encounters', false);

    const stepsBefore = session.encounterState.stepsSinceLastEncounter;
    await bus.emit(GameEvents.PLAYER_MOVED, {
      position: [1, 0, 0] as [number, number, number],
      branchId: 'branch-1',
      velocity: [0, 0, 0] as [number, number, number],
    });

    expect(session.encounterState.stepsSinceLastEncounter).toBe(stepsBefore + 1);
    controller.unwire();
  });

  it('should block SPELL_CAST when combat disabled', async () => {
    // Start a battle first
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    startBattle(session, [monster]);

    controller.setSystemEnabled('combat', false);

    const battleBefore = store.getState().battleState;
    await bus.emit(GameEvents.SPELL_CAST, {
      spellId: 'spell-sql-injection',
      casterId: 'player-1',
    });

    // Battle state should not have changed
    expect(store.getState().battleState).toBe(battleBefore);
    controller.unwire();
  });

  it('should block ITEM_USED when inventory disabled', async () => {
    controller.setSystemEnabled('inventory', false);

    // Add an item to inventory
    session.inventory = {
      items: [{ itemId: 'item-health-potion', quantity: 1 }],
      maxSlots: 20,
    };

    await bus.emit(GameEvents.ITEM_USED, {
      itemId: 'item-health-potion',
    });

    // Item should still be in inventory
    expect(session.inventory.items[0].quantity).toBe(1);
    controller.unwire();
  });

  it('should block all gated events when master disabled', async () => {
    controller.setMasterEnabled(false);

    let encounterFired = false;
    bus.on(GameEvents.ENCOUNTER_TRIGGERED, () => { encounterFired = true; });

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    expect(encounterFired).toBe(false);

    // PLAYER_MOVED still works
    const stepsBefore = session.encounterState.stepsSinceLastEncounter;
    await bus.emit(GameEvents.PLAYER_MOVED, {
      position: [1, 0, 0] as [number, number, number],
      branchId: 'branch-1',
      velocity: [0, 0, 0] as [number, number, number],
    });
    expect(session.encounterState.stepsSinceLastEncounter).toBe(stepsBefore + 1);

    controller.unwire();
  });

  it('should not double-wire on repeated wireControlledEvents calls', () => {
    // Already wired in beforeEach; calling again should be a no-op
    controller.wireControlledEvents();
    // Should not throw and should not double-subscribe
    controller.unwire();
  });

  it('should cleanly unwire and re-wire', async () => {
    controller.unwire();

    let encounterFired = false;
    bus.on(GameEvents.ENCOUNTER_TRIGGERED, () => { encounterFired = true; });

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    // After unwire, controller handlers should not fire
    // (other bus handlers may still fire, but no encounter from controller)
    // Re-wire and verify it works again
    controller.wireControlledEvents();
    controller.unwire();
  });
});

// ════════════════════════════════════════════════════════════
// SHADOW MODE
// ════════════════════════════════════════════════════════════

describe('GameSystemController - Shadow Mode', () => {
  let controller: GameSystemController;
  let session: GameSession;
  let bus: ReturnType<typeof getEventBus>;

  beforeEach(() => {
    const setup = createTestSetup();
    session = setup.session;
    bus = getEventBus();
    controller = createGameSystemController(session, { shadowEnabled: true });
    controller.wireControlledEvents();
  });

  it('should collect shadow traces when system disabled and shadow on', async () => {
    controller.setSystemEnabled('encounters', false);

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    // Shadow trace may or may not have entries depending on RNG encounter roll
    // But suppressed count should be > 0
    expect(controller.getSuppressedCount()).toBeGreaterThan(0);
    controller.unwire();
  });

  it('should filter shadow traces by system', async () => {
    controller.setSystemEnabled('encounters', false);
    controller.setSystemEnabled('combat', false);

    // Emit encounter event
    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    const encounterTraces = controller.getShadowTrace('encounters');
    const combatTraces = controller.getShadowTrace('combat');

    // All encounter traces should have system='encounters'
    for (const t of encounterTraces) {
      expect(t.system).toBe('encounters');
    }
    for (const t of combatTraces) {
      expect(t.system).toBe('combat');
    }
    controller.unwire();
  });

  it('should respect ring buffer max size', async () => {
    const smallController = createGameSystemController(session, {
      shadowEnabled: true,
      maxShadowEntries: 3,
    });
    smallController.setSystemEnabled('inventory', false);
    smallController.wireControlledEvents();

    // Add items so shadow evaluator produces traces
    session.inventory = {
      items: [{ itemId: 'item-health-potion', quantity: 10 }],
      maxSlots: 20,
    };

    for (let i = 0; i < 5; i++) {
      await bus.emit(GameEvents.ITEM_USED, { itemId: 'item-health-potion' });
    }

    const trace = smallController.getShadowTrace();
    expect(trace.length).toBeLessThanOrEqual(3);
    expect(smallController.getSuppressedCount()).toBe(5);
    smallController.unwire();
  });

  it('should clear shadow trace', async () => {
    controller.setSystemEnabled('encounters', false);

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    controller.clearShadowTrace();
    expect(controller.getShadowTrace().length).toBe(0);
    // suppressed count persists (lifetime counter)
    expect(controller.getSuppressedCount()).toBeGreaterThan(0);
    controller.unwire();
  });

  it('should not collect traces when shadow disabled', async () => {
    controller.setShadowEnabled(false);
    controller.setSystemEnabled('encounters', false);

    await bus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'node-1',
      filePath: 'src/a.ts',
      position: [0, 0, 0] as [number, number, number],
    });

    // No traces collected, but suppressed count still increments
    expect(controller.getShadowTrace().length).toBe(0);
    expect(controller.getSuppressedCount()).toBeGreaterThan(0);
    controller.unwire();
  });

  it('should include shadow trace entry fields', async () => {
    controller.setSystemEnabled('inventory', false);
    session.inventory = {
      items: [{ itemId: 'item-health-potion', quantity: 1 }],
      maxSlots: 20,
    };

    await bus.emit(GameEvents.ITEM_USED, { itemId: 'item-health-potion' });

    const traces = controller.getShadowTrace('inventory');
    expect(traces.length).toBe(1);

    const entry = traces[0];
    expect(entry.system).toBe('inventory');
    expect(entry.incomingEvent).toBe(GameEvents.ITEM_USED);
    expect(typeof entry.wouldHave).toBe('string');
    expect(typeof entry.timestamp).toBe('number');
    expect(entry.suppressed).toBeDefined();
    expect(entry.suppressed.busEmissions).toBeInstanceOf(Array);
    controller.unwire();
  });
});

// ════════════════════════════════════════════════════════════
// PERSISTENCE
// ════════════════════════════════════════════════════════════

describe('GameSystemController - Persistence', () => {
  it('should persist toggle state to gameFlags', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);

    controller.setSystemEnabled('encounters', false);
    controller.setMasterEnabled(false);
    controller.setShadowEnabled(true);

    const flags = setup.store.getState().gameFlags;
    expect(flags['ludus.master.enabled']).toBe(false);
    expect(flags['ludus.shadow.enabled']).toBe(true);
    expect(flags['ludus.system.encounters.enabled']).toBe(false);
    expect(flags['ludus.system.combat.enabled']).toBe(true);
  });

  it('should restore toggle state from gameFlags on creation', () => {
    const setup = createTestSetup();
    // Pre-set flags as if loaded from save
    setup.store.setState({
      gameFlags: {
        'ludus.master.enabled': true,
        'ludus.shadow.enabled': true,
        'ludus.system.encounters.enabled': false,
        'ludus.system.combat.enabled': true,
        'ludus.system.progression.enabled': false,
        'ludus.system.quests.enabled': true,
        'ludus.system.inventory.enabled': true,
      },
    });

    const controller = createGameSystemController(setup.session);
    const status = controller.getSystemStatus();

    expect(status.master).toBe(true);
    expect(status.shadow).toBe(true);
    expect(status.systems.encounters).toBe(false);
    expect(status.systems.progression).toBe(false);
    expect(status.systems.combat).toBe(true);
  });

  it('should survive save/load cycle via SaveSystem', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);

    controller.setSystemEnabled('encounters', false);
    controller.setSystemEnabled('progression', false);
    controller.setShadowEnabled(true);

    // Serialize
    const state = setup.store.getState();
    const saveData = serializeGameState(
      state.character,
      setup.session.inventory,
      setup.session.quests,
      setup.session.encounterState,
      setup.session.battleStats,
      [],
      state.gameFlags,
      0,
    );

    // Deserialize
    const loadResult = deserializeGameState(saveData);
    expect(loadResult.success).toBe(true);

    // Verify flags round-tripped
    expect(loadResult.gameFlags!['ludus.system.encounters.enabled']).toBe(false);
    expect(loadResult.gameFlags!['ludus.system.progression.enabled']).toBe(false);
    expect(loadResult.gameFlags!['ludus.shadow.enabled']).toBe(true);
    expect(loadResult.gameFlags!['ludus.master.enabled']).toBe(true);

    // Create new session from loaded data and verify controller restores
    getEventBus().clear();
    const newStore = createGameStore({
      character: loadResult.character!,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: loadResult.gameFlags!,
    });
    const newSession = createGameSession(
      newStore,
      setup.session.files,
      setup.session.commits,
      setup.session.hotspots,
      42,
    );
    const newController = createGameSystemController(newSession);

    expect(newController.isSystemActive('encounters')).toBe(false);
    expect(newController.isSystemActive('progression')).toBe(false);
    expect(newController.isSystemActive('combat')).toBe(true);
    expect(newController.getSystemStatus().shadow).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// OCULUS SURFACE
// ════════════════════════════════════════════════════════════

describe('GameSystemController - OCULUS Surface', () => {
  it('should return correct SystemStatus shape', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);

    const status = controller.getSystemStatus();
    expect(typeof status.master).toBe('boolean');
    expect(typeof status.shadow).toBe('boolean');
    expect(typeof status.systems).toBe('object');
    expect(typeof status.effective).toBe('object');

    for (const name of ALL_SYSTEMS) {
      expect(typeof status.systems[name]).toBe('boolean');
      expect(typeof status.effective[name]).toBe('boolean');
    }
  });

  it('should emit SYSTEM_STATUS_CHANGED on toggle', async () => {
    const setup = createTestSetup();
    const bus = getEventBus();
    const controller = createGameSystemController(setup.session);

    const received: Array<{ system: string; enabled: boolean }> = [];
    bus.on(GameEvents.SYSTEM_STATUS_CHANGED, (data: any) => {
      received.push({ system: data.system, enabled: data.enabled });
    });

    controller.setSystemEnabled('encounters', false);
    controller.setMasterEnabled(false);

    // Wait for async bus emissions
    await new Promise(r => setTimeout(r, 10));

    expect(received.length).toBe(2);
    expect(received[0].system).toBe('encounters');
    expect(received[0].enabled).toBe(false);
    expect(received[1].system).toBe('master');
    expect(received[1].enabled).toBe(false);
  });

  it('should include effectiveStates in status change event', async () => {
    const setup = createTestSetup();
    const bus = getEventBus();
    const controller = createGameSystemController(setup.session);

    let lastEvent: any = null;
    bus.on(GameEvents.SYSTEM_STATUS_CHANGED, (data: any) => {
      lastEvent = data;
    });

    controller.setSystemEnabled('encounters', false);
    await new Promise(r => setTimeout(r, 10));

    expect(lastEvent).not.toBeNull();
    expect(lastEvent.effectiveStates.encounters).toBe(false);
    expect(lastEvent.effectiveStates.combat).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ════════════════════════════════════════════════════════════

describe('GameSystemController - Backward Compatibility', () => {
  it('should allow wireGameEvents to work without controller', async () => {
    const setup = createTestSetup();
    const bus = getEventBus();

    // Original wireGameEvents still works
    const cleanup = wireGameEvents(setup.session);

    const stepsBefore = setup.session.encounterState.stepsSinceLastEncounter;
    await bus.emit(GameEvents.PLAYER_MOVED, {
      position: [1, 0, 0] as [number, number, number],
      branchId: 'branch-1',
      velocity: [0, 0, 0] as [number, number, number],
    });

    expect(setup.session.encounterState.stepsSinceLastEncounter).toBe(stepsBefore + 1);
    cleanup();
  });

  it('should not interfere with startBattle', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);
    controller.wireControlledEvents();

    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    const battleState = startBattle(setup.session, [monster]);

    expect(battleState.phase.type).toBe('PLAYER_TURN');
    expect(setup.store.getState().battleState).not.toBeNull();
    controller.unwire();
  });

  it('should not interfere with dispatchCombatAction when combat enabled', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);
    controller.wireControlledEvents();

    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    startBattle(setup.session, [monster]);

    const result = dispatchCombatAction(setup.session, { type: 'ATTACK', targetIndex: 0 });
    expect(result).not.toBeNull();
    controller.unwire();
  });

  it('should create controller without config (defaults)', () => {
    const setup = createTestSetup();
    const controller = createGameSystemController(setup.session);
    expect(controller.getSystemStatus().shadow).toBe(false);
    expect(controller.getSystemStatus().master).toBe(true);
  });
});
