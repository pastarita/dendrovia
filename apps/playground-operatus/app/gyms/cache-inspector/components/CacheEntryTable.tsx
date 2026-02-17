'use client';

import { useState } from 'react';

type OperatusMod = typeof import('@dendrovia/operatus');
type CacheEntryInfo = import('@dendrovia/operatus').CacheEntryInfo;

type SortKey = 'path' | 'size' | 'cachedAt';

const TIER_BADGE: Record<string, { bg: string; fg: string }> = {
  memory: { bg: '#1e3b1e', fg: '#86efac' },
  opfs: { bg: '#1e3a5f', fg: '#93c5fd' },
  idb: { bg: '#3b2d00', fg: '#fbbf24' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CacheEntryTable({
  entries,
  cache,
  onRefresh,
}: {
  entries: CacheEntryInfo[];
  cache: InstanceType<OperatusMod['CacheManager']>;
  onRefresh: () => Promise<void>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('path');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...entries].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'path') cmp = a.path.localeCompare(b.path);
    else if (sortKey === 'size') cmp = a.size - b.size;
    else if (sortKey === 'cachedAt') cmp = new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime();
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleInvalidate = async (path: string) => {
    await cache.delete(path);
    await onRefresh();
  };

  if (entries.length === 0) {
    return (
      <div
        style={{ padding: '2rem', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center', opacity: 0.4 }}
      >
        No cache entries. Use &quot;Seed Demo Data&quot; to populate.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <SortableTh label="Path" sortKey="path" active={sortKey} asc={sortAsc} onClick={toggleSort} />
            <SortableTh label="Size" sortKey="size" active={sortKey} asc={sortAsc} onClick={toggleSort} align="right" />
            <th style={thStyle}>Hash</th>
            <SortableTh label="Age" sortKey="cachedAt" active={sortKey} asc={sortAsc} onClick={toggleSort} />
            <th style={thStyle}>Tiers</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.path} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>{entry.path}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                {formatBytes(entry.size)}
              </td>
              <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono)', opacity: 0.5, fontSize: '0.75rem' }}>
                {entry.hash ? entry.hash.slice(0, 8) : '-'}
              </td>
              <td style={{ ...tdStyle, fontSize: '0.8rem', opacity: 0.6 }}>{timeAgo(entry.cachedAt)}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {entry.tiers.map((tier) => {
                    const style = TIER_BADGE[tier] ?? { bg: '#333', fg: '#aaa' };
                    return (
                      <span
                        key={tier}
                        style={{
                          fontSize: '0.6rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                          background: style.bg,
                          color: style.fg,
                        }}
                      >
                        {tier}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => handleInvalidate(entry.path)}
                  style={{
                    background: 'none',
                    border: '1px solid #4a2020',
                    borderRadius: '3px',
                    color: '#ef4444',
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.35rem',
                    cursor: 'pointer',
                  }}
                >
                  Invalidate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  active,
  asc,
  onClick,
  align,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  asc: boolean;
  onClick: (key: SortKey) => void;
  align?: string;
}) {
  const isActive = active === sortKey;
  return (
    <th style={{ ...thStyle, cursor: 'pointer', textAlign: (align ?? 'left') as any }} onClick={() => onClick(sortKey)}>
      {label} {isActive ? (asc ? '\u2191' : '\u2193') : ''}
    </th>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  opacity: 0.5,
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
};
