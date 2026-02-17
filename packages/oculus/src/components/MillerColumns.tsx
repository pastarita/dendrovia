/**
 * MillerColumns — Three-column file tree navigator
 *
 * Selecting an item in column N populates column N+1 with its children.
 * Keyboard navigation: arrows to browse, Enter to select, Esc to close.
 */

import type { FileTreeNode, Hotspot } from '@dendrovia/shared';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { Panel } from './primitives/Panel';

const typeIcons: Record<string, string> = {
  directory: '\u{1F4C1}',
  file: '\u{1F4C4}',
  function: '\u{0192}',
  class: '\u{25C6}',
};

interface ColumnData {
  items: FileTreeNode[];
  selectedIndex: number;
}

function findNode(root: FileTreeNode, path: string): FileTreeNode | null {
  if (root.path === path) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, path);
      if (found) return found;
    }
  }
  return null;
}

function VirtualColumn({
  items,
  selectedIndex,
  onSelect,
  hotspotPaths,
  deepwikiPaths,
  columnIndex,
  activeColumnIndex,
}: {
  items: FileTreeNode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  hotspotPaths: Set<string>;
  deepwikiPaths: Set<string>;
  columnIndex: number;
  activeColumnIndex: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });

  const isActiveColumn = columnIndex === activeColumnIndex;

  return (
    <div
      ref={parentRef}
      className={`oculus-miller__column oculus-scrollable ${isActiveColumn ? 'oculus-miller__column--active' : ''}`}
      style={{
        flex: 1,
        minWidth: 0,
        borderRight: '1px solid var(--oculus-border)',
        position: 'relative',
      }}
      role="listbox"
      aria-label={`Column ${columnIndex + 1}`}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index]!;
          const isSelected = vItem.index === selectedIndex;
          const isHotspot = hotspotPaths.has(item.path);

          return (
            <div
              key={item.path}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(vItem.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: vItem.size,
                transform: `translateY(${vItem.start}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--oculus-space-xs)',
                padding: '0 var(--oculus-space-sm)',
                cursor: 'pointer',
                fontSize: 'var(--oculus-font-sm)',
                background: isSelected ? 'rgba(245, 169, 127, 0.15)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--oculus-amber)' : '2px solid transparent',
                color: isSelected ? 'var(--oculus-amber)' : 'var(--oculus-text)',
                transition: 'background var(--oculus-transition-fast)',
              }}
            >
              <span style={{ fontSize: 'var(--oculus-font-xs)', width: 16, textAlign: 'center' }}>
                {typeIcons[item.type] || typeIcons.file}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              {isHotspot && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--oculus-danger)',
                    flexShrink: 0,
                  }}
                  title="Hotspot"
                />
              )}
              {item.metadata?.complexity !== undefined && item.metadata.complexity > 10 && (
                <span style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-warning)' }}>
                  {item.metadata.complexity}
                </span>
              )}
              {deepwikiPaths.has(item.path) && (
                <span style={{ fontSize: 'var(--oculus-font-xs)' }} title="AI documentation available">
                  {'\u{1F4D6}'}
                </span>
              )}
              {item.type === 'directory' && item.children && (
                <span style={{ color: 'var(--oculus-text-muted)', fontSize: 'var(--oculus-font-xs)' }}>&rsaquo;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MillerColumns() {
  const topology = useOculusStore((s) => s.topology);
  const hotspots = useOculusStore((s) => s.hotspots);
  const deepwiki = useOculusStore((s) => s.deepwiki);
  const activePanel = useOculusStore((s) => s.activePanel);
  const togglePanel = useOculusStore((s) => s.togglePanel);
  const openCodeReader = useOculusStore((s) => s.openCodeReader);
  const millerSelection = useOculusStore((s) => s.millerSelection);
  const setMillerSelection = useOculusStore((s) => s.setMillerSelection);

  const [activeColumn, setActiveColumn] = useState(0);

  const hotspotPaths = useMemo(() => new Set(hotspots.map((h: Hotspot) => h.path)), [hotspots]);

  const deepwikiPaths = useMemo(
    () => new Set(deepwiki?.moduleDocumentation ? Object.keys(deepwiki.moduleDocumentation) : []),
    [deepwiki],
  );

  // Build columns from selection state
  const columns = useMemo<ColumnData[]>(() => {
    if (!topology) return [];

    const cols: ColumnData[] = [];
    const rootItems = topology.children || [];
    cols.push({ items: rootItems, selectedIndex: -1 });

    for (let i = 0; i < millerSelection.length && i < 2; i++) {
      const selectedPath = millerSelection[i];
      const col = cols[i]!;
      const parentItems = col.items;
      const selectedIdx = parentItems.findIndex((item) => item.path === selectedPath);
      col.selectedIndex = selectedIdx;

      if (selectedIdx >= 0) {
        const selectedNode = parentItems[selectedIdx]!;
        if (selectedNode.children && selectedNode.children.length > 0) {
          cols.push({ items: selectedNode.children, selectedIndex: -1 });
        }
      }
    }

    // Set last column's selected index
    if (millerSelection.length > 0 && cols.length > millerSelection.length) {
      const lastSelPath = millerSelection[millerSelection.length - 1];
      if (lastSelPath) {
        const lastCol = cols[cols.length - 1]!;
        const lastColItems = lastCol.items;
        const idx = lastColItems.findIndex((item) => item.path === lastSelPath);
        if (idx >= 0) lastCol.selectedIndex = idx;
      }
    }

    return cols;
  }, [topology, millerSelection]);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    if (!topology) return ['root'];
    const parts = [topology.name];
    for (const sel of millerSelection) {
      const node = findNode(topology, sel);
      if (node) parts.push(node.name);
    }
    return parts;
  }, [topology, millerSelection]);

  const handleSelect = useCallback(
    (colIndex: number, itemIndex: number) => {
      const col = columns[colIndex];
      if (!col) return;
      const item = col.items[itemIndex];
      if (!item) return;

      setActiveColumn(colIndex);

      // Update selection: trim to this column, then set
      const newSelection = millerSelection.slice(0, colIndex);
      newSelection[colIndex] = item.path;
      setMillerSelection(newSelection);

      // If file is selected, open code reader
      if (item.type === 'file') {
        openCodeReader(item.path, '', item.metadata?.language || 'typescript');
      }
    },
    [columns, millerSelection, setMillerSelection, openCodeReader],
  );

  // Keyboard navigation
  useEffect(() => {
    if (activePanel !== 'miller-columns') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const col = columns[activeColumn];
      if (!col) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIdx = Math.min(col.selectedIndex + 1, col.items.length - 1);
          handleSelect(activeColumn, nextIdx);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIdx = Math.max(col.selectedIndex - 1, 0);
          handleSelect(activeColumn, prevIdx);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (activeColumn < columns.length - 1) {
            setActiveColumn(activeColumn + 1);
            if (columns[activeColumn + 1]!.items.length > 0) {
              handleSelect(activeColumn + 1, 0);
            }
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (activeColumn > 0) {
            setActiveColumn(activeColumn - 1);
          }
          break;
        }
        case 'Escape':
          togglePanel('miller-columns');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, activeColumn, columns, handleSelect, togglePanel]);

  if (activePanel !== 'miller-columns') return null;

  return (
    <>
      <div className="oculus-backdrop" onClick={() => togglePanel('miller-columns')} />
      <Panel
        glow
        noPadding
        className="oculus-miller"
        aria-label="File browser"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(900px, 95vw)',
          height: '60vh',
          zIndex: 'var(--oculus-z-modal)',
          animation: 'oculus-slide-up var(--oculus-transition-dramatic)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--oculus-space-xs)',
            padding: 'var(--oculus-space-sm) var(--oculus-space-md)',
            borderBottom: '1px solid var(--oculus-border)',
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
          }}
          role="navigation"
          aria-label="Breadcrumb"
        >
          {/* Mobile back button */}
          <button
            className="oculus-miller__back-btn oculus-button"
            onClick={() => {
              if (activeColumn > 0) {
                setActiveColumn(activeColumn - 1);
                setMillerSelection(millerSelection.slice(0, activeColumn - 1));
              } else {
                togglePanel('miller-columns');
              }
            }}
            style={{ display: 'none', padding: '2px 8px', fontSize: 'var(--oculus-font-xs)' }}
            aria-label="Go back"
          >
            &larr;
          </button>

          {breadcrumb.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span style={i === breadcrumb.length - 1 ? { color: 'var(--oculus-amber)' } : undefined}>{part}</span>
            </React.Fragment>
          ))}

          <span style={{ flex: 1 }} />
          <button
            className="oculus-button"
            onClick={() => togglePanel('miller-columns')}
            style={{ padding: '2px 8px', fontSize: 'var(--oculus-font-xs)' }}
            aria-label="Close file browser"
          >
            Esc
          </button>
        </div>

        {/* Columns */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }} role="tree" aria-label="File tree">
          {columns.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--oculus-text-muted)',
              }}
            >
              No topology loaded
            </div>
          )}
          {columns.map((col, i) => (
            <VirtualColumn
              key={i}
              items={col.items}
              selectedIndex={col.selectedIndex}
              onSelect={(idx) => handleSelect(i, idx)}
              hotspotPaths={hotspotPaths}
              deepwikiPaths={deepwikiPaths}
              columnIndex={i}
              activeColumnIndex={activeColumn}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
