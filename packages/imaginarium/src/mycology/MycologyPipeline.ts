/**
 * MycologyPipeline — orchestrates the full mycology pass.
 *
 * Sub-pipeline of IMAGINARIUM's distill. Produces specimens, network,
 * SVG assets, and a mycology-specific manifest.
 *
 * Never throws — falls back gracefully on any error.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeTopology } from '@dendrovia/shared';
import { generateSvg } from './assets/SvgTemplates';
import { buildCoChurnMap, buildFileContext, classifyGenus } from './GenusMapper';
import { buildNetwork } from './MycelialNetwork';
import { catalogize } from './SpecimenCatalog';
import type { FungalGenus, MycologyManifest } from './types';

export async function distillMycology(topology: CodeTopology, outputDir: string): Promise<MycologyManifest> {
  console.log('[MYCOLOGY] Starting mycology catalogization...');

  // Ensure output directories
  const mycologyDir = join(outputDir, 'mycology');
  const svgDir = join(mycologyDir, 'svg');
  const meshDir = join(mycologyDir, 'meshes');
  for (const d of [mycologyDir, svgDir, meshDir]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }

  // 1. Catalogize specimens
  const specimens = catalogize(topology);
  console.log(`[MYCOLOGY]   Specimens: ${specimens.length}`);

  // 2. Build genus map for network construction
  const coChurnMap = buildCoChurnMap(topology);
  const genusMap = new Map<string, FungalGenus>();
  for (const file of topology.files) {
    const ctx = buildFileContext(file, topology, coChurnMap);
    genusMap.set(file.path, classifyGenus(file, ctx));
  }

  // 3. Build mycelial network
  const network = buildNetwork(topology, genusMap);
  console.log(`[MYCOLOGY]   Network: ${network.edges.length} edges, ${network.hubNodes.length} hubs`);

  // 4. Generate SVG assets
  let svgCount = 0;
  for (const specimen of specimens) {
    try {
      const svg = generateSvg(specimen);
      const svgPath = join(svgDir, `${specimen.id}.svg`);
      await Bun.write(svgPath, svg);
      specimen.assets.svgPath = `mycology/svg/${specimen.id}.svg`;
      svgCount++;
    } catch {
      // Skip failed SVG generation silently
    }
  }
  console.log(`[MYCOLOGY]   SVGs: ${svgCount} generated`);

  // 5. Write specimens catalog
  const specimensPath = join(mycologyDir, 'specimens.json');
  await Bun.write(specimensPath, JSON.stringify(specimens, null, 2));

  // 6. Write network
  const networkPath = join(mycologyDir, 'network.json');
  await Bun.write(networkPath, JSON.stringify(network, null, 2));

  // 7. Write manifest
  const manifest: MycologyManifest = {
    version: '1.0.0',
    specimenCount: specimens.length,
    networkEdgeCount: network.edges.length,
    specimens: 'mycology/specimens.json',
    network: 'mycology/network.json',
    assetDir: 'mycology/svg',
    meshDir: 'mycology/meshes',
    generatedAt: Date.now(),
  };

  const manifestPath = join(mycologyDir, 'manifest.json');
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('[MYCOLOGY] Catalogization complete.');
  return manifest;
}
