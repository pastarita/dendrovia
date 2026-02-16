'use client';

/**
 * ParticleBackground — Ambient floating particle canvas
 *
 * Renders a fixed full-screen canvas with drifting, fading particles
 * in the OCULUS amber/peach palette. Pure 2D canvas, no WebGL needed.
 * Sits behind everything at z-index 0.
 */

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 60;
const COLORS = [
  'rgba(245, 169, 127, 0.4)',  // --oculus-amber
  'rgba(216, 137, 87, 0.3)',   // --oculus-orange
  'rgba(255, 212, 184, 0.2)',  // --oculus-peach
  'rgba(78, 205, 196, 0.15)',  // --oculus-mana (teal accent)
];

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  phase: number;
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.2 - 0.05,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.6 + 0.2,
    phase: Math.random() * Math.PI * 2,
  };
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf: number;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h),
    );

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Gentle sine wobble
        p.x += Math.sin(t * 0.001 + p.phase) * 0.15;

        // Wrap edges
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // Pulsing alpha
        const a = p.alpha * (0.6 + 0.4 * Math.sin(t * 0.002 + p.phase));

        ctx!.globalAlpha = a;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
