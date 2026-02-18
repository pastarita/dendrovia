'use client';

const EFFECTS = [
  {
    type: 'poison',
    name: 'Poison',
    color: '#22C55E',
    behavior: 'Deals damage at the start of each turn equal to the effect value.',
    stackable: 'No — refreshes duration on re-apply.',
    sources: 'Buffer Overflow, Stack Smash, Cryptominer (DPS spells + monster spells)',
  },
  {
    type: 'regen',
    name: 'Regeneration',
    color: '#4ADE80',
    behavior: 'Restores HP at the start of each turn equal to the effect value.',
    stackable: 'No — refreshes duration on re-apply.',
    sources: 'Patch (Healer HoT), Kubernetes (Tank unlock)',
  },
  {
    type: 'shield',
    name: 'Shield',
    color: '#3B82F6',
    behavior: 'Absorbs incoming damage up to the shield HP value. Removed when depleted or when duration expires.',
    stackable: 'No — new shield replaces old shield.',
    sources: 'Mutex Lock, Firewall, Docker Compose, Terraform, Immutable Infrastructure',
  },
  {
    type: 'stun',
    name: 'Stun',
    color: '#EAB308',
    behavior: 'Target skips their turn entirely. Cannot attack, cast spells, defend, or use items.',
    stackable: 'No — refreshes duration.',
    sources: 'Deadlock, Chaos Monkey (player). System Deadlock (boss spell).',
  },
  {
    type: 'attack-up',
    name: 'Attack Up',
    color: '#F97316',
    behavior: 'Increases effective attack stat by the effect value for the duration.',
    stackable: 'No — refreshes with highest value.',
    sources: 'Privilege Escalation (DPS), Circuit Breaker (Tank), Root Cause Analysis (item), Heap Growth (monster).',
  },
  {
    type: 'attack-down',
    name: 'Attack Down',
    color: '#DC2626',
    behavior: 'Decreases effective attack stat by the effect value for the duration.',
    stackable: 'No — refreshes with highest value.',
    sources: 'Not currently applied by any player spell. Reserved for future use.',
  },
  {
    type: 'defense-up',
    name: 'Defense Up',
    color: '#6366F1',
    behavior: 'Increases effective defense stat by the effect value for the duration.',
    stackable: 'No — refreshes with highest value.',
    sources: 'Defend action (+5 for 1 turn), Code Review (item).',
  },
  {
    type: 'defense-down',
    name: 'Defense Down',
    color: '#A855F7',
    behavior: 'Decreases effective defense stat by the effect value for the duration.',
    stackable: 'No — refreshes with highest value.',
    sources: 'Git Bisect (Healer debuff spell).',
  },
];

export default function StatusEffectReference(): React.JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
      {EFFECTS.map(fx => (
        <div
          key={fx.type}
          style={{
            padding: '1rem',
            border: '1px solid #222',
            borderRadius: '8px',
            background: '#111',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: fx.color,
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fx.name}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.4, fontFamily: 'var(--font-geist-mono)' }}>{fx.type}</span>
          </div>

          <div style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>{fx.behavior}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            <strong>Stackable:</strong> {fx.stackable}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.15rem' }}>
            <strong>Sources:</strong> {fx.sources}
          </div>
        </div>
      ))}
    </div>
  );
}
