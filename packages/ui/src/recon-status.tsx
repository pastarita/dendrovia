'use client';

import { useCallback, useEffect, useState } from 'react';

// --- Types (inline, operational metadata — not shared contracts) ---

type AxisScore = 0 | 1 | 2 | 3;

interface CheckoutStatus {
  name: string;
  branch: string;
  behind: number;
  ahead: number;
  drift: 'none' | 'low' | 'moderate' | 'high';
  alignment: 'current' | 'outdated' | 'diverged';
}

interface ReconData {
  timestamp: string;
  checkouts: CheckoutStatus[];
  shared: { alignment: 'current' | 'outdated' | 'diverged' };
  maturity: {
    axes: {
      contracts: AxisScore;
      events: AxisScore;
      topology: AxisScore;
      integration: AxisScore;
    };
    overall: number;
  };
}

// --- Hook ---

function useReconData() {
  const [data, setData] = useState<ReconData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/recon');
      if (!res.ok) {
        setData(null);
        return;
      }
      const json: ReconData = await res.json();
      setData(json);

      // Check staleness: >10 minutes old
      const age = Date.now() - new Date(json.timestamp).getTime();
      setStale(age > 10 * 60 * 1000);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, stale, refresh: fetchData };
}

// --- Helpers ---

function getStatusColor(checkout: CheckoutStatus): string {
  if (checkout.behind > 20 || checkout.drift === 'high') return '#EF4444'; // red
  if (checkout.behind > 10 || checkout.drift === 'moderate') return '#F59E0B'; // amber
  if (checkout.alignment === 'outdated' || checkout.drift === 'low') return '#EAB308'; // yellow
  return '#22C55E'; // green
}

function MaturityDots({ score }: { score: AxisScore }) {
  const filled = score;
  const empty = 3 - score;
  return (
    <span style={{ letterSpacing: '1px' }}>
      {'●'.repeat(filled)}
      {'○'.repeat(empty)}
    </span>
  );
}

// --- Component ---

export function ReconStatusBar({ currentPillar }: { currentPillar: string }) {
  const { data, loading, stale, refresh } = useReconData();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('/recon --json');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API may fail in non-secure contexts
    }
  };

  const current = data?.checkouts.find((c) => c.name.toUpperCase() === currentPillar.toUpperCase());

  // --- No data state ---
  if (!loading && !data) {
    return (
      <div
        style={{
          border: '1px dashed #444',
          borderRadius: '4px',
          padding: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          opacity: 0.6,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.25rem',
          }}
        >
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.65rem',
              opacity: 0.5,
            }}
          >
            Recon
          </span>
        </div>
        <div style={{ opacity: 0.5, marginBottom: '0.35rem' }}>No recon data</div>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: '1px solid #555',
            borderRadius: '3px',
            color: 'inherit',
            fontSize: '0.65rem',
            padding: '0.15rem 0.4rem',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          {copied ? '✓ copied' : 'copy /recon'}
        </button>
      </div>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div
        style={{
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          opacity: 0.35,
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
          }}
        >
          Recon
        </span>
        <div style={{ marginTop: '0.25rem' }}>Loading...</div>
      </div>
    );
  }

  // --- Normal / stale state ---
  const branch = current?.branch ?? '—';
  const truncatedBranch = branch.length > 14 ? `${branch.slice(0, 13)}…` : branch;
  const behind = current?.behind ?? 0;
  const axes = data!.maturity.axes;

  return (
    <div
      style={{
        border: `1px solid ${stale ? '#F59E0B55' : '#333'}`,
        borderRadius: '4px',
        padding: '0.5rem',
        marginBottom: '0.5rem',
        fontSize: '0.75rem',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.3rem',
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
            opacity: 0.5,
          }}
        >
          Recon
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {stale && (
            <span
              style={{
                fontSize: '0.6rem',
                color: '#F59E0B',
                fontWeight: 600,
              }}
            >
              stale
            </span>
          )}
          <button
            onClick={refresh}
            title="Refresh recon data"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: 0,
              opacity: 0.5,
              lineHeight: 1,
            }}
          >
            ↻
          </button>
        </span>
      </div>

      {/* Branch + status dot + behind count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          marginBottom: '0.2rem',
        }}
      >
        <span style={{ opacity: 0.8 }} title={branch}>
          {truncatedBranch}
        </span>
        {current && (
          <>
            <span style={{ color: getStatusColor(current), fontSize: '0.6rem' }}>●</span>
            <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>↓{behind}</span>
          </>
        )}
      </div>

      {/* Shared alignment */}
      <div style={{ opacity: 0.5, fontSize: '0.65rem', marginBottom: '0.3rem' }}>shared: {data!.shared.alignment}</div>

      {/* Maturity dots + overall score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.65rem',
        }}
      >
        <span style={{ display: 'flex', gap: '0.25rem', opacity: 0.7 }}>
          <MaturityDots score={axes.contracts} />
          <MaturityDots score={axes.events} />
          <MaturityDots score={axes.topology} />
          <MaturityDots score={axes.integration} />
        </span>
        <span style={{ fontWeight: 600, opacity: 0.8 }}>{data!.maturity.overall.toFixed(1)}</span>
      </div>
    </div>
  );
}
