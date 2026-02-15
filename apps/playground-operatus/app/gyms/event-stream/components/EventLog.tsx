'use client';

import { useEffect, useRef, useState } from 'react';
import type { EventEntry } from '../EventStreamClient';

export function EventLog({
  entries,
  onSelect,
}: {
  entries: EventEntry[];
  onSelect: (entry: EventEntry) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Auto-scroll if within 50px of bottom
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  return (
    <div style={{ position: "relative" }}>
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
          style={{
            position: "absolute",
            bottom: "0.5rem",
            right: "0.5rem",
            padding: "0.25rem 0.5rem",
            background: "#333",
            border: "1px solid #555",
            borderRadius: "4px",
            color: "#ededed",
            fontSize: "0.7rem",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          Resume auto-scroll
        </button>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: "400px",
          overflow: "auto",
          background: "#0d0d0d",
          border: "1px solid #222",
          borderRadius: "8px",
          fontFamily: "var(--font-geist-mono)",
          fontSize: "0.8rem",
        }}
      >
        {entries.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", opacity: 0.3 }}>
            No events yet. Use the emitter above to fire events.
          </div>
        ) : (
          entries.map((entry) => {
            const time = new Date(entry.timestamp);
            const ts = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padStart(3, '0')}`;
            const preview = entry.payload != null
              ? JSON.stringify(entry.payload).slice(0, 80)
              : '';

            return (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  padding: "0.35rem 0.75rem",
                  borderBottom: "1px solid #111",
                  cursor: "pointer",
                  alignItems: "baseline",
                }}
              >
                <span style={{ opacity: 0.3, fontSize: "0.7rem", flexShrink: 0 }}>{ts}</span>
                <span style={{
                  fontSize: "0.6rem",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "3px",
                  background: entry.color + '22',
                  color: entry.color,
                  flexShrink: 0,
                  minWidth: "80px",
                  textAlign: "center",
                }}>
                  {entry.pillar}
                </span>
                <span style={{ color: "#e2e8f0", flexShrink: 0 }}>{entry.event}</span>
                {preview && (
                  <span style={{ opacity: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {preview}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
