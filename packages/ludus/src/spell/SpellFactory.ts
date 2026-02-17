/**
 * Spell Registry & Factory
 *
 * 12 hand-authored starter spells (4 per class) + developer-themed bonus spells.
 * Symbol-driven procedural generation for runtime spell creation.
 */

import type { Element, Spell, SpellSymbol } from '@dendrovia/shared';

// ─── Spell Registry ──────────────────────────────────────────

const REGISTRY = new Map<string, Spell>();

function register(spell: Spell): Spell {
  REGISTRY.set(spell.id, spell);
  return spell;
}

export function getSpell(id: string): Spell | undefined {
  return REGISTRY.get(id);
}

export function getSpellOrThrow(id: string): Spell {
  const spell = REGISTRY.get(id);
  if (!spell) throw new Error(`Unknown spell: ${id}`);
  return spell;
}

export function getAllSpells(): Spell[] {
  return Array.from(REGISTRY.values());
}

// ─── Tank Spells (Infrastructure) ────────────────────────────

register({
  id: 'spell-mutex-lock',
  name: 'Mutex Lock',
  description: 'Acquire a lock, generating a protective shield.',
  manaCost: 10,
  cooldown: 0,
  element: 'earth',
  effect: { type: 'shield', target: 'self', value: 20 },
});

register({
  id: 'spell-load-balancer',
  name: 'Load Balancer',
  description: 'Distribute threat evenly. Forces enemy to target you.',
  manaCost: 15,
  cooldown: 2,
  element: 'none',
  effect: { type: 'taunt', target: 'self', value: 0, duration: 2 },
});

register({
  id: 'spell-firewall',
  name: 'Firewall',
  description: 'Raise a firewall that absorbs incoming damage for the team.',
  manaCost: 20,
  cooldown: 3,
  element: 'fire',
  effect: { type: 'shield', target: 'all-allies', value: 15 },
});

register({
  id: 'spell-deadlock',
  name: 'Deadlock',
  description: 'Lock the enemy in a circular wait. Stuns for 1 turn.',
  manaCost: 25,
  cooldown: 4,
  element: 'earth',
  effect: { type: 'debuff', target: 'enemy', value: 0, duration: 1 },
});

// ─── Healer Spells (Bug Fixer) ──────────────────────────────

register({
  id: 'spell-try-catch',
  name: 'Try-Catch',
  description: 'Wrap the wound in error handling. Restores HP.',
  manaCost: 15,
  cooldown: 0,
  element: 'water',
  effect: { type: 'heal', target: 'self', value: 30 },
});

register({
  id: 'spell-rollback',
  name: 'Rollback',
  description: 'Revert to a previous state. Massive heal.',
  manaCost: 35,
  cooldown: 5,
  element: 'water',
  effect: { type: 'revive', target: 'self', value: 50 },
});

register({
  id: 'spell-garbage-collect',
  name: 'Garbage Collect',
  description: 'Clean up all status ailments.',
  manaCost: 20,
  cooldown: 3,
  element: 'air',
  effect: { type: 'cleanse', target: 'self', value: 0 },
});

register({
  id: 'spell-patch',
  name: 'Patch',
  description: 'Apply a quick fix. Heal over time.',
  manaCost: 12,
  cooldown: 1,
  element: 'water',
  effect: { type: 'heal', target: 'self', value: 10, duration: 3 },
});

// ─── DPS Spells (Feature Developer) ─────────────────────────

register({
  id: 'spell-sql-injection',
  name: 'SQL Injection',
  description: 'Inject malicious queries directly into the target.',
  manaCost: 20,
  cooldown: 0,
  element: 'fire',
  effect: { type: 'damage', target: 'enemy', value: 40 },
});

register({
  id: 'spell-fork-bomb',
  name: 'Fork Bomb',
  description: 'Spawn infinite processes. Damages all enemies.',
  manaCost: 30,
  cooldown: 3,
  element: 'fire',
  effect: { type: 'aoe-damage', target: 'all-enemies', value: 25 },
});

register({
  id: 'spell-buffer-overflow',
  name: 'Buffer Overflow',
  description: 'Write past the boundary. Poison damage over time.',
  manaCost: 18,
  cooldown: 2,
  element: 'earth',
  effect: { type: 'dot', target: 'enemy', value: 12, duration: 3 },
});

register({
  id: 'spell-regex-nuke',
  name: 'Regex Nuke',
  description: 'Catastrophic backtracking obliterates the target.',
  manaCost: 40,
  cooldown: 5,
  element: 'air',
  effect: { type: 'damage', target: 'enemy', value: 65 },
});

// ─── Developer-Themed Bonus Spells ──────────────────────────
// Unlocked at higher levels via CharacterSystem

