'use client';

/**
 * ZooFilterBar — Category tabs + sort dropdown + view mode toggle + count.
 */

import type { ZooCategory, ZooSortDimension, ZooViewMode } from './types';
import { tabStyle, countStyle } from './zoo-styles';

interface ZooFilterBarProps {
  categories: ZooCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  sortDimensions: ZooSortDimension[];
  activeSort: string;
  onSortChange: (id: string) => void;
  viewMode: ZooViewMode;
  onViewModeChange: (mode: ZooViewMode) => void;
  exhibitCount: number;
}

export function ZooFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  sortDimensions,
  activeSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  exhibitCount,
}: ZooFilterBarProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          style={tabStyle(activeCategory === 'all')}
          onClick={() => onCategoryChange('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            style={tabStyle(activeCategory === cat.id)}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + view mode + count */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          Sort:
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '0.3rem 0.5rem',
              color: 'inherit',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {sortDimensions.map((sd) => (
              <option key={sd.id} value={sd.id}>{sd.label}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            style={tabStyle(viewMode === 'grid')}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
          >
            Grid
          </button>
          <button
            type="button"
            style={tabStyle(viewMode === 'list')}
            onClick={() => onViewModeChange('list')}
            title="List view"
          >
            List
          </button>
        </div>

        <span style={countStyle}>
          {exhibitCount} exhibit{exhibitCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
