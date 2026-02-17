/**
 * Museum Kit — Reusable layout system for read-only exhibition pages.
 *
 * Provides the standard museum shell with:
 * - Header + back navigation
 * - Filter tabs + text search
 * - Grouped master list with color-coded rows
 * - Sticky detail panel via render props
 */

export { MuseumDetailPanel } from './MuseumDetailPanel';
export { MuseumExhibitRow } from './MuseumExhibitRow';
// Sub-components (for advanced composition)
export { MuseumFilterBar } from './MuseumFilterBar';
// Shell
export { MuseumShell } from './MuseumShell';
// Styles
export * from './museum-styles';
// Types
export type {
  MuseumExhibitDescriptor,
  MuseumFilter,
  MuseumGroup,
  MuseumPageConfig,
} from './types';
