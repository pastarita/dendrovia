"use client";

import { useState, useMemo } from "react";

interface CommitEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: string[];
  insertions: number;
  deletions: number;
  type?: string;
  scope?: string;
  isBreaking?: boolean;
  confidence?: string;
}

const TYPE_COLORS: Record<string, string> = {
  "bug-fix": "#ef4444",
  feature: "#22c55e",
  refactor: "#3b82f6",
  docs: "#a78bfa",
  test: "#06b6d4",
  performance: "#f59e0b",
  merge: "#6b7280",
  revert: "#f97316",
  dependency: "#8b5cf6",
  "breaking-change": "#dc2626",
  chore: "#9ca3af",
  style: "#ec4899",
  maintenance: "#71717a",
};

export function CommitList({ commits }: { commits: CommitEntry[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const c of commits) {
      if (c.type) set.add(c.type);
    }
    return ["all", ...Array.from(set).sort()];
  }, [commits]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return commits;
    return commits.filter((c) => c.type === typeFilter);
  }, [commits, typeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, CommitEntry[]>();
    for (const c of filtered) {
      const day = new Date(c.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Type filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "10px",
              border: typeFilter === t ? "1px solid #c77b3f" : "1px solid #333",
              background: typeFilter === t ? "#c77b3f22" : "transparent",
              color: t === "all" ? "#ccc" : TYPE_COLORS[t] || "#ccc",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "0.8rem", opacity: 0.4, marginBottom: "1rem" }}>
        Showing {filtered.length} of {commits.length} commits
      </div>

      {/* Timeline */}
      {grouped.map(([day, dayCommits]) => (
        <div key={day} style={{ marginBottom: "1.5rem" }}>
          <div style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            opacity: 0.5,
            marginBottom: "0.5rem",
            borderBottom: "1px solid #222",
            paddingBottom: "0.25rem",
          }}>
            {day} ({dayCommits.length})
          </div>
          {dayCommits.map((c) => (
            <div
              key={c.hash}
              style={{
                padding: "0.6rem 0.75rem",
                borderLeft: `3px solid ${TYPE_COLORS[c.type || "maintenance"] || "#444"}`,
                marginBottom: "0.35rem",
                background: "#111",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <code style={{ fontSize: "0.75rem", opacity: 0.5 }}>{c.hash.slice(0, 7)}</code>
                <span style={{ fontSize: "0.85rem" }}>{c.message}</span>
                {c.isBreaking && (
                  <span style={{
                    fontSize: "0.65rem",
                    padding: "0.1rem 0.35rem",
                    borderRadius: "4px",
                    background: "#dc262633",
                    color: "#ef4444",
                    fontWeight: 700,
                  }}>
                    BREAKING
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                {c.type && (
                  <span style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "8px",
                    background: `${TYPE_COLORS[c.type] || "#666"}22`,
                    color: TYPE_COLORS[c.type] || "#666",
                  }}>
                    {c.type}
                  </span>
                )}
                {c.scope && (
                  <span style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "8px",
                    background: "#222",
                    color: "#aaa",
                  }}>
                    {c.scope}
                  </span>
                )}
                {c.confidence && (
                  <span style={{
                    fontSize: "0.65rem",
                    padding: "0.1rem 0.35rem",
                    borderRadius: "8px",
                    border: "1px solid #333",
                    opacity: c.confidence === "high" ? 1 : c.confidence === "medium" ? 0.7 : 0.4,
                  }}>
                    {c.confidence}
                  </span>
                )}
                <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>
                  {c.author} | +{c.insertions}/-{c.deletions} | {c.filesChanged.length} files
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
