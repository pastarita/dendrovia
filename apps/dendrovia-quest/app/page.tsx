'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DendroviaQuest } from './components/DendroviaQuest';
import type { CharacterClass } from '@dendrovia/shared';

// ─── Types ──────────────────────────────────────────────────

type Phase = 'portal' | 'pipeline' | 'game';

interface LogEntry {
  step: string;
  message: string;
  ts: number;
}

interface PipelineResult {
  topologyDir: string;
  manifestPath: string;
  stats: Record<string, unknown>;
}

// ─── Design Tokens (from SYMBOL_DRIVEN_DESIGN_SYSTEM.md) ───

const T = {
  // Core palette
  bg: '#0d0b0a',
  bgDeep: '#070605',
  parchment: '#f5e6d3',
  stone: '#4a4543',
  stoneLight: '#6b6563',

  // Pillar palettes
  chronos: { primary: '#d4a574', secondary: '#8b7355', accent: '#e8d7c3', shadow: '#4a3822', active: '#dda15e' },
  architectus: { primary: '#8ab4f8', secondary: '#5a8dd8', accent: '#c8e0ff', shadow: '#1e3a5f', active: '#5dbaff' },
  ludus: { primary: '#81c995', secondary: '#5fa876', accent: '#b8e6c9', shadow: '#2d4d3a', active: '#5ff59f' },
  imaginarium: { primary: '#c6a0f6', secondary: '#9b6dd8', accent: '#e5d4ff', shadow: '#4a2d5f' },
  oculus: { primary: '#f5a97f', secondary: '#d88957', accent: '#ffd4b8' },
  operatus: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db', shadow: '#374151' },

  // Class-specific (mapped to pillar essences)
  tank: { color: '#8ab4f8', glow: '#5a8dd822', border: '#5a8dd8', bg: '#1e3a5f18' },
  healer: { color: '#d4a574', glow: '#8b735522', border: '#8b7355', bg: '#4a382218' },
  dps: { color: '#ef6b6b', glow: '#c9858122', border: '#c98581', bg: '#5f2d2d18' },
} as const;

// ─── Character Class Data ───────────────────────────────────

const CLASSES: {
  id: CharacterClass;
  name: string;
  role: string;
  archetype: string;
  flavor: string;
  spells: string[];
  stats: { hp: number; mp: number; atk: number; def: number };
  palette: typeof T.tank;
}[] = [
  {
    id: 'tank',
    name: 'Infrastructure Dev',
    role: 'TANK',
    archetype: 'The Renderer',
    flavor: 'Structural precision. Columns that never fall.',
    spells: ['Mutex Lock', 'Load Balancer', 'Firewall', 'Deadlock'],
    stats: { hp: 150, mp: 50, atk: 5, def: 15 },
    palette: T.tank,
  },
  {
    id: 'healer',
    name: 'Bug Fixer',
    role: 'HEALER',
    archetype: 'The Archaeologist',
    flavor: 'Patience and restoration. Time heals all regressions.',
    spells: ['Try-Catch', 'Rollback', 'Garbage Collect', 'Patch'],
    stats: { hp: 100, mp: 100, atk: 3, def: 8 },
    palette: T.healer,
  },
  {
    id: 'dps',
    name: 'Feature Dev',
    role: 'DPS',
    archetype: 'The Mechanics',
    flavor: 'Glass cannon. Ship fast, break things, ship fixes faster.',
    spells: ['SQL Injection', 'Fork Bomb', 'Buffer Overflow', 'Regex Nuke'],
    stats: { hp: 80, mp: 75, atk: 15, def: 5 },
    palette: T.dps,
  },
];

// ─── Dev Portal Links ───────────────────────────────────────

const PILLAR_SERVERS = [
  { name: 'CHRONOS', port: 3011, color: T.chronos.primary },
  { name: 'IMAGINARIUM', port: 3012, color: T.imaginarium.primary },
  { name: 'ARCHITECTUS', port: 3013, color: T.architectus.primary },
  { name: 'LUDUS', port: 3014, color: T.ludus.primary },
  { name: 'OCULUS', port: 3015, color: T.oculus.primary },
  { name: 'OPERATUS', port: 3016, color: T.operatus.primary },
];

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
      try { onEvent(JSON.parse(line)); } catch { /* skip */ }
    }
  }
}

// ─── Ornate Frame SVG Components ────────────────────────────

