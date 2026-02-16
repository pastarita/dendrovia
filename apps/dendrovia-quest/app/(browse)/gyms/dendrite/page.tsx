"use client";

import { useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createDendriteStore,
  DendriteCanvas,
  DendriteToolbar,
  dendroviaFixture,
} from "@dendrovia/dendrite";

const FIXTURES = {
  [dendroviaFixture.id]: dendroviaFixture,
};
const AVAILABLE = [dendroviaFixture.id];

export default function DendritePage() {
  const store = useMemo(
    () => createDendriteStore(FIXTURES, dendroviaFixture.id),
    []
  );

  return (
    <div style={{ padding: '1rem 0' }}>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '0.06em' }}>
        Dendrite Observatory
      </h1>
      <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
        <DendriteToolbar store={store} availableFixtures={AVAILABLE} />
      </div>
      <div style={{ width: "100%", height: "calc(100vh - 180px)" }}>
        <ReactFlowProvider>
          <DendriteCanvas store={store} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
