"use client";

import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import type { DendriteState, BoundaryContract } from "../types";
import { DT } from "../design-tokens";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  width: 300,
  height: "100%",
  backgroundColor: DT.panel,
  borderLeftWidth: "1px",
  borderLeftStyle: "solid",
  borderLeftColor: DT.panelBorder,
  padding: "1rem",
  overflowY: "auto",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  fontSize: "0.78rem",
  color: DT.text,
};

const closeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 10,
  background: "none",
  border: "none",
  color: DT.textMuted,
  fontSize: "1.1rem",
  cursor: "pointer",
  lineHeight: 1,
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.7rem",
  color: DT.textMuted,
  marginBottom: "0.3rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.1rem 0.35rem",
  borderRadius: 3,
  backgroundColor: DT.surface,
  color: DT.textMuted,
  fontSize: "0.62rem",
  fontFamily: "monospace",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ContractDetailPanelProps {
  store: StoreApi<DendriteState>;
}

export function ContractDetailPanel({ store }: ContractDetailPanelProps) {
  const selectedEdgeId = useStore(store, (s) => s.selectedEdgeId);
  const activeFixtureId = useStore(store, (s) => s.activeFixtureId);
  const fixtures = useStore(store, (s) => s.fixtures);
  const clearSelection = useStore(store, (s) => s.clearSelection);

  if (!selectedEdgeId) return null;

  const diagram = fixtures[activeFixtureId];
  if (!diagram) return null;

  // Find the source edge
  const sourceEdge = diagram.edges.find(
    (e) => `${e.source}->${e.target}` === selectedEdgeId
  );
  if (!sourceEdge || sourceEdge.relation !== "pipeline-flow") return null;

  const contract: BoundaryContract | undefined = sourceEdge.contracts;
  if (!contract) return null;

  // Resolve pillar names from node IDs
  const sourceNode = diagram.nodes.find((n) => n.id === sourceEdge.source);
  const targetNode = diagram.nodes.find((n) => n.id === sourceEdge.target);

  return (
    <div style={panelStyle}>
      <button style={closeBtnStyle} onClick={clearSelection} title="Close">
        ×
      </button>

      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
        {sourceNode?.label ?? sourceEdge.source}{" "}
        <span style={{ color: DT.accent }}>→</span>{" "}
        {targetNode?.label ?? sourceEdge.target}
      </div>

      {sourceEdge.label && (
        <div style={{ color: DT.textMuted, fontStyle: "italic" }}>
          {sourceEdge.label}
        </div>
      )}

      {/* Types section */}
      {contract.types.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>
            Types ({contract.types.length})
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {contract.types.map((t) => (
              <div
                key={t.name}
                style={{
                  padding: "0.4rem 0.5rem",
                  backgroundColor: DT.surface,
                  borderRadius: 4,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: DT.borderSubtle,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontSize: "0.67rem",
                    color: DT.textMuted,
                    marginTop: "0.15rem",
                  }}
                >
                  {t.description}
                </div>
                {t.fields && t.fields.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.25rem",
                      marginTop: "0.3rem",
                    }}
                  >
                    {t.fields.map((f) => (
                      <span key={f} style={chipStyle}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events section */}
      {contract.events.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>
            Events ({contract.events.length})
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            {contract.events.map((e) => (
              <div
                key={e.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.3rem 0.5rem",
                  backgroundColor: DT.surface,
                  borderRadius: 4,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: DT.borderSubtle,
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color:
                      e.direction === "emit" ? "#22C55E" : "#3B82F6",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {e.direction === "emit" ? "→" : "←"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {e.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: DT.textDim,
                      fontFamily: "monospace",
                    }}
                  >
                    {e.key}
                  </div>
                </div>
                {e.payloadType && (
                  <span style={chipStyle}>{e.payloadType}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema */}
      {contract.schema && (
        <div>
          <div style={sectionTitleStyle}>Schema</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
            {contract.schema}
          </div>
        </div>
      )}
    </div>
  );
}