register({
  id: 'spell-docker-compose',
  name: 'Docker Compose',
  description: 'Orchestrate a multi-container defense.',
  manaCost: 30,
  cooldown: 4,
  element: 'earth',
  effect: { type: 'shield', target: 'self', value: 40 },
});

register({
  id: 'spell-kubernetes',
  name: 'Kubernetes',
  description: 'Self-healing infrastructure. Regen over time.',
  manaCost: 25,
  cooldown: 4,
  element: 'water',
  effect: { type: 'heal', target: 'self', value: 15, duration: 4 },
});

register({
  id: 'spell-terraform',
  name: 'Terraform',
  description: 'Infrastructure as code. Massive shield.',
  manaCost: 35,
  cooldown: 5,
  element: 'earth',
  effect: { type: 'shield', target: 'self', value: 55 },
});

register({
  id: 'spell-circuit-breaker',
  name: 'Circuit Breaker',
  description: 'Stop cascading failures. Reduces incoming damage.',
  manaCost: 20,
  cooldown: 3,
  element: 'none',
  effect: { type: 'buff', target: 'self', value: 5, duration: 3 },
});

register({
  id: 'spell-chaos-monkey',
  name: 'Chaos Monkey',
  description: 'Randomly disable enemy abilities.',
  manaCost: 30,
  cooldown: 4,
  element: 'air',
  effect: { type: 'debuff', target: 'enemy', value: 0, duration: 2 },
});

register({
  id: 'spell-immutable-infra',
  name: 'Immutable Infrastructure',
  description: 'Nothing can be changed. Ultimate defense.',
  manaCost: 45,
  cooldown: 6,
  element: 'earth',
  effect: { type: 'shield', target: 'self', value: 80 },
});

register({
  id: 'spell-lint-fix',
  name: 'Lint Fix',
  description: 'Auto-fix minor issues. Small heal.',
  manaCost: 8,
  cooldown: 0,
  element: 'air',
  effect: { type: 'heal', target: 'self', value: 15 },
});

register({
  id: 'spell-bisect',
  name: 'Git Bisect',
  description: 'Binary search for the root cause. Reveals enemy weakness.',
  manaCost: 15,
  cooldown: 3,
  element: 'none',
  effect: { type: 'debuff', target: 'enemy', value: 3, duration: 3 },
});

register({
  id: 'spell-hot-reload',
  name: 'Hot Reload',
  description: 'Swap code without restart. Instant heal burst.',
  manaCost: 25,
  cooldown: 3,
  element: 'fire',
  effect: { type: 'heal', target: 'self', value: 45 },
});

register({
  id: 'spell-snapshot-restore',
  name: 'Snapshot Restore',
  description: 'Restore from a saved snapshot. Full cleanse + heal.',
  manaCost: 40,
  cooldown: 5,
  element: 'water',
  effect: { type: 'heal', target: 'self', value: 60 },
});

register({
  id: 'spell-time-travel-debug',
  name: 'Time-Travel Debug',
  description: 'Step back through execution. Revive with half HP.',
  manaCost: 50,
  cooldown: 8,
  element: 'air',
  effect: { type: 'revive', target: 'self', value: 50 },
});

register({
  id: 'spell-formal-verification',
  name: 'Formal Verification',
  description: 'Mathematically prove correctness. Full heal.',
  manaCost: 60,
  cooldown: 10,
  element: 'none',
  effect: { type: 'heal', target: 'self', value: 100 },
});

register({
  id: 'spell-zero-day',
  name: 'Zero Day',
  description: 'Exploit an unknown vulnerability.',
  manaCost: 22,
  cooldown: 2,
  element: 'fire',
  effect: { type: 'damage', target: 'enemy', value: 45 },
});

register({
  id: 'spell-privilege-escalation',
  name: 'Privilege Escalation',
  description: 'Gain elevated access. Buff attack power.',
  manaCost: 18,
  cooldown: 3,
  element: 'none',
  effect: { type: 'buff', target: 'self', value: 5, duration: 3 },
});

register({
  id: 'spell-ddos',
  name: 'DDoS',
  description: 'Overwhelm with requests. AoE damage.',
  manaCost: 35,
  cooldown: 4,
  element: 'air',
  effect: { type: 'aoe-damage', target: 'all-enemies', value: 35 },
});

register({
  id: 'spell-cryptominer',
  name: 'Cryptominer',
  description: 'Steal CPU cycles. Damage + drain.',
  manaCost: 25,
  cooldown: 3,
  element: 'earth',
  effect: { type: 'dot', target: 'enemy', value: 18, duration: 3 },
});

register({
  id: 'spell-rootkit',
  name: 'Rootkit',
  description: 'Deep system compromise. Heavy single-target damage.',
  manaCost: 45,
  cooldown: 5,
  element: 'fire',
  effect: { type: 'damage', target: 'enemy', value: 75 },
});

