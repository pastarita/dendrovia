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
  CoarseCameraMode,
  BattleState,
  CodeReaderState,
  StatusEffect,
  LootDrop,
} from './store/useOculusStore';

export { usePanelStore } from './store/usePanelStore';
export type { PanelStore, PanelStoreActions } from './store/usePanelStore';
export type {
  PanelConfig,
  PanelGeometry,
  PanelMinSize,
  PanelSnapshot,
  LayoutSnapshot,
  PanelStoreState,
  DisplayMode,
  PanelCategory,
} from './store/panel-types';

// ── Components ───────────────────────────────────────
export { HUD } from './components/HUD';
export { Minimap } from './components/Minimap';
export { BattleUI } from './components/BattleUI';
export { QuestLog } from './components/QuestLog';
export { MillerColumns } from './components/MillerColumns';
export { CodeReader } from './components/CodeReader';
export type { CodeReaderProps } from './components/CodeReader';
export { StatusEffectBar } from './components/StatusEffectBar';
export { LootPanel } from './components/LootPanel';
export { FalconModeOverlay } from './components/FalconModeOverlay';
export { WorldHeader } from './components/WorldHeader';
export { NavigationBar } from './components/NavigationBar';
export { Billboard3D } from './components/Billboard3D';
export type { Billboard3DProps } from './components/Billboard3D';
export { WelcomeScreen } from './components/WelcomeScreen';
export type { WelcomeScreenProps } from './components/WelcomeScreen';
export { OnboardingHints } from './components/OnboardingHints';
export type { OnboardingHintsProps } from './components/OnboardingHints';

// ── Panel Management Components ─────────────────────
export { ManagedPanel } from './components/ManagedPanel';
export type { ManagedPanelProps } from './components/ManagedPanel';
export { EncounterPanel } from './components/EncounterPanel';
export type { EncounterPanelProps, EncounterSlots, EncounterType, EncounterLayout } from './components/EncounterPanel';
export { PanelWindowManager } from './components/PanelWindowManager';
export { MinimizedDock } from './components/MinimizedDock';
export { LayoutExporter, DevStateInspector } from './components/dev';

// ── Primitives ───────────────────────────────────────
export {
  Panel,
  ProgressBar,
  IconBadge,
  StatLabel,
  Tooltip,
  OrnateFrame,
  PILLAR_PALETTES,
  FRAME_REGISTRY,
  VARIANT_SPECS,
  PILLAR_SPECS,
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
  FrameOrnamentSet,
  VariantSpec,
  PillarSpec,
} from './components/primitives';

// ── Hooks ────────────────────────────────────────────
export { useInputCapture, useIsUiHovered } from './hooks/useInputCapture';
export { useEventSubscriptions } from './hooks/useEventSubscriptions';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { useCodeLoader } from './hooks/useCodeLoader';
export type { CodeLoaderOptions } from './hooks/useCodeLoader';
export { useOnboarding } from './hooks/useOnboarding';
export type {
  OnboardingPhase,
  OnboardingState,
  UseOnboardingReturn,
} from './hooks/useOnboarding';
export { useDragResize } from './hooks/useDragResize';
export { usePanelRegistration } from './hooks/usePanelRegistration';
