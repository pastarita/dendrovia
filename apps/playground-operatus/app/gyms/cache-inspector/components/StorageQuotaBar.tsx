'use client';

import { OrnateFrame } from '@dendrovia/oculus';

type StorageQuota = import('@dendrovia/operatus').StorageQuota;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function StorageQuotaBar({ quota, opfsActive }: { quota: StorageQuota | null; opfsActive: boolean }) {
  return (
    <OrnateFrame pillar="operatus" variant="compact">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Storage Quota</span>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '3px',
            background: opfsActive ? '#1e3a5f' : '#3b2d00',
            color: opfsActive ? '#93c5fd' : '#fbbf24',
          }}
        >
          {opfsActive ? 'OPFS Active' : 'IDB Fallback'}
        </span>
      </div>

      {quota ? (
        <>
          <div
            style={{
              height: '8px',
              background: '#1a1a1a',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(quota.percentUsed, 100)}%`,
                background: quota.percentUsed > 90 ? '#ef4444' : quota.percentUsed > 70 ? '#d97706' : '#22c55e',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, fontFamily: 'var(--font-geist-mono)' }}>
            {formatBytes(quota.usage)} / {formatBytes(quota.quota)} ({quota.percentUsed.toFixed(2)}%)
          </div>
        </>
      ) : (
        <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>StorageManager API not available</div>
      )}
    </OrnateFrame>
  );
}
