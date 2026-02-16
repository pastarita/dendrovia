/**
 * CodeReader — Syntax-highlighted read-only code viewer
 *
 * Displays file content with line numbers, metadata header,
 * and hotspot line highlighting. Blurs background when open.
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { useCodeLoader } from '../hooks/useCodeLoader';
import { Panel } from './primitives/Panel';
import { IconBadge } from './primitives/IconBadge';
import { StatLabel } from './primitives/StatLabel';

const langIcons: Record<string, string> = {
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  rust: 'RS',
  go: 'GO',
  css: 'CS',
  html: 'HT',
  json: 'JN',
  markdown: 'MD',
};

interface CodeLine {
  number: number;
  content: string;
  isHotspot: boolean;
}

function parseLines(content: string, hotspotLines?: Set<number>): CodeLine[] {
  return content.split('\n').map((line, i) => ({
    number: i + 1,
    content: line,
    isHotspot: hotspotLines?.has(i + 1) || false,
  }));
}

export interface CodeReaderProps {
  /** Options forwarded to the useCodeLoader hook */
  codeLoaderOptions?: {
    baseUrl?: string;
    fetchContent?: (filePath: string) => Promise<string>;
  };
}

export function CodeReader({ codeLoaderOptions }: CodeReaderProps = {}) {
  const codeReader = useOculusStore((s) => s.codeReader);
  const activePanel = useOculusStore((s) => s.activePanel);
  const closeCodeReader = useOculusStore((s) => s.closeCodeReader);
  const hotspots = useOculusStore((s) => s.hotspots);
  const deepwiki = useOculusStore((s) => s.deepwiki);

  const [docsExpanded, setDocsExpanded] = useState(false);

  // Automatically fetch file content when filePath is set without content
  useCodeLoader(codeLoaderOptions);

  // Find hotspot for this file
  const fileHotspot = useMemo(
    () => hotspots.find((h) => h.path === codeReader.filePath),
    [hotspots, codeReader.filePath]
  );

  const lines = useMemo(() => {
    if (!codeReader.content) return [];
    return parseLines(codeReader.content);
  }, [codeReader.content]);

  // Keyboard: Esc to close
  useEffect(() => {
    if (activePanel !== 'code-reader') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCodeReader();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, closeCodeReader]);

  const deepwikiDoc = useMemo(
    () => codeReader.filePath ? deepwiki?.moduleDocumentation?.[codeReader.filePath] : undefined,
    [deepwiki, codeReader.filePath]
  );

  if (activePanel !== 'code-reader' || !codeReader.filePath) return null;

  const fileName = codeReader.filePath.split('/').pop() || codeReader.filePath;
  const langIcon = langIcons[codeReader.language] || '??';
  const loc = lines.length;

  return (
    <>
      <div className="oculus-backdrop" onClick={closeCodeReader} />
      <Panel
        glow
        noPadding
        className="oculus-code-reader"
        aria-label="Code viewer"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(850px, 92vw)',
          height: '75vh',
          zIndex: 'var(--oculus-z-modal)',
          animation: 'oculus-scale-in var(--oculus-transition-dramatic)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--oculus-space-sm)',
            padding: 'var(--oculus-space-md) var(--oculus-space-lg)',
            borderBottom: '1px solid var(--oculus-border)',
            background: 'rgba(245, 169, 127, 0.05)',
          }}
        >
          <IconBadge icon={langIcon} label={codeReader.language} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: 'var(--oculus-amber)',
              fontSize: 'var(--oculus-font-sm)',
              fontFamily: 'var(--oculus-font-code)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {codeReader.filePath}
            </div>
            <div style={{ display: 'flex', gap: 'var(--oculus-space-md)', fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)' }}>
              <span>{loc} lines</span>
              <span>{codeReader.language}</span>
              {fileHotspot && (
                <span style={{ color: 'var(--oculus-danger)' }}>
                  Risk: {fileHotspot.riskScore.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          {deepwikiDoc && (
            <button
              className="oculus-button"
              onClick={() => setDocsExpanded((v) => !v)}
              aria-label={docsExpanded ? 'Collapse documentation' : 'Expand documentation'}
              style={{ fontSize: 'var(--oculus-font-xs)' }}
            >
              {docsExpanded ? '\u{1F4D6} Docs' : '\u{1F4D6} Docs'}
            </button>
          )}
          <button
            className="oculus-button"
            onClick={closeCodeReader}
            aria-label="Close code viewer"
          >
            Close
          </button>
        </div>

        {/* ── DeepWiki Documentation ──────────────── */}
        {deepwikiDoc && docsExpanded && (
          <div
            style={{
              padding: 'var(--oculus-space-sm) var(--oculus-space-lg)',
              background: 'rgba(245, 169, 127, 0.03)',
              borderBottom: '1px solid var(--oculus-border)',
              maxHeight: 200,
              overflowY: 'auto',
              fontSize: 'var(--oculus-font-sm)',
              whiteSpace: 'pre-wrap',
              color: 'var(--oculus-text-muted)',
              lineHeight: 1.5,
            }}
            role="region"
            aria-label="AI documentation"
          >
            {deepwikiDoc}
          </div>
        )}

        {/* ── Code Content ───────────────────────── */}
        <div
          className="oculus-scrollable oculus-code"
          style={{ flex: 1, padding: 0 }}
          role="region"
          aria-label="Source code"
          tabIndex={0}
        >
          {codeReader.loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--oculus-text-muted)',
              gap: 'var(--oculus-space-sm)',
            }}>
              <div
                className="oculus-code-reader__spinner"
                style={{
                  width: 24,
                  height: 24,
                  border: '2px solid var(--oculus-border)',
                  borderTop: '2px solid var(--oculus-amber)',
                  borderRadius: '50%',
                  animation: 'oculus-spin 0.8s linear infinite',
                }}
                role="status"
                aria-label="Loading file content"
              />
              <span>Loading {fileName}...</span>
            </div>
          ) : codeReader.error && !codeReader.content ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--oculus-danger, #ff4444)',
              gap: 'var(--oculus-space-sm)',
              padding: 'var(--oculus-space-lg)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 'var(--oculus-font-md)' }}>Failed to load file</span>
              <span style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)' }}>
                {codeReader.error}
              </span>
            </div>
          ) : codeReader.content ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--oculus-font-code)',
                fontSize: 'var(--oculus-font-sm)',
                lineHeight: 1.6,
              }}
            >
              <tbody>
                {lines.map((line) => (
                  <tr
                    key={line.number}
                    style={{
                      background: line.isHotspot
                        ? 'rgba(255, 68, 68, 0.08)'
                        : undefined,
                    }}
                  >
                    <td
                      style={{
                        width: 50,
                        textAlign: 'right',
                        padding: '0 var(--oculus-space-sm)',
                        color: 'var(--oculus-text-muted)',
                        opacity: 0.5,
                        userSelect: 'none',
                        borderRight: '1px solid var(--oculus-border)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      aria-hidden="true"
                    >
                      {line.number}
                    </td>
                    <td
                      style={{
                        padding: '0 var(--oculus-space-md)',
                        whiteSpace: 'pre',
                        overflow: 'hidden',
                      }}
                    >
                      {line.content}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--oculus-text-muted)',
            }}>
              No content available
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
