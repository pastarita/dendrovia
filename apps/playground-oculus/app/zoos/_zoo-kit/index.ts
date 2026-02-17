/**
 * Zoo Kit — Reusable layout system for zoo pages.
 *
 * Usage:
 *   1. Define exhibits as ZooExhibitDescriptor[]
 *   2. Build a ZooPageConfig
 *   3. Render <ZooShell config={config} />
 */

export { PropPlayground } from './PropPlayground';
export type {
  ExhibitRenderProps,
  PropControl,
  ZooCategory,
  ZooExhibitDescriptor,
  ZooPageConfig,
  ZooSortDimension,
  ZooViewMode,
} from './types';
export { ZooExhibitCard } from './ZooExhibitCard';
export { ZooFilterBar } from './ZooFilterBar';
export { ZooInspector } from './ZooInspector';
export { ZooShell } from './ZooShell';

export {
  cardStyle,
  categoryBadgeStyle,
  countStyle,
  emptyStateStyle,
  inspectorStyle,
  listRowStyle,
  sectionHeaderStyle,
  tabStyle,
} from './zoo-styles';
