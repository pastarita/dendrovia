/**
 * Boundary Contract Registry — Maps pillar-to-pillar edges
 * to their shared types, events, and schemas.
 *
 * Data derived from @dendrovia/shared types + events.
 */

import type { BoundaryContract } from '../types';

/**
 * Keyed by "sourceId->targetId" matching edge IDs in fixtures.
 */
export const BOUNDARY_CONTRACTS: Record<string, BoundaryContract> = {
  // -----------------------------------------------------------------------
  // CHRONOS → IMAGINARIUM
  // -----------------------------------------------------------------------
  'dend-chronos->dend-imaginarium': {
    types: [
      {
        name: 'CodeTopology',
        source: '@dendrovia/shared',
        description:
          'Complete topology of a codebase: files, dependencies, complexity scores, and contributor profiles.',
        fields: ['files', 'dependencies', 'avgComplexity', 'maxDepth', 'hotspots', 'contributors'],
      },
    ],
    events: [
      {
        name: 'PARSE_COMPLETE',
        key: 'chronos:parse:complete',
        direction: 'emit',
        payloadType: 'ParseResult',
      },
      {
        name: 'TOPOLOGY_GENERATED',
        key: 'chronos:topology:generated',
        direction: 'emit',
        payloadType: 'CodeTopology',
      },
    ],
    schema: 'TopologySchema',
  },

  // -----------------------------------------------------------------------
  // IMAGINARIUM → ARCHITECTUS
  // -----------------------------------------------------------------------
  'dend-imaginarium->dend-architectus': {
    types: [
      {
        name: 'ProceduralPalette',
        source: '@dendrovia/shared',
        description: 'OKLCH color palette extracted from code topology.',
        fields: ['colors', 'accent', 'background', 'semantic'],
      },
      {
        name: 'SDFShader',
        source: '@dendrovia/shared',
        description: 'GLSL shader source with SDF distance functions.',
        fields: ['vertexSource', 'fragmentSource', 'uniforms'],
      },
      {
        name: 'LSystemRule',
        source: '@dendrovia/shared',
        description: 'L-system axiom, production rules, and iteration depth.',
        fields: ['axiom', 'rules', 'iterations', 'angle'],
      },
      {
        name: 'NoiseFunction',
        source: '@dendrovia/shared',
        description: 'Parameterized noise function definition.',
        fields: ['type', 'octaves', 'frequency', 'amplitude'],
      },
      {
        name: 'FungalSpecimen[]',
        source: '@dendrovia/shared',
        description: 'Mycology catalog: fungal specimens mapped from code files.',
        fields: ['genus', 'morphology', 'habitat', 'lore'],
      },
      {
        name: 'MycelialNetwork',
        source: '@dendrovia/shared',
        description: 'Network graph of fungal connections between code modules.',
        fields: ['nodes', 'edges', 'clusters'],
      },
      {
        name: 'AssetManifest',
        source: '@dendrovia/shared',
        description: 'Manifest of all generated assets with checksums.',
        fields: ['palettes', 'shaders', 'lsystems', 'meshes', 'checksum'],
      },
      {
        name: 'SerializedMeshData',
        source: '@dendrovia/shared',
        description: 'Half-edge mesh geometry serialized for GPU upload.',
        fields: ['vertices', 'indices', 'normals', 'genus'],
      },
    ],
    events: [
      {
        name: 'DISTILL_COMPLETE',
        key: 'imaginarium:distill:complete',
        direction: 'emit',
        payloadType: 'AssetManifest',
      },
      {
        name: 'MYCOLOGY_CATALOGED',
        key: 'imaginarium:mycology:cataloged',
        direction: 'emit',
        payloadType: 'FungalSpecimen[]',
      },
      {
        name: 'MESH_GENERATED',
        key: 'imaginarium:mesh:generated',
        direction: 'emit',
        payloadType: 'SerializedMeshData[]',
      },
    ],
    schema: 'PaletteSchema',
  },

  // -----------------------------------------------------------------------
  // ARCHITECTUS → LUDUS
  // -----------------------------------------------------------------------
  'dend-architectus->dend-ludus': {
    types: [
      {
        name: 'DendriteConfig',
        source: '@dendrovia/shared',
        description: 'Spatial configuration for the 3D world.',
        fields: ['worldScale', 'cameraConfig', 'lightingConfig'],
      },
      {
        name: 'GameWorldState',
        source: '@dendrovia/shared',
        description: 'Snapshot of the 3D world state shared with game mechanics.',
        fields: ['entities', 'spatialIndex', 'playerPosition', 'activeRegion'],
      },
    ],
    events: [
      {
        name: 'PLAYER_MOVED',
        key: 'player:moved',
        direction: 'emit',
        payloadType: 'Position3D',
      },
      {
        name: 'ENTITY_CLICKED',
        key: 'entity:clicked',
        direction: 'emit',
        payloadType: 'EntityId',
      },
      {
        name: 'REGION_ENTERED',
        key: 'region:entered',
        direction: 'emit',
        payloadType: 'RegionId',
      },
      {
        name: 'NODE_INSPECTED',
        key: 'node:inspected',
        direction: 'emit',
        payloadType: 'NodeId',
      },
      {
        name: 'COMBAT_STARTED',
        key: 'combat:started',
        direction: 'consume',
        payloadType: 'CombatConfig',
      },
      {
        name: 'COMBAT_ENDED',
        key: 'combat:ended',
        direction: 'consume',
        payloadType: 'CombatResult',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // ARCHITECTUS → OCULUS
  // -----------------------------------------------------------------------
  'dend-architectus->dend-oculus': {
    types: [
      {
        name: 'GameWorldState',
        source: '@dendrovia/shared',
        description: 'World state consumed by UI for HUD and overlays.',
        fields: ['entities', 'spatialIndex', 'playerPosition', 'activeRegion'],
      },
    ],
    events: [
      {
        name: 'PLAYER_MOVED',
        key: 'player:moved',
        direction: 'emit',
        payloadType: 'Position3D',
      },
      {
        name: 'NODE_INSPECTED',
        key: 'node:inspected',
        direction: 'emit',
        payloadType: 'NodeId',
      },
      {
        name: 'CAMERA_CHANGED',
        key: 'camera:changed',
        direction: 'emit',
        payloadType: 'CameraState',
      },
    ],
  },

  // -----------------------------------------------------------------------
  // ARCHITECTUS → OPERATUS
  // -----------------------------------------------------------------------
  'dend-architectus->dend-operatus': {
    types: [
      {
        name: 'AssetManifest',
        source: '@dendrovia/shared',
        description: 'Manifest for cache management and CDN loading.',
        fields: ['palettes', 'shaders', 'lsystems', 'meshes', 'checksum'],
      },
      {
        name: 'GameWorldState',
        source: '@dendrovia/shared',
        description: 'State snapshot for persistence and sync.',
        fields: ['entities', 'spatialIndex', 'playerPosition', 'activeRegion'],
      },
    ],
    events: [
      {
        name: 'STATE_SNAPSHOT',
        key: 'state:snapshot',
        direction: 'emit',
        payloadType: 'GameWorldState',
      },
      {
        name: 'ASSET_LOADED',
        key: 'asset:loaded',
        direction: 'emit',
        payloadType: 'AssetRef',
      },
      {
        name: 'SAVE_REQUESTED',
        key: 'save:requested',
        direction: 'emit',
        payloadType: 'SavePayload',
      },
    ],
  },
};
