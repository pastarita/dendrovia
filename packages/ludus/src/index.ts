/**
 * LUDUS - The Mechanics
 *
 * Entry point for pure game logic (no rendering).
 */

export * from './character/CharacterSystem.js';
export * from './spell/SpellFactory.js';
export * from './combat/TurnBasedEngine.js';
export * from './quest/QuestGenerator.js';

console.log('🎮 LUDUS initialized - Ready to run game logic');
