#!/usr/bin/env bun

/**
 * THIN VERTICAL SLICE
 *
 * This script orchestrates the entire pipeline for ONE file:
 * Parse → Distill → Render → Interact → Display
 *
 * This is the "proof" that the architecture works end-to-end.
 */

import { CodeTopology, ProceduralPalette, type ParsedFile } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const eventBus = getEventBus(true); // Enable debug mode

console.log('🌳 DENDROVIA: Thin Vertical Slice\n');
console.log('================================================\n');

// ============================================================================
// PHASE 1: CHRONOS - Parse one file
// ============================================================================

console.log('📜 [CHRONOS] Parsing file...');

const targetFile = join(process.cwd(), 'package.json');
const fileContent = readFileSync(targetFile, 'utf-8');
const fileStat = statSync(targetFile);

const parsedFile: ParsedFile = {
  path: targetFile,
  hash: hashString(fileContent), // Simple hash
  language: 'json',
  complexity: 1, // JSON has no cyclomatic complexity
  loc: fileContent.split('\n').length,
  lastModified: fileStat.mtime,
  author: 'unknown', // Would come from git blame
};

console.log(`  ✓ Path: ${parsedFile.path}`);
console.log(`  ✓ Language: ${parsedFile.language}`);
console.log(`  ✓ Lines of Code: ${parsedFile.loc}`);
console.log(`  ✓ Hash: ${parsedFile.hash.substring(0, 8)}...\n`);

// Emit event (this would trigger IMAGINARIUM in the full pipeline)
await eventBus.emit(GameEvents.PARSE_COMPLETE, { files: [parsedFile] });

// ============================================================================
// PHASE 2: IMAGINARIUM - Generate palette
// ============================================================================

console.log('🎨 [IMAGINARIUM] Generating procedural palette...');

const palette: ProceduralPalette = generatePaletteFromFile(parsedFile);

console.log(`  ✓ Primary: ${palette.primary}`);
console.log(`  ✓ Secondary: ${palette.secondary}`);
console.log(`  ✓ Accent: ${palette.accent}`);
console.log(`  ✓ Mood: ${palette.mood}\n`);

await eventBus.emit(GameEvents.PALETTE_GENERATED, palette);

// ============================================================================
// PHASE 3: Generate SDF Shader
// ============================================================================

console.log('⚙️  [IMAGINARIUM] Compiling SDF shader...');

const sdfShader = generateSDFShader(parsedFile, palette);

console.log(`  ✓ Shader ID: ${sdfShader.id}`);
console.log(`  ✓ Complexity: ${sdfShader.complexity} instructions`);
console.log(`  ✓ Parameters: ${Object.keys(sdfShader.parameters).join(', ')}\n`);

await eventBus.emit(GameEvents.SHADERS_COMPILED, { shaders: [sdfShader] });

// ============================================================================
// PHASE 4: Write output files
// ============================================================================

console.log('💾 [OPERATUS] Writing generated artifacts...');

const outputDir = join(process.cwd(), 'generated');

// Ensure directory exists
await Bun.write(join(outputDir, '.gitkeep'), '');

await Bun.write(
  join(outputDir, 'palette.json'),
  JSON.stringify(palette, null, 2)
);
await Bun.write(
  join(outputDir, 'dendrite.glsl'),
  sdfShader.glsl
);
await Bun.write(
  join(outputDir, 'topology.json'),
  JSON.stringify({ files: [parsedFile] }, null, 2)
);

console.log(`  ✓ palette.json`);
console.log(`  ✓ dendrite.glsl`);
console.log(`  ✓ topology.json\n`);

// ============================================================================
// PHASE 5: Launch visualization
// ============================================================================

console.log('🚀 [ARCHITECTUS] Launching 3D visualization...');
console.log('   Run: cd packages/proof-of-concept && bun run dev\n');