function OrnateFrame({
  color,
  glow,
  selected,
  children,
  onClick,
}: {
  color: string;
  glow: string;
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* SVG frame overlay */}
      <svg
        viewBox="0 0 200 280"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <defs>
          <filter id={`glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main border */}
        <rect
          x="4" y="4" width="192" height="272" rx="8"
          fill="none"
          stroke={color}
          strokeWidth={selected ? 2 : 1}
          opacity={selected ? 0.8 : 0.25}
        />

        {/* Corner ornaments — architectural brackets */}
        <g stroke={color} strokeWidth={selected ? 1.8 : 1} opacity={selected ? 0.9 : 0.3} fill="none">
          {/* Top-left */}
          <path d="M4,24 L4,4 L24,4" />
          <path d="M8,18 L8,8 L18,8" />
          <circle cx="4" cy="4" r="2" fill={color} opacity={0.5} />

          {/* Top-right */}
          <path d="M176,4 L196,4 L196,24" />
          <path d="M182,8 L192,8 L192,18" />
          <circle cx="196" cy="4" r="2" fill={color} opacity={0.5} />

          {/* Bottom-left */}
          <path d="M4,256 L4,276 L24,276" />
          <path d="M8,262 L8,272 L18,272" />
          <circle cx="4" cy="276" r="2" fill={color} opacity={0.5} />

          {/* Bottom-right */}
          <path d="M176,276 L196,276 L196,256" />
          <path d="M182,272 L192,272 L192,262" />
          <circle cx="196" cy="276" r="2" fill={color} opacity={0.5} />
        </g>

        {/* Edge tick marks */}
        <g stroke={color} strokeWidth={0.5} opacity={selected ? 0.5 : 0.15}>
          {/* Top edge */}
          <line x1="60" y1="4" x2="60" y2="10" />
          <line x1="100" y1="4" x2="100" y2="10" />
          <line x1="140" y1="4" x2="140" y2="10" />
          {/* Bottom edge */}
          <line x1="60" y1="276" x2="60" y2="270" />
          <line x1="100" y1="276" x2="100" y2="270" />
          <line x1="140" y1="276" x2="140" y2="270" />
        </g>

        {/* Selected glow ring */}
        {selected && (
          <rect
            x="1" y="1" width="198" height="278" rx="10"
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.4}
            filter={`url(#glow-${color.replace('#', '')})`}
          />
        )}
      </svg>

      {/* Content area */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: selected ? glow : 'transparent',
          border: `1px solid ${selected ? color + '40' : '#ffffff08'}`,
          borderRadius: 8,
          padding: '1.25rem 1rem',
          transition: 'all 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Stat Bar ───────────────────────────────────────────────

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: T.stoneLight, marginBottom: 1 }}>
        <span>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div style={{ height: 3, background: '#ffffff08', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.7, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ─── Dendritic Background ───────────────────────────────────

function DendriticBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Base gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 50% at 50% 45%, ${T.architectus.shadow}30 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 30% 70%, ${T.chronos.shadow}20 0%, transparent 60%),
            radial-gradient(ellipse 35% 40% at 75% 25%, ${T.imaginarium.shadow}15 0%, transparent 55%),
            ${T.bg}
          `,
        }}
      />

      {/* Grid pattern */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="40" stroke={T.parchment} strokeWidth="0.5" />
            <line x1="0" y1="0" x2="40" y2="0" stroke={T.parchment} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Decorative dendritic branch */}
      <svg
        viewBox="0 0 800 900"
        style={{
          position: 'absolute',
          right: '-5%',
          top: '10%',
          width: '45%',
          height: 'auto',
          opacity: 0.035,
        }}
      >
        <g stroke={T.parchment} strokeLinecap="round" fill="none">
          {/* Main trunk */}
          <path d="M400,850 Q390,700 400,550 Q410,400 400,250" strokeWidth="8" />
          {/* Primary branches */}
          <path d="M400,550 Q350,480 280,430" strokeWidth="5" />
          <path d="M400,550 Q450,470 520,440" strokeWidth="5" />
          <path d="M400,400 Q340,350 270,330" strokeWidth="4" />
          <path d="M400,400 Q460,340 530,320" strokeWidth="4" />
          <path d="M400,300 Q350,260 300,240" strokeWidth="3" />
          <path d="M400,300 Q440,250 490,230" strokeWidth="3" />
          {/* Secondary branches */}
          <path d="M280,430 Q250,400 220,380" strokeWidth="3" />
          <path d="M280,430 Q260,460 240,480" strokeWidth="2.5" />
          <path d="M520,440 Q550,410 580,400" strokeWidth="3" />
          <path d="M520,440 Q540,470 560,490" strokeWidth="2.5" />
          <path d="M270,330 Q240,310 210,300" strokeWidth="2" />
          <path d="M530,320 Q560,300 590,290" strokeWidth="2" />
          {/* Tertiary */}
          <path d="M300,240 Q280,220 260,210" strokeWidth="2" />
          <path d="M300,240 Q290,260 270,270" strokeWidth="1.5" />
          <path d="M490,230 Q510,210 530,200" strokeWidth="2" />
          <path d="M490,230 Q500,250 520,260" strokeWidth="1.5" />
        </g>
        {/* Branch nodes */}
        <g fill={T.parchment} opacity="0.6">
          <circle cx="400" cy="550" r="6" />
          <circle cx="400" cy="400" r="5" />
          <circle cx="400" cy="300" r="4.5" />
          <circle cx="280" cy="430" r="4" />
          <circle cx="520" cy="440" r="4" />
          <circle cx="270" cy="330" r="3.5" />
          <circle cx="530" cy="320" r="3.5" />
          <circle cx="300" cy="240" r="3" />
          <circle cx="490" cy="230" r="3" />
        </g>
      </svg>

      {/* Left branch mirror (subtler) */}
      <svg
        viewBox="0 0 400 600"
        style={{
          position: 'absolute',
          left: '-8%',
          bottom: '5%',
          width: '25%',
          height: 'auto',
          opacity: 0.02,
          transform: 'scaleX(-1)',
        }}
      >
        <g stroke={T.chronos.primary} strokeLinecap="round" fill="none">
          <path d="M200,550 Q190,400 200,250" strokeWidth="6" />
          <path d="M200,400 Q160,350 120,320" strokeWidth="4" />
          <path d="M200,400 Q240,340 280,310" strokeWidth="4" />
          <path d="M200,300 Q170,260 140,240" strokeWidth="3" />
          <path d="M200,300 Q230,250 260,230" strokeWidth="3" />
        </g>
      </svg>

      {/* Floating particles */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
      `}</style>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + (i * 7.3) % 80}%`,
            top: `${30 + (i * 13.7) % 60}%`,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: i % 3 === 0 ? T.architectus.accent : i % 3 === 1 ? T.chronos.accent : T.imaginarium.accent,
            animation: `float-particle ${6 + (i % 4) * 2}s ease-in-out ${i * 0.7}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Portal Phase ───────────────────────────────────────────

