"use client";

import { useState, useMemo } from "react";

interface FileEntry {
  path: string;
  language: string;
  complexity: number;
  loc: number;
}

type SortKey = "path" | "language" | "complexity" | "loc";

export function FilesTable({ files }: { files: FileEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("complexity");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    let result = files.filter(
      (f) =>
        f.path.toLowerCase().includes(filter.toLowerCase()) ||
        f.language.toLowerCase().includes(filter.toLowerCase())
    );

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return result;
  }, [files, sortKey, sortAsc, filter]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "path" || key === "language");
    }
  };

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
        placeholder="Filter by path or language..."
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

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              {(["path", "language", "complexity", "loc"] as SortKey[]).map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{
                    textAlign: key === "path" ? "left" : "right",
                    padding: "0.5rem",
                    borderBottom: "1px solid #333",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    opacity: sortKey === key ? 1 : 0.5,
                    color: sortKey === key ? "#c77b3f" : undefined,
                  }}
                >
                  {key} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 200).map((f) => (
              <tr key={f.path} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "0.4rem 0.5rem", fontFamily: "var(--font-geist-mono)", fontSize: "0.8rem" }}>
                  {f.path}
                </td>
                <td style={{ padding: "0.4rem 0.5rem", textAlign: "right" }}>
                  <span style={{
                    padding: "0.1rem 0.4rem",
                    borderRadius: "8px",
                    background: "#222",
                    fontSize: "0.75rem",
                  }}>
                    {f.language}
                  </span>
                </td>
                <td style={{
                  padding: "0.4rem 0.5rem",
                  textAlign: "right",
                  fontWeight: f.complexity >= 10 ? 600 : 400,
                  color: complexityColor(f.complexity),
                }}>
                  {f.complexity}
                </td>
                <td style={{ padding: "0.4rem 0.5rem", textAlign: "right", opacity: 0.7 }}>
                  {f.loc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && (
          <div style={{ textAlign: "center", opacity: 0.4, marginTop: "0.75rem", fontSize: "0.8rem" }}>
            Showing 200 of {sorted.length} files
          </div>
        )}
      </div>
    </div>
  );
}
