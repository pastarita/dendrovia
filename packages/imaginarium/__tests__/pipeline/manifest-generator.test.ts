import { describe, test, expect } from 'bun:test';
import { generateManifest, generateChunkedManifest, type ManifestInput, type ChunkedManifestInput } from '../../src/pipeline/ManifestGenerator';

describe('ManifestGenerator', () => {
  describe('generateManifest', () => {
    test('produces valid manifest with minimal input', () => {
      const input: ManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [{ id: 'global', path: 'palettes/global.json' }],
        topologyPath: '/tmp/test/topology.json',
      };

      const manifest = generateManifest(input);

      expect(manifest.version).toBe('1.0.0');
      expect(manifest.shaders['sdf-0']).toBe('shaders/sdf-0.glsl');
      expect(manifest.palettes['global']).toBe('palettes/global.json');
      expect(manifest.topology).toBe('topology.json');
      expect(manifest.checksum).toBeTruthy();
      expect(typeof manifest.checksum).toBe('string');
    });

    test('uses basename for topology path (no absolute paths leak)', () => {
      const input: ManifestInput = {
        shaders: [],
        palettes: [],
        topologyPath: '/Users/dev/projects/dendrovia/generated/topology.json',
      };

      const manifest = generateManifest(input);

      expect(manifest.topology).toBe('topology.json');
      expect(manifest.topology).not.toContain('/Users');
      expect(manifest.topology).not.toContain('generated');
    });

    test('includes all optional fields when provided', () => {
      const input: ManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [{ id: 'global', path: 'palettes/global.json' }],
        topologyPath: 'topology.json',
        topologyHash: 'abc123',
        noisePath: 'noise/global.json',
        lsystemPath: 'lsystems/global.json',
        mycology: {
          specimens: 'mycology/specimens.json',
          network: 'mycology/network.json',
          assetDir: 'mycology/assets',
          specimenCount: 12,
        },
        meshes: {
          'genus-amanita': {
            path: 'meshes/genus-amanita.json',
            hash: 'deadbeef12345678',
            format: 'halfedge',
            vertices: 120,
            faces: 200,
            size: 4096,
            tier: 'enriched',
            genusId: 'amanita',
          },
        },
        storyArc: {
          arc: 'story-arc.json',
          segmentAssets: 'segment-assets.json',
          segmentCount: 5,
        },
      };

      const manifest = generateManifest(input);

      expect(manifest.noise).toBe('noise/global.json');
      expect(manifest.lsystem).toBe('lsystems/global.json');
      expect(manifest.mycology).toBeDefined();
      expect(manifest.mycology!.specimenCount).toBe(12);
      expect(manifest.meshes).toBeDefined();
      expect(manifest.meshes!['genus-amanita']).toBeDefined();
      expect(manifest.storyArc).toBeDefined();
      expect(manifest.storyArc!.segmentCount).toBe(5);
    });

    test('checksum is deterministic (same input → same checksum)', () => {
      const input: ManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [{ id: 'global', path: 'palettes/global.json' }],
        topologyPath: 'topology.json',
        topologyHash: 'fixed-hash',
      };

      const manifest1 = generateManifest(input);
      const manifest2 = generateManifest(input);

      expect(manifest1.checksum).toBe(manifest2.checksum);
    });

    test('checksum is sensitive to input changes', () => {
      const base: ManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [{ id: 'global', path: 'palettes/global.json' }],
        topologyPath: 'topology.json',
        topologyHash: 'hash-a',
      };

      const modified: ManifestInput = {
        ...base,
        topologyHash: 'hash-b',
      };

      const manifest1 = generateManifest(base);
      const manifest2 = generateManifest(modified);

      expect(manifest1.checksum).not.toBe(manifest2.checksum);
    });

    test('checksum changes when shader list differs', () => {
      const base: ManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [],
        topologyPath: 'topology.json',
      };

      const withExtra: ManifestInput = {
        shaders: [
          { id: 'sdf-0', path: 'shaders/sdf-0.glsl' },
          { id: 'sdf-1', path: 'shaders/sdf-1.glsl' },
        ],
        palettes: [],
        topologyPath: 'topology.json',
      };

      expect(generateManifest(base).checksum).not.toBe(generateManifest(withExtra).checksum);
    });
  });

  describe('generateChunkedManifest', () => {
    test('produces valid chunked manifest', () => {
      const input: ChunkedManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [{ id: 'global', path: 'palettes/global.json' }],
        topologyHash: 'topo-hash-123',
        worldIndexPath: 'world-index.json',
        segments: {
          'seg-0': {
            topology: 'segments/seg-0/topology-chunk.json',
            palette: 'segments/seg-0/palette.json',
            noise: 'segments/seg-0/noise.json',
            lsystem: 'segments/seg-0/lsystem.json',
            shader: 'segments/seg-0/shader.glsl',
          },
        },
      };

      const manifest = generateChunkedManifest(input);

      expect(manifest.version).toBe('2.0.0');
      expect(manifest.worldIndex).toBe('world-index.json');
      expect(manifest.segments['seg-0']).toBeDefined();
      expect(manifest.segments['seg-0'].topology).toBe('segments/seg-0/topology-chunk.json');
      expect(manifest.checksum).toBeTruthy();
    });

    test('includes optional fields', () => {
      const input: ChunkedManifestInput = {
        shaders: [],
        palettes: [],
        topologyHash: 'hash',
        worldIndexPath: 'world-index.json',
        segments: {},
        noisePath: 'noise/global.json',
        lsystemPath: 'lsystems/global.json',
        meshIndexPath: 'mesh-index.json',
        storyArc: { arc: 'story-arc.json', segmentCount: 3 },
        mycologyNetwork: 'mycology/network.json',
      };

      const manifest = generateChunkedManifest(input);

      expect(manifest.noise).toBe('noise/global.json');
      expect(manifest.lsystem).toBe('lsystems/global.json');
      expect(manifest.meshIndex).toBe('mesh-index.json');
      expect(manifest.storyArc?.segmentCount).toBe(3);
      expect(manifest.mycologyNetwork).toBe('mycology/network.json');
    });

    test('checksum is deterministic', () => {
      const input: ChunkedManifestInput = {
        shaders: [{ id: 'sdf-0', path: 'shaders/sdf-0.glsl' }],
        palettes: [],
        topologyHash: 'stable',
        worldIndexPath: 'world-index.json',
        segments: { 'seg-0': { topology: 't', palette: 'p', noise: 'n', lsystem: 'l', shader: 's' } },
      };

      expect(generateChunkedManifest(input).checksum).toBe(generateChunkedManifest(input).checksum);
    });
  });
});
