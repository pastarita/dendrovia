"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createDendriteStore,
  DendriteCanvas,
  DendriteToolbar,
  architectusFixture,
  dendroviaFixture,
} from "@dendrovia/dendrite";

const FIXTURES = {
  [architectusFixture.id]: architectusFixture,
  [dendroviaFixture.id]: dendroviaFixture,
};
const AVAILABLE = [architectusFixture.id, dendroviaFixture.id];

export default function DendritePage() {
  const store = useMemo(
    () => createDendriteStore(FIXTURES, architectusFixture.id),
    []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ paddingTop: "0.75rem", paddingBottom: "0.5rem", paddingLeft: "1rem", paddingRight: "1rem" }}>
        <Link href="/gyms" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; Gyms</Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.5rem" }}>
          Dendrite Observatory
        </h1>
      </div>
      <div style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingBottom: "0.5rem" }}>
        <DendriteToolbar store={store} availableFixtures={AVAILABLE} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactFlowProvider>
          <DendriteCanvas store={store} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
