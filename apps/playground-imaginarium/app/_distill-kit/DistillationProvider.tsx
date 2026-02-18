'use client';

/**
 * DistillationProvider — State management for IMAGINARIUM's distillation pipeline.
 *
 * Unlike OCULUS's GymProvider which wraps an EventBus + Zustand store,
 * DistillationProvider manages pipeline configuration and computed output.
 * IMAGINARIUM is build-time-only — there's no persistent EventBus.
 *
 * The provider:
 * - Manages DistillationConfig via useReducer
 * - Tracks pipeline step status (PipelineStep[])
 * - Debounces config changes before triggering recomputation
 * - Accepts an onCompute callback for plugging in computation logic
 * - Exposes config/output via context for child components
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  DistillationConfig,
  DistillationOutput,
  PipelineStep,
  DistillRenderProps,
} from './types';

// ── Default Configuration ─────────────────────────────

export const DEFAULT_CONFIG: DistillationConfig = {
  language: 'typescript',
  complexity: 8,
  fileCount: 50,
  maxDepth: 4,
  seed: 'dendrovia-001',
  harmonyScheme: 'split-complementary',
  noiseType: 'fbm',
  lsystemIterations: 3,
  saturationMultiplier: 1.0,
  lightnessOffset: 0,
};

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'palette', name: 'Color Extraction', icon: '\u{1F3A8}', status: 'pending' },
  { id: 'lsystem', name: 'L-System Compilation', icon: '\u{1F33F}', status: 'pending' },
  { id: 'noise', name: 'Noise Generation', icon: '\u{1F30A}', status: 'pending' },
  { id: 'sdf', name: 'SDF Compilation', icon: '\u{1F48E}', status: 'pending' },
  { id: 'shader', name: 'Shader Assembly', icon: '\u2728', status: 'pending' },
];

const INITIAL_OUTPUT: DistillationOutput = {
  palette: null,
  lsystem: null,
  noise: null,
  sdf: null,
  steps: [...INITIAL_STEPS],
};

// ── Reducer ───────────────────────────────────────────

export type DistillAction =
  | { type: 'SET_CONFIG'; patch: Partial<DistillationConfig> }
  | { type: 'RESET_CONFIG' }
  | { type: 'SET_OUTPUT'; output: Partial<DistillationOutput> }
  | { type: 'SET_STEP'; stepId: string; update: Partial<PipelineStep> }
  | { type: 'SET_COMPUTING'; value: boolean }
  | { type: 'RESET_PIPELINE' };

interface State {
  config: DistillationConfig;
  output: DistillationOutput;
  isComputing: boolean;
  generation: number;
}

function reducer(state: State, action: DistillAction): State {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.patch },
        generation: state.generation + 1,
      };
    case 'RESET_CONFIG':
      return {
        ...state,
        config: DEFAULT_CONFIG,
        generation: state.generation + 1,
      };
    case 'SET_OUTPUT':
      return {
        ...state,
        output: { ...state.output, ...action.output },
      };
    case 'SET_STEP': {
      const steps = state.output.steps.map((s) =>
        s.id === action.stepId ? { ...s, ...action.update } : s,
      );
      return { ...state, output: { ...state.output, steps } };
    }
    case 'SET_COMPUTING':
      return { ...state, isComputing: action.value };
    case 'RESET_PIPELINE':
      return {
        ...state,
        output: { ...INITIAL_OUTPUT, steps: INITIAL_STEPS.map((s) => ({ ...s })) },
        isComputing: false,
      };
  }
}

// ── Context ───────────────────────────────────────────

interface DistillContextValue extends DistillRenderProps {
  dispatch: React.Dispatch<DistillAction>;
  generation: number;
}

const DistillContext = createContext<DistillContextValue | null>(null);

/** Access distillation config, output, and controls from any descendant. */
export function useDistillation(): DistillRenderProps {
  const ctx = useContext(DistillContext);
  if (!ctx) throw new Error('useDistillation must be used within <DistillationProvider>');
  return ctx;
}

/** Access the raw dispatch for advanced pipeline step updates. */
export function useDistillDispatch(): React.Dispatch<DistillAction> {
  const ctx = useContext(DistillContext);
  if (!ctx) throw new Error('useDistillDispatch must be used within <DistillationProvider>');
  return ctx.dispatch;
}

// ── Provider ──────────────────────────────────────────

interface DistillationProviderProps {
  /** Override default config values */
  initialConfig?: Partial<DistillationConfig>;
  /** Computation function invoked on config change. Receives dispatch for step updates. */
  onCompute?: (config: DistillationConfig, dispatch: React.Dispatch<DistillAction>) => Promise<void>;
  /** Debounce delay in ms before triggering computation (default: 300) */
  debounceMs?: number;
  children: ReactNode | ((props: DistillRenderProps) => ReactNode);
}

export function DistillationProvider({
  initialConfig,
  onCompute,
  debounceMs = 300,
  children,
}: DistillationProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    config: { ...DEFAULT_CONFIG, ...initialConfig },
    output: { ...INITIAL_OUTPUT, steps: INITIAL_STEPS.map((s) => ({ ...s })) },
    isComputing: false,
    generation: 0,
  });

  const generationRef = useRef(state.generation);
  generationRef.current = state.generation;

  const updateConfig = useCallback((patch: Partial<DistillationConfig>) => {
    dispatch({ type: 'SET_CONFIG', patch });
  }, []);

  const recompute = useCallback(() => {
    dispatch({ type: 'RESET_PIPELINE' });
    dispatch({ type: 'SET_CONFIG', patch: {} });
  }, []);

  // Auto-compute on config change (debounced)
  useEffect(() => {
    if (!onCompute) return;

    const gen = state.generation;
    const timer = setTimeout(async () => {
      if (gen !== generationRef.current) return;

      dispatch({ type: 'SET_COMPUTING', value: true });
      dispatch({ type: 'RESET_PIPELINE' });

      try {
        await onCompute(state.config, dispatch);
      } catch (err) {
        console.error('[DistillationProvider] computation failed:', err);
      } finally {
        if (gen === generationRef.current) {
          dispatch({ type: 'SET_COMPUTING', value: false });
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [state.generation, onCompute, debounceMs]);

  const renderProps: DistillRenderProps = {
    config: state.config,
    output: state.output,
    isComputing: state.isComputing,
    updateConfig,
    recompute,
  };

  const contextValue: DistillContextValue = {
    ...renderProps,
    dispatch,
    generation: state.generation,
  };

  return (
    <DistillContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(renderProps) : children}
    </DistillContext.Provider>
  );
}
