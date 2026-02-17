'use client';

/**
 * ZooShell — Main layout orchestrator.
 *
 * Accepts a ZooPageConfig and renders:
 *   header + filter bar + grid/list + inspector
 *
 * State: category filter, sort, view mode, selected exhibit,
 * and a per-exhibit control values map.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { PropControl, ZooPageConfig, ZooViewMode } from './types';
import { ZooExhibitCard } from './ZooExhibitCard';
import { ZooFilterBar } from './ZooFilterBar';
import { ZooInspector } from './ZooInspector';
import { emptyStateStyle } from './zoo-styles';

// ── Control values reducer ───────────────────────────

type ControlState = Record<string, Record<string, unknown>>;

type ControlAction =
  | { type: 'set'; exhibitId: string; key: string; value: unknown }
  | { type: 'init'; exhibitId: string; defaults: Record<string, unknown> };

function controlReducer(state: ControlState, action: ControlAction): ControlState {
  switch (action.type) {
    case 'set':
      return {
        ...state,
        [action.exhibitId]: {
          ...(state[action.exhibitId] ?? {}),
          [action.key]: action.value,
        },
      };
    case 'init':
      if (state[action.exhibitId]) return state;
      return { ...state, [action.exhibitId]: action.defaults };
  }
}

function defaultsFromControls(controls: PropControl[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const c of controls) {
    defaults[c.key] = c.defaultValue;
  }
  return defaults;
}

// ── Component ────────────────────────────────────────

interface ZooShellProps {
  config: ZooPageConfig;
}

export function ZooShell({ config }: ZooShellProps) {
  const [category, setCategory] = useState('all');
  const [sortId, setSortId] = useState(config.sortDimensions[0]?.id ?? 'name');
  const [viewMode, setViewMode] = useState<ZooViewMode>(config.defaultView ?? 'grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [controlValues, dispatch] = useReducer(controlReducer, {}, () => {
    const init: ControlState = {};
    for (const ex of config.exhibits) {
      init[ex.id] = defaultsFromControls(ex.controls);
    }
    return init;
  });

  // Filter + sort
  const sortDim = config.sortDimensions.find((s) => s.id === sortId) ?? config.sortDimensions[0];
  const filtered = useMemo(() => {
    let result = config.exhibits;
    if (category !== 'all') {
      result = result.filter((e) => e.category === category);
    }
    if (sortDim) {
      result = [...result].sort((a, b) => {
        const va = sortDim.accessor(a);
        const vb = sortDim.accessor(b);
        if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb);
        return (va as number) - (vb as number);
      });
    }
    return result;
  }, [config.exhibits, category, sortDim]);

  const selectedExhibit = config.exhibits.find((e) => e.id === selectedId) ?? null;

  // URL hash sync
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && config.exhibits.some((e) => e.id === hash)) {
      setSelectedId(hash);
    }
  }, [config.exhibits]);

  useEffect(() => {
    if (selectedId) {
      window.history.replaceState(null, '', `#${selectedId}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [selectedId]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedId) {
        setSelectedId(null);
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
      if (filtered.length === 0) return;

      const currentIndex = filtered.findIndex((ex) => ex.id === selectedId);

      if (e.key === 'Enter' && currentIndex === -1 && filtered.length > 0) {
        setSelectedId(filtered[0]!.id);
        e.preventDefault();
        return;
      }

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
      }

      if (nextIndex !== currentIndex) {
        setSelectedId(filtered[nextIndex]!.id);
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, filtered]);

  const handleControlChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      dispatch({ type: 'set', exhibitId: selectedId, key, value });
    },
    [selectedId],
  );

  // Responsive: detect narrow viewport
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1200px)');
    setIsNarrow(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div>
      {/* Header */}
      <Link href={config.backHref} style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; {config.backLabel}
      </Link>
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginTop: '1rem',
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>{config.icon}</span> {config.title}
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>{config.subtitle}</p>

      {/* Filter bar */}
      <ZooFilterBar
        categories={config.categories}
        activeCategory={category}
        onCategoryChange={setCategory}
        sortDimensions={config.sortDimensions}
        activeSort={sortId}
        onSortChange={setSortId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        exhibitCount={filtered.length}
      />

      {/* Main area: grid/list + inspector */}
      <div
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          gap: isNarrow ? '1.5rem' : 0,
        }}
      >
        {/* Grid / List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {filtered.map((exhibit) => (
                <ZooExhibitCard
                  key={exhibit.id}
                  exhibit={exhibit}
                  selected={selectedId === exhibit.id}
                  onClick={() => setSelectedId(selectedId === exhibit.id ? null : exhibit.id)}
                  viewMode={viewMode}
                  controlValues={controlValues[exhibit.id] ?? {}}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((exhibit) => (
                <ZooExhibitCard
                  key={exhibit.id}
                  exhibit={exhibit}
                  selected={selectedId === exhibit.id}
                  onClick={() => setSelectedId(selectedId === exhibit.id ? null : exhibit.id)}
                  viewMode={viewMode}
                  controlValues={controlValues[exhibit.id] ?? {}}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && <div style={emptyStateStyle}>No exhibits match the current filters</div>}
        </div>

        {/* Inspector */}
        {selectedExhibit && (
          <ZooInspector
            exhibit={selectedExhibit}
            controlValues={controlValues[selectedExhibit.id] ?? {}}
            onControlChange={handleControlChange}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
