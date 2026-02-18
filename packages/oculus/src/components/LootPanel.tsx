'use client';

/**
 * LootPanel — Toast-like notifications for loot drops
 *
 * Appears when LOOT_DROPPED fires. Each drop auto-dismisses
 * after 8 seconds or can be manually closed.
 */

import React, { useEffect, useRef } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { Panel } from './primitives/Panel';

const AUTO_DISMISS_MS = 8_000;

export function LootPanel() {
  const drops = useOculusStore((s) => s.lootDrops);
  const dismiss = useOculusStore((s) => s.dismissLootDrop);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;

    for (const drop of drops) {
      if (!timers.has(drop.id)) {
        const remaining = AUTO_DISMISS_MS - (Date.now() - drop.droppedAt);
        if (remaining <= 0) {
          dismiss(drop.id);
        } else {
          const timer = setTimeout(() => {
            dismiss(drop.id);
            timers.delete(drop.id);
          }, remaining);
          timers.set(drop.id, timer);
        }
      }
    }

    // Clean up timers for dismissed drops
    for (const [id, timer] of timers) {
      if (!drops.some((d) => d.id === id)) {
        clearTimeout(timer);
        timers.delete(id);
      }
    }
  }, [drops, dismiss]);

  // Clear all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  if (drops.length === 0) return null;

  return (
    <div
      className="oculus-loot-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--oculus-space-xs)',
        maxWidth: 280,
      }}
      role="status"
      aria-label="Loot drops"
      aria-live="polite"
    >
      {drops.map((drop) => (
        <Panel
          key={drop.id}
          compact
          style={{ animation: 'oculus-slide-up var(--oculus-transition-fast)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--oculus-space-sm)' }}>
            <div>
              <div
                className="oculus-heading"
                style={{ fontSize: 'var(--oculus-font-xs)', margin: 0, marginBottom: 2 }}
              >
                {'\u{1F4E6}'} Loot
              </div>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)', lineHeight: 1.5 }}>
                {drop.items.map((item) => item.name).join(', ')}
              </div>
            </div>
            <button
              className="oculus-button"
              onClick={() => dismiss(drop.id)}
              style={{
                fontSize: 'var(--oculus-font-xs)',
                padding: '2px 6px',
                minWidth: 0,
                flexShrink: 0,
              }}
              aria-label="Dismiss loot notification"
            >
              {'\u{2715}'}
            </button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
