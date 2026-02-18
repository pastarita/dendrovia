'use client';

import { useState } from 'react';

type OperatusMod = typeof import('@dendrovia/operatus');

/** Synthetic v1 save data (pre-migration shape) */
const SYNTHETIC_V1_SAVE = {
  state: {
    character: {
      id: 'legacy-hero',
      name: 'Legacy Explorer',
      class: 'warrior' as const,
      level: 5,
      experience: 450,
      stats: { hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 15, defense: 12, speed: 10, luck: 8 },
      spells: [],
      statusEffects: [],
      cooldowns: {},
    },
    quests: [],
    visitedNodes: [],
    unlockedKnowledge: [],
    worldPosition: [0, 0, 0] as [number, number, number],
    cameraMode: 'falcon' as const,
    inventory: [],
    gameFlags: {},
    playtimeMs: 120000,
  },
  version: 1,
};

export function MigrationTester({ mod, onMigrate }: { mod: OperatusMod; onMigrate: () => void }) {
  const [beforeState, setBeforeState] = useState<string | null>(null);
  const [afterState, setAfterState] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleInjectV1 = () => {
    // Write synthetic v1 save to localStorage (where Zustand persist reads from)
    const key = 'dendrovia-save';
    localStorage.setItem(key, JSON.stringify(SYNTHETIC_V1_SAVE));
    setBeforeState(JSON.stringify(SYNTHETIC_V1_SAVE, null, 2));
    setAfterState(null);
    setStatus(`Injected v1 save into localStorage key "${key}". Reload to trigger migration.`);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleShowCurrent = () => {
    const key = 'dendrovia-save';
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAfterState(JSON.stringify(parsed, null, 2));
        setStatus(`Current save: version ${parsed.version ?? 'unknown'}`);
      } catch {
        setAfterState(raw);
        setStatus('Could not parse current save');
      }
    } else {
      setAfterState(null);
      setStatus('No save found in localStorage');
    }
  };

  return (
    <div style={{ padding: "1rem 1.25rem", border: "1px solid #222", borderRadius: "8px" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Migration Tester
      </h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.5, marginBottom: "0.75rem" }}>
        Inject a synthetic v1 save, then reload to trigger the migration pipeline. Compare before/after.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={handleInjectV1} style={btnStyle}>Inject v1 Save</button>
        <button onClick={handleReload} style={btnStyle}>Reload Page</button>
        <button onClick={handleShowCurrent} style={btnStyle}>Show Current State</button>
      </div>

      {(beforeState || afterState) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {beforeState && (
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.25rem" }}>Before (v1)</div>
              <pre style={preStyle}>{beforeState}</pre>
            </div>
          )}
          {afterState && (
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.25rem" }}>After (current)</div>
              <pre style={preStyle}>{afterState}</pre>
            </div>
          )}
        </div>
      )}

      {status && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", opacity: 0.6 }}>{status}</div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.4rem 0.75rem",
  background: "#222",
  border: "1px solid #444",
  borderRadius: "4px",
  color: "#ededed",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const preStyle: React.CSSProperties = {
  background: "#111",
  padding: "0.75rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontFamily: "var(--font-geist-mono)",
  maxHeight: "250px",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  margin: 0,
};