function Portal({
  onLaunch,
}: {
  onLaunch: (url: string, charClass: CharacterClass, charName: string) => void;
}) {
  const [url, setUrl] = useState('.');
  const [charName, setCharName] = useState('Explorer');
  const [charClass, setCharClass] = useState<CharacterClass>('dps');
  const [showPortals, setShowPortals] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const canLaunch = url.trim().length > 0 && charName.trim().length > 0;

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    background: '#ffffff06',
    border: `1px solid ${T.stone}50`,
    borderRadius: 6,
    color: T.parchment,
    fontFamily: "'Courier New', monospace",
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    boxSizing: 'border-box' as const,
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
            {/* Ornate top rule */}
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
                fontSize: '2.8rem',
                fontWeight: 300,
                letterSpacing: '0.35em',
                color: T.parchment,
                fontFamily: "'Courier New', monospace",
                margin: 0,
                textShadow: `0 0 40px ${T.architectus.shadow}60`,
              }}
            >
              DENDROVIA
            </h1>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: T.stone,
                marginTop: 6,
                textTransform: 'uppercase',
              }}
            >
              Autogamification of Codebase Archaeologization
            </div>

            {/* Ornate bottom rule */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <div style={{ width: 60, height: 1, background: `linear-gradient(to right, transparent, ${T.stone}40)` }} />
              <div style={{ width: 4, height: 4, borderRadius: 1, transform: 'rotate(45deg)', background: T.stone, opacity: 0.3 }} />
              <div style={{ width: 60, height: 1, background: `linear-gradient(to left, transparent, ${T.stone}40)` }} />
            </div>
          </div>

          {/* ── Input Section ── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.15em', color: T.stoneLight, marginBottom: 6, textTransform: 'uppercase' }}>
              Repository
            </label>
            <input
              style={inputStyle}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo or ."
              onFocus={(e) => {
                e.target.style.borderColor = T.architectus.primary + '60';
                e.target.style.boxShadow = `0 0 12px ${T.architectus.shadow}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = T.stone + '50';
                e.target.style.boxShadow = 'none';
              }}
            />

            <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.15em', color: T.stoneLight, marginBottom: 6, textTransform: 'uppercase' }}>
              Character Name
            </label>
            <input
              style={inputStyle}
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              placeholder="Explorer"
              onFocus={(e) => {
                e.target.style.borderColor = T.chronos.primary + '60';
                e.target.style.boxShadow = `0 0 12px ${T.chronos.shadow}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = T.stone + '50';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* ── Class Selection ── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.15em', color: T.stoneLight, marginBottom: 12, textTransform: 'uppercase' }}>
              Class
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {CLASSES.map((c) => {
                const sel = charClass === c.id;
                return (
                  <OrnateFrame
                    key={c.id}
                    color={c.palette.color}
                    glow={c.palette.glow}
                    selected={sel}
                    onClick={() => setCharClass(c.id)}
                  >
                    {/* Role badge */}
                    <div
                      style={{
                        fontSize: '0.55rem',
                        letterSpacing: '0.2em',
                        color: c.palette.color,
                        opacity: sel ? 1 : 0.6,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {c.role}
                    </div>

                    {/* Class icon (pillar-derived abstract symbol) */}
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <svg viewBox="0 0 40 40" width="36" height="36" style={{ opacity: sel ? 0.9 : 0.4 }}>
                        {c.id === 'tank' && (
                          /* Column + shield (ARCHITECTUS structural) */
                          <g>
                            <rect x="16" y="6" width="8" height="28" fill={c.palette.color} opacity={0.7} rx="1" />
                            <rect x="12" y="4" width="16" height="3" fill={c.palette.color} opacity={0.5} rx="1" />
                            <rect x="12" y="33" width="16" height="3" fill={c.palette.color} opacity={0.5} rx="1" />
                            {/* Fluting */}
                            <line x1="18" y1="8" x2="18" y2="32" stroke={c.palette.color} strokeWidth="0.5" opacity={0.5} />
                            <line x1="20" y1="8" x2="20" y2="32" stroke={c.palette.color} strokeWidth="0.5" opacity={0.5} />
                            <line x1="22" y1="8" x2="22" y2="32" stroke={c.palette.color} strokeWidth="0.5" opacity={0.5} />
                            {/* Shield overlay */}
                            <path d="M20,12 L26,16 L26,24 L20,28 L14,24 L14,16 Z" fill="none" stroke={c.palette.color} strokeWidth="1.2" opacity={0.4} />
                          </g>
                        )}
                        {c.id === 'healer' && (
                          /* Scroll + temporal rings (CHRONOS archaeological) */
                          <g>
                            <path d="M10,8 Q8,20 10,32 L30,32 Q32,20 30,8 Z" fill={c.palette.color} opacity={0.3} />
                            <circle cx="20" cy="20" r="8" fill="none" stroke={c.palette.color} strokeWidth="0.8" opacity={0.5} />
                            <circle cx="20" cy="20" r="5" fill="none" stroke={c.palette.color} strokeWidth="1" opacity={0.6} />
                            <circle cx="20" cy="20" r="2" fill={c.palette.color} opacity={0.7} />
                            {/* Y-fork branch */}
                            <line x1="20" y1="28" x2="20" y2="20" stroke={c.palette.color} strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="20" y1="20" x2="15" y2="14" stroke={c.palette.color} strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="20" y1="20" x2="25" y2="14" stroke={c.palette.color} strokeWidth="1.2" strokeLinecap="round" />
                          </g>
                        )}
                        {c.id === 'dps' && (
                          /* Tactical grid + burst (LUDUS game mechanics) */
                          <g>
                            {/* Tactical grid */}
                            <g stroke={c.palette.color} strokeWidth="0.4" opacity={0.25}>
                              <line x1="8" y1="8" x2="8" y2="32" />
                              <line x1="16" y1="8" x2="16" y2="32" />
                              <line x1="24" y1="8" x2="24" y2="32" />
                              <line x1="32" y1="8" x2="32" y2="32" />
                              <line x1="8" y1="8" x2="32" y2="8" />
                              <line x1="8" y1="16" x2="32" y2="16" />
                              <line x1="8" y1="24" x2="32" y2="24" />
                              <line x1="8" y1="32" x2="32" y2="32" />
                            </g>
                            {/* Burst star */}
                            <polygon
                              points="20,8 22,16 30,16 24,21 26,29 20,24 14,29 16,21 10,16 18,16"
                              fill={c.palette.color}
                              opacity={0.6}
                            />
                            <circle cx="20" cy="20" r="3" fill={c.palette.color} opacity={0.8} />
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: sel ? T.parchment : T.stoneLight,
                        textAlign: 'center',
                        marginBottom: 2,
                        transition: 'color 0.2s',
                      }}
                    >
                      {c.name}
                    </div>

                    {/* Archetype */}
                    <div
                      style={{
                        fontSize: '0.55rem',
                        color: T.stone,
                        textAlign: 'center',
                        fontStyle: 'italic',
                        marginBottom: 8,
                      }}
                    >
                      {c.archetype}
                    </div>

                    {/* Flavor text */}
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: T.stone,
                        textAlign: 'center',
                        lineHeight: 1.4,
                        marginBottom: 10,
                        minHeight: 30,
                      }}
                    >
                      {c.flavor}
                    </div>

                    {/* Stat bars */}
                    <div style={{ padding: '0 4px' }}>
                      <StatBar label="HP" value={c.stats.hp} max={150} color={T.ludus.active} />
                      <StatBar label="MP" value={c.stats.mp} max={100} color={T.architectus.active} />
                      <StatBar label="ATK" value={c.stats.atk} max={15} color={T.dps.color} />
                      <StatBar label="DEF" value={c.stats.def} max={15} color={T.operatus.accent} />
                    </div>

                    {/* Spells */}
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                      {c.spells.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: '0.5rem',
                            padding: '1px 5px',
                            background: `${c.palette.color}15`,
                            border: `1px solid ${c.palette.color}25`,
                            borderRadius: 3,
                            color: c.palette.color,
                            opacity: sel ? 0.8 : 0.4,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </OrnateFrame>
                );
              })}
            </div>
          </div>

          {/* ── Launch Button ── */}
          <button
            disabled={!canLaunch}
            onClick={() => onLaunch(url.trim(), charClass, charName.trim())}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: canLaunch
                ? `linear-gradient(135deg, ${T.architectus.shadow} 0%, ${T.bgDeep} 50%, ${T.chronos.shadow} 100%)`
                : '#ffffff06',
              border: `1px solid ${canLaunch ? T.parchment + '30' : '#ffffff10'}`,
              borderRadius: 6,
              color: canLaunch ? T.parchment : T.stone,
              fontFamily: "'Courier New', monospace",
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              cursor: canLaunch ? 'pointer' : 'not-allowed',
              opacity: canLaunch ? 1 : 0.4,
              transition: 'all 0.3s',
              textTransform: 'uppercase',
            }}
          >
            Enter the Dendrite
          </button>

          {/* ── Dev Portals ── */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowPortals(!showPortals)}
              style={{
                background: 'none',
                border: 'none',
                color: T.stone,
                cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                opacity: 0.5,
              }}
            >
              {showPortals ? '- pillar playgrounds -' : '+ pillar playgrounds +'}
            </button>
            {showPortals && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.4rem',
                  marginTop: '0.75rem',
                }}
              >
                {PILLAR_SERVERS.map((p) => (
                  <a
                    key={p.name}
                    href={`http://localhost:${p.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.35rem',
                      background: '#ffffff04',
                      border: `1px solid ${p.color}20`,
                      borderRadius: 4,
                      color: p.color,
                      textDecoration: 'none',
                      fontSize: '0.6rem',
                      textAlign: 'center',
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {p.name}
                    <div style={{ fontSize: '0.5rem', opacity: 0.5 }}>:{p.port}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Pipeline Phase ─────────────────────────────────────────

function Pipeline({
  logs,
  stats,
  error,
}: {
  logs: LogEntry[];
  stats: Record<string, unknown>;
  error: string | null;
}) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      <DendriticBackground />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div style={{ maxWidth: 720, width: '90%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.2rem', letterSpacing: '0.3em', color: T.parchment }}>PIPELINE</div>
            <div style={{ fontSize: '0.6rem', color: T.stone, letterSpacing: '0.15em', marginTop: 4 }}>
              CHRONOS → IMAGINARIUM
            </div>
          </div>

          {/* Log */}
          <div
            style={{
              background: '#ffffff04',
              border: `1px solid ${T.stone}30`,
              borderRadius: 6,
              padding: '0.75rem',
              height: 320,
              overflowY: 'auto',
              fontSize: '0.7rem',
              lineHeight: 1.7,
              marginBottom: '1rem',
            }}
          >
            {logs.map((l, i) => (
              <div key={i}>
                <span
                  style={{
                    color: l.step.includes('error')
                      ? T.dps.color
                      : l.step.includes('complete') || l.step.includes('ready')
                        ? T.ludus.active
                        : l.step.includes('distill')
                          ? T.imaginarium.primary
                          : T.chronos.primary,
                  }}
                >
                  [{l.step}]
                </span>{' '}
                <span style={{ color: T.stoneLight }}>{l.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {error && (
            <div style={{ color: T.dps.color, fontSize: '0.75rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {Object.keys(stats).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.65rem' }}>
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} style={{ background: '#ffffff04', padding: '0.5rem', borderRadius: 4, border: `1px solid ${T.stone}20` }}>
                  <div style={{ color: T.stone, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</div>
                  <div style={{ color: T.parchment }}>{String(v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<Phase>('portal');
  const [charClass, setCharClass] = useState<CharacterClass>('dps');
  const [charName, setCharName] = useState('Explorer');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const addLog = useCallback((step: string, message: string) => {
    setLogs((prev) => [...prev, { step, message, ts: Date.now() }]);
  }, []);

  const launchPipeline = useCallback(
    async (url: string, selectedClass: CharacterClass, name: string) => {
      setCharClass(selectedClass);
      setCharName(name);
      setPhase('pipeline');
      setLogs([]);
      setStats({});
      setPipelineError(null);

      let outputDir = '';

      try {
        addLog('init', 'Starting CHRONOS analysis...');
        await readSSE('/api/analyze', { url }, (ev) => {
          const step = (ev.step as string) ?? 'info';
          const msg = (ev.message as string) ?? '';
          addLog(step, msg);
          if (step === 'complete') {
            outputDir = (ev.outputDir as string) ?? '';
            if (ev.stats) setStats(ev.stats as Record<string, unknown>);
          }
          if (step === 'error') setPipelineError(msg);
        });

        if (!outputDir) {
          setPipelineError('CHRONOS did not produce an output directory');
          return;
        }

        addLog('distill-start', 'Starting IMAGINARIUM distillation...');
        let manifestPath = '';
        await readSSE('/api/distill', { topologyDir: outputDir }, (ev) => {
          const step = (ev.step as string) ?? 'info';
          const msg = (ev.message as string) ?? '';
          addLog(step, msg);
          if (step === 'distill-complete') manifestPath = (ev.manifestPath as string) ?? '';
          if (step === 'error') setPipelineError(msg);
        });

        setResult({
          topologyDir: outputDir,
          manifestPath: manifestPath || `${outputDir}/imaginarium/manifest.json`,
          stats,
        });

        addLog('ready', 'Entering the Dendrite...');
        setTimeout(() => setPhase('game'), 1200);
      } catch (err) {
        setPipelineError(err instanceof Error ? err.message : String(err));
      }
    },
    [addLog, stats],
  );

  if (phase === 'portal') {
    return <Portal onLaunch={launchPipeline} />;
  }

  if (phase === 'pipeline') {
    return <Pipeline logs={logs} stats={stats} error={pipelineError} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <DendroviaQuest
        topologyPath={
          result?.topologyDir
            ? `/api/results?dir=${encodeURIComponent(result.topologyDir)}&file=topology.json`
            : '/generated/topology.json'
        }
        manifestPath={result?.manifestPath ?? '/generated/manifest.json'}
        enableOperatus={false}
        characterClass={charClass}
        characterName={charName}
      />
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 8,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => { setPhase('portal'); setResult(null); }}
          style={{
            background: `${T.bgDeep}cc`,
            border: `1px solid ${T.parchment}20`,
            color: T.parchment,
            padding: '4px 14px',
            borderRadius: 4,
            fontFamily: "'Courier New', monospace",
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          NEW RUN
        </button>
      </div>
    </div>
  );
}
