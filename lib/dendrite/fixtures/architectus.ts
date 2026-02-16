import type { SourceDiagram } from "../types";

export const architectusFixture: SourceDiagram = {
  id: "architectus",
  title: "ARCHITECTUS",
  nodes: [
    { id: "arch-root", label: "ARCHITECTUS", kind: "root", status: "partial", domain: "architectus" },

    // Phase: Load
    { id: "arch-load", label: "Load", kind: "phase", status: "implemented", domain: "architectus", children: ["arch-asset-bridge"] },
    { id: "arch-asset-bridge", label: "AssetBridge", kind: "section", status: "implemented", domain: "architectus", description: "Loads distilled assets from IMAGINARIUM" },

    // Phase: Render
    { id: "arch-render", label: "Render", kind: "phase", status: "partial", domain: "architectus", children: ["arch-dendrite-world", "arch-camera", "arch-lighting", "arch-postfx", "arch-perf", "arch-gpu"] },
    { id: "arch-dendrite-world", label: "DendriteWorld", kind: "section", status: "partial", domain: "architectus", description: "Main 3D scene composition" },
    { id: "arch-camera", label: "CameraRig", kind: "section", status: "implemented", domain: "architectus", description: "Orbit camera with constraints" },
    { id: "arch-lighting", label: "Lighting", kind: "section", status: "implemented", domain: "architectus", description: "Scene lighting setup" },
    { id: "arch-postfx", label: "PostProcessing", kind: "section", status: "scaffold", domain: "architectus", description: "Bloom, SSAO, tone mapping" },
    { id: "arch-perf", label: "PerformanceMonitor", kind: "section", status: "implemented", domain: "architectus", description: "FPS and GPU timing" },
    { id: "arch-gpu", label: "detectGPU", kind: "section", status: "implemented", domain: "architectus", description: "GPU capability detection" },

    // Phase: Instances
    { id: "arch-instances", label: "Instances", kind: "phase", status: "partial", domain: "architectus", children: ["arch-branch-inst", "arch-node-inst", "arch-mushroom-inst"] },
    { id: "arch-branch-inst", label: "BranchInstances", kind: "section", status: "partial", domain: "architectus", description: "Instanced branch geometry" },
    { id: "arch-node-inst", label: "NodeInstances", kind: "section", status: "partial", domain: "architectus", description: "Instanced node geometry" },
    { id: "arch-mushroom-inst", label: "MushroomInstances", kind: "section", status: "scaffold", domain: "architectus", description: "Instanced mushroom placement" },

    // Phase: Systems
    { id: "arch-systems", label: "Systems", kind: "phase", status: "implemented", domain: "architectus", children: ["arch-lsystem", "arch-turtle", "arch-segment-mapper"] },
    { id: "arch-lsystem", label: "LSystem", kind: "section", status: "implemented", domain: "architectus", description: "L-System executor" },
    { id: "arch-turtle", label: "TurtleInterpreter", kind: "section", status: "implemented", domain: "architectus", description: "3D turtle graphics interpreter" },
    { id: "arch-segment-mapper", label: "SegmentMapper", kind: "section", status: "implemented", domain: "architectus", description: "Maps node markers to story arc segment placements" },
  ],
  edges: [
    { source: "arch-root", target: "arch-load", relation: "pipeline-flow" },
    { source: "arch-load", target: "arch-render", relation: "pipeline-flow" },
    { source: "arch-load", target: "arch-instances", relation: "pipeline-flow" },
    { source: "arch-render", target: "arch-systems", relation: "pipeline-flow" },

    { source: "arch-load", target: "arch-asset-bridge", relation: "containment" },
    { source: "arch-render", target: "arch-dendrite-world", relation: "containment" },
    { source: "arch-render", target: "arch-camera", relation: "containment" },
    { source: "arch-render", target: "arch-lighting", relation: "containment" },
    { source: "arch-render", target: "arch-postfx", relation: "containment" },
    { source: "arch-render", target: "arch-perf", relation: "containment" },
    { source: "arch-render", target: "arch-gpu", relation: "containment" },
    { source: "arch-instances", target: "arch-branch-inst", relation: "containment" },
    { source: "arch-instances", target: "arch-node-inst", relation: "containment" },
    { source: "arch-instances", target: "arch-mushroom-inst", relation: "containment" },
    { source: "arch-systems", target: "arch-lsystem", relation: "containment" },
    { source: "arch-systems", target: "arch-turtle", relation: "containment" },
    { source: "arch-systems", target: "arch-segment-mapper", relation: "containment" },
  ],
};
