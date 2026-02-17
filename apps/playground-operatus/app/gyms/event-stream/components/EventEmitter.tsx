'use client';

import type { EventBus } from '@dendrovia/shared';
import { useState } from 'react';

type GameEventsType = typeof import('@dendrovia/shared')['GameEvents'];

export function EventEmitter({ bus, gameEvents }: { bus: EventBus; gameEvents: GameEventsType }) {
  const eventValues = Object.entries(gameEvents);
  const [selectedEvent, setSelectedEvent] = useState(eventValues[0]?.[1] ?? '');
  const [payloadText, setPayloadText] = useState('{}');
  const [status, setStatus] = useState<string | null>(null);

  const handleEmit = async () => {
    try {
      const payload = payloadText.trim() ? JSON.parse(payloadText) : undefined;
      await bus.emit(selectedEvent, payload);
      setStatus(`Emitted: ${selectedEvent}`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ padding: '1rem 1.25rem', border: '1px solid #222', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Event Emitter</h3>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '0.4rem 0.6rem',
              color: '#ededed',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-geist-mono)',
              minWidth: '200px',
            }}
          >
            {eventValues.map(([key, value]) => (
              <option key={key} value={value}>
                {value} ({key})
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>
            Payload (JSON)
          </label>
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '0.4rem 0.6rem',
              color: '#ededed',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-geist-mono)',
              resize: 'vertical',
            }}
          />
        </div>
        <button
          onClick={handleEmit}
          style={{
            padding: '0.4rem 1rem',
            background: '#1e3a5f',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            color: '#ededed',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Emit
        </button>
      </div>
      {status && <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>{status}</div>}
    </div>
  );
}
