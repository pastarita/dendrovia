'use client';

/**
 * HomePortal — Main portal page client component.
 *
 * Composes DendriticBackground, world selection cards, class selection,
 * GitHub URL analysis, and the "Enter the World" gate button on a single page.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CharacterClass } from '@dendrovia/shared';
import { T, CLASSES, PILLAR_SERVERS, type WorldEntry } from '../lib/design-tokens';
import { DendriticBackground } from './DendriticBackground';
import { ClassCard } from './ClassCard';
import { WorldSelectionCard } from './WorldSelectionCard';

// ─── Types ──────────────────────────────────────────────────

interface PipelineStep {
  step: string;
  message: string;
  stats?: Record<string, number>;
  outputDir?: string;
  repo?: string;
}

interface HomePortalProps {
  worlds: WorldEntry[];
}

// ─── SSE Reader ─────────────────────────────────────────────

async function readSSE(
  url: string,
  body: Record<string, unknown>,
  onEvent: (data: Record<string, unknown>) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`SSE request failed: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, '').trim();
      if (!line) continue;
      try { onEvent(JSON.parse(line)); } catch { /* skip malformed */ }
    }
  }
}

// ─── Main Component ─────────────────────────────────────────

export function HomePortal({ worlds }: HomePortalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Selection state
  const [selectedWorld, setSelectedWorld] = useState<WorldEntry | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('dps');

  // Analysis state
  const [customUrl, setCustomUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<PipelineStep[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Dev portals
  const [showPortals, setShowPortals] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll pipeline log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [analysisSteps]);

  // ── Run Analysis ────────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    if (!customUrl.trim() || analyzing) return;
    setAnalyzing(true);
    setAnalysisSteps([]);
    setAnalysisError(null);

    try {
      await readSSE('/api/analyze', { url: customUrl.trim() }, (ev) => {
        const step: PipelineStep = {
          step: (ev.step as string) ?? 'info',
          message: (ev.message as string) ?? '',
          stats: ev.stats as Record<string, number> | undefined,
          outputDir: ev.outputDir as string | undefined,
          repo: ev.repo as string | undefined,
        };

        if (step.step === 'error') {
          setAnalysisError(step.message);
        }

        if (step.step === 'complete' && step.repo) {
          // Create a synthetic WorldEntry from the analysis result
          const parts = step.repo.split('/');
          const owner = parts[0] ?? 'local';
          const repo = parts[1] ?? step.repo;
          const slug = `${owner}/${repo}`;
          const stats = step.stats ?? {};
          const synthetic: WorldEntry = {
            slug,
            name: repo,
            owner,
            repo,
            description: `Freshly analyzed: ${step.repo}`,
            status: 'playable',
            stats: {
              fileCount: stats.fileCount ?? 0,
              commitCount: stats.commitCount ?? 0,
              hotspotCount: stats.hotspotCount ?? 0,
              contributorCount: stats.contributorCount ?? 0,
              languages: [],
            },
            magnitude: { score: 0, tier: 'unknown', symbol: '?' },
            tincture: { hex: T.chronos.primary, name: 'amber' },
            framePillar: 'chronos',
          };
          setSelectedWorld(synthetic);
        }

        setAnalysisSteps(prev => [...prev, step]);
      });
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  }, [customUrl, analyzing]);

  // ── Enter World ─────────────────────────────────────────────

  const canEnter = selectedWorld !== null;

  const handleEnter = useCallback(() => {
    if (!selectedWorld) return;
    router.push(`/worlds/${selectedWorld.slug}?class=${selectedClass}`);
  }, [selectedWorld, selectedClass, router]);

  // ── Input style ─────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.65rem 0.9rem',
    background: '#ffffff06',
    border: `1px solid ${T.stone}50`,
    borderRadius: 6,
    color: T.parchment,
    fontFamily: "'Courier New', monospace",
    fontSize: '0.85rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <>
      <DendriticBackground />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            width: '100%',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          {/* ── Title ── */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, maxWidth: 80, height: 1, background: `linear-gradient(to right, transparent, ${T.stone}60)` }} />
              <svg viewBox="0 0 20 20" width="12" height="12" style={{ opacity: 0.3 }}>
                <circle cx="10" cy="10" r="3" fill={T.parchment} />
                <circle cx="10" cy="10" r="6" fill="none" stroke={T.parchment} strokeWidth="1" />
              </svg>
              <div style={{ flex: 1, maxWidth: 80, height: 1, background: `linear-gradient(to left, transparent, ${T.stone}60)` }} />
            </div>

            <h1
              style={{
                fontSize: '2.8rem', fontWeight: 300, letterSpacing: '0.35em',
                color: T.parchment, fontFamily: "'Courier New', monospace",
                margin: 0, textShadow: `0 0 40px ${T.architectus.shadow}60`,
              }}
            >
              DENDROVIA
            </h1>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: T.stone, marginTop: 6, textTransform: 'uppercase' }}>
              Autogamification of Codebase Archaeologization
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <div style={{ width: 60, height: 1, background: `linear-gradient(to right, transparent, ${T.stone}40)` }} />
              <div style={{ width: 4, height: 4, borderRadius: 1, transform: 'rotate(45deg)', background: T.stone, opacity: 0.3 }} />
              <div style={{ width: 60, height: 1, background: `linear-gradient(to left, transparent, ${T.stone}40)` }} />
            </div>
          </div>

          {/* ── Repository Section ── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.15em', color: T.stoneLight, marginBottom: 10, textTransform: 'uppercase' }}>
              Select a World
            </label>

            {/* World selection cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
              {worlds.map((world, i) => (
                <WorldSelectionCard
                  key={world.slug}
                  world={world}
                  selected={selectedWorld?.slug === world.slug}
                  onClick={() => setSelectedWorld(selectedWorld?.slug === world.slug ? null : world)}
                  index={i}
                />
              ))}
              {worlds.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.3, fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.8rem' }}>
                  No worlds analyzed yet
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: 1, background: `${T.stone}30` }} />
              <span style={{ fontSize: '0.6rem', color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                or analyze a new repository
              </span>
              <div style={{ flex: 1, height: 1, background: `${T.stone}30` }} />
            </div>

            {/* URL input */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
                placeholder="https://github.com/owner/repo or owner/repo"
                disabled={analyzing}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = T.chronos.primary + '60';
                  e.target.style.boxShadow = `0 0 12px ${T.chronos.shadow}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = T.stone + '50';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={runAnalysis}
                disabled={analyzing || !customUrl.trim()}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: analyzing ? '#333' : T.chronos.primary,
                  color: analyzing ? '#666' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: analyzing ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                }}
              >
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {/* Pipeline log */}
            {analysisSteps.length > 0 && (
              <div
                ref={logRef}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#ffffff04',
                  border: `1px solid ${T.stone}30`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.7rem',
                  maxHeight: 160,
                  overflowY: 'auto',
                  lineHeight: 1.7,
                }}
              >
                {analysisSteps.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      color: s.step === 'error' ? T.dps.color
                        : s.step === 'complete' ? T.ludus.active
                        : T.chronos.primary,
                    }}
                  >
                    [{s.step}] {s.message}
                  </div>
                ))}
                {analyzing && (
                  <div style={{ color: T.chronos.primary, opacity: 0.6 }}>...</div>
                )}
              </div>
            )}

            {/* Analysis error */}
            {analysisError && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: '#1a0000',
                border: '1px solid #ef444444',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
              }}>
                {analysisError}
              </div>
            )}
          </div>

          {/* ── Class Section ── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.15em', color: T.stoneLight, marginBottom: 12, textTransform: 'uppercase' }}>
              Class
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {CLASSES.map((c) => (
                <ClassCard
                  key={c.id}
                  classData={c}
                  selected={selectedClass === c.id}
                  onClick={() => setSelectedClass(c.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Enter the World Button ── */}
          <button
            disabled={!canEnter}
            onClick={handleEnter}
            className={canEnter ? 'enter-button-active' : ''}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: canEnter
                ? `linear-gradient(135deg, ${T.architectus.shadow} 0%, ${T.bgDeep} 50%, ${T.chronos.shadow} 100%)`
                : '#ffffff06',
              border: `1px solid ${canEnter ? T.parchment + '30' : '#ffffff10'}`,
              borderRadius: 6,
              color: canEnter ? T.parchment : T.stone,
              fontFamily: "'Courier New', monospace",
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              cursor: canEnter ? 'pointer' : 'not-allowed',
              opacity: canEnter ? 1 : 0.4,
              transition: 'all 0.3s',
              textTransform: 'uppercase',
            }}
          >
            Enter the World
          </button>

          {/* ── Browse Library Link ── */}
          {worlds.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a
                href="/worlds"
                className="browse-worlds-link"
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: T.chronos.primary,
                  opacity: 0.5,
                  transition: 'opacity 150ms',
                }}
              >
                Browse World Library &rarr;
              </a>
            </div>
          )}

          {/* ── Dev Portals ── */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowPortals(!showPortals)}
              style={{
                background: 'none', border: 'none', color: T.stone, cursor: 'pointer',
                fontFamily: "'Courier New', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', opacity: 0.5,
              }}
            >
              {showPortals ? '- pillar playgrounds -' : '+ pillar playgrounds +'}
            </button>
            {showPortals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.75rem' }}>
                {PILLAR_SERVERS.map((p) => (
                  <a
                    key={p.name}
                    href={`http://localhost:${p.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.35rem', background: '#ffffff04',
                      border: `1px solid ${p.color}20`, borderRadius: 4,
                      color: p.color, textDecoration: 'none',
                      fontSize: '0.6rem', textAlign: 'center', opacity: 0.6, transition: 'opacity 0.2s',
                    }}
                  >
                    {p.name}
                    <div style={{ fontSize: '0.5rem', opacity: 0.5 }}>:{p.port}</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '2rem', opacity: 0.15, fontSize: '0.6rem', textAlign: 'center', fontFamily: 'var(--font-geist-mono), monospace' }}>
            Six-Pillar Architecture
          </footer>
        </div>
      </div>
    </>
  );
}
