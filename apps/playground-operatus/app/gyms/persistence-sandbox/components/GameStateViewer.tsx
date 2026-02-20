'use client';

import { useState, useEffect } from 'react';

type OperatusMod = typeof import('@dendrovia/operatus');

export function GameStateViewer({ mod, refreshKey }: { mod: OperatusMod; refreshKey: number }) {
  const [state, setState] = useState<Record<string, unknown> | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const update = () => {
      const raw = mod.useSaveStateStore.getState();
      // Filter out functions and transient state for display
      const display: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'function') continue;
        if (key.startsWith('_')) continue;
        if (key === 'isMenuOpen' || key === 'currentAnimation') continue;
        // Convert Set to Array for display
        if (value instanceof Set) {
          display[key] = Array.from(value);
        } else {
          display[key] = value;
        }
      }
      setState(display);
    };

    update();
    const unsub = mod.useSaveStateStore.subscribe(update);
    return () => unsub();
  }, [mod, refreshKey]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!state) return null;

  return (
    <div style={{ padding: "1rem 1.25rem", border: "1px solid #222", borderRadius: "8px" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Game State (live)
      </h3>
      <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.8rem", maxHeight: "400px", overflow: "auto" }}>
        {Object.entries(state).map(([key, value]) => {
          const isObject = value !== null && typeof value === 'object';
          const isCollapsed = collapsed.has(key);

          return (
            <div key={key} style={{ marginBottom: "0.25rem" }}>
              <div
                onClick={() => isObject && toggle(key)}
                style={{
                  cursor: isObject ? "pointer" : "default",
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                {isObject && (
                  <span style={{ opacity: 0.4, width: "1ch" }}>{isCollapsed ? '+' : '-'}</span>
                )}
                <span style={{ color: "#93c5fd" }}>{key}</span>
                <span style={{ opacity: 0.3 }}>:</span>
                {!isObject && (
                  <span style={{ color: "#86efac" }}>{JSON.stringify(value)}</span>
                )}
                {isObject && isCollapsed && (
                  <span style={{ opacity: 0.3 }}>
                    {Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value as object).length}}`}
                  </span>
                )}
              </div>
              {isObject && !isCollapsed && (
                <pre style={{
                  margin: 0,
                  marginLeft: "1.5ch",
                  color: "#d1d5db",
                  opacity: 0.7,
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
