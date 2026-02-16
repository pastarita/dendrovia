'use client';

import { OrnateFrame } from '@dendrovia/oculus';
import type { EventEntry } from '../EventStreamClient';

export function EventPayloadModal({
  entry,
  onClose,
}: {
  entry: EventEntry;
  onClose: () => void;
}) {
  const time = new Date(entry.timestamp);
  const ts = time.toLocaleTimeString() + '.' + time.getMilliseconds().toString().padStart(3, '0');

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <OrnateFrame
        pillar="operatus"
        variant="modal"
        style={{
          background: "#111",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
      <div
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{entry.event}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.4, marginTop: "0.15rem" }}>
              {entry.pillar} &middot; {ts}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#ededed",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.25rem" }}>Payload</div>
        <pre style={{
          background: "#0a0a0a",
          padding: "1rem",
          borderRadius: "4px",
          fontSize: "0.8rem",
          fontFamily: "var(--font-geist-mono)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          margin: 0,
          color: "#d1d5db",
        }}>
          {entry.payload != null ? JSON.stringify(entry.payload, null, 2) : '(no payload)'}
        </pre>
      </div>
      </OrnateFrame>
    </div>
  );
}
