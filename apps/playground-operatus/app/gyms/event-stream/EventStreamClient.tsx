'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { OrnateFrame } from '@dendrovia/oculus';
import { EventLog } from './components/EventLog';
import { EventFilters } from './components/EventFilters';
import { EventEmitter } from './components/EventEmitter';
import { EventPayloadModal } from './components/EventPayloadModal';

export interface EventEntry {
  id: number;
  timestamp: number;
  event: string;
  pillar: string;
  color: string;
  payload?: unknown;
}

const PILLAR_MAP: Record<string, { name: string; color: string }> = {
  player: { name: 'ARCHITECTUS', color: '#3B82F6' },
  branch: { name: 'ARCHITECTUS', color: '#3B82F6' },
  node: { name: 'ARCHITECTUS', color: '#3B82F6' },
  collision: { name: 'ARCHITECTUS', color: '#3B82F6' },
  encounter: { name: 'LUDUS', color: '#EF4444' },
  damage: { name: 'LUDUS', color: '#EF4444' },
  health: { name: 'LUDUS', color: '#EF4444' },
  mana: { name: 'LUDUS', color: '#EF4444' },
  quest: { name: 'LUDUS', color: '#EF4444' },
  combat: { name: 'LUDUS', color: '#EF4444' },
  spell: { name: 'LUDUS', color: '#EF4444' },
  item: { name: 'LUDUS', color: '#EF4444' },
  status: { name: 'LUDUS', color: '#EF4444' },
  experience: { name: 'LUDUS', color: '#EF4444' },
  level: { name: 'LUDUS', color: '#EF4444' },
  loot: { name: 'LUDUS', color: '#EF4444' },
  parse: { name: 'CHRONOS', color: '#c77b3f' },
  topology: { name: 'CHRONOS', color: '#c77b3f' },
  shaders: { name: 'IMAGINARIUM', color: '#A855F7' },
  palette: { name: 'IMAGINARIUM', color: '#A855F7' },
  mycology: { name: 'IMAGINARIUM', color: '#A855F7' },
  assets: { name: 'OPERATUS', color: '#6B7280' },
  state: { name: 'OPERATUS', color: '#6B7280' },
  cache: { name: 'OPERATUS', color: '#6B7280' },
};

function detectPillar(event: string): { name: string; color: string } {
  const prefix = event.split(':')[0];
  return PILLAR_MAP[prefix] ?? { name: 'UNKNOWN', color: '#555' };
}

const MAX_ENTRIES = 500;

export function EventStreamClient() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<EventEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EventEntry | null>(null);
  const [enabledPillars, setEnabledPillars] = useState<Set<string>>(
    new Set(['ARCHITECTUS', 'LUDUS', 'CHRONOS', 'IMAGINARIUM', 'OPERATUS', 'OCULUS', 'UNKNOWN'])
  );
  const [textFilter, setTextFilter] = useState('');

  const busRef = useRef<import('@dendrovia/shared').EventBus | null>(null);
  const eventsRef = useRef<typeof import('@dendrovia/shared')['GameEvents'] | null>(null);
  const idCounter = useRef(0);
  const pendingRef = useRef<EventEntry[]>([]);
  const rafRef = useRef<number | null>(null);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    const batch = pendingRef.current;
    if (batch.length === 0) return;
    pendingRef.current = [];
    setEntries((prev) => {
      const next = [...prev, ...batch];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('@dendrovia/shared').then((shared) => {
      if (cancelled) return;
      const bus = shared.getEventBus();
      busRef.current = bus;
      eventsRef.current = shared.GameEvents;

      const unsub = bus.onAny((event: string, data?: unknown) => {
        const pillar = detectPillar(event);
        const entry: EventEntry = {
          id: idCounter.current++,
          timestamp: Date.now(),
          event,
          pillar: pillar.name,
          color: pillar.color,
          payload: data,
        };
        pendingRef.current.push(entry);
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(flushPending);
        }
      });

      setReady(true);
      return () => { unsub(); };
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err));
    });
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [flushPending]);

  if (error) {
    return <div style={{ marginTop: "2rem", color: "#ef4444" }}>Error: {error}</div>;
  }

  if (!ready) {
    return <div style={{ marginTop: "2rem", opacity: 0.5 }}>Connecting to EventBus...</div>;
  }

  const filtered = entries.filter((e) => {
    if (!enabledPillars.has(e.pillar)) return false;
    if (textFilter && !e.event.toLowerCase().includes(textFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <EventEmitter bus={busRef.current!} gameEvents={eventsRef.current!} />
      <EventFilters
        enabledPillars={enabledPillars}
        onTogglePillar={(p) => {
          setEnabledPillars((prev) => {
            const next = new Set(prev);
            if (next.has(p)) next.delete(p);
            else next.add(p);
            return next;
          });
        }}
        textFilter={textFilter}
        onTextFilterChange={setTextFilter}
        onClear={() => setEntries([])}
      />
      <OrnateFrame pillar="operatus" variant="panel">
        <EventLog entries={filtered} onSelect={setSelectedEntry} />
      </OrnateFrame>

      {selectedEntry && (
        <EventPayloadModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
