'use client';

/**
 * DistillShell — Main layout orchestrator for distillation pages.
 *
 * IMAGINARIUM's equivalent of OCULUS's GymShell. Provides the standard
 * distillation page structure:
 *   Header (back link + title + subtitle)
 *   Controls slot (render prop)
 *   Viewport slot (render prop, optional)
 *   Pipeline trace panel (optional)
 *
 * Wraps children in DistillationProvider, exposing pipeline state
 * via render-prop slots — same pattern as GymShell's children function.
 *
 * Usage:
 *   <DistillShell config={shellConfig} onCompute={computeFn}>
 *     {(props) => ({
 *       controls: <DistillationControls />,
 *       viewport: <ShaderViewport sceneSDF={props.output.sdf?.glsl} />,
 *     })}
 *   </DistillShell>
 */

import Link from 'next/link';
import type { DistillShellConfig, DistillationConfig, DistillRenderProps, DistillSlots } from './types';
import type { DistillAction } from './DistillationProvider';
import { DistillationProvider } from './DistillationProvider';
import { ShaderViewport } from './ShaderViewport';
import { PipelineTrace } from './PipelineTrace';

interface DistillShellProps {
  config: DistillShellConfig;
  /** Override default distillation config values */
  initialConfig?: Partial<DistillationConfig>;
  /** Computation function invoked on config change */
  onCompute?: (config: DistillationConfig, dispatch: React.Dispatch<DistillAction>) => Promise<void>;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Render-prop children receiving pipeline state, returning control + viewport slots */
  children: (props: DistillRenderProps) => DistillSlots;
}

export function DistillShell({
  config: shellConfig,
  initialConfig,
  onCompute,
  debounceMs,
  children,
}: DistillShellProps) {
  const showTrace = shellConfig.showTrace !== false;
  const showViewport = shellConfig.showViewport !== false;

  return (
    <div>
      {/* Header */}
      <Link href={shellConfig.backHref} style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; {shellConfig.backLabel}
      </Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        {shellConfig.icon} {shellConfig.title}
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>{shellConfig.subtitle}</p>

      {/* Provider + Content */}
      <DistillationProvider
        initialConfig={initialConfig}
        onCompute={onCompute}
        debounceMs={debounceMs}
      >
        {(props) => {
          const slots = children(props);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Controls slot */}
              {slots.controls}

              {/* Viewport slot (use provided or default ShaderViewport) */}
              {showViewport && (
                slots.viewport ?? (
                  <ShaderViewport
                    sceneSDF={props.output.sdf?.glsl}
                    palette={props.output.palette ? {
                      primary: props.output.palette.primary,
                      secondary: props.output.palette.secondary,
                      accent: props.output.palette.accent,
                      glow: props.output.palette.glow,
                    } : undefined}
                    height={shellConfig.viewportHeight}
                  />
                )
              )}

              {/* Pipeline trace */}
              {showTrace && <PipelineTrace />}
            </div>
          );
        }}
      </DistillationProvider>
    </div>
  );
}
