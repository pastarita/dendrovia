/**
 * OCULUS — The Interface
 *
 * UI/UX components for the Dendrovia game engine.
 * Purely presentational: reads game state, never mutates it.
 *
 * @packageDocumentation
 */

// ── Provider ─────────────────────────────────────────
export { OculusProvider, useOculus } from './OculusProvider';
export type { OculusProviderProps, OculusConfig } from './OculusProvider';

// ── Store ────────────────────────────────────────────
export { useOculusStore } from './store/useOculusStore';
export type {
  OculusState,
  OculusActions,
  OculusStore,
  ActivePanel,
  CameraMode,
  BattleState,
  CodeReaderState,
} from './store/useOculusStore';

// ── Components ───────────────────────────────────────
export { HUD } from './components/HUD';
export { Minimap } from './components/Minimap';
export { BattleUI } from './components/BattleUI';
export { QuestLog } from './components/QuestLog';
export { MillerColumns } from './components/MillerColumns';
export { CodeReader } from './components/CodeReader';
export type { CodeReaderProps } from './components/CodeReader';
export { FalconModeOverlay } from './components/FalconModeOverlay';
export { Billboard3D } from './components/Billboard3D';
export type { Billboard3DProps } from './components/Billboard3D';

// ── Primitives ───────────────────────────────────────
export {
  Panel,
  ProgressBar,
  IconBadge,
  StatLabel,
  Tooltip,
  OrnateFrame,
} from './components/primitives';
export type {
  PanelProps,
  ProgressBarProps,
  ProgressBarVariant,
  IconBadgeProps,
  StatLabelProps,
  TooltipProps,
  OrnateFrameProps,
  PillarId,
  FrameVariant,
  PillarPalette,
} from './components/primitives';

// ── Hooks ────────────────────────────────────────────
export { useInputCapture, useIsUiHovered } from './hooks/useInputCapture';
export { useEventSubscriptions } from './hooks/useEventSubscriptions';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { useCodeLoader } from './hooks/useCodeLoader';
export type { CodeLoaderOptions } from './hooks/useCodeLoader';
