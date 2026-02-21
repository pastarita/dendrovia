/**
 * Cursor asset manifest.
 * Custom cursor SVGs for spatial interaction modes.
 */

export interface CursorAsset {
  id: string;
  label: string;
  hotspot: { x: number; y: number };
}

export const CURSOR_MANIFEST: CursorAsset[] = [
  { id: "pointer", label: "Default Pointer", hotspot: { x: 0, y: 0 } },
  { id: "inspect", label: "Inspect Mode", hotspot: { x: 12, y: 12 } },
  { id: "graft", label: "Graft Tool", hotspot: { x: 8, y: 24 } },
  { id: "edit", label: "Edit Mode", hotspot: { x: 4, y: 4 } },
];
