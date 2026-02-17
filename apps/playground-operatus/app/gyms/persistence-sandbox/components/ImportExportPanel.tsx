'use client';

import { useRef, useState } from 'react';

type OperatusMod = typeof import('@dendrovia/operatus');

export function ImportExportPanel({ mod, onImport }: { mod: OperatusMod; onImport: () => void }) {
  const [exportedJSON, setExportedJSON] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const json = await mod.exportSave('dendrovia-save');
      setExportedJSON(json);
      setStatus('Exported successfully');
    } catch (err) {
      setStatus(`Export error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDownload = () => {
    if (!exportedJSON) return;
    const blob = new Blob([exportedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dendrovia-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportText = async () => {
    if (!importText.trim()) return;
    try {
      await mod.importSave(importText);
      setStatus('Imported — reloading...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setStatus(`Import error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await mod.importSave(text);
      setStatus('Imported from file — reloading...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setStatus(`Import error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ padding: '1rem 1.25rem', border: '1px solid #222', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Import / Export</h3>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button onClick={handleExport} style={btnStyle}>
          Export to JSON
        </button>
        {exportedJSON && (
          <button onClick={handleDownload} style={btnStyle}>
            Download .json
          </button>
        )}
      </div>

      {exportedJSON && (
        <pre
          style={{
            background: '#111',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-geist-mono)',
            maxHeight: '150px',
            overflow: 'auto',
            marginBottom: '1rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {exportedJSON}
        </pre>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>
            Paste JSON to import
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '0.5rem',
              color: '#ededed',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-geist-mono)',
              resize: 'vertical',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={handleImportText} style={btnStyle}>
            Import Text
          </button>
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>
            Upload File
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {status && <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>{status}</div>}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  background: '#222',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#ededed',
  fontSize: '0.8rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
