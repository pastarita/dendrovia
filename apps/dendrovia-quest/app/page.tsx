'use client';

/**
 * DENDROVIA QUEST — Playable Game Entry
 *
 * Three-phase flow:
 *   Phase 1 (Portal)   — GitHub URL input + character class selection
 *   Phase 2 (Pipeline) — CHRONOS analysis → IMAGINARIUM distillation (SSE)
 *   Phase 3 (Game)     — Full 3D world via DendroviaQuest component
 */

import type { CharacterClass } from '@dendrovia/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DendroviaQuest } from './components/DendroviaQuest';

// ── Types ──────────────────────────────────────────────────────

type Phase = 'portal' | 'pipeline' | 'game';

interface PipelineStep {
  step: string;
  message: string;
  repo?: string;
  outputDir?: string;
  manifestPath?: string;
  stats?: Record<string, number>;
}

interface ClassInfo {
  id: CharacterClass;
  label: string;
  archetype: string;
  color: string;
  desc: string;
  stats: { hp: number; atk: number; def: number; spd: number; mana: number };
}

// ── Character Classes ──────────────────────────────────────────

const CLASSES: ClassInfo[] = [
  {
    id: 'tank',
    label: 'TANK',
    archetype: 'Infrastructure Dev',
    color: '#3B82F6',
    desc: 'High HP, high DEF. Builds walls, deploys containers, locks mutexes.',
    stats: { hp: 150, atk: 5, def: 15, spd: 6, mana: 50 },
  },
  {
    id: 'healer',
    label: 'HEALER',
    archetype: 'Bug Fixer',
    color: '#22C55E',
    desc: 'High mana, support spells. Patches bugs, rolls back, garbage collects.',
    stats: { hp: 100, atk: 3, def: 8, spd: 8, mana: 100 },
  },
  {
    id: 'dps',
    label: 'DPS',
    archetype: 'Feature Dev',
    color: '#EF4444',
    desc: 'High ATK, glass cannon. SQL injections, fork bombs, buffer overflows.',
    stats: { hp: 80, atk: 15, def: 5, spd: 7, mana: 75 },
  },
];

// ── Pillar Server Links (preserved from original hub) ──────────

const PILLAR_SERVERS = [
  { name: 'ARCHITECTUS', port: 3011, icon: '🏛️', color: '#3B82F6' },
  { name: 'CHRONOS', port: 3012, icon: '📜', color: '#c77b3f' },
  { name: 'IMAGINARIUM', port: 3013, icon: '🎨', color: '#A855F7' },
  { name: 'LUDUS', port: 3014, icon: '🎮', color: '#EF4444' },
  { name: 'OCULUS', port: 3015, icon: '👁️', color: '#22C55E' },
  { name: 'OPERATUS', port: 3016, icon: '💾', color: '#6B7280' },
];

// ── Shared Styles ──────────────────────────────────────────────

const MONO = "'Courier New', monospace";
const BG = '#0a0a0a';
const FG = '#ededed';
const ACCENT = '#00ffcc';
const DIM = 'rgba(255,255,255,0.4)';

// ── SSE Reader ─────────────────────────────────────────────────

async function readSSE(
  url: string,
  body: Record<string, string>,
  onStep: (step: PipelineStep) => void,
): Promise<PipelineStep | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalStep: PipelineStep | null = null;

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
        const step: PipelineStep = JSON.parse(match[1] ?? '{}');
        onStep(step);
        if (step.step === 'complete' || step.step === 'distill-complete') {
          finalStep = step;
        }
        if (step.step === 'error') {
          throw new Error(step.message);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'skip') throw e;
      }
    }
  }

  return finalStep;
}

// ── Main Page Component ────────────────────────────────────────

