/**
 * World Viewlet SVG — Deterministic thumbnail generator for world cards.
 *
 * Takes world stats and produces a 120x120 SVG string showing a stylized
 * dendritic silhouette whose shape is seeded by the repo metrics.
 *
 * Adapted from dendrovia-quest for the Ornithicus landing page.
 */

// ─── Seeded PRNG (mulberry32) ───────────────────────────────

function mulberry32(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(fileCount: number, commitCount: number, hotspotCount: number): number {
  return ((fileCount * 2654435761) ^ (commitCount * 2246822519) ^ (hotspotCount * 3266489917)) >>> 0;
}

// ─── SVG Generator ──────────────────────────────────────────

export interface ViewletInput {
  fileCount: number;
  commitCount: number;
  hotspotCount: number;
  languages: Array<{ language: string; percentage: number }>;
  tincture: string; // hex color
}

export function generateWorldViewlet(input: ViewletInput): string {
  const { fileCount, commitCount, hotspotCount, languages, tincture } = input;
  const seed = hashSeed(fileCount, commitCount, hotspotCount);
  const rand = mulberry32(seed);

  // Trunk height scales with log(fileCount), clamped
  const trunkH = Math.min(70, Math.max(30, Math.log(fileCount + 1) * 10));
  const trunkTop = 100 - trunkH;

  // One branch per language, max 6
  const langs = languages.slice(0, 6);
  const branchCount = Math.max(2, langs.length);

  // Generate branches
  const branches: string[] = [];
  for (let i = 0; i < branchCount; i++) {
    const pct = langs[i]?.percentage ?? 10;
    const t = trunkTop + ((i + 1) / (branchCount + 1)) * trunkH * 0.8;
    const side = i % 2 === 0 ? -1 : 1;
    const length = 12 + (pct / 100) * 30 + rand() * 8;
    const angle = 25 + rand() * 30;
    const rad = (angle * Math.PI) / 180;
    const ex = 60 + side * Math.cos(rad) * length;
    const ey = t - Math.sin(rad) * length;
    const cpx = 60 + side * length * 0.4;
    const cpy = t - length * 0.15;
    const sw = 1 + (pct / 100) * 2;

    branches.push(
      `<path d="M60,${t.toFixed(1)} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" stroke="${tincture}" stroke-width="${sw.toFixed(1)}" fill="none" opacity="0.6" stroke-linecap="round"/>`,
    );

    // Sub-branch
    if (pct > 15) {
      const subLen = length * 0.45;
      const subAng = angle + (rand() - 0.5) * 40;
      const subRad = (subAng * Math.PI) / 180;
      const sx = ex + side * Math.cos(subRad) * subLen;
      const sy = ey - Math.sin(subRad) * subLen;
      branches.push(
        `<path d="M${ex.toFixed(1)},${ey.toFixed(1)} L${sx.toFixed(1)},${sy.toFixed(1)}" stroke="${tincture}" stroke-width="${(sw * 0.5).toFixed(1)}" fill="none" opacity="0.35" stroke-linecap="round"/>`,
      );
    }
  }

  // Hotspot pulse dots
  const dots: string[] = [];
  const dotCount = Math.min(5, hotspotCount);
  for (let i = 0; i < dotCount; i++) {
    const dx = 40 + rand() * 40;
    const dy = trunkTop + rand() * trunkH * 0.7;
    const r = 1.5 + rand() * 1.5;
    dots.push(
      `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${r.toFixed(1)}" fill="${tincture}" opacity="0.5">` +
      `<animate attributeName="opacity" values="0.3;0.7;0.3" dur="${(2 + rand() * 2).toFixed(1)}s" repeatCount="indefinite"/>` +
      `</circle>`,
    );
  }

  // Commit density ring at base
  const ringR = Math.min(12, 4 + Math.log(commitCount + 1) * 1.5);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">`,
    `<defs>`,
    `  <filter id="vg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `</defs>`,
    // Subtle grid overlay
    `<g opacity="0.06">`,
    `  <line x1="0" y1="40" x2="120" y2="40" stroke="${tincture}" stroke-width="0.3"/>`,
    `  <line x1="0" y1="80" x2="120" y2="80" stroke="${tincture}" stroke-width="0.3"/>`,
    `  <line x1="40" y1="0" x2="40" y2="120" stroke="${tincture}" stroke-width="0.3"/>`,
    `  <line x1="80" y1="0" x2="80" y2="120" stroke="${tincture}" stroke-width="0.3"/>`,
    `</g>`,
    // Trunk
    `<line x1="60" y1="105" x2="60" y2="${trunkTop.toFixed(1)}" stroke="${tincture}" stroke-width="3" stroke-linecap="round" opacity="0.7" filter="url(#vg)"/>`,
    // Branches
    ...branches,
    // Hotspot dots
    ...dots,
    // Base ring
    `<circle cx="60" cy="105" r="${ringR.toFixed(1)}" fill="none" stroke="${tincture}" stroke-width="0.8" opacity="0.25"/>`,
    // Crown dot
    `<circle cx="60" cy="${(trunkTop - 3).toFixed(1)}" r="2.5" fill="${tincture}" opacity="0.6"/>`,
    `</svg>`,
  ].join('\n');
}