register({
  id: 'spell-quantum-crack',
  name: 'Quantum Crack',
  description: 'Break all encryption simultaneously. Ultimate damage.',
  manaCost: 60,
  cooldown: 8,
  element: 'air',
  effect: { type: 'damage', target: 'enemy', value: 100 },
});

// ─── Monster Spells ─────────────────────────────────────────

register({
  id: 'spell-null-deref',
  name: 'Null Dereference',
  description: 'Access nothing. Deals damage.',
  manaCost: 0,
  cooldown: 0,
  element: 'none',
  effect: { type: 'damage', target: 'enemy', value: 15 },
});

register({
  id: 'spell-heap-grow',
  name: 'Heap Growth',
  description: 'Memory expands. Monster gets stronger.',
  manaCost: 0,
  cooldown: 2,
  element: 'earth',
  effect: { type: 'buff', target: 'self', value: 3, duration: 99 },
});

register({
  id: 'spell-thread-swap',
  name: 'Thread Swap',
  description: 'Context switch at the worst time. Double attack.',
  manaCost: 0,
  cooldown: 2,
  element: 'air',
  effect: { type: 'damage', target: 'enemy', value: 20 },
});

register({
  id: 'spell-fence-post',
  name: 'Fence Post',
  description: 'Off by one. Sometimes hits, sometimes misses.',
  manaCost: 0,
  cooldown: 0,
  element: 'none',
  effect: { type: 'damage', target: 'enemy', value: 18 },
});

register({
  id: 'spell-segfault',
  name: 'Segfault',
  description: 'Illegal memory access. Heavy damage.',
  manaCost: 0,
  cooldown: 3,
  element: 'earth',
  effect: { type: 'damage', target: 'enemy', value: 35 },
});

register({
  id: 'spell-oom-kill',
  name: 'OOM Killer',
  description: 'Out of memory. Kills the largest process.',
  manaCost: 0,
  cooldown: 4,
  element: 'earth',
  effect: { type: 'damage', target: 'enemy', value: 50 },
});

register({
  id: 'spell-deadlock-boss',
  name: 'System Deadlock',
  description: 'All threads locked. Stun.',
  manaCost: 0,
  cooldown: 5,
  element: 'earth',
  effect: { type: 'debuff', target: 'enemy', value: 0, duration: 1 },
});

register({
  id: 'spell-stack-smash',
  name: 'Stack Smash',
  description: 'Corrupt the call stack. Damages and poisons.',
  manaCost: 0,
  cooldown: 3,
  element: 'fire',
  effect: { type: 'dot', target: 'enemy', value: 10, duration: 3 },
});

// ─── Symbol-Driven Spell Generation ─────────────────────────

const _BASE_EFFECTS: Record<SpellSymbol['shape'], SpellSymbol['shape'] extends 'circle' ? 'heal' : string> = {
  circle: 'heal',
  triangle: 'damage',
  square: 'shield',
  star: 'buff',
} as any;

const SHAPE_TO_EFFECT: Record<string, SpellEffect['type']> = {
  circle: 'heal',
  triangle: 'damage',
  square: 'shield',
  star: 'buff',
};

const SHAPE_TO_TARGET: Record<string, SpellEffect['target']> = {
  circle: 'self',
  triangle: 'enemy',
  square: 'self',
  star: 'self',
};

const POWER_MULTIPLIERS: Record<Element, number> = {
  fire: 1.5,
  water: 1.0,
  earth: 1.2,
  air: 0.8,
  none: 1.0,
};

const COST_MODIFIERS: Record<SpellSymbol['modifier'], number> = {
  swift: 0.8,
  heavy: 1.5,
  precise: 1.2,
  chaotic: 0.9,
};

let generatedSpellCounter = 0;

export function generateSpell(symbol: SpellSymbol): Spell {
  const id = `spell-gen-${++generatedSpellCounter}`;
  const name = `${capitalize(symbol.modifier)} ${capitalize(symbol.element)} ${capitalize(symbol.shape)}`;
  const basePower = 20;
  const power = Math.floor(basePower * POWER_MULTIPLIERS[symbol.element]);
  const cost = Math.floor(15 * COST_MODIFIERS[symbol.modifier]);

  return {
    id,
    name,
    description: `A ${symbol.modifier} ${symbol.element}-aspected ${symbol.shape} spell.`,
    manaCost: cost,
    cooldown: symbol.modifier === 'heavy' ? 2 : symbol.modifier === 'swift' ? 0 : 1,
    element: symbol.element,
    effect: {
      type: SHAPE_TO_EFFECT[symbol.shape],
      target: SHAPE_TO_TARGET[symbol.shape],
      value: power,
    },
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
