/**
 * StoryArcDeriver — orchestrator for story arc derivation.
 *
 * Pipeline: topology → sliceSegments → mapMood → assignPhases → StoryArc
 *
 * Deterministic: same topology always produces the same arc (via hashed seed).
 * Never throws: falls back to single-segment climax on any error.
 */

import type { CodeTopology, StoryArc, StorySegment } from '@dendrovia/shared';
import { sliceSegments } from './SegmentSlicer';
import { mapMood } from './MoodMapper';
import { assignPhases } from './PhaseAssigner';
import { hashString } from '../utils/hash';

export function deriveStoryArc(topology: CodeTopology): StoryArc {
  try {
    // Deterministic seed from topology structure
    const topologyHash = hashString(JSON.stringify({
      fileCount: topology.files.length,
      hotspotCount: (topology.hotspots ?? []).length,
      treeName: topology.tree.name,
      paths: topology.files.map(f => f.path).sort(),
    }));
    const seed = topologyHash.substring(0, 16);

    // 1. Slice topology into raw segments
    const rawSegments = sliceSegments(topology);

    // 2. Map moods
    const moods = rawSegments.map(seg => mapMood(seg.metrics));

    // 3. Assign phases
    const phaseAssignments = assignPhases(rawSegments.map(seg => seg.metrics));

    // 4. Build StorySegment array
    const segments: StorySegment[] = rawSegments.map((raw, i) => ({
      id: `seg-${hashString(raw.label + seed).substring(0, 8)}`,
      label: raw.label,
      phase: phaseAssignments[i].phase,
      mood: moods[i],
      filePaths: raw.filePaths,
      treePath: raw.treePath,
      metrics: raw.metrics,
      ordinal: i,
    }));

    return {
      version: '1.0.0',
      seed,
      segments,
      totalFiles: topology.files.length,
      derivedAt: new Date().toISOString(),
      topologyHash,
    };
  } catch {
    // Fallback: single segment with all files
    return buildFallbackArc(topology);
  }
}

function buildFallbackArc(topology: CodeTopology): StoryArc {
  const topologyHash = hashString(String(topology.files.length));
  const allPaths = topology.files.map(f => f.path);
  const avgComplexity = topology.files.length > 0
    ? topology.files.reduce((s, f) => s + f.complexity, 0) / topology.files.length
    : 0;

  const langCounts = new Map<string, number>();
  for (const f of topology.files) {
    langCounts.set(f.language, (langCounts.get(f.language) ?? 0) + 1);
  }
  const dominantLanguage = langCounts.size > 0
    ? [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : 'unknown';

  return {
    version: '1.0.0',
    seed: topologyHash.substring(0, 16),
    segments: [{
      id: `seg-${topologyHash.substring(0, 8)}`,
      label: 'all',
      phase: 'climax',
      mood: 'mysterious',
      filePaths: allPaths,
      treePath: topology.tree.path,
      metrics: {
        fileCount: topology.files.length,
        totalLoc: topology.files.reduce((s, f) => s + f.loc, 0),
        avgComplexity,
        maxComplexity: topology.files.length > 0 ? Math.max(...topology.files.map(f => f.complexity)) : 0,
        hotspotCount: (topology.hotspots ?? []).length,
        avgChurn: (topology.hotspots ?? []).length > 0
          ? (topology.hotspots ?? []).reduce((s, h) => s + h.churnRate, 0) / (topology.hotspots ?? []).length
          : 0,
        dominantLanguage,
        encounterDensity: topology.files.length > 0 ? (topology.hotspots ?? []).length / topology.files.length : 0,
      },
      ordinal: 0,
    }],
    totalFiles: topology.files.length,
    derivedAt: new Date().toISOString(),
    topologyHash,
  };
}
