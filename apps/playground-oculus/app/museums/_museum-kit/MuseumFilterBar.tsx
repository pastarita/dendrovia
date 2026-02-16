'use client';

/**
 * MuseumFilterBar — Filter tabs + search input + item count.
 *
 * Provides text search across exhibit searchText fields and
 * tabbed filtering with auto-counted tabs.
 */

import type { MuseumFilter, MuseumExhibitDescriptor } from './types';
import { tabStyle, searchContainerStyle, searchInputStyle, countStyle } from './museum-styles';

interface MuseumFilterBarProps {
  filters: MuseumFilter[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Total visible items after filtering */
  visibleCount: number;
  /** All exhibits (for computing filter counts) */
  exhibits: MuseumExhibitDescriptor[];
}

export function MuseumFilterBar({
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  visibleCount,
  exhibits,
}: MuseumFilterBarProps) {
  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {filters.map((f) => {
          const count = exhibits.filter(f.predicate).length;
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              style={tabStyle(activeFilter === f.id)}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + count */}
      <div style={searchContainerStyle}>
        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Search:</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by name or key..."
          style={searchInputStyle}
        />
        <span style={countStyle}>{visibleCount} items</span>
      </div>
    </div>
  );
}
