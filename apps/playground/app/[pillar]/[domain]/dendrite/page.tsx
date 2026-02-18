"use client";

/**
 * Dendrite Observatory — Pillar-aware graph visualization.
 *
 * Loads the pillar-specific fixture as default, plus the shared
 * dendroviaFixture as a second option. Uses pillar context to
 * determine which fixture to show first.
 */

import { useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createDendriteStore,
  DendriteCanvas,
  DendriteToolbar,
  architectusFixture,
  chronosFixture,
  imaginariumFixture,
  ludusFixture,
  oculusFixture,
  operatusFixture,
  dendroviaFixture,
} from "@dendrovia/dendrite";
import { usePillar } from "@repo/ui/pillar-context";
import type { PillarName } from "@repo/ui/domain-registry";

const ALL_FIXTURES = {
  [architectusFixture.id]: architectusFixture,
  [chronosFixture.id]: chronosFixture,
  [imaginariumFixture.id]: imaginariumFixture,
  [ludusFixture.id]: ludusFixture,
  [oculusFixture.id]: oculusFixture,
  [operatusFixture.id]: operatusFixture,
  [dendroviaFixture.id]: dendroviaFixture,
};

const PILLAR_DEFAULT_FIXTURE: Record<PillarName, string> = {
  ARCHITECTUS: architectusFixture.id,
  CHRONOS: chronosFixture.id,
  IMAGINARIUM: imaginariumFixture.id,
  LUDUS: ludusFixture.id,
  OCULUS: oculusFixture.id,
  OPERATUS: operatusFixture.id,
};

export default function DendritePage() {
  const { name: pillar } = usePillar();
  const defaultId = PILLAR_DEFAULT_FIXTURE[pillar] ?? oculusFixture.id;

  const store = useMemo(
    () => createDendriteStore(ALL_FIXTURES, defaultId),
    [defaultId]
  );

  const available = useMemo(
    () => [defaultId, dendroviaFixture.id],
    [defaultId]
  );

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
        Dendrite Observatory
      </h1>
      <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
        <DendriteToolbar store={store} availableFixtures={available} />
      </div>
      <div style={{ width: "100%", height: "calc(100vh - 12rem)" }}>
        <ReactFlowProvider>
          <DendriteCanvas store={store} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
