/**
 * CodeReader — Syntax-highlighted read-only code viewer
 *
 * Displays file content with line numbers, metadata header,
 * and hotspot line highlighting. Blurs background when open.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { useOculusStore } from '../store/useOculusStore';
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

export function CodeReader() {
  const codeReader = useOculusStore((s) => s.codeReader);
  const activePanel = useOculusStore((s) => s.activePanel);
  const closeCodeReader = useOculusStore((s) => s.closeCodeReader);
  const hotspots = useOculusStore((s) => s.hotspots);

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
          <button
            className="oculus-button"
            onClick={closeCodeReader}
            aria-label="Close code viewer"
          >
            Close
          </button>
        </div>

        {/* ── Code Content ───────────────────────── */}
        <div
          className="oculus-scrollable oculus-code"
          style={{ flex: 1, padding: 0 }}
          role="region"
          aria-label="Source code"
          tabIndex={0}
        >
          {codeReader.content ? (
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
              Loading...
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
