/**
 * Museum Kit — Type definitions for read-only exhibition pages.
 *
 * Museums use the master-detail pattern: a filterable/searchable list
 * of typed exhibit descriptors where clicking one shows detail in a
 * sticky panel via a render prop.
 */

import type { ReactNode } from 'react';

/** A single exhibit item in a museum catalog. */
export interface MuseumExhibitDescriptor<T = unknown> {
  id: string;
  name: string;
  /** Grouping key (matches MuseumGroup.id) */
  group: string;
  /** Color dot for the row indicator */
  dotColor: string;
  /** Searchable text fields (case-insensitive substring match) */
  searchText: string;
  /** Badges shown inline on the row */
  badges: Array<{ label: string; color?: string }>;
  /** Arbitrary typed payload for detail rendering */
  data: T;
}

/** A group header for categorizing exhibits. */
export interface MuseumGroup {
  id: string;
  label: string;
}

/** A filter tab shown in the filter bar. */
export interface MuseumFilter {
  id: string;
  label: string;
  predicate: (item: MuseumExhibitDescriptor) => boolean;
}

/** Configuration for a museum page. */
export interface MuseumPageConfig<T = unknown> {
  title: string;
  subtitle: string;
  icon: string;
  backHref: string;
  backLabel: string;
  groups: MuseumGroup[];
  filters: MuseumFilter[];
  exhibits: MuseumExhibitDescriptor<T>[];
  /** Render function for the detail panel content */
  renderDetail: (item: MuseumExhibitDescriptor<T>) => ReactNode;
  /** Optional: render extra content below the detail */
  renderDetailFooter?: (item: MuseumExhibitDescriptor<T>) => ReactNode;
}
