'use client';

import type { BalanceConfig } from '@dendrovia/ludus';

interface ConfigSlidersProps {
  config: BalanceConfig;
  onChange: (section: string, key: string, value: number) => void;
}

interface SliderDef {
  section: string;
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  // Damage
  { section: 'damage', key: 'defenseConstant', label: 'Defense Constant', min: 5, max: 50, step: 1 },
  { section: 'damage', key: 'baseCritChance', label: 'Base Crit Chance', min: 0, max: 0.3, step: 0.01 },
  { section: 'damage', key: 'critMultiplier', label: 'Crit Multiplier', min: 1, max: 3, step: 0.1 },
  { section: 'damage', key: 'minDamage', label: 'Min Damage', min: 0, max: 10, step: 1 },
  // Combat
  { section: 'combat', key: 'defendDefenseBonus', label: 'Defend Bonus', min: 0, max: 20, step: 1 },
  { section: 'combat', key: 'healAttackRatio', label: 'Heal/ATK Ratio', min: 0, max: 1.5, step: 0.1 },
  { section: 'combat', key: 'shieldDefenseRatio', label: 'Shield/DEF Ratio', min: 0, max: 1.5, step: 0.1 },
  // Monsters
  { section: 'monsters', key: 'severityStep', label: 'Severity Step', min: 0.1, max: 1.0, step: 0.05 },
  { section: 'monsters', key: 'complexityStep', label: 'Complexity Step', min: 0, max: 0.5, step: 0.05 },
];

function getNestedValue(config: BalanceConfig, section: string, key: string): number {
  const s = config[section as keyof BalanceConfig];
  if (typeof s === 'object' && s !== null) {
    return (s as Record<string, number>)[key] ?? 0;
  }
  return 0;
}

const sliderInputStyle: React.CSSProperties = {
  width: '100%',
  accentColor: 'var(--pillar-accent)',
};

export default function ConfigSliders({ config, onChange }: ConfigSlidersProps) {
  // Group sliders by section
  const sections = SLIDERS.reduce<Record<string, SliderDef[]>>((acc, s) => {
    if (!acc[s.section]) acc[s.section] = [];
    acc[s.section].push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Object.entries(sections).map(([section, sliders]) => (
        <div key={section} style={{ padding: '0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#111' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            {section}
          </div>
          {sliders.map(slider => {
            const value = getNestedValue(config, slider.section, slider.key);
            return (
              <div key={slider.key} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
                  <span style={{ opacity: 0.7 }}>{slider.label}</span>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', opacity: 0.8 }}>
                    {slider.step < 1 ? value.toFixed(2) : value}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={value}
                  onChange={e => onChange(slider.section, slider.key, Number(e.target.value))}
                  style={sliderInputStyle}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
