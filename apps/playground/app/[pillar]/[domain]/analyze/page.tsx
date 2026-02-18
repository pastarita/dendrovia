'use client';

import dynamic from 'next/dynamic';

const AnalyzeClient = dynamic(() => import('./AnalyzeClient'), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Analyze Pipeline...</div>,
});

export default function AnalyzePage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Analysis Pipeline
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>
        Analyze any public GitHub repository through the CHRONOS pipeline.
      </p>
      <AnalyzeClient />
    </div>
  );
}
