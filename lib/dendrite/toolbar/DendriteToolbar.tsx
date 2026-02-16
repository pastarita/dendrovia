"use client";

import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import type { DendriteState, LayoutDirection, ColorMode } from "../types";
import { DT, PILLAR_COLORS } from "../design-tokens";
import type { PillarDomain } from "../types";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  paddingTop: "0.5rem",
  paddingBottom: "0.5rem",
  paddingLeft: "0.75rem",
  paddingRight: "0.75rem",
  backgroundColor: DT.panel,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: DT.panelBorder,
  borderRadius: "6px",
  fontSize: "0.75rem",
  color: DT.textMuted,
};

const btnBase: React.CSSProperties = {
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
  paddingLeft: "0.5rem",
  paddingRight: "0.5rem",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: DT.border,
  backgroundColor: DT.surface,
  color: DT.text,
  fontSize: "0.72rem",
  cursor: "pointer",
  transition: "background-color 0.15s",
};

function activeBtn(active: boolean): React.CSSProperties {
  return {
    ...btnBase,
    backgroundColor: active ? DT.accent : DT.surface,
    color: active ? "#000" : DT.text,
    borderColor: active ? DT.accent : DT.border,
  };
}

const sepStyle: React.CSSProperties = {
  width: "1px",
  height: "1.2rem",
  backgroundColor: DT.border,
  marginLeft: "0.25rem",
  marginRight: "0.25rem",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DendriteToolbarProps {
  store: StoreApi<DendriteState>;
  /** Which fixture IDs are available (for fixture switching buttons) */
  availableFixtures: string[];
}

export function DendriteToolbar({ store, availableFixtures }: DendriteToolbarProps) {
  const direction = useStore(store, (s) => s.direction);
  const colorMode = useStore(store, (s) => s.colorMode);
  const activeFixtureId = useStore(store, (s) => s.activeFixtureId);
  const fixtures = useStore(store, (s) => s.fixtures);
  const phaseFilter = useStore(store, (s) => s.phaseFilter);

  const setDirection = useStore(store, (s) => s.setDirection);
  const setColorMode = useStore(store, (s) => s.setColorMode);
  const setFixture = useStore(store, (s) => s.setFixture);
  const collapseAll = useStore(store, (s) => s.collapseAll);
  const expandAll = useStore(store, (s) => s.expandAll);
  const setPhaseFilter = useStore(store, (s) => s.setPhaseFilter);

  // Get phase nodes for the active fixture
  const activeDiagram = fixtures[activeFixtureId];
  const phases = activeDiagram
    ? activeDiagram.nodes.filter((n) => n.kind === "phase")
    : [];

  return (
    <div style={toolbarStyle}>
      {/* Direction */}
      <span style={{ fontWeight: 600 }}>Dir:</span>
      {(["TB", "LR"] as LayoutDirection[]).map((d) => (
        <button
          key={d}
          style={activeBtn(direction === d)}
          onClick={() => setDirection(d)}
        >
          {d}
        </button>
      ))}

      <div style={sepStyle} />

      {/* Color mode */}
      <span style={{ fontWeight: 600 }}>Color:</span>
      {(["status", "domain", "fidelity"] as ColorMode[]).map((m) => (
        <button
          key={m}
          style={activeBtn(colorMode === m)}
          onClick={() => setColorMode(m)}
        >
          {m}
        </button>
      ))}

      <div style={sepStyle} />

      {/* Collapse/Expand */}
      <button style={btnBase} onClick={collapseAll}>
        Collapse
      </button>
      <button style={btnBase} onClick={expandAll}>
        Expand
      </button>

      <div style={sepStyle} />

      {/* Fixture switcher */}
      {availableFixtures.length > 1 && (
        <>
          <span style={{ fontWeight: 600 }}>Fixture:</span>
          {availableFixtures.map((fid) => {
            const diagram = fixtures[fid];
            const domain = fid as PillarDomain;
            const color = PILLAR_COLORS[domain]?.fill;
            return (
              <button
                key={fid}
                style={{
                  ...activeBtn(activeFixtureId === fid),
                  ...(color && activeFixtureId !== fid
                    ? { borderColor: color }
                    : {}),
                }}
                onClick={() => setFixture(fid)}
              >
                {diagram?.title ?? fid}
              </button>
            );
          })}
          <div style={sepStyle} />
        </>
      )}

      {/* Phase filter */}
      {phases.length > 0 && (
        <>
          <span style={{ fontWeight: 600 }}>Phase:</span>
          <button
            style={activeBtn(phaseFilter === null)}
            onClick={() => setPhaseFilter(null)}
          >
            All
          </button>
          {phases.map((p) => (
            <button
              key={p.id}
              style={activeBtn(phaseFilter === p.id)}
              onClick={() =>
                setPhaseFilter(phaseFilter === p.id ? null : p.id)
              }
            >
              {p.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
