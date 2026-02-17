import { OrnateFrame } from '@dendrovia/oculus';
import Link from 'next/link';
import { loadTopologyData } from '../../../lib/load-data';

export default async function HotspotsPage() {
  const data = await loadTopologyData();
  const hotspots = data.hotspots?.hotspots ?? [];

  const maxRisk = Math.max(...hotspots.map((h) => h.riskScore), 0.001);

  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; Zoos
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>🔥 Hotspots</h1>
      <p style={{ opacity: 0.5, marginTop: '0.25rem', fontSize: '0.85rem' }}>
        {hotspots.length} files ranked by risk (churn x complexity)
      </p>

      <OrnateFrame pillar="chronos" variant="panel" style={{ marginTop: '1rem' }}>
        {hotspots.map((h, i) => {
          const riskPct = (h.riskScore / maxRisk) * 100;
          const riskColor =
            h.riskScore > 0.5 ? '#ef4444' : h.riskScore > 0.2 ? '#f59e0b' : h.riskScore > 0.05 ? '#c77b3f' : '#444';

          return (
            <div
              key={h.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              <span style={{ width: '30px', fontSize: '0.75rem', opacity: 0.3, textAlign: 'right' }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h.path}
                </div>
                <div
                  style={{
                    height: '4px',
                    background: '#1a1a1a',
                    borderRadius: '2px',
                    marginTop: '0.25rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${riskPct}%`,
                      height: '100%',
                      background: riskColor,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
              <span style={{ width: '60px', fontSize: '0.75rem', textAlign: 'right', opacity: 0.5 }}>
                churn: {h.churnRate}
              </span>
              <span style={{ width: '60px', fontSize: '0.75rem', textAlign: 'right', opacity: 0.5 }}>
                cx: {h.complexity}
              </span>
              <span
                style={{
                  width: '60px',
                  fontSize: '0.8rem',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: riskColor,
                }}
              >
                {h.riskScore.toFixed(3)}
              </span>
            </div>
          );
        })}
      </OrnateFrame>
    </div>
  );
}
