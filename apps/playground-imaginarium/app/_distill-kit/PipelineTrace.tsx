'use client';

/**
 * PipelineTrace — Step-by-step distillation pipeline execution display.
 *
 * IMAGINARIUM's equivalent of OCULUS's GymWiretap. Instead of showing
 * a live EventBus stream, it shows discrete pipeline stages with
 * status indicators, timing, and collapsible output previews.
 *
 * Pipeline steps: Palette → L-System → Noise → SDF → Shader Assembly
 */

import { useState } from 'react';
import type { PipelineStep } from './types';
import { useDistillation } from './DistillationProvider';
import {
  traceContainerStyle,
  traceHeaderStyle,
  traceStepStyle,
  stepStatusDotStyle,
  glslBlockStyle,
  distillBtnStyle,
} from './distill-styles';

interface PipelineTraceProps {
  /** Override steps from context (for standalone use) */
  steps?: PipelineStep[];
  /** Start collapsed */
  collapsed?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'pending',
  running: 'running...',
  complete: 'done',
  error: 'failed',
  skipped: 'skipped',
};

export function PipelineTrace({ steps: stepsProp, collapsed = false }: PipelineTraceProps) {
  const ctx = useDistillation();
  const steps = stepsProp ?? ctx.output.steps;
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const hasErrors = steps.some((s) => s.status === 'error');

  if (isCollapsed) {
    return (
      <div
        style={{ ...traceContainerStyle, cursor: 'pointer' }}
        onClick={() => setIsCollapsed(false)}
      >
        <div style={traceHeaderStyle}>
          <span>Pipeline Trace</span>
          <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>
            ({completedCount}/{steps.length} steps)
          </span>
          {hasErrors && (
            <span style={{ color: '#EF4444', fontSize: '0.7rem' }}>errors</span>
          )}
          <span style={{ marginLeft: 'auto', opacity: 0.4 }}>+</span>
        </div>
      </div>
    );
  }

  return (
    <div style={traceContainerStyle}>
      <div style={traceHeaderStyle}>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)}>
          Pipeline Trace
        </span>
        <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>
          ({completedCount}/{steps.length} steps)
        </span>
        {ctx.isComputing && (
          <span style={{ color: '#A855F7', fontSize: '0.7rem' }}>computing...</span>
        )}
        <button
          style={{ ...distillBtnStyle, padding: '0.15rem 0.4rem', fontSize: '0.65rem', marginLeft: 'auto' }}
          onClick={ctx.recompute}
        >
          Re-run
        </button>
        <span
          style={{ opacity: 0.4, cursor: 'pointer', fontSize: '0.8rem' }}
          onClick={() => setIsCollapsed(true)}
        >
          -
        </span>
      </div>

      <div>
        {steps.map((step) => (
          <div key={step.id}>
            <div
              style={{ ...traceStepStyle(step.status), cursor: step.output || step.error ? 'pointer' : 'default' }}
              onClick={() => {
                if (step.output || step.error) {
                  setExpandedId(expandedId === step.id ? null : step.id);
                }
              }}
            >
              <span style={stepStatusDotStyle(step.status)} />
              <span style={{ width: 20, textAlign: 'center' }}>{step.icon}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{step.name}</span>
              <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>
                {STATUS_LABELS[step.status] ?? step.status}
              </span>
              {step.durationMs != null && (
                <span style={{ opacity: 0.3, fontSize: '0.65rem' }}>
                  {step.durationMs}ms
                </span>
              )}
              {(step.output || step.error) && (
                <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>
                  {expandedId === step.id ? '\u25B4' : '\u25BE'}
                </span>
              )}
            </div>

            {/* Expanded output */}
            {expandedId === step.id && (
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #1a1a1a' }}>
                {step.error && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    {step.error}
                  </div>
                )}
                {step.output && (
                  <div style={glslBlockStyle}>{step.output}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
