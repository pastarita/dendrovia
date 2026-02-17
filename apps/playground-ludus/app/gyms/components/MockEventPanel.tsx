'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { NodeClickedEvent, PlayerMovedEvent, BranchEnteredEvent } from '@dendrovia/shared';

export default function MockEventPanel(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-49), msg]);
  }, []);

  useEffect(() => {
    const bus = getEventBus();
    const unsubs: Array<() => void> = [];

    const events = Object.values(GameEvents);
    for (const event of events) {
      unsubs.push(
        bus.on(event, (data: unknown) => {
          addLog(`${event} → ${JSON.stringify(data).slice(0, 120)}`);
        })
      );
    }

    return () => { for (const u of unsubs) u(); };
  }, [addLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  const emitNodeClicked = () => {
    const bus = getEventBus();
    const payload: NodeClickedEvent = {
      nodeId: 'test-node-001',
      filePath: 'src/index.ts',
      position: [0, 0, 0],
    };
    bus.emit(GameEvents.NODE_CLICKED, payload);
  };

  const emitPlayerMoved = () => {
    const bus = getEventBus();
    const payload: PlayerMovedEvent = {
      position: [Math.random() * 10, 0, Math.random() * 10],
      branchId: 'main',
      velocity: [0, 0, 0],
    };
    bus.emit(GameEvents.PLAYER_MOVED, payload);
  };

  const emitBranchEntered = () => {
    const bus = getEventBus();
    const payload: BranchEnteredEvent = {
      branchId: 'main',
      filePath: 'src/index.ts',
      depth: 1,
    };
    bus.emit(GameEvents.BRANCH_ENTERED, payload);
  };

  const btnStyle: React.CSSProperties = {
    padding: '0.35rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ededed',
    cursor: 'pointer',
    fontSize: '0.75rem',
  };

  return (
    <div style={{ marginTop: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'none',
          border: 'none',
          color: '#ededed',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ opacity: 0.6 }}>Mock Event Panel</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{collapsed ? 'expand' : 'collapse'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button style={btnStyle} onClick={emitNodeClicked}>
              Emit NODE_CLICKED
            </button>
            <button style={btnStyle} onClick={emitPlayerMoved}>
              Emit PLAYER_MOVED
            </button>
            <button style={btnStyle} onClick={emitBranchEntered}>
              Emit BRANCH_ENTERED
            </button>
            <button style={{ ...btnStyle, opacity: 0.5 }} onClick={() => setLog([])}>
              Clear
            </button>
          </div>

          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.7rem',
              background: '#0a0a0a',
              borderRadius: '4px',
              padding: '0.5rem',
            }}
          >
            {log.length === 0 && <div style={{ opacity: 0.3 }}>No events captured...</div>}
            {log.map((msg, i) => (
              <div key={i} style={{ padding: '0.1rem 0', borderBottom: '1px solid #151515', opacity: 0.7 }}>
                {msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
