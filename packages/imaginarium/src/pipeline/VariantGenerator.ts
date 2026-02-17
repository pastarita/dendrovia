/**
 * VariantGenerator — produces 5 distinct SDF shader variants.
 *
 * Strategies:
 * 1. Language variant — top languages get their own palette + SDF
 * 2. Complexity variant — files grouped by complexity quartile
 * 3. Structural variant — top-level directories get individual L-systems
 * 4. Hotspot variant — hotspot files get "twisted spire" with domain distortion
 * 5. Global variant — whole-codebase master shader
 */

import type { CodeTopology, SDFShader } from '@dendrovia/shared';
import { extractPalette } from '../distillation/ColorExtractor';
import { compile as compileLSystem } from '../distillation/LSystemCompiler';
import { generate as generateNoise } from '../distillation/NoiseGenerator';
import { compile as compileSDF } from '../distillation/SDFCompiler';
import { hashString } from '../utils/hash';

export async function generateVariants(topology: CodeTopology, count: number = 5): Promise<SDFShader[]> {
  const shaders: SDFShader[] = [];
  const seed = hashString(JSON.stringify({ fc: topology.files.length }));

  // 1. Global variant (always)
  const globalPalette = extractPalette(topology);
  const globalLSystem = compileLSystem(topology);
  const globalNoise = generateNoise(topology);

  shaders.push(
    await compileSDF({
      topology,
      palette: globalPalette,
      lsystem: globalLSystem,
      noise: globalNoise,
      seed,
      variantId: 'global',
    }),
  );

  if (count <= 1) return shaders;

  // 2. Language variant — top language-specific palette
  const langGroups = groupByLanguage(topology);
  const topLangs = [...langGroups.entries()].sort((a, b) => b[1].files.length - a[1].files.length).slice(0, 1);

  for (const [lang, sub] of topLangs) {
    const palette = extractPalette(sub);
    const lsystem = compileLSystem(sub);
    const noise = generateNoise(sub);
    shaders.push(
      await compileSDF({
        topology: sub,
        palette,
        lsystem,
        noise,
        seed: hashString(`lang-${lang}`),
        variantId: `lang-${lang}`,
      }),
    );
  }

  if (shaders.length >= count) return shaders.slice(0, count);

  // 3. Complexity variant — high complexity subset
  const highComplexity = createComplexitySubset(topology, 'high');
  if (highComplexity.files.length > 0) {
    const palette = extractPalette(highComplexity);
    const lsystem = compileLSystem(highComplexity);
    const noise = generateNoise(highComplexity);
    shaders.push(
      await compileSDF({
        topology: highComplexity,
        palette,
        lsystem,
        noise,
        seed: hashString('complexity-high'),
        variantId: 'complexity-high',
      }),
    );
  }

  if (shaders.length >= count) return shaders.slice(0, count);

  // 4. Structural variant — first top-level directory
  const structuralSub = createStructuralSubset(topology);
  if (structuralSub.files.length > 0) {
    const palette = extractPalette(structuralSub);
    const lsystem = compileLSystem(structuralSub);
    const noise = generateNoise(structuralSub);
    shaders.push(
      await compileSDF({
        topology: structuralSub,
        palette,
        lsystem,
        noise,
        seed: hashString('structural'),
        variantId: 'structural',
      }),
    );
  }

  if (shaders.length >= count) return shaders.slice(0, count);

  // 5. Hotspot variant
  const hotspotSub = createHotspotSubset(topology);
  if (hotspotSub.files.length > 0) {
    const palette = extractPalette(hotspotSub);
    const lsystem = compileLSystem(hotspotSub);
    const noise = generateNoise(hotspotSub);
    shaders.push(
      await compileSDF({
        topology: hotspotSub,
        palette,
        lsystem,
        noise,
        seed: hashString('hotspot'),
        variantId: 'hotspot',
      }),
    );
  }

  return shaders.slice(0, count);
}

function groupByLanguage(topology: CodeTopology): Map<string, CodeTopology> {
  const groups = new Map<string, CodeTopology>();
  const langFiles = new Map<string, typeof topology.files>();

  for (const f of topology.files) {
    if (!langFiles.has(f.language)) langFiles.set(f.language, []);
    langFiles.get(f.language)!.push(f);
  }

  for (const [lang, files] of langFiles) {
    groups.set(lang, {
      files,
      commits: topology.commits,
      tree: topology.tree,
      hotspots: topology.hotspots.filter((h) => files.some((f) => f.path === h.path)),
    });
  }

  return groups;
}

function createComplexitySubset(topology: CodeTopology, tier: 'high' | 'low'): CodeTopology {
  const sorted = [...topology.files].sort((a, b) => b.complexity - a.complexity);
  const cutoff = Math.floor(sorted.length / 4);
  const files = tier === 'high' ? sorted.slice(0, Math.max(cutoff, 1)) : sorted.slice(-Math.max(cutoff, 1));

  return {
    files,
    commits: topology.commits,
    tree: topology.tree,
    hotspots: topology.hotspots.filter((h) => files.some((f) => f.path === h.path)),
  };
}

function createStructuralSubset(topology: CodeTopology): CodeTopology {
  const topDirs = topology.tree.children?.filter((c) => c.type === 'directory') ?? [];
  if (topDirs.length === 0) return topology;

  const firstDir = topDirs[0]!;
  const dirPath = firstDir.path;
  const files = topology.files.filter((f) => f.path.startsWith(dirPath));

  return {
    files: files.length > 0 ? files : topology.files.slice(0, 5),
    commits: topology.commits,
    tree: firstDir,
    hotspots: topology.hotspots.filter((h) => h.path.startsWith(dirPath)),
  };
}

function createHotspotSubset(topology: CodeTopology): CodeTopology {
  if (topology.hotspots.length === 0) {
    // Use highest complexity files as pseudo-hotspots
    const sorted = [...topology.files].sort((a, b) => b.complexity - a.complexity);
    return {
      files: sorted.slice(0, Math.max(3, Math.floor(sorted.length / 10))),
      commits: topology.commits,
      tree: topology.tree,
      hotspots: [],
    };
  }

  const hotspotPaths = new Set(topology.hotspots.map((h) => h.path));
  const files = topology.files.filter((f) => hotspotPaths.has(f.path));

  return {
    files: files.length > 0 ? files : topology.files.slice(0, 5),
    commits: topology.commits,
    tree: topology.tree,
    hotspots: topology.hotspots,
  };
}
