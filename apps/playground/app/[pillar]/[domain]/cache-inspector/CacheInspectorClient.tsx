'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OrnateFrame } from '@dendrovia/oculus';
import { StorageQuotaBar } from './components/StorageQuotaBar';
import { CacheEntryTable } from './components/CacheEntryTable';
import { CacheActionToolbar } from './components/CacheActionToolbar';

type OperatusMod = typeof import('@dendrovia/operatus');
type CacheEntryInfo = import('@dendrovia/operatus').CacheEntryInfo;
type StorageQuota = import('@dendrovia/operatus').StorageQuota;

export function CacheInspectorClient() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<CacheEntryInfo[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [opfsActive, setOpfsActive] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const cacheRef = useRef<InstanceType<OperatusMod['CacheManager']> | null>(null);

  const refresh = useCallback(async () => {
    const cache = cacheRef.current;
    if (!cache) return;
    const [list, q, stats] = await Promise.all([
      cache.listEntries(),
      cache.getStorageQuota(),
      cache.stats(),
    ]);
    setEntries(list);
    setQuota(q);
    setOpfsActive(stats.opfsAvailable);
    setMemoryCount(stats.memory);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('@dendrovia/operatus').then(async (mod) => {
      if (cancelled) return;
      const cache = new mod.CacheManager();
      await cache.init();
      cacheRef.current = cache;
      setReady(true);
      await refresh();
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err));
    });
    return () => { cancelled = true; };
  }, [refresh]);

  if (error) {
    return <div style={{ marginTop: "2rem", color: "#ef4444" }}>Error: {error}</div>;
  }

  if (!ready) {
    return <div style={{ marginTop: "2rem", opacity: 0.5 }}>Initializing cache manager...</div>;
  }

  const cache = cacheRef.current!;
  const totalBytes = entries.reduce((sum, e) => sum + e.size, 0);
  const persistentCount = entries.length;
  const oldest = entries.length > 0
    ? entries.reduce((oldest, e) => new Date(e.cachedAt) < new Date(oldest.cachedAt) ? e : oldest).cachedAt
    : null;

  return (
    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <StorageQuotaBar quota={quota} opfsActive={opfsActive} />

      {/* Stats summary */}
      <OrnateFrame pillar="operatus" variant="compact">
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.85rem" }}>
          <Stat label="Memory entries" value={String(memoryCount)} />
          <Stat label="Persistent entries" value={String(persistentCount)} />
          <Stat label="Total size" value={formatBytes(totalBytes)} />
          {oldest && <Stat label="Oldest entry" value={timeAgo(oldest)} />}
        </div>
      </OrnateFrame>

      <CacheActionToolbar cache={cache} onRefresh={refresh} />
      <OrnateFrame pillar="operatus" variant="panel">
        <CacheEntryTable entries={entries} cache={cache} onRefresh={refresh} />
      </OrnateFrame>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ opacity: 0.4, fontSize: "0.7rem", textTransform: "uppercase" }}>{label}</span>
      <div style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

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
