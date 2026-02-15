'use client';

import type { AvailableActions } from '@dendrovia/ludus';
import { getSpell } from '@dendrovia/ludus';

interface ActionPanelProps {
  actions: AvailableActions;
  onAttack: () => void;
  onSpell: (spellId: string) => void;
  onDefend: () => void;
  disabled: boolean;
}

const btnBase: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ededed',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'border-color 0.2s',
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  opacity: 0.3,
  cursor: 'not-allowed',
};

export default function ActionPanel({ actions, onAttack, onSpell, onDefend, disabled }: ActionPanelProps) {
  return (
    <div style={{ padding: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
      <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Actions
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          style={disabled || !actions.canAttack ? btnDisabled : { ...btnBase, borderColor: '#EF4444' }}
          onClick={onAttack}
          disabled={disabled || !actions.canAttack}
        >
          Attack
        </button>
        <button
          style={disabled || !actions.canDefend ? btnDisabled : { ...btnBase, borderColor: '#3B82F6' }}
          onClick={onDefend}
          disabled={disabled || !actions.canDefend}
        >
          Defend
        </button>
      </div>

      {actions.availableSpells.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.35rem' }}>Spells</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {actions.availableSpells.map(spellId => {
              const spell = getSpell(spellId);
              if (!spell) return null;
              return (
                <button
                  key={spellId}
                  style={disabled ? btnDisabled : { ...btnBase, borderColor: '#A855F7', fontSize: '0.8rem' }}
                  onClick={() => onSpell(spellId)}
                  disabled={disabled}
                  title={`${spell.description} (${spell.manaCost} MP, CD: ${spell.cooldown})`}
                >
                  {spell.name} <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{spell.manaCost}MP</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
