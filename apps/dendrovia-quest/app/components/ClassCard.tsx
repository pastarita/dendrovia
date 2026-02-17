'use client';

/**
 * ClassCard — RPG class selection card with ornate SVG frame,
 * stat bars, inline class icon, and spell tags.
 */

import { T, type ClassData } from '../lib/design-tokens';

// ─── Ornate Class Frame ─────────────────────────────────────

function OrnateClassFrame({
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
      <svg
        viewBox="0 0 200 280"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
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
        <rect
          x="4" y="4" width="192" height="272" rx="8"
          fill="none" stroke={color}
          strokeWidth={selected ? 2 : 1}
          opacity={selected ? 0.8 : 0.25}
        />
        {/* Corner ornaments */}
        <g stroke={color} strokeWidth={selected ? 1.8 : 1} opacity={selected ? 0.9 : 0.3} fill="none">
          <path d="M4,24 L4,4 L24,4" /><path d="M8,18 L8,8 L18,8" />
          <circle cx="4" cy="4" r="2" fill={color} opacity={0.5} />
          <path d="M176,4 L196,4 L196,24" /><path d="M182,8 L192,8 L192,18" />
          <circle cx="196" cy="4" r="2" fill={color} opacity={0.5} />
          <path d="M4,256 L4,276 L24,276" /><path d="M8,262 L8,272 L18,272" />
          <circle cx="4" cy="276" r="2" fill={color} opacity={0.5} />
          <path d="M176,276 L196,276 L196,256" /><path d="M182,272 L192,272 L192,262" />
          <circle cx="196" cy="276" r="2" fill={color} opacity={0.5} />
        </g>
        {/* Edge tick marks */}
        <g stroke={color} strokeWidth={0.5} opacity={selected ? 0.5 : 0.15}>
          <line x1="60" y1="4" x2="60" y2="10" /><line x1="100" y1="4" x2="100" y2="10" /><line x1="140" y1="4" x2="140" y2="10" />
          <line x1="60" y1="276" x2="60" y2="270" /><line x1="100" y1="276" x2="100" y2="270" /><line x1="140" y1="276" x2="140" y2="270" />
        </g>
        {selected && (
          <rect x="1" y="1" width="198" height="278" rx="10" fill="none" stroke={color} strokeWidth={1} opacity={0.4} filter={`url(#glow-${color.replace('#', '')})`} />
        )}
      </svg>
      <div
        style={{
          position: 'relative', zIndex: 1,
          background: selected ? glow : 'transparent',
          border: `1px solid ${selected ? color + '40' : '#ffffff08'}`,
          borderRadius: 8, padding: '1.25rem 1rem',
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

// ─── Class Icon SVGs ────────────────────────────────────────

function ClassIcon({ id, color, selected }: { id: string; color: string; selected: boolean }) {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" style={{ opacity: selected ? 0.9 : 0.4 }}>
      {id === 'tank' && (
        <g>
          <rect x="16" y="6" width="8" height="28" fill={color} opacity={0.7} rx="1" />
          <rect x="12" y="4" width="16" height="3" fill={color} opacity={0.5} rx="1" />
          <rect x="12" y="33" width="16" height="3" fill={color} opacity={0.5} rx="1" />
          <line x1="18" y1="8" x2="18" y2="32" stroke={color} strokeWidth="0.5" opacity={0.5} />
          <line x1="20" y1="8" x2="20" y2="32" stroke={color} strokeWidth="0.5" opacity={0.5} />
          <line x1="22" y1="8" x2="22" y2="32" stroke={color} strokeWidth="0.5" opacity={0.5} />
          <path d="M20,12 L26,16 L26,24 L20,28 L14,24 L14,16 Z" fill="none" stroke={color} strokeWidth="1.2" opacity={0.4} />
        </g>
      )}
      {id === 'healer' && (
        <g>
          <path d="M10,8 Q8,20 10,32 L30,32 Q32,20 30,8 Z" fill={color} opacity={0.3} />
          <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="0.8" opacity={0.5} />
          <circle cx="20" cy="20" r="5" fill="none" stroke={color} strokeWidth="1" opacity={0.6} />
          <circle cx="20" cy="20" r="2" fill={color} opacity={0.7} />
          <line x1="20" y1="28" x2="20" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="20" x2="15" y2="14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="20" y1="20" x2="25" y2="14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {id === 'dps' && (
        <g>
          <g stroke={color} strokeWidth="0.4" opacity={0.25}>
            <line x1="8" y1="8" x2="8" y2="32" /><line x1="16" y1="8" x2="16" y2="32" />
            <line x1="24" y1="8" x2="24" y2="32" /><line x1="32" y1="8" x2="32" y2="32" />
            <line x1="8" y1="8" x2="32" y2="8" /><line x1="8" y1="16" x2="32" y2="16" />
            <line x1="8" y1="24" x2="32" y2="24" /><line x1="8" y1="32" x2="32" y2="32" />
          </g>
          <polygon points="20,8 22,16 30,16 24,21 26,29 20,24 14,29 16,21 10,16 18,16" fill={color} opacity={0.6} />
          <circle cx="20" cy="20" r="3" fill={color} opacity={0.8} />
        </g>
      )}
    </svg>
  );
}

// ─── ClassCard ──────────────────────────────────────────────

interface ClassCardProps {
  classData: ClassData;
  selected: boolean;
  onClick: () => void;
}

export function ClassCard({ classData: c, selected, onClick }: ClassCardProps) {
  return (
    <OrnateClassFrame color={c.palette.color} glow={c.palette.glow} selected={selected} onClick={onClick}>
      {/* Role badge */}
      <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: c.palette.color, opacity: selected ? 1 : 0.6, marginBottom: 4, textAlign: 'center' }}>
        {c.role}
      </div>

      {/* Class icon */}
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <ClassIcon id={c.id} color={c.palette.color} selected={selected} />
      </div>

      {/* Name */}
      <div style={{ fontSize: '0.8rem', color: selected ? T.parchment : T.stoneLight, textAlign: 'center', marginBottom: 2, transition: 'color 0.2s' }}>
        {c.name}
      </div>

      {/* Archetype */}
      <div style={{ fontSize: '0.55rem', color: T.stone, textAlign: 'center', fontStyle: 'italic', marginBottom: 8 }}>
        {c.archetype}
      </div>

      {/* Flavor text */}
      <div style={{ fontSize: '0.6rem', color: T.stone, textAlign: 'center', lineHeight: 1.4, marginBottom: 10, minHeight: 30 }}>
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
              fontSize: '0.5rem', padding: '1px 5px',
              background: `${c.palette.color}15`, border: `1px solid ${c.palette.color}25`,
              borderRadius: 3, color: c.palette.color, opacity: selected ? 0.8 : 0.4,
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </OrnateClassFrame>
  );
}
