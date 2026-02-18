"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createDendriteStore,
  DendriteCanvas,
  DendriteToolbar,
  oculusFixture,
  dendroviaFixture,
} from "@dendrovia/dendrite";

const FIXTURES = {
  [oculusFixture.id]: oculusFixture,
  [dendroviaFixture.id]: dendroviaFixture,
};
const AVAILABLE = [oculusFixture.id, dendroviaFixture.id];

export default function DendritePage() {
  const store = useMemo(
    () => createDendriteStore(FIXTURES, oculusFixture.id),
    []
  );

  return (
    <div>
      <div>
        <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; OCULUS</Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.5rem" }}>
          Dendrite Observatory
        </h1>
      </div>
      <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
        <DendriteToolbar store={store} availableFixtures={AVAILABLE} />
      </div>
      <div style={{ width: "100%", height: "calc(100vh - 12rem)" }}>
        <ReactFlowProvider>
          <DendriteCanvas store={store} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