console.log('================================================\n');
console.log('✅ Thin Vertical Slice Complete!\n');
console.log('Next steps:');
console.log('  1. Review generated files in packages/proof-of-concept/generated/');
console.log('  2. Launch the 3D viewer to see the SDF rendering');
console.log('  3. Test the click-to-read interaction\n');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hashString(str: string): string {
  // Simple hash (not cryptographic)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generatePaletteFromFile(file: ParsedFile): ProceduralPalette {
  // Deterministic color generation based on file metadata
  const seed = parseInt(file.hash.substring(0, 8), 16);

  // Use golden ratio for pleasant color distribution
  const goldenRatio = 0.618033988749895;
  let hue = (seed * goldenRatio) % 1.0;

  const languageColors: Record<string, number> = {
    'typescript': 0.6,   // Blue
    'javascript': 0.15,  // Yellow
    'json': 0.3,         // Green
    'python': 0.2,       // Yellow-green
    'rust': 0.03,        // Orange
    'go': 0.5,           // Cyan
  };

  hue = languageColors[file.language] ?? hue;

  return {
    primary: hslToHex(hue, 0.7, 0.5),
    secondary: hslToHex((hue + 0.3) % 1.0, 0.6, 0.4),
    accent: hslToHex((hue + 0.5) % 1.0, 0.9, 0.6),
    background: hslToHex(hue, 0.2, 0.1),
    glow: hslToHex(hue, 1.0, 0.7),
    mood: hue > 0.5 ? 'cool' : 'warm',
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hueToRgb(p, q, h + 1/3) * 255);
  const g = Math.round(hueToRgb(p, q, h) * 255);
  const b = Math.round(hueToRgb(p, q, h - 1/3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function generateSDFShader(file: ParsedFile, palette: ProceduralPalette) {
  // Generate a simple SDF based on file complexity
  const complexity = Math.min(file.complexity, 10); // Cap at 10

  return {
    id: file.hash,
    glsl: `
// Generated for: ${file.path}
// Language: ${file.language}
// Complexity: ${complexity}

uniform float time;
uniform vec3 color;

// Simple branch SDF (rounded cylinder)
float sdBranch(vec3 p, float height, float radius) {
  vec2 d = vec2(length(p.xz) - radius, abs(p.y) - height);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.05;
}

float sdf(vec3 p) {
  // Main trunk
  float trunk = sdBranch(p, 2.0, 0.1);

  // Add complexity-based branches
  ${Array.from({ length: complexity }).map((_, i) => {
    const angle = (i / complexity) * 3.14159 * 2;
    const height = 0.5 + i * 0.2;
    return `
  vec3 p${i} = p - vec3(sin(${angle.toFixed(2)}) * 0.5, ${height.toFixed(2)}, cos(${angle.toFixed(2)}) * 0.5);
  trunk = min(trunk, sdBranch(p${i}, 0.3, 0.05));`;
  }).join('')}

  return trunk;
}

void main() {
  // Raymarching setup
  vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
  uv.x *= resolution.x / resolution.y;

  vec3 ro = vec3(0.0, 1.0, -3.0); // Ray origin
  vec3 rd = normalize(vec3(uv, 1.0)); // Ray direction

  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    float d = sdf(p);
    if (d < 0.001) break;
    t += d;
    if (t > 100.0) break;
  }

  vec3 finalColor = color;
  if (t < 100.0) {
    // Hit surface - apply lighting
    vec3 p = ro + rd * t;
    vec3 normal = normalize(vec3(
      sdf(p + vec3(0.001, 0, 0)) - sdf(p - vec3(0.001, 0, 0)),
      sdf(p + vec3(0, 0.001, 0)) - sdf(p - vec3(0, 0.001, 0)),
      sdf(p + vec3(0, 0, 0.001)) - sdf(p - vec3(0, 0, 0.001))
    ));

    float diffuse = max(dot(normal, normalize(vec3(1, 1, -1))), 0.0);
    finalColor = color * (0.3 + 0.7 * diffuse);
  } else {
    finalColor = vec3(0.0); // Background
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
    `,
    parameters: {
      time: 0,
      colorR: parseInt(palette.primary.substring(1, 3), 16) / 255,
      colorG: parseInt(palette.primary.substring(3, 5), 16) / 255,
      colorB: parseInt(palette.primary.substring(5, 7), 16) / 255,
    },
    complexity: complexity * 10, // Rough instruction count
  };
}
