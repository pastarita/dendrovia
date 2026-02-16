import type { SourceDiagram } from "../types";

export const ludusFixture: SourceDiagram = {
  id: "ludus",
  title: "LUDUS",
  nodes: [
    { id: "ludus-root", label: "LUDUS", kind: "root", status: "implemented", domain: "ludus" },

    // Phase: Character
    { id: "ludus-character", label: "Character", kind: "phase", status: "implemented", domain: "ludus", children: ["ludus-char-system"] },
    { id: "ludus-char-system", label: "CharacterSystem", kind: "section", status: "implemented", domain: "ludus", description: "Character creation and management" },

    // Phase: Combat
    { id: "ludus-combat", label: "Combat", kind: "phase", status: "implemented", domain: "ludus", children: ["ludus-turn-engine", "ludus-combat-math", "ludus-enemy-ai", "ludus-monster", "ludus-status"] },
    { id: "ludus-turn-engine", label: "TurnBasedEngine", kind: "section", status: "implemented", domain: "ludus", description: "Turn-based combat execution" },
    { id: "ludus-combat-math", label: "CombatMath", kind: "section", status: "implemented", domain: "ludus", description: "Damage, defense, hit calculations" },
    { id: "ludus-enemy-ai", label: "EnemyAI", kind: "section", status: "implemented", domain: "ludus", description: "AI decision-making for enemies" },
    { id: "ludus-monster", label: "MonsterFactory", kind: "section", status: "implemented", domain: "ludus", description: "Procedural monster generation" },
    { id: "ludus-status", label: "StatusEffects", kind: "section", status: "implemented", domain: "ludus", description: "Buff/debuff status effect system" },

    // Phase: Quest/Encounter
    { id: "ludus-quest", label: "Quest", kind: "phase", status: "implemented", domain: "ludus", children: ["ludus-quest-gen", "ludus-encounter"] },
    { id: "ludus-quest-gen", label: "QuestGenerator", kind: "section", status: "implemented", domain: "ludus", description: "Procedural quest generation from code metrics" },
    { id: "ludus-encounter", label: "EncounterSystem", kind: "section", status: "implemented", domain: "ludus", description: "Random encounter management" },

    // Phase: Progression
    { id: "ludus-progression", label: "Progression", kind: "phase", status: "implemented", domain: "ludus", children: ["ludus-prog-system", "ludus-spells", "ludus-inventory"] },
    { id: "ludus-prog-system", label: "ProgressionSystem", kind: "section", status: "implemented", domain: "ludus", description: "XP, leveling, and skill trees" },
    { id: "ludus-spells", label: "SpellFactory", kind: "section", status: "implemented", domain: "ludus", description: "Spell creation from code patterns" },
    { id: "ludus-inventory", label: "InventorySystem", kind: "section", status: "implemented", domain: "ludus", description: "Item management" },

    // Phase: Simulation
    { id: "ludus-simulation", label: "Simulation", kind: "phase", status: "implemented", domain: "ludus", children: ["ludus-harness", "ludus-game-store", "ludus-events", "ludus-save", "ludus-balance", "ludus-rng"] },
    { id: "ludus-harness", label: "SimulationHarness", kind: "section", status: "implemented", domain: "ludus", description: "Headless game simulation runner" },
    { id: "ludus-game-store", label: "GameStore", kind: "section", status: "implemented", domain: "ludus", description: "Central game state store" },
    { id: "ludus-events", label: "EventWiring", kind: "section", status: "implemented", domain: "ludus", description: "Game event bus and wiring" },
    { id: "ludus-save", label: "SaveSystem", kind: "section", status: "implemented", domain: "ludus", description: "Save/load game state" },
    { id: "ludus-balance", label: "BalanceConfig", kind: "section", status: "implemented", domain: "ludus", description: "Game balance parameters" },
    { id: "ludus-rng", label: "SeededRandom", kind: "section", status: "implemented", domain: "ludus", description: "Deterministic RNG" },
  ],
  edges: [
    { source: "ludus-root", target: "ludus-character", relation: "pipeline-flow" },
    { source: "ludus-character", target: "ludus-combat", relation: "pipeline-flow" },
    { source: "ludus-character", target: "ludus-quest", relation: "pipeline-flow" },
    { source: "ludus-combat", target: "ludus-progression", relation: "pipeline-flow" },
    { source: "ludus-quest", target: "ludus-progression", relation: "pipeline-flow" },
    { source: "ludus-progression", target: "ludus-simulation", relation: "pipeline-flow" },

    { source: "ludus-character", target: "ludus-char-system", relation: "containment" },
    { source: "ludus-combat", target: "ludus-turn-engine", relation: "containment" },
    { source: "ludus-combat", target: "ludus-combat-math", relation: "containment" },
    { source: "ludus-combat", target: "ludus-enemy-ai", relation: "containment" },
    { source: "ludus-combat", target: "ludus-monster", relation: "containment" },
    { source: "ludus-combat", target: "ludus-status", relation: "containment" },
    { source: "ludus-quest", target: "ludus-quest-gen", relation: "containment" },
    { source: "ludus-quest", target: "ludus-encounter", relation: "containment" },
    { source: "ludus-progression", target: "ludus-prog-system", relation: "containment" },
    { source: "ludus-progression", target: "ludus-spells", relation: "containment" },
    { source: "ludus-progression", target: "ludus-inventory", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-harness", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-game-store", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-events", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-save", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-balance", relation: "containment" },
    { source: "ludus-simulation", target: "ludus-rng", relation: "containment" },
  ],
};
