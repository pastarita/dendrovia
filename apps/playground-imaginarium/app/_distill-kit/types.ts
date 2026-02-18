/**
 * Distill Kit — Type definitions for IMAGINARIUM's computational generation system.
 *
 * Unlike OCULUS kits which work with EventBus + Zustand, the distill-kit
 * manages pipeline parameters and computed output state. IMAGINARIUM is
 * build-time-only — there's no persistent EventBus or game state store.
 */

import type { ReactNode } from 'react';

// ── Distillation Configuration ────────────────────────

/** Topology-like parameters that drive the distillation pipeline. */
export interface DistillationConfig {
  /** Dominant language (maps to OKLCH base hue) */
  language: string;
  /** Average file complexity (1-25) */
  complexity: number;
  /** Number of files in the codebase */
  fileCount: number;
  /** Maximum directory depth */
  maxDepth: number;
  /** Deterministic seed string */
  seed: string;
  /** Color harmony scheme */
  harmonyScheme: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
  /** Noise function type */
  noiseType: 'simplex' | 'perlin' | 'fbm' | 'worley';
  /** L-system iteration count (1-5) */
  lsystemIterations: number;
  /** Saturation multiplier (0.5-2.0) */
  saturationMultiplier: number;
  /** Lightness offset (-0.2 to 0.2) */
  lightnessOffset: number;
}

// ── Pipeline Output Types ─────────────────────────────

export interface PaletteOutput {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glow: string;
  mood: 'warm' | 'cool' | 'neutral';
}

export interface LSystemOutput {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
  angle: number;
  expanded: string;
  segmentCount: number;
}

export interface NoiseOutput {
  type: 'simplex' | 'perlin' | 'fbm' | 'worley';
  octaves: number;
  frequency: number;
  amplitude: number;
  seed: number;
}

export interface SDFOutput {
  glsl: string;
  instructionCount: number;
  tier: string;
}

// ── Pipeline Tracing ──────────────────────────────────

export type PipelineStepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped';

export interface PipelineStep {
  id: string;
  name: string;
  icon: string;
  status: PipelineStepStatus;
  durationMs?: number;
  output?: string;
  error?: string;
}

// ── Distillation Output ───────────────────────────────

export interface DistillationOutput {
  palette: PaletteOutput | null;
  lsystem: LSystemOutput | null;
  noise: NoiseOutput | null;
  sdf: SDFOutput | null;
  steps: PipelineStep[];
}

// ── Shell Configuration ───────────────────────────────

export interface DistillShellConfig {
  title: string;
  subtitle: string;
  icon: string;
  backHref: string;
  backLabel: string;
  /** Show pipeline trace panel (default: true) */
  showTrace?: boolean;
  /** Show shader viewport (default: true) */
  showViewport?: boolean;
  /** Viewport height CSS value */
  viewportHeight?: string;
}

// ── Render Props ──────────────────────────────────────

export interface DistillRenderProps {
  config: DistillationConfig;
  output: DistillationOutput;
  isComputing: boolean;
  updateConfig: (patch: Partial<DistillationConfig>) => void;
  recompute: () => void;
}

export interface DistillSlots {
  controls: ReactNode;
  viewport?: ReactNode;
}
