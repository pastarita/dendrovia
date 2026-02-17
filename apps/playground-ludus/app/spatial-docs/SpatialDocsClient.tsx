'use client';

import { GameEvents } from '@dendrovia/shared';

const sectionStyle: React.CSSProperties = {
  padding: '1.25rem',
  border: '1px solid #222',
  borderRadius: '8px',
  background: '#111',
  marginBottom: '1.5rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.4rem 0.6rem',
  borderBottom: '1px solid #333',
  fontSize: '0.7rem',
  opacity: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '0.35rem 0.6rem',
  fontSize: '0.8rem',
  borderBottom: '1px solid #1a1a1a',
};

const monoTd: React.CSSProperties = {
  ...tdStyle,
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '0.75rem',
};

type EventMeta = { direction: 'input' | 'output'; payload: string; description: string };

const EVENT_META: Record<string, EventMeta> = {
  // Spatial Input Events (ARCHITECTUS → LUDUS)
  PLAYER_MOVED: {
    direction: 'input',
    payload: 'PlayerMovedEvent',
    description: 'Player navigated to a new position in the 3D scene',
  },
  NODE_CLICKED: {
    direction: 'input',
    payload: 'NodeClickedEvent',
    description: 'Player clicked on a code node in the tree',
  },
  COLLISION_DETECTED: {
    direction: 'input',
    payload: 'CollisionDetectedEvent',
    description: 'Player collided with an entity or boundary',
  },
  BRANCH_ENTERED: {
    direction: 'input',
    payload: 'BranchEnteredEvent',
    description: 'Player entered a new git branch region',
  },
  // Combat Output Events (LUDUS → OCULUS/ARCHITECTUS)
  ENCOUNTER_TRIGGERED: {
    direction: 'output',
    payload: 'EncounterTriggeredEvent',
    description: 'A monster encounter was triggered by navigation',
  },
  COMBAT_STARTED: {
    direction: 'output',
    payload: 'CombatStartedEvent',
    description: 'Battle has begun — display combat HUD',
  },
  COMBAT_ENDED: {
    direction: 'output',
    payload: 'CombatEndedEvent',
    description: 'Battle resolved — show victory/defeat screen',
  },
  COMBAT_TURN_START: {
    direction: 'output',
    payload: 'CombatTurnEvent',
    description: 'New turn started (player or enemy phase)',
  },
  COMBAT_TURN_END: { direction: 'output', payload: 'CombatTurnEvent', description: 'Turn completed' },
  HEALTH_CHANGED: {
    direction: 'output',
    payload: 'HealthChangedEvent',
    description: 'HP changed for any entity (player or monster)',
  },
  MANA_CHANGED: {
    direction: 'output',
    payload: 'ManaChangedEvent',
    description: 'Mana changed for the player character',
  },
  SPELL_RESOLVED: {
    direction: 'output',
    payload: 'SpellResolvedEvent',
    description: 'A spell effect was applied (damage, heal, buff, etc.)',
  },
  STATUS_EFFECT_APPLIED: {
    direction: 'output',
    payload: 'StatusEffectEvent',
    description: 'A status effect was applied to an entity',
  },
  STATUS_EFFECT_EXPIRED: {
    direction: 'output',
    payload: 'StatusEffectEvent',
    description: 'A status effect expired on an entity',
  },
  DAMAGE_DEALT: {
    direction: 'output',
    payload: 'DamageDealtEvent',
    description: 'Damage was dealt — trigger visual feedback',
  },
  EXPERIENCE_GAINED: {
    direction: 'output',
    payload: 'ExperienceGainedEvent',
    description: 'XP was awarded after combat',
  },
  LEVEL_UP: { direction: 'output', payload: 'LevelUpEvent', description: 'Character leveled up — show celebration' },
  LOOT_DROPPED: {
    direction: 'output',
    payload: 'LootDroppedEvent',
    description: 'Loot items were obtained from defeated monsters',
  },
  QUEST_UPDATED: {
    direction: 'output',
    payload: 'QuestUpdatedEvent',
    description: 'Quest status changed (started, progressed, completed)',
  },
  // User Actions (OCULUS → LUDUS)
  SPELL_CAST: {
    direction: 'input',
    payload: 'SpellCastEvent',
    description: 'User initiated a spell cast from the combat HUD',
  },
  ITEM_USED: { direction: 'input', payload: 'ItemUsedEvent', description: 'User consumed an item from inventory' },
};

