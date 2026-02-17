'use client';

import type { BattleState } from '@dendrovia/shared';
import type { ProgressionSummary } from '../hooks/useProgressionEvents';
import { OrnateFrame, ProgressBar } from '@dendrovia/oculus';

interface VictoryOverlayProps {
  battleState: BattleState;
  progression: ProgressionSummary | null;
  onNewBattle: () => void;
  onRematch: () => void;
  onSave?: () => void;
  saveStatus?: string | null;
}

export default function VictoryOverlay({
  battleState,
  progression,
  onNewBattle,
  onRematch,
  onSave,
  saveStatus,
}: VictoryOverlayProps): React.JSX.Element {
  const isVictory = battleState.phase.type === 'VICTORY';

  return (
    <OrnateFrame
      pillar="ludus"
      variant="modal"
      header={
        <span style={{ color: isVictory ? '#22C55E' : '#EF4444' }}>
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </span>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
          Completed in {battleState.turn} turns
        </div>

        {/* XP Gained */}
        {isVictory && progression && progression.xpGained > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              +{progression.xpGained} XP
            </div>
            <ProgressBar
              value={progression.xpGained}
              max={Math.max(progression.xpGained, 200)}
              variant="custom"
              color="#ffe66d"
              showLabel
              label={`${progression.xpGained} XP earned`}
            />
          </div>
        )}

        {/* Level Up */}
        {progression?.leveledUp && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #22C55E', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22C55E' }}>
              LEVEL UP! Now Level {progression.newLevel}
            </div>
            {Object.entries(progression.statChanges).length > 0 && (
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                {Object.entries(progression.statChanges)
                  .filter(([, v]) => v !== 0)
                  .map(([stat, delta]) => (
                    <span key={stat} style={{ marginRight: '0.5rem' }}>
                      {stat.toUpperCase()} +{delta}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* New Spells */}
        {progression?.newSpells && progression.newSpells.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ opacity: 0.5 }}>New Spells Unlocked:</div>
            {progression.newSpells.map(spell => (
              <div key={spell} style={{ color: '#A855F7' }}>{spell}</div>
            ))}
          </div>
        )}

        {/* Loot */}
        {progression?.lootItems && progression.lootItems.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ opacity: 0.5 }}>Loot:</div>
            {progression.lootItems.map((item, i) => (
              <div key={i} style={{ color: '#F59E0B' }}>{item.name}</div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onNewBattle}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#ededed',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            New Battle
          </button>
          <button
            onClick={onRematch}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--pillar-accent)',
              background: 'transparent',
              color: 'var(--pillar-accent)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Rematch
          </button>
          {isVictory && onSave && (
            <button
              onClick={onSave}
              disabled={saveStatus === 'Saving...'}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: '1px solid #22C55E',
                background: 'transparent',
                color: '#22C55E',
                cursor: saveStatus === 'Saving...' ? 'wait' : 'pointer',
                fontSize: '0.85rem',
                opacity: saveStatus === 'Saving...' ? 0.5 : 1,
              }}
            >
              {saveStatus ?? 'Save Character'}
            </button>
          )}
        </div>
      </div>
    </OrnateFrame>
  );
}
