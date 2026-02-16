'use client';

import { useState, useEffect } from 'react';
import { OrnateFrame } from '@dendrovia/oculus';

type OperatusMod = typeof import('@dendrovia/operatus');

export function SaveSlotList({ mod, refreshKey }: { mod: OperatusMod; refreshKey: number }) {
  const [slots, setSlots] = useState<Array<{ key: string; timestamp: number; version: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    mod.listSaveSlots()
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [mod, refreshKey]);

  const handleDelete = async (key: string) => {
    await mod.deleteSaveSlot(key);
    const updated = await mod.listSaveSlots();
    setSlots(updated);
  };

  return (
    <OrnateFrame pillar="operatus" variant="compact">
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Save Slots ({slots.length})
      </h3>
      {loading ? (
        <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>Loading...</div>
      ) : slots.length === 0 ? (
        <div style={{ opacity: 0.4, fontSize: "0.85rem" }}>No save slots found. Modify state above to create one.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {slots.map((slot) => (
            <div
              key={slot.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                background: "#111",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ fontFamily: "var(--font-geist-mono)" }}>{slot.key}</span>
                <span style={{ marginLeft: "0.75rem", opacity: 0.4, fontSize: "0.75rem" }}>
                  {new Date(slot.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{
                  fontSize: "0.65rem",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "3px",
                  background: "#1e3a5f",
                  color: "#93c5fd",
                }}>
                  v{slot.version}
                </span>
                <button
                  onClick={() => handleDelete(slot.key)}
                  style={{
                    background: "none",
                    border: "1px solid #4a2020",
                    borderRadius: "3px",
                    color: "#ef4444",
                    fontSize: "0.7rem",
                    padding: "0.15rem 0.4rem",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </OrnateFrame>
  );
}
