/**
 * OCULUS — The Interface
 *
 * UI/UX components for the Dendrovia game engine.
 * Purely presentational: reads game state, never mutates it.
 *
 * @packageDocumentation
 */

export { BattleUI } from './components/BattleUI';
export type { Billboard3DProps } from './components/Billboard3D';
export { Billboard3D } from './components/Billboard3D';
export type { CodeReaderProps } from './components/CodeReader';
export { CodeReader } from './components/CodeReader';
export { FalconModeOverlay } from './components/FalconModeOverlay';
// ── Components ───────────────────────────────────────
export { HUD } from './components/HUD';
export { MillerColumns } from './components/MillerColumns';
export { Minimap } from './components/Minimap';
export type {
  FrameOrnamentSet,
  FrameVariant,
  IconBadgeProps,
  OrnateFrameProps,
  PanelProps,
  PillarId,
  PillarPalette,
  PillarSpec,
  ProgressBarProps,
  ProgressBarVariant,
  StatLabelProps,
  TooltipProps,
  VariantSpec,
} from './components/primitives';
// ── Primitives ───────────────────────────────────────
export {
  FRAME_REGISTRY,
  IconBadge,
  OrnateFrame,
  Panel,
  PILLAR_PALETTES,
  PILLAR_SPECS,
  ProgressBar,
  StatLabel,
  Tooltip,
  VARIANT_SPECS,
} from './components/primitives';
export { QuestLog } from './components/QuestLog';
export type { CodeLoaderOptions } from './hooks/useCodeLoader';
export { useCodeLoader } from './hooks/useCodeLoader';
export { useEventSubscriptions } from './hooks/useEventSubscriptions';
// ── Hooks ────────────────────────────────────────────
export { useInputCapture, useIsUiHovered } from './hooks/useInputCapture';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export type { OculusConfig, OculusProviderProps } from './OculusProvider';
// ── Provider ─────────────────────────────────────────
export { OculusProvider, useOculus } from './OculusProvider';
export type {
  ActivePanel,
  BattleState,
  CameraMode,
  CodeReaderState,
  OculusActions,
  OculusState,
  OculusStore,
} from './store/useOculusStore';
// ── Store ────────────────────────────────────────────
export { useOculusStore } from './store/useOculusStore';