const EVENT_CATALOG = Object.entries(GameEvents)
  .filter(([key]) => key in EVENT_META)
  .map(([constant, value]) => {
    const meta = EVENT_META[constant]!;
    return { constant, value, direction: meta.direction, payload: meta.payload, description: meta.description };
  });

const SPATIAL_INPUTS = EVENT_CATALOG.filter((e) =>
  ['PLAYER_MOVED', 'NODE_CLICKED', 'COLLISION_DETECTED', 'BRANCH_ENTERED'].includes(e.constant),
);
const COMBAT_OUTPUTS = EVENT_CATALOG.filter((e) => e.direction === 'output');
const _USER_ACTIONS = EVENT_CATALOG.filter((e) => ['SPELL_CAST', 'ITEM_USED'].includes(e.constant));

const MODULES = [
  {
    module: 'CharacterSystem',
    file: 'character/CharacterSystem.ts',
    exports: 'createCharacter, computeStatsAtLevel, gainExperience, BASE_STATS, GROWTH_RATES',
    desc: 'Character factory, stat computation, XP/level progression',
  },
  {
    module: 'TurnBasedEngine',
    file: 'combat/TurnBasedEngine.ts',
    exports: 'initBattle, executeTurn, getAvailableActions',
    desc: 'Pure reducer for turn-based combat resolution',
  },
  {
    module: 'CombatMath',
    file: 'combat/CombatMath.ts',
    exports: 'calculateDamage, calculateHealing, calculateShield, ELEMENT_TABLE',
    desc: 'Damage/heal/shield formulas and element effectiveness',
  },
  {
    module: 'SpellFactory',
    file: 'spell/SpellFactory.ts',
    exports: 'generateSpell, getAllSpells, getSpell',
    desc: 'Spell registry and symbol-driven procedural generation',
  },
  {
    module: 'MonsterFactory',
    file: 'combat/MonsterFactory.ts',
    exports: 'createMonster, generateBoss, generateMiniboss, generateBugMonster',
    desc: 'Monster creation with type/severity/complexity scaling',
  },
  {
    module: 'StatusEffects',
    file: 'combat/StatusEffects.ts',
    exports: 'tickStatusEffects, absorbDamage, createStatusEffect',
    desc: 'Per-turn effect processing, shield absorption, stat modifiers',
  },
  {
    module: 'EnemyAI',
    file: 'combat/EnemyAI.ts',
    exports: 'chooseEnemyAction, resolveEnemySpell',
    desc: 'Type-specific AI behavior for each bug type + boss phases',
  },
  {
    module: 'QuestGenerator',
    file: 'quest/QuestGenerator.ts',
    exports: 'generateQuestGraph, generateBugHuntQuests, generateArchaeologyQuests',
    desc: 'Converts CHRONOS commits/files into quest DAGs',
  },
  {
    module: 'EncounterSystem',
    file: 'encounter/EncounterSystem.ts',
    exports: 'checkEncounter, scanAllEncounters, getEncounterDensity',
    desc: 'Spatial navigation triggers for combat encounters',
  },
  {
    module: 'InventorySystem',
    file: 'inventory/InventorySystem.ts',
    exports: 'getAllItems, useItem, resolveLoot, addItem',
    desc: 'Item registry, usage effects, loot resolution',
  },
  {
    module: 'ProgressionSystem',
    file: 'progression/ProgressionSystem.ts',
    exports: 'resolveBattleRewards, applyBattleRewards, createBattleStatistics',
    desc: 'Post-combat XP/loot pipeline and statistics tracking',
  },
  {
    module: 'SimulationHarness',
    file: 'simulation/SimulationHarness.ts',
    exports: 'simulateBattle, simulateMatchup, runFullSimulation',
    desc: 'Monte Carlo balance testing (1000+ trials per matchup)',
  },
  {
    module: 'BalanceConfig',
    file: 'config/BalanceConfig.ts',
    exports: 'DEFAULT_BALANCE_CONFIG, EASY_CONFIG, HARD_CONFIG',
    desc: 'All tuning knobs: damage, XP, monster scaling, encounter rates',
  },
  {
    module: 'SeededRandom',
    file: 'utils/SeededRandom.ts',
    exports: 'createRngState, rngNext, rngRange, rngChance',
    desc: 'sfc32 PRNG for deterministic replay (zero Math.random())',
  },
  {
    module: 'SaveSystem',
    file: 'save/SaveSystem.ts',
    exports: 'saveGame, loadGame, createSaveSlot',
    desc: 'Game state serialization and persistence',
  },
  {
    module: 'EventWiring',
    file: 'integration/EventWiring.ts',
    exports: 'wireLudusEvents',
    desc: 'Connects LUDUS systems to the shared EventBus',
  },
];

