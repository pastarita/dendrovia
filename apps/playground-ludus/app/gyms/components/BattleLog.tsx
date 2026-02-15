'use client';

import { useEffect, useRef } from 'react';
import type { ActionLogEntry } from '@dendrovia/shared';

interface BattleLogProps {
  log: ActionLogEntry[];
}

export default function BattleLog({ log }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #222',
        borderRadius: '8px',
        background: '#0d0d0d',
        maxHeight: '300px',
        overflowY: 'auto',
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Battle Log
      </div>
      {log.length === 0 && (
        <div style={{ opacity: 0.3, fontStyle: 'italic' }}>No actions yet...</div>
      )}
      {log.map((entry, i) => (
        <div
          key={i}
          style={{
            padding: '0.2rem 0',
            borderBottom: '1px solid #1a1a1a',
            color: entry.actor === 'player' ? '#ededed' : '#F97316',
          }}
        >
          <span style={{ opacity: 0.4, marginRight: '0.5rem' }}>T{entry.turn}</span>
          {entry.result}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
