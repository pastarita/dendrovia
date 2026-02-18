/**
 * Distill Kit — IMAGINARIUM's unique computational generation infrastructure.
 *
 * Fourth modality kit alongside Zoo/Gym/Museum. Encapsulates:
 * - Pipeline parameter management (topology config, seed, complexity)
 * - Computed output state (palette, SDF, L-system, noise)
 * - Shader preview rendering (WebGL2 viewport)
 * - Pipeline execution tracing (step-by-step output)
 *
 * Consumed by Generators (interactive creation) and Gyms (live experimentation).
 */

// Shell
export { DistillShell } from './DistillShell';

// Provider
export { DistillationProvider, useDistillation, useDistillDispatch } from './DistillationProvider';
export type { DistillAction } from './DistillationProvider';

// Components
export { ShaderViewport } from './ShaderViewport';
export { PipelineTrace } from './PipelineTrace';
export { DistillationControls } from './DistillationControls';

// Types
export type {
  DistillationConfig,
  PaletteOutput,
  LSystemOutput,
  NoiseOutput,
  SDFOutput,
  PipelineStep,
  PipelineStepStatus,
  DistillationOutput,
  DistillShellConfig,
  DistillRenderProps,
  DistillSlots,
} from './types';

// Styles
export {
  tabStyle,
  sectionHeaderStyle,
  countStyle,
  controlPanelStyle,
  viewportStyle,
  viewportCanvasStyle,
  viewportOverlayStyle,
  traceContainerStyle,
  traceHeaderStyle,
  traceStepStyle,
  stepStatusDotStyle,
  glslBlockStyle,
  swatchStyle,
  distillBtnStyle,
  distillBtnPrimaryStyle,
  cardStyle,
  emptyStateStyle,
} from './distill-styles';
