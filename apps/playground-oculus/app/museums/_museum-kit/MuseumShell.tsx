'use client';

/**
 * MuseumShell — Main layout for museum pages.
 *
 * Provides the standard museum structure:
 *   Header (back link + title + subtitle)
 *   Filter bar (tabs + search)
 *   Master list (grouped items)
 *   Detail panel (sticky right, render prop)
 *
 * Handles filtering, searching, grouping, selection, and Escape to close.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MuseumDetailPanel } from './MuseumDetailPanel';
import { MuseumExhibitRow } from './MuseumExhibitRow';
import { MuseumFilterBar } from './MuseumFilterBar';
import { groupHeaderStyle } from './museum-styles';
import type { MuseumExhibitDescriptor, MuseumPageConfig } from './types';

interface MuseumShellProps<T = unknown> {
  config: MuseumPageConfig<T>;
}

export function MuseumShell<T>({ config }: MuseumShellProps<T>) {
  const { filters, groups, exhibits, renderDetail, renderDetailFooter } = config;

  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter + search
  const activeFilterObj = filters.find((f) => f.id === activeFilter);
  const filtered = useMemo(() => {
    let items = exhibits as MuseumExhibitDescriptor[];
    if (activeFilterObj) {
      items = items.filter(activeFilterObj.predicate);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((e) => e.searchText.toLowerCase().includes(q));
    }
    return items;
  }, [exhibits, activeFilterObj, searchQuery]);

  const selectedItem = exhibits.find((e) => e.id === selectedId) ?? null;

  // Group items
  const grouped = useMemo(() => {
    const map = new Map<string, MuseumExhibitDescriptor[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    // Preserve group order from config
    return groups.filter((g) => map.has(g.id)).map((g) => ({ group: g, items: map.get(g.id)! }));
  }, [filtered, groups]);

  // Keyboard: Escape closes detail
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div>
      {/* Header */}
      <Link href={config.backHref} style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; {config.backLabel}
      </Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        {config.icon} {config.title}
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>{config.subtitle}</p>

      {/* Filter bar */}
      <MuseumFilterBar
        filters={filters as MuseumPageConfig['filters']}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        visibleCount={filtered.length}
        exhibits={exhibits as MuseumExhibitDescriptor[]}
      />

      {/* Master-detail layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {grouped.map(({ group, items }) => (
            <div key={group.id}>
              <div style={groupHeaderStyle}>{group.label}</div>
              {items.map((item) => (
                <MuseumExhibitRow
                  key={item.id}
                  exhibit={item}
                  selected={selectedId === item.id}
                  onClick={() => handleSelect(item.id)}
                />
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>No items match your search</div>
          )}
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <MuseumDetailPanel
            footer={renderDetailFooter ? renderDetailFooter(selectedItem as MuseumExhibitDescriptor<T>) : undefined}
          >
            {renderDetail(selectedItem as MuseumExhibitDescriptor<T>)}
          </MuseumDetailPanel>
        )}
      </div>
    </div>
  );
}
