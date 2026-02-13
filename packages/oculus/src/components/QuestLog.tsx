/**
 * QuestLog — Compact tracker + full overlay
 *
 * Two modes:
 * (a) Compact: shows active quest + progress in HUD corner
 * (b) Full: expandable overlay listing all quests
 */

import React, { useState, useCallback } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import type { Quest } from '@dendrovia/shared';
import { Panel } from './primitives/Panel';
import { ProgressBar } from './primitives/ProgressBar';
import { IconBadge } from './primitives/IconBadge';

const questIcons: Record<string, string> = {
  'bug-hunt': '\u{1F41B}',
  refactor: '\u{1F527}',
  feature: '\u{2B50}',
  archaeology: '\u{1F4DC}',
};

const questColors: Record<string, string> = {
  'bug-hunt': 'var(--oculus-quest-bug)',
  refactor: 'var(--oculus-quest-refactor)',
  feature: 'var(--oculus-quest-feature)',
  archaeology: 'var(--oculus-quest-archaeology)',
};

const statusIcons: Record<string, string> = {
  locked: '\u{1F512}',
  available: '\u{2728}',
  active: '\u{25B6}',
  completed: '\u{2705}',
};

function QuestItem({ quest, expanded, onToggle }: {
  quest: Quest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const icon = questIcons[quest.type] || '\u{2753}';
  const color = questColors[quest.type] || 'var(--oculus-amber)';
  const isLocked = quest.status === 'locked';

  return (
    <div
      className="oculus-quest-item"
      style={{
        opacity: isLocked ? 0.5 : 1,
        marginBottom: 'var(--oculus-space-sm)',
      }}
      role="listitem"
    >
      <button
        className="oculus-button"
        onClick={onToggle}
        disabled={isLocked}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--oculus-space-sm)',
          textAlign: 'left',
          borderColor: quest.status === 'active' ? color : undefined,
          background: quest.status === 'active' ? `color-mix(in srgb, ${color} 10%, transparent)` : undefined,
        }}
      >
        <IconBadge icon={icon} color={color} size="sm" />
        <span style={{ flex: 1, fontSize: 'var(--oculus-font-sm)' }}>
          {quest.title}
        </span>
        <span style={{ fontSize: 'var(--oculus-font-xs)' }}>
          {statusIcons[quest.status]}
        </span>
      </button>

      {expanded && !isLocked && (
        <div
          style={{
            padding: 'var(--oculus-space-sm) var(--oculus-space-md)',
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
            animation: 'oculus-slide-up var(--oculus-transition-fast)',
          }}
        >
          <p style={{ marginBottom: 'var(--oculus-space-sm)' }}>{quest.description}</p>

          {/* Requirements */}
          {quest.requirements.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {quest.requirements.map((req, i) => (
                <li key={i} style={{ lineHeight: 1.8 }}>
                  {req}
                </li>
              ))}
            </ul>
          )}

          {/* Rewards */}
          {quest.rewards.length > 0 && (
            <div style={{ marginTop: 'var(--oculus-space-sm)', color: 'var(--oculus-xp)' }}>
              Rewards: {quest.rewards.map((r) =>
                r.type === 'experience' ? `${r.value} XP` : String(r.value)
              ).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QuestLog() {
  const quests = useOculusStore((s) => s.quests);
  const activeQuest = useOculusStore((s) => s.activeQuest);
  const activePanel = useOculusStore((s) => s.activePanel);
  const togglePanel = useOculusStore((s) => s.togglePanel);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isExpanded = activePanel === 'quest-log';

  const handleToggle = useCallback(() => {
    togglePanel('quest-log');
  }, [togglePanel]);

  // ── Compact Tracker (default) ──────────────────
  if (!isExpanded) {
    return (
      <Panel compact className="oculus-quest-tracker" aria-label="Active quest">
        <button
          className="oculus-button"
          onClick={handleToggle}
          style={{ width: '100%', textAlign: 'left', marginBottom: activeQuest ? 'var(--oculus-space-xs)' : 0 }}
          aria-label="Open quest log"
        >
          <span className="oculus-heading" style={{ margin: 0 }}>Quests</span>
        </button>

        {activeQuest && (
          <div style={{ fontSize: 'var(--oculus-font-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--oculus-space-xs)', marginBottom: 2 }}>
              <IconBadge
                icon={questIcons[activeQuest.type] || '\u{2753}'}
                color={questColors[activeQuest.type]}
                size="sm"
              />
              <span>{activeQuest.title}</span>
            </div>
          </div>
        )}
      </Panel>
    );
  }

  // ── Full Quest Log Overlay ─────────────────────
  const grouped = {
    active: quests.filter((q) => q.status === 'active'),
    available: quests.filter((q) => q.status === 'available'),
    completed: quests.filter((q) => q.status === 'completed'),
    locked: quests.filter((q) => q.status === 'locked'),
  };

  return (
    <>
      <div className="oculus-backdrop" onClick={handleToggle} />
      <Panel
        glow
        className="oculus-quest-log--expanded"
        aria-label="Quest log"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(500px, 90vw)',
          maxHeight: '70vh',
          zIndex: 'var(--oculus-z-modal)',
          animation: 'oculus-scale-in var(--oculus-transition-dramatic)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--oculus-space-md)' }}>
          <span className="oculus-heading" style={{ margin: 0 }}>Quest Log</span>
          <button className="oculus-button" onClick={handleToggle} aria-label="Close quest log">
            Esc
          </button>
        </div>

        <div className="oculus-scrollable" style={{ flex: 1 }} role="list" aria-label="Quest list">
          {grouped.active.length > 0 && (
            <div style={{ marginBottom: 'var(--oculus-space-md)' }}>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-success)', marginBottom: 'var(--oculus-space-xs)', textTransform: 'uppercase', letterSpacing: 1 }}>Active</div>
              {grouped.active.map((q) => (
                <QuestItem key={q.id} quest={q} expanded={expandedId === q.id} onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)} />
              ))}
            </div>
          )}

          {grouped.available.length > 0 && (
            <div style={{ marginBottom: 'var(--oculus-space-md)' }}>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-xp)', marginBottom: 'var(--oculus-space-xs)', textTransform: 'uppercase', letterSpacing: 1 }}>Available</div>
              {grouped.available.map((q) => (
                <QuestItem key={q.id} quest={q} expanded={expandedId === q.id} onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)} />
              ))}
            </div>
          )}

          {grouped.completed.length > 0 && (
            <div style={{ marginBottom: 'var(--oculus-space-md)' }}>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)', marginBottom: 'var(--oculus-space-xs)', textTransform: 'uppercase', letterSpacing: 1 }}>Completed</div>
              {grouped.completed.map((q) => (
                <QuestItem key={q.id} quest={q} expanded={expandedId === q.id} onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)} />
              ))}
            </div>
          )}

          {grouped.locked.length > 0 && (
            <div>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)', marginBottom: 'var(--oculus-space-xs)', textTransform: 'uppercase', letterSpacing: 1 }}>Locked</div>
              {grouped.locked.map((q) => (
                <QuestItem key={q.id} quest={q} expanded={false} onToggle={() => {}} />
              ))}
            </div>
          )}

          {quests.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--oculus-text-muted)', padding: 'var(--oculus-space-xl)' }}>
              No quests discovered yet
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