export default function Home() {
  // Phase state
  const [phase, setPhase] = useState<Phase>('portal');

  // Portal state
  const [repoUrl, setRepoUrl] = useState('.');
  const [charClass, setCharClass] = useState<CharacterClass>('dps');
  const [charName, setCharName] = useState('Explorer');
  const [showPortals, setShowPortals] = useState(false);

  // Pipeline state
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineStats, setPipelineStats] = useState<Record<string, number> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Game state
  const [topologyPath, setTopologyPath] = useState<string | null>(null);
  const [manifestPath, setManifestPath] = useState<string | null>(null);

  // Auto-scroll pipeline log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [steps]);

  // ── Launch Pipeline ──────────────────────────────────────────

  const launchPipeline = useCallback(async () => {
    if (!repoUrl.trim()) return;
    setPhase('pipeline');
    setSteps([]);
    setPipelineError(null);
    setPipelineStats(null);

    try {
      // Phase 2a: CHRONOS analysis
      const chronosResult = await readSSE('/api/analyze', { url: repoUrl.trim() }, (step) => {
        setSteps((prev) => [...prev, step]);
      });

      if (!chronosResult?.outputDir) {
        setPipelineError('CHRONOS pipeline did not return an output directory.');
        return;
      }

      if (chronosResult.stats) {
        setPipelineStats(chronosResult.stats as Record<string, number>);
      }

      // Build the topology path for the results API
      const outputDir = chronosResult.outputDir;

      // Phase 2b: IMAGINARIUM distillation
      setSteps((prev) => [
        ...prev,
        { step: 'distill-start', message: 'Starting IMAGINARIUM distillation...' },
      ]);

      const distillResult = await readSSE('/api/distill', { topologyDir: outputDir }, (step) => {
        setSteps((prev) => [...prev, step]);
      });

      // Set paths for the game phase
      // The topology API path reads from the filesystem via /api/results
      setTopologyPath(`/api/results?dir=${encodeURIComponent(outputDir)}&file=topology.json`);

      if (distillResult?.manifestPath) {
        setManifestPath(distillResult.manifestPath);
      } else {
        // Fallback: use default manifest path relative to output
        setManifestPath(`${outputDir}/imaginarium/manifest.json`);
      }

      // Auto-transition to game
      setSteps((prev) => [...prev, { step: 'ready', message: 'Entering the Dendrite...' }]);
      setTimeout(() => setPhase('game'), 1500);
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : String(err));
    }
  }, [repoUrl]);

  // ── Phase 1: Portal ──────────────────────────────────────────

  if (phase === 'portal') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: BG,
          color: FG,
          fontFamily: MONO,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.15em', color: ACCENT }}>
            DENDROVIA
          </h1>
          <p style={{ opacity: 0.5, marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Autogamification of Codebase Archaeologization
          </p>
        </div>

        {/* URL Input */}
        <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.5rem' }}>
            Repository (GitHub URL, owner/repo, or . for self-portrait)
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && launchPipeline()}
            placeholder="https://github.com/owner/repo"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              color: FG,
              fontFamily: MONO,
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '0.7rem', opacity: 0.3, marginTop: '0.4rem' }}>
            Tip: &quot;.&quot; analyzes this monorepo (self-portrait mode)
          </div>
        </div>

        {/* Character Name */}
        <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.5rem' }}>
            Character Name
          </label>
          <input
            type="text"
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            placeholder="Explorer"
            style={{
              width: '100%',
              maxWidth: '280px',
              padding: '0.7rem 1rem',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              color: FG,
              fontFamily: MONO,
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Character Class Selection */}
        <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.75rem' }}>
            Choose Your Class
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setCharClass(cls.id)}
                style={{
                  padding: '1rem',
                  background: charClass === cls.id ? `${cls.color}15` : '#111',
                  border: `2px solid ${charClass === cls.id ? cls.color : '#222'}`,
                  borderRadius: '10px',
                  color: FG,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: MONO,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 700, color: cls.color, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {cls.label}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                  {cls.archetype}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.4, lineHeight: 1.4 }}>{cls.desc}</div>
                <div
                  style={{
                    marginTop: '0.6rem',
                    fontSize: '0.65rem',
                    opacity: 0.5,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.15rem',
                  }}
                >
                  <span>HP {cls.stats.hp}</span>
                  <span>ATK {cls.stats.atk}</span>
                  <span>DEF {cls.stats.def}</span>
                  <span>SPD {cls.stats.spd}</span>
                  <span>MP {cls.stats.mana}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={launchPipeline}
          disabled={!repoUrl.trim()}
          style={{
            padding: '1rem 3rem',
            background: repoUrl.trim() ? ACCENT : '#333',
            color: repoUrl.trim() ? '#000' : '#666',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '1rem',
            fontFamily: MONO,
            cursor: repoUrl.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.05em',
            marginBottom: '2.5rem',
          }}
        >
          Enter the Dendrite
        </button>

        {/* Dev Portals (collapsible) */}
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <button
            onClick={() => setShowPortals(!showPortals)}
            style={{
              background: 'none',
              border: 'none',
              color: DIM,
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: MONO,
              padding: '0.5rem 0',
            }}
          >
            {showPortals ? '[-]' : '[+]'} Dev Portals
          </button>
          {showPortals && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {PILLAR_SERVERS.map((p) => (
                <a
                  key={p.port}
                  href={`http://localhost:${p.port}`}
                  style={{
                    display: 'block',
                    padding: '0.5rem',
                    border: '1px solid #222',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: p.color,
                    opacity: 0.7,
                  }}
                >
                  {p.icon} {p.name}
                  <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>:{p.port}</div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Gym link */}
        <div style={{ marginTop: '1rem' }}>
          <a
            href="/gyms"
            style={{ color: DIM, fontSize: '0.7rem', fontFamily: MONO }}
          >
            Dendrite Observatory (2D) &rarr;
          </a>
        </div>
      </main>
    );
  }

  // ── Phase 2: Pipeline ────────────────────────────────────────

  if (phase === 'pipeline') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: BG,
          color: FG,
          fontFamily: MONO,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', color: ACCENT, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
          PIPELINE
        </h2>
        <p style={{ fontSize: '0.75rem', opacity: 0.4, marginBottom: '2rem' }}>
          CHRONOS &rarr; IMAGINARIUM
        </p>

        {/* Pipeline Log */}
        <div
          ref={logRef}
          style={{
            width: '100%',
            maxWidth: '700px',
            padding: '1rem',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '8px',
            fontSize: '0.8rem',
            maxHeight: '400px',
            overflow: 'auto',
            marginBottom: '1.5rem',
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '0.15rem 0',
                color: s.step === 'error'
                  ? '#ef4444'
                  : s.step === 'complete' || s.step === 'distill-complete'
                    ? '#22c55e'
                    : s.step === 'ready'
                      ? ACCENT
                      : s.step.startsWith('distill')
                        ? '#A855F7'
                        : '#c77b3f',
              }}
            >
              [{s.step}] {s.message}
            </div>
          ))}
          {!pipelineError && steps[steps.length - 1]?.step !== 'ready' && (
            <div style={{ color: '#c77b3f', opacity: 0.6 }}>...</div>
          )}
        </div>

        {/* Stats Summary */}
        {pipelineStats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.5rem',
              width: '100%',
              maxWidth: '700px',
              marginBottom: '1.5rem',
            }}
          >
            {Object.entries(pipelineStats).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #222',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: 0.4 }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c77b3f', marginTop: '0.15rem' }}>
                  {typeof value === 'number'
                    ? key === 'duration'
                      ? `${value.toFixed(1)}s`
                      : value.toLocaleString()
                    : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {pipelineError && (
          <div
            style={{
              width: '100%',
              maxWidth: '700px',
              padding: '1rem',
              background: '#1a0000',
              border: '1px solid #ef444444',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}
          >
            {pipelineError}
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => setPhase('portal')}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  color: FG,
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: '0.8rem',
                }}
              >
                Back to Portal
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── Phase 3: Game ────────────────────────────────────────────

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: BG }}>
      <DendroviaQuest
        topologyPath={topologyPath ?? undefined}
        manifestPath={manifestPath ?? '/generated/manifest.json'}
        enableOperatus={true}
        enableLudus={true}
        enableOculus={true}
        characterClass={charClass}
        characterName={charName || 'Explorer'}
      />

      {/* Back to Portal overlay button */}
      <button
        onClick={() => {
          setPhase('portal');
          setSteps([]);
          setPipelineError(null);
          setPipelineStats(null);
          setTopologyPath(null);
          setManifestPath(null);
        }}
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          padding: '0.4rem 0.8rem',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid #333',
          borderRadius: '6px',
          color: DIM,
          cursor: 'pointer',
          fontFamily: MONO,
          fontSize: '0.7rem',
          zIndex: 1000,
        }}
      >
        &larr; Portal
      </button>

      {/* Gym link */}
      <a
        href="/gyms"
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '7rem',
          padding: '0.4rem 0.8rem',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid #333',
          borderRadius: '6px',
          color: DIM,
          fontFamily: MONO,
          fontSize: '0.7rem',
          zIndex: 1000,
        }}
      >
        Observatory
      </a>
    </div>
  );
}
