/**
 * LUDUS - The Mechanics
 *
 * Pure game logic. No rendering. Runs headless in Bun/Node.js.
 */

// Core data layer
export * from './utils/SeededRandom';
export * from './state/GameStore';
export * from './character/CharacterSystem';

// Combat engine
export * from './spell/SpellFactory';
export * from './combat/CombatMath';
export * from './combat/StatusEffects';
export * from './combat/MonsterFactory';
export * from './combat/EnemyAI';
export * from './combat/TurnBasedEngine';

// Game systems
export * from './quest/QuestGenerator';
export * from './encounter/EncounterSystem';
export * from './inventory/InventorySystem';
export * from './progression/ProgressionSystem';
export * from './integration/EventWiring';

// Simulation, save, and config
export * from './simulation/SimulationHarness';
export * from './save/SaveSystem';
export * from './config/BalanceConfig';
