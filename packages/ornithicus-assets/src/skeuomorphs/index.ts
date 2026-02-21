/**
 * Skeuomorph asset manifest.
 * Pedestal models and tool icons for the Pantheon Vestibule.
 */

export interface SkeuomorphAsset {
  id: string;
  label: string;
  type: "pedestal" | "icon" | "decoration";
}

export const SKEUOMORPH_MANIFEST: SkeuomorphAsset[] = [
  { id: "parse-pedestal", label: "Parse Pedestal", type: "pedestal" },
  { id: "build-pedestal", label: "Build Pedestal", type: "pedestal" },
  { id: "inspect-pedestal", label: "Inspect Pedestal", type: "pedestal" },
  { id: "navigate-icon", label: "Navigate", type: "icon" },
  { id: "replay-icon", label: "Replay", type: "icon" },
];
