/**
 * SvgTemplates — parametric SVG generation for mushroom silhouettes.
 *
 * Produces deterministic SVG strings driven by morphology parameters.
 * Each SVG is ~2-5KB, valid XML, and ready for inline rendering.
 */

import type { MushroomMorphology, FungalGenus, CapShape, FungalSpecimen } from '../types.js';

// ---------------------------------------------------------------------------
// SVG generation constants
// ---------------------------------------------------------------------------

const VIEWBOX_SIZE = 200;
const CENTER_X = VIEWBOX_SIZE / 2;
const BASE_Y = VIEWBOX_SIZE * 0.85;

// Bioluminescence glow filter
const GLOW_FILTER = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`;

const ORGANIC_FILTER = `<filter id="organic" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="1" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;

// ---------------------------------------------------------------------------
// Cap shape Bezier curves
// ---------------------------------------------------------------------------

function capPath(shape: CapShape, w: number, h: number, cx: number, topY: number): string {
  const halfW = w / 2;
  const left = cx - halfW;
  const right = cx + halfW;

  switch (shape) {
    case 'convex':
      return `M ${left},${topY + h} Q ${left},${topY} ${cx},${topY} Q ${right},${topY} ${right},${topY + h}`;

    case 'campanulate': // bell shape
      return `M ${left},${topY + h} Q ${left + halfW * 0.2},${topY + h * 0.3} ${cx},${topY} Q ${right - halfW * 0.2},${topY + h * 0.3} ${right},${topY + h}`;

    case 'umbonate': // central bump
      return `M ${left},${topY + h} Q ${left},${topY + h * 0.6} ${cx - halfW * 0.3},${topY + h * 0.4} L ${cx},${topY} L ${cx + halfW * 0.3},${topY + h * 0.4} Q ${right},${topY + h * 0.6} ${right},${topY + h}`;

    case 'infundibuliform': // funnel
      return `M ${left},${topY} Q ${left + halfW * 0.3},${topY + h * 0.5} ${cx},${topY + h} Q ${right - halfW * 0.3},${topY + h * 0.5} ${right},${topY}`;

    case 'plane': // flat
      return `M ${left},${topY + h} Q ${left},${topY + h * 0.7} ${cx},${topY + h * 0.6} Q ${right},${topY + h * 0.7} ${right},${topY + h}`;

    case 'depressed': // concave center
      return `M ${left},${topY + h * 0.6} Q ${left + halfW * 0.3},${topY + h} ${cx},${topY + h * 0.8} Q ${right - halfW * 0.3},${topY + h} ${right},${topY + h * 0.6}`;
  }
}

// ---------------------------------------------------------------------------
// Gills rendering
// ---------------------------------------------------------------------------

function gillsPath(
  count: number,
  cx: number,
  baseY: number,
  capW: number,
  capH: number,
): string {
  const lines: string[] = [];
  const halfW = capW / 2;
  const gillLength = capH * 0.4;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0 to 1
    const x = cx - halfW * 0.8 + t * halfW * 1.6;
    const spread = (t - 0.5) * 0.3;
    lines.push(`M ${x},${baseY} L ${x + spread * gillLength},${baseY + gillLength}`);
  }

  return lines.join(' ');
}

// ---------------------------------------------------------------------------
// Stem rendering
// ---------------------------------------------------------------------------

function stemPath(
  cx: number,
  topY: number,
  bottomY: number,
  topThickness: number,
  bottomThickness: number,
  bulbous: boolean,
): string {
  const tl = cx - topThickness / 2;
  const tr = cx + topThickness / 2;
  let bl = cx - bottomThickness / 2;
  let br = cx + bottomThickness / 2;

  if (bulbous) {
    bl -= bottomThickness * 0.3;
    br += bottomThickness * 0.3;
  }

  return `M ${tl},${topY} Q ${tl - 1},${(topY + bottomY) / 2} ${bl},${bottomY} L ${br},${bottomY} Q ${tr + 1},${(topY + bottomY) / 2} ${tr},${topY} Z`;
}

