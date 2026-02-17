'use client';

interface MycologyInfo {
  specimens: string;
  network: string;
  assetDir: string;
  specimenCount: number;
}

export function MycologySection({ mycology }: { mycology: MycologyInfo }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Mycology</h2>
      <div
        style={{
          padding: '1rem 1.25rem',
          border: '1px solid #222',
          borderRadius: '8px',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <Field label="Specimens" value={String(mycology.specimenCount)} />
        <Field label="Network Path" value={mycology.network} mono />
        <Field label="Specimens Path" value={mycology.specimens} mono />
        <Field label="Asset Directory" value={mycology.assetDir} mono />
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.4 }}>{label}</div>
      <div
        style={{
          fontSize: '0.9rem',
          marginTop: '0.15rem',
          fontFamily: mono ? 'var(--font-geist-mono)' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
