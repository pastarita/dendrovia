'use client';

import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { DT, RUNTIME_HEALTH_COLORS } from '../design-tokens';
import type { RuntimeHealth } from '../types';

const PULSE_CSS = `
@keyframes dendrite-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
`;

function SectionNodeInner({ data }: NodeProps) {
  const fill = (data.fill as string) ?? DT.panel;
  const textColor = (data.textColor as string) ?? DT.text;
  const status = data.status as string;
  const runtimeHealth = data.runtimeHealth as RuntimeHealth | undefined;

  const dotColor = runtimeHealth ? RUNTIME_HEALTH_COLORS[runtimeHealth].fill : statusDot(status);
  const isPulsing = runtimeHealth && runtimeHealth !== 'idle';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: fill,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: DT.borderSubtle,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 400,
        color: textColor,
        gap: '0.3rem',
      }}
      title={data.description as string}
    >
      {isPulsing && <style>{PULSE_CSS}</style>}
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
          ...(isPulsing ? { animation: 'dendrite-pulse 2s ease-in-out infinite' } : {}),
        }}
      />
      {data.label as string}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function statusDot(status: string): string {
  switch (status) {
    case 'implemented':
      return '#22c55e';
    case 'partial':
      return '#eab308';
    case 'scaffold':
      return '#3b82f6';
    case 'planned':
      return '#a855f7';
    case 'deprecated':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export const SectionNode = memo(SectionNodeInner);
