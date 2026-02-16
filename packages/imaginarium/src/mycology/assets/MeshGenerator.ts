/**
 * MeshGenerator — prepares data for Three.js instanced rendering.
 *
 * Outputs vertex positions, normals, UVs, and instance attributes.
 * Does NOT render — that's ARCHITECTUS's job. This just generates data.
 */

import type { FungalSpecimen, MushroomMorphology, CapShape } from '../types';
import { hexToRgb } from '../../utils/color';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface MushroomMeshData {
  specimenId: string;
  cap: ProfileGeometry;
  stem: CylinderGeometry;
  instanceData: InstanceData;
  lod: LODConfig;
}

export interface ProfileGeometry {
  points: [number, number][]; // profile curve for LatheGeometry
  segments: number;           // radial segments
}

export interface CylinderGeometry {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
}

export interface InstanceData {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number]; // euler angles
  color: [number, number, number];    // normalized RGB
  emissive: [number, number, number]; // glow color (0,0,0 if none)
}

export interface LODConfig {
  billboard: boolean;          // use sprite at distance
  billboardThreshold: number;  // distance threshold
  clusterCount: number;        // instances in cluster (1 = solitary)
  clusterRadius: number;       // spread radius for cluster
}

// ---------------------------------------------------------------------------
// Cap profile generation
// ---------------------------------------------------------------------------

function generateCapProfile(shape: CapShape, width: number, height: number): [number, number][] {
  const points: [number, number][] = [];
  const steps = 12;
  const halfW = width / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 (center) to 1 (edge)
    const x = t * halfW; // radial distance
    let y: number;

    switch (shape) {
      case 'convex':
        y = height * (1 - t * t); // parabolic dome
        break;
      case 'campanulate':
        y = height * Math.pow(1 - t, 1.5); // bell curve
        break;
      case 'umbonate':
        y = height * (1 - t * t) + (t < 0.3 ? height * 0.2 * (1 - t / 0.3) : 0);
        break;
      case 'infundibuliform':
        y = -height * t * t; // inverted parabola (funnel)
        break;
      case 'plane':
        y = height * 0.1 * (1 - t); // nearly flat
        break;
      case 'depressed':
        y = height * (t * t - 0.3) * (t < 0.5 ? 1 : 0.5); // concave center
        break;
    }

    points.push([x, y]);
  }

  return points;
}

// ---------------------------------------------------------------------------
// Instance data generation
// ---------------------------------------------------------------------------

function generateInstanceData(specimen: FungalSpecimen): InstanceData {
  const m = specimen.morphology;
  const p = specimen.placement;

  const rgb = hexToRgb(m.scaleColor);
  const color: [number, number, number] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

  let emissive: [number, number, number] = [0, 0, 0];
  if (m.bioluminescence !== 'none') {
    const glowRgb = hexToRgb(m.scaleColor);
    const intensity = m.bioluminescence === 'pulsing' ? 0.8 :
                     m.bioluminescence === 'bright' ? 0.5 : 0.2;
    emissive = [
      glowRgb.r / 255 * intensity,
      glowRgb.g / 255 * intensity,
      glowRgb.b / 255 * intensity,
    ];
  }

  return {
    position: p.position,
    scale: [p.scale, p.scale, p.scale],
    rotation: [0, p.rotation, 0],
    color,
    emissive,
  };
}

// ---------------------------------------------------------------------------
// LOD configuration
// ---------------------------------------------------------------------------

function generateLOD(specimen: FungalSpecimen): LODConfig {
  const m = specimen.morphology;
  const p = specimen.placement;

  // Small specimens get billboarded sooner
  const sizeMultiplier = m.sizeClass === 'tiny' ? 0.5 :
                         m.sizeClass === 'small' ? 0.7 :
                         m.sizeClass === 'medium' ? 1.0 :
                         m.sizeClass === 'large' ? 1.3 : 1.5;

  return {
    billboard: m.sizeClass === 'tiny' || m.sizeClass === 'small',
    billboardThreshold: 30 * sizeMultiplier,
    clusterCount: p.clusterSize,
    clusterRadius: p.clusterSize > 1 ? 0.5 + p.clusterSize * 0.1 : 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateMeshData(specimen: FungalSpecimen): MushroomMeshData {
  const m = specimen.morphology;

  // Cap
  const capWidth = 0.3 + m.capWidth * 0.7;   // 0.3 - 1.0 world units
  const capHeight = 0.1 + m.capHeight * 0.5;  // 0.1 - 0.6 world units
  const capProfile = generateCapProfile(m.capShape, capWidth, capHeight);
  const capSegments = m.sizeClass === 'tiny' ? 8 : m.sizeClass === 'small' ? 12 : 16;

  // Stem
  const stemHeight = 0.2 + m.stem.height * 1.0; // 0.2 - 1.2 world units
  const stemRadiusTop = 0.02 + m.stem.thickness * 0.08;
  const stemRadiusBottom = stemRadiusTop * (m.stem.bulbous ? 1.8 : 1.2);
  const stemSegments = m.sizeClass === 'tiny' ? 6 : 8;

  return {
    specimenId: specimen.id,
    cap: {
      points: capProfile,
      segments: capSegments,
    },
    stem: {
      radiusTop: stemRadiusTop,
      radiusBottom: stemRadiusBottom,
      height: stemHeight,
      radialSegments: stemSegments,
    },
    instanceData: generateInstanceData(specimen),
    lod: generateLOD(specimen),
  };
}