// ---------------------------------------------------------------------------
// Spots (Amanita-type)
// ---------------------------------------------------------------------------

function spotsElements(cx: number, capTopY: number, capW: number, capH: number): string {
  const spots: string[] = [];
  const positions = [
    { dx: -0.25, dy: 0.3, r: 3 },
    { dx: 0.15, dy: 0.2, r: 2.5 },
    { dx: -0.05, dy: 0.15, r: 2 },
    { dx: 0.3, dy: 0.4, r: 2 },
    { dx: -0.3, dy: 0.5, r: 1.5 },
    { dx: 0.05, dy: 0.5, r: 2.5 },
  ];

  for (const p of positions) {
    const sx = cx + p.dx * capW;
    const sy = capTopY + p.dy * capH;
    spots.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${p.r}" fill="white" opacity="0.85"/>`);
  }

  return spots.join('\n    ');
}

// ---------------------------------------------------------------------------
// Ring (annulus)
// ---------------------------------------------------------------------------

function ringElement(cx: number, y: number, width: number): string {
  return `<ellipse cx="${cx}" cy="${y}" rx="${width / 2}" ry="${width * 0.15}" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateSvg(specimen: FungalSpecimen): string {
  const m = specimen.morphology;

  // Compute dimensions
  const capW = 30 + m.capWidth * 70;   // 30-100px
  const capH = 15 + m.capHeight * 45;  // 15-60px
  const stemH = 30 + m.stem.height * 80; // 30-110px
  const stemTopW = 4 + m.stem.thickness * 12;
  const stemBotW = stemTopW * (m.stem.bulbous ? 1.8 : 1.2);

  const capTopY = BASE_Y - stemH - capH;
  const capBottomY = BASE_Y - stemH;

  const applyGlow = m.bioluminescence !== 'none';
  const filterAttr = applyGlow ? ' filter="url(#glow)"' : '';

  const parts: string[] = [];

  // SVG header
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" width="${VIEWBOX_SIZE}" height="${VIEWBOX_SIZE}">`);
  parts.push('  <defs>');
  if (applyGlow) parts.push(`    ${GLOW_FILTER}`);
  parts.push(`    ${ORGANIC_FILTER}`);
  parts.push('  </defs>');

  parts.push(`  <g${filterAttr}>`);

  // Stem
  parts.push(`    <path d="${stemPath(CENTER_X, capBottomY, BASE_Y, stemTopW, stemBotW, m.stem.bulbous)}" fill="${m.gillColor}" filter="url(#organic)"/>`);

  // Ring (annulus) if applicable
  if (m.stem.ringed) {
    const ringY = capBottomY + stemH * 0.3;
    parts.push(`    ${ringElement(CENTER_X, ringY, stemTopW * 1.5)}`);
  }

  // Gills
  parts.push(`    <path d="${gillsPath(m.gillCount, CENTER_X, capBottomY, capW, capH)}" stroke="${m.gillColor}" stroke-width="0.8" fill="none" opacity="0.7"/>`);

  // Cap
  parts.push(`    <path d="${capPath(m.capShape, capW, capH, CENTER_X, capTopY)}" fill="${m.scaleColor}" filter="url(#organic)"/>`);

  // Spots
  if (m.spots) {
    parts.push(`    ${spotsElements(CENTER_X, capTopY, capW, capH)}`);
  }

  parts.push('  </g>');

  // Bioluminescence animation
  if (m.bioluminescence === 'pulsing') {
    parts.push('  <style>');
    parts.push('    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }');
    parts.push('    g { animation: pulse 2s ease-in-out infinite; }');
    parts.push('  </style>');
  }

  parts.push('</svg>');

  return parts.join('\n');
}

export function generateSvgBatch(specimens: FungalSpecimen[]): Map<string, string> {
  const results = new Map<string, string>();
  for (const specimen of specimens) {
    results.set(specimen.id, generateSvg(specimen));
  }
  return results;
}
