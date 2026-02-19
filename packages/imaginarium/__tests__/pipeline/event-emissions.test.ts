import { describe, test, expect, afterEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { ProceduralPalette, SDFShader, StoryArc, SegmentAssets } from '@dendrovia/shared';
import { distill } from '../../src/pipeline/DistillationPipeline';
import { generateMockTopology } from '../../src/pipeline/MockTopology';

const TEST_OUTPUT = join(import.meta.dir, '.test-event-emissions');
const TOPOLOGY_PATH = join(TEST_OUTPUT, 'topology.json');

describe('DistillationPipeline event emissions', () => {
  afterEach(() => {
    getEventBus().clear();
    if (existsSync(TEST_OUTPUT)) {
      rmSync(TEST_OUTPUT, { recursive: true });
    }
  });

  test('emits all 5 IMAGINARIUM events in correct order', async () => {
    // Setup
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(30);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    const received: Array<{ event: string; data: unknown }> = [];

    // Subscribe to all IMAGINARIUM events
    const events = [
      GameEvents.PALETTE_GENERATED,
      GameEvents.SHADERS_COMPILED,
      GameEvents.STORY_ARC_DERIVED,
      GameEvents.MYCOLOGY_CATALOGED,
      GameEvents.SEGMENT_DISTILLED,
    ];

    for (const event of events) {
      eventBus.on(event, (data: unknown) => {
        received.push({ event, data });
      });
    }

    // Run pipeline
    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    // Collect event names (deduped, preserving first occurrence order)
    const eventNames = received.map(r => r.event);
    const uniqueEventOrder: string[] = [];
    for (const name of eventNames) {
      if (!uniqueEventOrder.includes(name)) {
        uniqueEventOrder.push(name);
      }
    }

    // All 5 event types fire
    expect(uniqueEventOrder).toContain(GameEvents.PALETTE_GENERATED);
    expect(uniqueEventOrder).toContain(GameEvents.SHADERS_COMPILED);
    expect(uniqueEventOrder).toContain(GameEvents.STORY_ARC_DERIVED);
    expect(uniqueEventOrder).toContain(GameEvents.MYCOLOGY_CATALOGED);
    expect(uniqueEventOrder).toContain(GameEvents.SEGMENT_DISTILLED);

    // Ordering: PALETTE before SHADERS before STORY_ARC
    const paletteIdx = uniqueEventOrder.indexOf(GameEvents.PALETTE_GENERATED);
    const shadersIdx = uniqueEventOrder.indexOf(GameEvents.SHADERS_COMPILED);
    const storyArcIdx = uniqueEventOrder.indexOf(GameEvents.STORY_ARC_DERIVED);
    const segDistilledIdx = uniqueEventOrder.indexOf(GameEvents.SEGMENT_DISTILLED);

    expect(paletteIdx).toBeLessThan(shadersIdx);
    expect(shadersIdx).toBeLessThan(storyArcIdx);
    // SEGMENT_DISTILLED fires during story arc derivation, so it comes after SHADERS
    // but before or during STORY_ARC processing
    expect(segDistilledIdx).toBeGreaterThan(shadersIdx);
  });

  test('PALETTE_GENERATED payload has { palette: ProceduralPalette } shape', async () => {
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(20);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    let palettePayload: unknown = null;

    eventBus.on(GameEvents.PALETTE_GENERATED, (data: unknown) => {
      palettePayload = data;
    });

    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    expect(palettePayload).toBeDefined();
    const payload = palettePayload as { palette: ProceduralPalette };
    expect(payload.palette).toBeDefined();
    expect(payload.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(payload.palette.secondary).toMatch(/^#[0-9a-f]{6}$/);
    expect(payload.palette.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(payload.palette.background).toMatch(/^#[0-9a-f]{6}$/);
    expect(payload.palette.glow).toMatch(/^#[0-9a-f]{6}$/);
    expect(['warm', 'cool', 'neutral']).toContain(payload.palette.mood);
  });

  test('SHADERS_COMPILED payload has { shaders: SDFShader[] } shape', async () => {
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(20);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    let shadersPayload: unknown = null;

    eventBus.on(GameEvents.SHADERS_COMPILED, (data: unknown) => {
      shadersPayload = data;
    });

    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    expect(shadersPayload).toBeDefined();
    const payload = shadersPayload as { shaders: SDFShader[] };
    expect(Array.isArray(payload.shaders)).toBe(true);
    expect(payload.shaders.length).toBeGreaterThan(0);
    for (const shader of payload.shaders) {
      expect(shader.id).toBeTruthy();
      expect(shader.glsl).toBeTruthy();
      expect(typeof shader.complexity).toBe('number');
    }
  });

  test('STORY_ARC_DERIVED payload has { arc, segmentCount } shape', async () => {
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(30);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    let arcPayload: unknown = null;

    eventBus.on(GameEvents.STORY_ARC_DERIVED, (data: unknown) => {
      arcPayload = data;
    });

    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    expect(arcPayload).toBeDefined();
    const payload = arcPayload as { arc: StoryArc; segmentCount: number };
    expect(payload.arc).toBeDefined();
    expect(payload.arc.segments).toBeDefined();
    expect(Array.isArray(payload.arc.segments)).toBe(true);
    expect(payload.segmentCount).toBe(payload.arc.segments.length);
  });

  test('MYCOLOGY_CATALOGED payload has { specimenCount, networkEdgeCount, manifestPath }', async () => {
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(30);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    let mycologyPayload: unknown = null;

    eventBus.on(GameEvents.MYCOLOGY_CATALOGED, (data: unknown) => {
      mycologyPayload = data;
    });

    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    expect(mycologyPayload).toBeDefined();
    const payload = mycologyPayload as { specimenCount: number; networkEdgeCount: number; manifestPath: string };
    expect(typeof payload.specimenCount).toBe('number');
    expect(typeof payload.networkEdgeCount).toBe('number');
    expect(typeof payload.manifestPath).toBe('string');
  });

  test('SEGMENT_DISTILLED fires once per segment with correct segmentId', async () => {
    mkdirSync(TEST_OUTPUT, { recursive: true });
    const topology = generateMockTopology(30);
    await Bun.write(TOPOLOGY_PATH, JSON.stringify(topology, null, 2));

    const eventBus = getEventBus();
    const segmentEvents: Array<{ segmentId: string; assets: SegmentAssets }> = [];

    eventBus.on(GameEvents.SEGMENT_DISTILLED, (data: { segmentId: string; assets: SegmentAssets }) => {
      segmentEvents.push(data);
    });

    // Also capture story arc to cross-reference segment count
    let arcData: { arc: StoryArc } | null = null;
    eventBus.on(GameEvents.STORY_ARC_DERIVED, (data: { arc: StoryArc }) => {
      arcData = data;
    });

    await distill(TOPOLOGY_PATH, TEST_OUTPUT);

    expect(arcData).toBeDefined();
    expect(segmentEvents.length).toBe(arcData!.arc.segments.length);

    // Each segment has unique ID and valid assets
    const segmentIds = segmentEvents.map(e => e.segmentId);
    expect(new Set(segmentIds).size).toBe(segmentIds.length);

    for (const evt of segmentEvents) {
      expect(evt.segmentId).toBeTruthy();
      expect(evt.assets).toBeDefined();
      expect(evt.assets.palette).toBeDefined();
      expect(evt.assets.shader).toBeDefined();
    }
  });
});