const DIRECTION_COLORS: Record<string, string> = {
  input: '#3B82F6',
  output: '#22C55E',
};

export default function SpatialDocsClient(): React.JSX.Element {
  return (
    <div>
      {/* 1. Event System Overview */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Event System</h2>
        <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>
          All inter-pillar communication flows through{' '}
          <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>GameEvents</code>{' '}
          constants on the shared{' '}
          <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>EventBus</code>. LUDUS
          listens for spatial input events and emits combat/progression output events.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Constant</th>
                <th style={thStyle}>Event String</th>
                <th style={thStyle}>Dir</th>
                <th style={thStyle}>Payload Type</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_CATALOG.map((ev) => (
                <tr key={ev.constant}>
                  <td style={monoTd}>{ev.constant}</td>
                  <td style={{ ...monoTd, opacity: 0.5 }}>{ev.value}</td>
                  <td style={tdStyle}>
                    <span style={{ color: DIRECTION_COLORS[ev.direction], fontSize: '0.7rem', fontWeight: 700 }}>
                      {ev.direction}
                    </span>
                  </td>
                  <td style={monoTd}>{ev.payload}</td>
                  <td style={{ ...tdStyle, opacity: 0.6 }}>{ev.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Spatial Input Events */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Spatial Input Events</h2>
        <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>
          Emitted by ARCHITECTUS when the player navigates the 3D code world. LUDUS listens to these to trigger
          encounters and quest checks.
        </div>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {SPATIAL_INPUTS.map((ev) => (
            <div
              key={ev.constant}
              style={{ padding: '0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#0a0a0a' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.15rem',
                }}
              >
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {ev.constant}
                </span>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', opacity: 0.4 }}>
                  &quot;{ev.value}&quot;
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.25rem' }}>{ev.description}</div>
              <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', opacity: 0.4 }}>
                Payload: {ev.payload}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Combat Output Events */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Combat Output Events</h2>
        <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>
          Emitted by LUDUS during combat. OCULUS listens for HUD updates; ARCHITECTUS listens for visual feedback
          (damage numbers, spell effects).
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
          {COMBAT_OUTPUTS.map((ev) => (
            <div
              key={ev.constant}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #222',
                borderRadius: '6px',
                background: '#0a0a0a',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  marginBottom: '0.1rem',
                }}
              >
                {ev.constant}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{ev.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Cross-Pillar Integration */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>Cross-Pillar Integration</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ padding: '0.75rem', border: '1px solid #3B82F6', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#3B82F6', marginBottom: '0.25rem' }}>ARCHITECTUS</div>
            <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Emits spatial events</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem' }}>
              player:moved, node:clicked, collision:detected, branch:entered
            </div>
          </div>
          <div
            style={{
              padding: '0.75rem',
              border: '1px solid var(--pillar-accent)',
              borderRadius: '6px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--pillar-accent)', marginBottom: '0.25rem' }}>LUDUS</div>
            <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Processes game logic</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem' }}>
              encounter check &rarr; combat &rarr; rewards &rarr; progression
            </div>
          </div>
          <div style={{ padding: '0.75rem', border: '1px solid #22C55E', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#22C55E', marginBottom: '0.25rem' }}>OCULUS</div>
            <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>Renders UI updates</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem' }}>
              health bars, combat HUD, quest log, victory screen
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            fontSize: '0.7rem',
            opacity: 0.3,
            marginTop: '0.5rem',
          }}
        >
          <span>&rarr; spatial events &rarr;</span>
          <span>&rarr; game state events &rarr;</span>
        </div>
      </div>

      {/* 5. LUDUS Module Map */}
      <div style={sectionStyle}>
        <h2 style={headingStyle}>LUDUS Module Map</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Module</th>
                <th style={thStyle}>File</th>
                <th style={thStyle}>Key Exports</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod.module}>
                  <td style={{ ...monoTd, fontWeight: 600 }}>{mod.module}</td>
                  <td style={{ ...monoTd, opacity: 0.5 }}>{mod.file}</td>
                  <td style={{ ...monoTd, opacity: 0.6, maxWidth: '300px' }}>{mod.exports}</td>
                  <td style={{ ...tdStyle, opacity: 0.6 }}>{mod.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
