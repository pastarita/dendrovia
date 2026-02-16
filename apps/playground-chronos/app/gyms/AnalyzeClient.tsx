'use client';

/**
 * AnalyzeClient — GitHub URL input + pipeline runner + results viewer
 *
 * Connects to POST /api/analyze via SSE for real-time progress,
 * then renders the output manifest with syntax highlighting.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface PipelineStep {
  step: string;
  message: string;
  stats?: Record<string, number>;
  repo?: string;
  outputDir?: string;
  writtenFiles?: string[];
  deepwikiAvailable?: boolean;
}

interface RegistryEntry {
  owner: string;
  repo: string;
  analyzedAt: string;
  headHash: string;
  stats: { commitCount: number; fileCount: number; hotspotCount: number; languageCount: number };
  deepwikiAvailable: boolean;
  outputDir: string;
  status: string;
}

// ── JSON Syntax Highlighter ─────────────────────────────────────────────────

function highlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:\\.|[^"\\])*")\s*:/g,
      '<span style="color:#c77b3f">$1</span>:'
    )
    .replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      ': <span style="color:#22c55e">$1</span>'
    )
    .replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span style="color:#3b82f6">$1</span>'
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span style="color:#a855f7">$1</span>'
    )
    .replace(
      /:\s*(null)/g,
      ': <span style="color:#6b7280">$1</span>'
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AnalyzeClient() {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<PipelineStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);

  // Output viewer state
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<unknown>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);

  // Load registry on mount
  useEffect(() => {
    fetch('/api/registry')
      .then(r => r.json())
      .then(data => setRegistry(data.entries ?? []))
      .catch(() => {});
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [steps]);

  // Load file list when outputDir changes
  useEffect(() => {
    if (!outputDir) return;
    fetch(`/api/results?dir=${encodeURIComponent(outputDir)}`)
      .then(r => r.json())
      .then(data => {
        setAvailableFiles(data.files ?? []);
        // Auto-select topology.json if available
        if (data.files?.includes('topology.json')) {
          loadFile(outputDir, 'topology.json');
        }
      })
      .catch(() => {});
  }, [outputDir]);

  const loadFile = useCallback(async (dir: string, filename: string) => {
    setSelectedFile(filename);
    setFileLoading(true);
    try {
      const res = await fetch(`/api/results?dir=${encodeURIComponent(dir)}&file=${encodeURIComponent(filename)}`);
      const data = await res.json();
      setFileContent(data.content ?? data.error);
    } catch (err) {
      setFileContent({ error: String(err) });
    } finally {
      setFileLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!url.trim() || running) return;
    setRunning(true);
    setSteps([]);
    setResult(null);
    setError(null);
    setOutputDir(null);
    setAvailableFiles([]);
    setSelectedFile(null);
    setFileContent(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status}: ${res.statusText}`);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/);
          if (!match) continue;
          try {
            const step: PipelineStep = JSON.parse(match[1]);
            if (step.step === 'error') {
              setError(step.message);
            } else if (step.step === 'complete') {
              setResult(step);
              if (step.outputDir) setOutputDir(step.outputDir);
            }
            setSteps(prev => [...prev, step]);
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }, [url, running]);

  const loadFromRegistry = useCallback((entry: RegistryEntry) => {
    setUrl(`${entry.owner}/${entry.repo}`);
    setOutputDir(entry.outputDir);
    setResult({
      step: 'complete',
      message: 'Loaded from registry',
      repo: `${entry.owner}/${entry.repo}`,
      outputDir: entry.outputDir,
      stats: entry.stats,
      deepwikiAvailable: entry.deepwikiAvailable,
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Input Form */}
      <div style={{
        padding: '1.5rem',
        border: '1px solid #333',
        borderRadius: '8px',
        background: '#111',
      }}>
        <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.5rem' }}>
          GitHub Repository URL or owner/repo
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            placeholder="https://github.com/facebook/react or facebook/react"
            disabled={running}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#ededed',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={runAnalysis}
            disabled={running || !url.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: running ? '#333' : '#c77b3f',
              color: running ? '#666' : '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
            }}
          >
            {running ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Previously Analyzed Repos */}
      {registry.length > 0 && !result && (
        <div>
          <h3 style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '0.5rem' }}>Previously Analyzed</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {registry.map(entry => (
              <button
                key={`${entry.owner}/${entry.repo}`}
                onClick={() => loadFromRegistry(entry)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#c77b3f',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                {entry.owner}/{entry.repo}
                <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>
                  {entry.stats.fileCount}f / {entry.stats.commitCount}c
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Log */}
      {steps.length > 0 && (
        <div
          ref={logRef}
          style={{
            padding: '1rem',
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '8px',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            maxHeight: '200px',
            overflow: 'auto',
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '0.2rem 0',
                color: s.step === 'error' ? '#ef4444'
                  : s.step === 'complete' ? '#22c55e'
                  : '#c77b3f',
              }}
            >
              [{s.step}] {s.message}
            </div>
          ))}
          {running && (
            <div style={{ color: '#c77b3f', animation: 'pulse 1s infinite' }}>
              ...
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#1a0000',
          border: '1px solid #ef444444',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
        }}>
          {error}
        </div>
      )}

      {/* Results Summary */}
      {result && result.stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}>
          {Object.entries(result.stats).map(([key, value]) => (
            <div key={key} style={{
              padding: '0.75rem',
              border: '1px solid #222',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.4 }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#c77b3f', marginTop: '0.25rem' }}>
                {typeof value === 'number' ? (key === 'duration' ? `${value.toFixed(1)}s` : value.toLocaleString()) : value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Output File Viewer */}
      {availableFiles.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Output Manifest
          </h3>

          {/* File Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {availableFiles.map(f => (
              <button
                key={f}
                onClick={() => outputDir && loadFile(outputDir, f)}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: selectedFile === f ? '#c77b3f22' : '#1a1a1a',
                  border: `1px solid ${selectedFile === f ? '#c77b3f' : '#333'}`,
                  borderRadius: '4px',
                  color: selectedFile === f ? '#c77b3f' : '#888',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* File Content */}
          {fileLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>Loading...</div>
          ) : fileContent ? (
            <div style={{
              background: '#0d0d0d',
              border: '1px solid #222',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '600px',
            }}>
              <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid #222',
                fontSize: '0.75rem',
                opacity: 0.4,
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>{selectedFile}</span>
                <span>{JSON.stringify(fileContent).length.toLocaleString()} chars</span>
              </div>
              <pre
                style={{
                  padding: '1rem',
                  margin: 0,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightJSON(JSON.stringify(fileContent, null, 2)),
                }}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
