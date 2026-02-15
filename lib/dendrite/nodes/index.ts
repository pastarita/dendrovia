/**
 * Node type registration map for ReactFlow.
 */

import { PipelineRootNode } from "./PipelineRootNode";
import { PhaseNode } from "./PhaseNode";
import { SectionNode } from "./SectionNode";

export const dendritenodeTypes = {
  pipelineRoot: PipelineRootNode,
  phase: PhaseNode,
  section: SectionNode,
} as const;
