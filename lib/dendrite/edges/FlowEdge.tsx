'use client';

import type { EdgeProps } from '@xyflow/react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { memo } from 'react';
import { DT } from '../design-tokens';
import type { BoundaryContract } from '../types';

function FlowEdgeInner(props: EdgeProps) {
  const { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data, markerEnd } = props;

  const relation = (data?.relation as string) ?? 'containment';
  const isPipeline = relation === 'pipeline-flow';
  const label = data?.label as string | undefined;
  const contracts = data?.contracts as BoundaryContract | undefined;
  const eventCount = contracts?.events?.length ?? 0;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isPipeline ? DT.edgePipeline : DT.edgeContainment,
          strokeWidth: isPipeline ? 2 : 1,
          opacity: isPipeline ? 0.8 : 0.4,
        }}
      />
      {isPipeline && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.45rem',
              borderRadius: 4,
              backgroundColor: DT.panel,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: DT.panelBorder,
              fontSize: '0.62rem',
              color: DT.textMuted,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{label}</span>
            {eventCount > 0 && (
              <span
                style={{
                  padding: '0.05rem 0.3rem',
                  borderRadius: 8,
                  backgroundColor: DT.accent,
                  color: '#000',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                }}
              >
                {eventCount} {eventCount === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const FlowEdge = memo(FlowEdgeInner);
