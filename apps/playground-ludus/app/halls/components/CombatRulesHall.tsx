'use client';

const sectionStyle: React.CSSProperties = {
  padding: '1.25rem',
  border: '1px solid #222',
  borderRadius: '8px',
  background: '#111',
  marginBottom: '1rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
};

const listStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  lineHeight: 1.8,
  paddingLeft: '1.25rem',
  margin: 0,
};

export default function CombatRulesHall() {
  return (
    <div>
      {/* Battle Phases */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Battle Phases</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
          <span style={{ padding: '0.3rem 0.6rem', background: '#1a3a1a', border: '1px solid #333', borderRadius: '4px' }}>PLAYER_TURN</span>
          <span style={{ opacity: 0.4 }}>&rarr;</span>
          <span style={{ padding: '0.3rem 0.6rem', background: '#3a1a1a', border: '1px solid #333', borderRadius: '4px' }}>ENEMY_TURN</span>
          <span style={{ opacity: 0.4 }}>&rarr;</span>
          <span style={{ opacity: 0.4 }}>(loop)</span>
          <span style={{ opacity: 0.4 }}>&rarr;</span>
          <span style={{ padding: '0.3rem 0.6rem', background: '#1a3a1a', border: '1px solid var(--pillar-accent)', borderRadius: '4px', color: 'var(--pillar-accent)' }}>VICTORY</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ padding: '0.3rem 0.6rem', background: '#3a1a1a', border: '1px solid #EF4444', borderRadius: '4px', color: '#EF4444' }}>DEFEAT</span>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
          Each turn: player acts first, then all enemies act. Status effects tick at the start of each entity&apos;s turn.
          Victory when all enemies reach 0 HP. Defeat when the player reaches 0 HP.
        </div>
      </div>

      {/* Available Actions */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Available Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {[
            { name: 'Attack', key: 'ATTACK', desc: 'Basic physical attack against a target. No mana cost. Uses ATK vs DEF. Element: none.' },
            { name: 'Cast Spell', key: 'CAST_SPELL', desc: 'Use a learned spell. Costs mana. Subject to cooldown. Uses spell power + ATK vs DEF with element multipliers.' },
            { name: 'Defend', key: 'DEFEND', desc: 'Raise guard. Grants +5 DEF for 1 turn (defense-up status effect). No mana cost. No cooldown.' },
            { name: 'Use Item', key: 'USE_ITEM', desc: 'Consume an item from inventory. Heals HP/mana, buffs stats, or cleanses debuffs. No cooldown.' },
          ].map(action => (
            <div key={action.key} style={{ padding: '0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#0a0a0a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{action.name}</span>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.65rem', opacity: 0.4 }}>{action.key}</span>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{action.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cooldown System */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Cooldown System</div>
        <ul style={listStyle}>
          <li>Each spell has a <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>cooldown</code> value (in turns).</li>
          <li>After casting, the spell cannot be reused for that many turns.</li>
          <li>Cooldowns are tracked per-spell in the character&apos;s <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>cooldowns</code> map.</li>
          <li>Cooldown decrements by 1 at the start of each player turn.</li>
          <li>Spells with cooldown 0 can be cast every turn (limited only by mana).</li>
        </ul>
      </div>

      {/* Status Effects */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Status Effects</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
          {[
            { type: 'poison', color: '#22C55E', desc: 'Deals X damage per turn' },
            { type: 'regen', color: '#4ADE80', desc: 'Heals X HP per turn' },
            { type: 'shield', color: '#3B82F6', desc: 'Absorbs X damage, removed when depleted' },
            { type: 'stun', color: '#EAB308', desc: 'Skip turn entirely' },
            { type: 'attack-up', color: '#F97316', desc: '+X to effective ATK' },
            { type: 'attack-down', color: '#DC2626', desc: '-X from effective ATK' },
            { type: 'defense-up', color: '#6366F1', desc: '+X to effective DEF' },
            { type: 'defense-down', color: '#A855F7', desc: '-X from effective DEF' },
          ].map(fx => (
            <div key={fx.type} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: fx.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-geist-mono)', minWidth: '90px' }}>{fx.type}</span>
              <span style={{ opacity: 0.6 }}>{fx.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.75rem' }}>
          <strong>Stacking:</strong> Effects do not stack. Re-applying refreshes duration (or takes the highest value for stat mods).
          <br />
          <strong>Tick order:</strong> Effects tick at the start of the affected entity&apos;s turn, then duration decrements. Expired effects are removed.
        </div>
      </div>

      {/* Defend Action */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Defend Action Details</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          Using Defend applies a <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>defense-up</code> status effect with value +5 and duration 1 turn.
          This effectively increases the character&apos;s DEF stat by 5 for the enemy&apos;s next attack, then expires.
        </div>
      </div>
    </div>
  );
}
