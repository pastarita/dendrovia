'use client';

/**
 * DendriticBackground — Full-viewport fixed background layer with layered
 * radial gradients, SVG grid pattern, decorative dendritic branches,
 * and CSS-animated floating particles.
 */

import { T } from '../lib/design-tokens';

export function DendriticBackground() {
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

      {/* Right-side decorative dendritic branch */}
      <svg
        viewBox="0 0 800 900"
        style={{ position: 'absolute', right: '-5%', top: '10%', width: '45%', height: 'auto', opacity: 0.035 }}
      >
        <g stroke={T.parchment} strokeLinecap="round" fill="none">
          <path d="M400,850 Q390,700 400,550 Q410,400 400,250" strokeWidth="8" />
          <path d="M400,550 Q350,480 280,430" strokeWidth="5" />
          <path d="M400,550 Q450,470 520,440" strokeWidth="5" />
          <path d="M400,400 Q340,350 270,330" strokeWidth="4" />
          <path d="M400,400 Q460,340 530,320" strokeWidth="4" />
          <path d="M400,300 Q350,260 300,240" strokeWidth="3" />
          <path d="M400,300 Q440,250 490,230" strokeWidth="3" />
          <path d="M280,430 Q250,400 220,380" strokeWidth="3" />
          <path d="M280,430 Q260,460 240,480" strokeWidth="2.5" />
          <path d="M520,440 Q550,410 580,400" strokeWidth="3" />
          <path d="M520,440 Q540,470 560,490" strokeWidth="2.5" />
          <path d="M270,330 Q240,310 210,300" strokeWidth="2" />
          <path d="M530,320 Q560,300 590,290" strokeWidth="2" />
          <path d="M300,240 Q280,220 260,210" strokeWidth="2" />
          <path d="M300,240 Q290,260 270,270" strokeWidth="1.5" />
          <path d="M490,230 Q510,210 530,200" strokeWidth="2" />
          <path d="M490,230 Q500,250 520,260" strokeWidth="1.5" />
        </g>
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
        style={{ position: 'absolute', left: '-8%', bottom: '5%', width: '25%', height: 'auto', opacity: 0.02, transform: 'scaleX(-1)' }}
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
