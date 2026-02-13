/**
 * ManifestGenerator Tests
 *
 * Tests the build-time manifest generation tool
 * which runs in Node/Bun (not browser).
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { ManifestGenerator } from '../src/manifest/ManifestGenerator.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

const TEST_DIR = join(import.meta.dir, '.test-generated');

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(join(TEST_DIR, 'shaders'), { recursive: true });

  // Create test assets
  await writeFile(join(TEST_DIR, 'topology.json'), JSON.stringify({
    version: '1.0',
    files: [],
    commits: [],
    tree: { name: 'root', path: '/', type: 'directory' },
  }));

  await writeFile(join(TEST_DIR, 'shaders', 'dendrite.glsl'), `
    uniform float time;
    void main() { gl_FragColor = vec4(1.0); }
  `);

  await writeFile(join(TEST_DIR, 'shaders', 'bark.glsl'), `
    uniform vec3 color;
    float sdf(vec3 p) { return length(p) - 1.0; }
  `);

  await writeFile(join(TEST_DIR, 'palette.json'), JSON.stringify({
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
    background: '#0a0a1a',
    glow: '#e94560',
    mood: 'cool',
  }));
});

afterAll(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe('ManifestGenerator', () => {
  test('generates manifest with correct structure', async () => {
    const gen = new ManifestGenerator({ inputDir: TEST_DIR });
    const manifest = await gen.generate();

    expect(manifest.version).toBeDefined();
    expect(manifest.checksum).toBeDefined();
    expect(typeof manifest.checksum).toBe('string');
    expect(manifest.checksum.length).toBe(16);
  });

  test('detects shaders', async () => {
    const gen = new ManifestGenerator({ inputDir: TEST_DIR });
    const manifest = await gen.generate();

    expect(Object.keys(manifest.shaders).length).toBe(2);
    expect(manifest.shaders['dendrite']).toBe('shaders/dendrite.glsl');
    expect(manifest.shaders['bark']).toBe('shaders/bark.glsl');
  });

  test('detects topology', async () => {
    const gen = new ManifestGenerator({ inputDir: TEST_DIR });
    const manifest = await gen.generate();

    expect(manifest.topology).toBe('topology.json');
  });

  test('detects palettes', async () => {
    const gen = new ManifestGenerator({ inputDir: TEST_DIR });
    const manifest = await gen.generate();

    expect(Object.keys(manifest.palettes).length).toBe(1);
    expect(manifest.palettes['palette']).toBe('palette.json');
  });

  test('writes manifest to disk', async () => {
    const outputPath = join(TEST_DIR, 'manifest.json');
    const gen = new ManifestGenerator({ inputDir: TEST_DIR, outputPath });
    const { manifest, entries } = await gen.generateAndWrite();

    expect(entries.length).toBe(4); // 2 shaders + topology + palette

    const file = Bun.file(outputPath);
    const written = await file.json();
    expect(written.checksum).toBe(manifest.checksum);
  });

  test('checksum changes when content changes', async () => {
    const gen = new ManifestGenerator({ inputDir: TEST_DIR });
    const manifest1 = await gen.generate();

    // Modify a shader
    await writeFile(join(TEST_DIR, 'shaders', 'dendrite.glsl'), `
      uniform float time;
      uniform float modified;
      void main() { gl_FragColor = vec4(0.5); }
    `);

    const manifest2 = await gen.generate();
    expect(manifest2.checksum).not.toBe(manifest1.checksum);

    // Restore original
    await writeFile(join(TEST_DIR, 'shaders', 'dendrite.glsl'), `
      uniform float time;
      void main() { gl_FragColor = vec4(1.0); }
    `);
  });

  test('handles empty directory', async () => {
    const emptyDir = join(TEST_DIR, 'empty');
    await mkdir(emptyDir, { recursive: true });

    const gen = new ManifestGenerator({ inputDir: emptyDir });
    const manifest = await gen.generate();

    expect(Object.keys(manifest.shaders).length).toBe(0);
    expect(Object.keys(manifest.palettes).length).toBe(0);
    expect(manifest.topology).toBe('');

    await rm(emptyDir, { recursive: true });
  });

  test('handles nonexistent directory', async () => {
    const gen = new ManifestGenerator({ inputDir: '/nonexistent/path' });
    const manifest = await gen.generate();

    expect(Object.keys(manifest.shaders).length).toBe(0);
  });
});
