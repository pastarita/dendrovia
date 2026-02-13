/**
 * LUDUS - The Mechanics
 *
 * Pure game logic. No rendering. Runs headless in Bun/Node.js.
 */

// Core data layer
export * from './utils/SeededRandom.js';
export * from './state/GameStore.js';
export * from './character/CharacterSystem.js';

// Combat engine
export * from './spell/SpellFactory.js';
export * from './combat/CombatMath.js';
export * from './combat/StatusEffects.js';
export * from './combat/MonsterFactory.js';
export * from './combat/EnemyAI.js';
export * from './combat/TurnBasedEngine.js';

// Game systems
export * from './quest/QuestGenerator.js';
export * from './encounter/EncounterSystem.js';
export * from './inventory/InventorySystem.js';
export * from './progression/ProgressionSystem.js';
export * from './integration/EventWiring.js';

// Simulation, save, and config
export * from './simulation/SimulationHarness.js';
export * from './save/SaveSystem.js';
export * from './config/BalanceConfig.js';
