/**
 * Museum Kit — Reusable layout system for read-only exhibition pages.
 *
 * Provides the standard museum shell with:
 * - Header + back navigation
 * - Filter tabs + text search
 * - Grouped master list with color-coded rows
 * - Sticky detail panel via render props
 */

// Shell
export { MuseumShell } from './MuseumShell';

// Sub-components (for advanced composition)
export { MuseumFilterBar } from './MuseumFilterBar';
export { MuseumExhibitRow } from './MuseumExhibitRow';
export { MuseumDetailPanel } from './MuseumDetailPanel';

// Types
export type {
  MuseumExhibitDescriptor,
  MuseumGroup,
  MuseumFilter,
  MuseumPageConfig,
} from './types';

// Styles
export * from './museum-styles';
