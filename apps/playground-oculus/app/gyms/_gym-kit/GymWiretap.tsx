'use client';

/**
 * GymWiretap — Live EventBus event stream panel.
 *
 * Subscribes to ALL events via eventBus.onAny() and renders a scrolling
 * log of timestamp + event name + payload preview + pillar color dot.
 * Filterable by event name, clearable, auto-scrolls to latest.
 *
 * Stores max 200 entries in a ring buffer (oldest dropped).
 * No virtualization needed for 200 items.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventBus } from '@dendrovia/shared';
import type { WiretapEntry } from './types';
import {
  wiretapContainerStyle,
  wiretapHeaderStyle,
  wiretapListStyle,
  wiretapEntryStyle,
  gymBtnStyle,
  tabStyle,
} from './gym-styles';

const MAX_ENTRIES = 200;

/** Map event key prefixes to pillar names and colors. */
const PILLAR_MAP: Record<string, { name: string; color: string }> = {
  'player':     { name: 'ARCHITECTUS', color: '#3B82F6' },
  'branch':     { name: 'ARCHITECTUS', color: '#3B82F6' },
  'node':       { name: 'ARCHITECTUS', color: '#3B82F6' },
  'collision':  { name: 'ARCHITECTUS', color: '#3B82F6' },
  'encounter':  { name: 'LUDUS',       color: '#EF4444' },
  'damage':     { name: 'LUDUS',       color: '#EF4444' },
  'health':     { name: 'LUDUS',       color: '#EF4444' },
  'mana':       { name: 'LUDUS',       color: '#EF4444' },
  'quest':      { name: 'LUDUS',       color: '#EF4444' },
  'combat':     { name: 'LUDUS',       color: '#EF4444' },
  'spell':      { name: 'LUDUS',       color: '#EF4444' },
  'status':     { name: 'LUDUS',       color: '#EF4444' },
  'experience': { name: 'LUDUS',       color: '#EF4444' },
  'level':      { name: 'LUDUS',       color: '#EF4444' },
  'loot':       { name: 'LUDUS',       color: '#EF4444' },
  'item':       { name: 'OCULUS',      color: '#22C55E' },
  'parse':      { name: 'CHRONOS',     color: '#c77b3f' },
  'topology':   { name: 'CHRONOS',     color: '#c77b3f' },
  'shaders':    { name: 'IMAGINARIUM', color: '#A855F7' },
  'palette':    { name: 'IMAGINARIUM', color: '#A855F7' },
  'mycology':   { name: 'IMAGINARIUM', color: '#A855F7' },
  'assets':     { name: 'OPERATUS',    color: '#888'    },
  'state':      { name: 'OPERATUS',    color: '#888'    },
  'cache':      { name: 'OPERATUS',    color: '#888'    },
  'save':       { name: 'OPERATUS',    color: '#888'    },
  'game':       { name: 'OPERATUS',    color: '#888'    },
};

function inferPillar(event: string): { name: string; color: string } {
  const prefix = event.split(':')[0] ?? '';
  return PILLAR_MAP[prefix] ?? { name: '?', color: '#666' };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function summarizePayload(payload: unknown): string {
  if (payload === undefined || payload === null) return '';
  if (typeof payload === 'string') return payload.slice(0, 40);
  if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
  try {
    const s = JSON.stringify(payload);
    return s.length > 60 ? s.slice(0, 57) + '...' : s;
  } catch {
    return '[object]';
  }
}

interface GymWiretapProps {
  eventBus: EventBus;
  collapsed?: boolean;
}

let nextId = 0;

export function GymWiretap({ eventBus, collapsed = false }: GymWiretapProps) {
  const [entries, setEntries] = useState<WiretapEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const listRef = useRef<HTMLDivElement>(null);

  // Subscribe to all events
  useEffect(() => {
    const unsub = eventBus.onAny((event: string, data?: unknown) => {
      const pillar = inferPillar(event);
      const entry: WiretapEntry = {
        id: nextId++,
        timestamp: Date.now(),
        event,
        payload: data,
        pillar: pillar.name,
      };
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
      });
    });
    return unsub;
  }, [eventBus]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current && !isCollapsed) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, isCollapsed]);

  const handleClear = useCallback(() => setEntries([]), []);

  // Collect unique event names for filter
  const eventNames = Array.from(new Set(entries.map((e) => e.event)));
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.event === filter);

  if (isCollapsed) {
    return (
      <div style={{ ...wiretapContainerStyle, cursor: 'pointer' }} onClick={() => setIsCollapsed(false)}>
        <div style={wiretapHeaderStyle}>
          <span>Wiretap</span>
          <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>({entries.length} events)</span>
          <span style={{ marginLeft: 'auto', opacity: 0.4 }}>+</span>
        </div>
      </div>
    );
  }

  return (
    <div style={wiretapContainerStyle}>
      <div style={wiretapHeaderStyle}>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)}>Wiretap</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ background: '#222', border: '1px solid #333', borderRadius: 3, color: 'inherit', fontSize: '0.7rem', padding: '0.15rem 0.3rem' }}
        >
          <option value="all">All ({entries.length})</option>
          {eventNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button style={{ ...gymBtnStyle, padding: '0.15rem 0.4rem', fontSize: '0.65rem', marginLeft: 'auto' }} onClick={handleClear}>
          Clear
        </button>
        <span style={{ opacity: 0.4, cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => setIsCollapsed(true)}>-</span>
      </div>
      <div ref={listRef} style={wiretapListStyle}>
        {filtered.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.3, fontSize: '0.75rem' }}>
            No events captured yet
          </div>
        )}
        {filtered.map((entry, i) => {
          const pillar = inferPillar(entry.event);
          return (
            <div key={entry.id} style={wiretapEntryStyle(i)}>
              <span style={{ opacity: 0.4, flexShrink: 0 }}>{formatTime(entry.timestamp)}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: pillar.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 500, flexShrink: 0 }}>{entry.event}</span>
              <span style={{ opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {summarizePayload(entry.payload)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
