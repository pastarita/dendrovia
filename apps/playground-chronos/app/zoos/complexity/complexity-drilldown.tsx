"use client";

import { useState, useMemo } from "react";
import { OrnateFrame } from "@dendrovia/oculus";

interface FunctionEntry {
  name: string;
  complexity: number;
  loc: number;
  startLine: number;
  endLine: number;
}

interface FileEntry {
  path: string;
  cyclomatic: number;
  loc: number;
  functions: FunctionEntry[];
}

export function ComplexityDrilldown({ files }: { files: FileEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    let result = files.filter((f) =>
      f.path.toLowerCase().includes(filter.toLowerCase())
    );
    result.sort((a, b) => b.cyclomatic - a.cyclomatic);
    return result;
  }, [files, filter]);

  const complexityColor = (c: number) => {
    if (c >= 20) return "#ef4444";
    if (c >= 10) return "#f59e0b";
    if (c >= 5) return "#c77b3f";
    return "#666";
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <input
        type="text"
        placeholder="Filter by file path..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          background: "#111",
          border: "1px solid #333",
          borderRadius: "6px",
          color: "#ccc",
          fontSize: "0.85rem",
          marginBottom: "1rem",
        }}
      />

      <OrnateFrame pillar="chronos" variant="panel">
      {sorted.slice(0, 100).map((f) => (
        <div key={f.path} style={{ marginBottom: "0.25rem" }}>
          <div
            onClick={() => setExpanded(expanded === f.path ? null : f.path)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "#111",
              borderRadius: "6px",
              cursor: "pointer",
              borderLeft: `3px solid ${complexityColor(f.cyclomatic)}`,
            }}
          >
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
              {expanded === f.path ? "▼" : "▶"}
            </span>
            <span style={{
              flex: 1,
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {f.path}
            </span>
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
              {f.functions.length} fn
            </span>
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
              {f.loc} LOC
            </span>
            <span style={{
              fontWeight: 600,
              fontSize: "0.85rem",
              color: complexityColor(f.cyclomatic),
              width: "40px",
              textAlign: "right",
            }}>
              {f.cyclomatic}
            </span>
          </div>

          {expanded === f.path && f.functions.length > 0 && (
            <div style={{
              marginLeft: "1.5rem",
              padding: "0.5rem 0",
              borderLeft: "1px solid #222",
              paddingLeft: "0.75rem",
            }}>
              {f.functions
                .sort((a, b) => b.complexity - a.complexity)
                .map((fn, i) => (
                  <div
                    key={`${fn.name}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-geist-mono)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {fn.name}
                    </span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.4 }}>
                      L{fn.startLine}-{fn.endLine}
                    </span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                      {fn.loc} LOC
                    </span>
                    <span style={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: complexityColor(fn.complexity),
                      width: "30px",
                      textAlign: "right",
                    }}>
                      {fn.complexity}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
      </OrnateFrame>

      {sorted.length > 100 && (
        <div style={{ textAlign: "center", opacity: 0.4, marginTop: "0.75rem", fontSize: "0.8rem" }}>
          Showing 100 of {sorted.length} files
        </div>
      )}
    </div>
  );
}
