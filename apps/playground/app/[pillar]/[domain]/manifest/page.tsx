import { ManifestCatalogClient } from "./ManifestCatalogClient";

export default function ManifestPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>📋</span> Manifest Catalog
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Browsable catalog of manifest.json entries</p>
      <ManifestCatalogClient />
    </div>
  );
}
