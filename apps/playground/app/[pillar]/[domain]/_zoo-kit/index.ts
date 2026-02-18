/**
 * Zoo Kit — Reusable layout system for zoo pages.
 *
 * Usage:
 *   1. Define exhibits as ZooExhibitDescriptor[]
 *   2. Build a ZooPageConfig
 *   3. Render <ZooShell config={config} />
 */

export { ZooShell } from './ZooShell';
export { ZooFilterBar } from './ZooFilterBar';
export { ZooExhibitCard } from './ZooExhibitCard';
export { ZooInspector } from './ZooInspector';
export { PropPlayground } from './PropPlayground';

export type {
  ZooViewMode,
  ZooCategory,
  ZooSortDimension,
  PropControl,
  ExhibitRenderProps,
  ZooExhibitDescriptor,
  ZooPageConfig,
} from './types';

export {
  tabStyle,
  cardStyle,
  listRowStyle,
  inspectorStyle,
  sectionHeaderStyle,
  categoryBadgeStyle,
  emptyStateStyle,
  countStyle,
} from './zoo-styles';
