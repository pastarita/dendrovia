/**
 * Node type registration map for ReactFlow.
 */

import { PhaseNode } from './PhaseNode';
import { PipelineRootNode } from './PipelineRootNode';
import { SectionNode } from './SectionNode';

export const dendritenodeTypes = {
  pipelineRoot: PipelineRootNode,
  phase: PhaseNode,
  section: SectionNode,
} as const;
