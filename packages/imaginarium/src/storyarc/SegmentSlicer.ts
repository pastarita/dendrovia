/**
 * SegmentSlicer — partitions a FileTreeNode into story segments.
 *
 * Strategy:
 *   - Each top-level directory becomes a candidate segment.
 *   - Root-level files (not in any directory) form the "prologue" segment.
 *   - Segments with fewer than MIN_SEGMENT_FILES get merged into neighbors.
 *   - Total segments are capped at MAX_SEGMENTS.
 */

import type { FileTreeNode, CodeTopology, SegmentMetrics } from '@dendrovia/shared';
import { hashString } from '../utils/hash.js';

const MIN_SEGMENT_FILES = 3;
const MAX_SEGMENTS = 10;

export interface RawSegment {
  label: string;
  treePath: string;
  filePaths: string[];
  metrics: SegmentMetrics;
}

/**
 * Partition topology into raw segments by top-level directory structure.
 */
export function sliceSegments(topology: CodeTopology): RawSegment[] {
  const tree = topology.tree;
  const hotspotPaths = new Set((topology.hotspots ?? []).map(h => h.path));
  const hotspotMap = new Map((topology.hotspots ?? []).map(h => [h.path, h]));

  // Collect root-level files and top-level directories
  const rootFiles: string[] = [];
  const dirSegments: Array<{ name: string; path: string; files: string[] }> = [];

  if (tree.children) {
    for (const child of tree.children) {
      if (child.type === 'file') {
        rootFiles.push(child.path);
      } else {
        const files = collectFiles(child);
        if (files.length > 0) {
          dirSegments.push({ name: child.name, path: child.path, files });
        }
      }
    }
  }

  // Build raw segment list
  const rawSegments: RawSegment[] = [];

  // Root files become prologue segment
  if (rootFiles.length > 0) {
    rawSegments.push(buildRawSegment('root', tree.path, rootFiles, topology, hotspotMap));
  }

  for (const dir of dirSegments) {
    rawSegments.push(buildRawSegment(dir.name, dir.path, dir.files, topology, hotspotMap));
  }

  // Fallback: if < 3 top-level dirs, produce a single segment
  if (rawSegments.length === 0) {
    const allFiles = topology.files.map(f => f.path);
    return [buildRawSegment('all', tree.path, allFiles, topology, hotspotMap)];
  }

  // Merge small segments into neighbors
  const merged = mergeSmallSegments(rawSegments);

  // Cap at MAX_SEGMENTS
  return capSegments(merged);
}

function collectFiles(node: FileTreeNode): string[] {
  const files: string[] = [];
  if (node.type === 'file') {
    files.push(node.path);
  }
  if (node.children) {
    for (const child of node.children) {
      files.push(...collectFiles(child));
    }
  }
  return files;
}

function buildRawSegment(
  label: string,
  treePath: string,
  filePaths: string[],
  topology: CodeTopology,
  hotspotMap: Map<string, { churnRate: number; complexity: number; riskScore: number }>,
): RawSegment {
  const fileSet = new Set(filePaths);
  const files = topology.files.filter(f => fileSet.has(f.path));

  const fileCount = files.length;
  const totalLoc = files.reduce((sum, f) => sum + f.loc, 0);
  const avgComplexity = fileCount > 0 ? files.reduce((sum, f) => sum + f.complexity, 0) / fileCount : 0;
  const maxComplexity = fileCount > 0 ? Math.max(...files.map(f => f.complexity)) : 0;

  const segmentHotspots = filePaths.filter(p => hotspotMap.has(p));
  const hotspotCount = segmentHotspots.length;
  const avgChurn = hotspotCount > 0
    ? segmentHotspots.reduce((sum, p) => sum + (hotspotMap.get(p)?.churnRate ?? 0), 0) / hotspotCount
    : 0;

  // Dominant language
  const langCounts = new Map<string, number>();
  for (const f of files) {
    langCounts.set(f.language, (langCounts.get(f.language) ?? 0) + 1);
  }
  const dominantLanguage = langCounts.size > 0
    ? [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
    : 'unknown';

  // Encounter density: hotspots per file
  const encounterDensity = fileCount > 0 ? hotspotCount / fileCount : 0;

  return {
    label,
    treePath,
    filePaths,
    metrics: {
      fileCount,
      totalLoc,
      avgComplexity,
      maxComplexity,
      hotspotCount,
      avgChurn,
      dominantLanguage,
      encounterDensity,
    },
  };
}

function mergeSmallSegments(segments: RawSegment[]): RawSegment[] {
  if (segments.length <= 1) return segments;

  const result: RawSegment[] = [];
  let pending: RawSegment | null = null;

  for (const seg of segments) {
    if (seg.metrics.fileCount < MIN_SEGMENT_FILES) {
      if (pending) {
        // Merge into pending
        pending = mergeTwo(pending, seg);
      } else if (result.length > 0) {
        // Merge into last result
        result[result.length - 1] = mergeTwo(result[result.length - 1], seg);
      } else {
        pending = seg;
      }
    } else {
      if (pending) {
        // Attach pending to this segment
        result.push(mergeTwo(pending, seg));
        pending = null;
      } else {
        result.push(seg);
      }
    }
  }

  if (pending) {
    if (result.length > 0) {
      result[result.length - 1] = mergeTwo(result[result.length - 1], pending);
    } else {
      result.push(pending);
    }
  }

  return result;
}

function mergeTwo(a: RawSegment, b: RawSegment): RawSegment {
  const filePaths = [...a.filePaths, ...b.filePaths];
  const fileCount = a.metrics.fileCount + b.metrics.fileCount;
  const totalLoc = a.metrics.totalLoc + b.metrics.totalLoc;
  const hotspotCount = a.metrics.hotspotCount + b.metrics.hotspotCount;

  const avgComplexity = fileCount > 0
    ? (a.metrics.avgComplexity * a.metrics.fileCount + b.metrics.avgComplexity * b.metrics.fileCount) / fileCount
    : 0;
  const maxComplexity = Math.max(a.metrics.maxComplexity, b.metrics.maxComplexity);
  const avgChurn = hotspotCount > 0
    ? (a.metrics.avgChurn * a.metrics.hotspotCount + b.metrics.avgChurn * b.metrics.hotspotCount) / hotspotCount
    : 0;
  const encounterDensity = fileCount > 0 ? hotspotCount / fileCount : 0;

  // Dominant language: use whichever segment has more files
  const dominantLanguage = a.metrics.fileCount >= b.metrics.fileCount
    ? a.metrics.dominantLanguage
    : b.metrics.dominantLanguage;

  return {
    label: `${a.label}+${b.label}`,
    treePath: a.treePath,
    filePaths,
    metrics: {
      fileCount,
      totalLoc,
      avgComplexity,
      maxComplexity,
      hotspotCount,
      avgChurn,
      dominantLanguage,
      encounterDensity,
    },
  };
}

function capSegments(segments: RawSegment[]): RawSegment[] {
  if (segments.length <= MAX_SEGMENTS) return segments;

  // Sort by file count, merge smallest pairs until under cap
  const sorted = [...segments].sort((a, b) => a.metrics.fileCount - b.metrics.fileCount);
  while (sorted.length > MAX_SEGMENTS) {
    const smallest = sorted.shift()!;
    // Merge into the next smallest
    sorted[0] = mergeTwo(sorted[0], smallest);
    sorted.sort((a, b) => a.metrics.fileCount - b.metrics.fileCount);
  }

  return sorted;
}
