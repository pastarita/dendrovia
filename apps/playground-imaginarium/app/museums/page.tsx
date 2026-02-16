import Link from "next/link";
import {
  classifyGenus,
  buildTaxonomy,
  generateMorphology,
  generateLore,
} from '@dendrovia/imaginarium';
import type { ParsedFile } from '@dendrovia/shared';
import type { FileContext } from '@dendrovia/imaginarium';
import MuseumsClient from "./MuseumsClient";
import { SPECIMEN_FILES } from "./museum-fixtures";
import type { SpecimenData } from "./components/MycologyExhibit";

function buildMockParsedFile(data: (typeof SPECIMEN_FILES)[number]): ParsedFile {
  return {
    path: data.path,
    hash: `mock-${data.path}`,
    language: data.language,
    complexity: data.complexity,
    loc: data.loc,
    lastModified: new Date('2025-06-15'),
    author: 'exhibit',
  };
}

function buildMockFileContext(data: (typeof SPECIMEN_FILES)[number]): FileContext {
  const isEntryPoint = /\/(index|main|app|server)\.[^/]+$/i.test(data.path);
  const isConfig = /\/(config|\.env|settings|constants|tsconfig|package\.json)/i.test(data.path);
  const isTest = /\/(test|spec|__tests__|__mocks__)\b/i.test(data.path);
  const isDeprecated = /\/(deprecated|legacy|old|archive)/i.test(data.path);

  return {
    isEntryPoint,
    isConfig,
    isTest,
    isDeprecated,
    dependentCount: Math.max(0, Math.floor(data.complexity * 0.8)),
    dependencyCount: Math.min(5, Math.floor(data.loc / 40)),
    hotspot: undefined,
    avgComplexity: 5,
    maxLoc: 200,
    fileAge: 30 * 24 * 60 * 60 * 1000,
    commitCount: Math.max(1, data.complexity * 2),
  };
}

function computeSpecimens(): SpecimenData[] {
  return SPECIMEN_FILES.map((data) => {
    const file = buildMockParsedFile(data);
    const ctx = buildMockFileContext(data);
    const genus = classifyGenus(file, ctx);
    const taxonomy = buildTaxonomy(file, ctx);
    const morphology = generateMorphology(file, ctx, genus);
    const lore = generateLore(file, ctx, taxonomy);

    return {
      path: file.path,
      genus: taxonomy.genus,
      species: taxonomy.species,
      division: taxonomy.division,
      class: taxonomy.class,
      order: taxonomy.order,
      family: taxonomy.family,
      capShape: morphology.capShape,
      capWidth: morphology.capWidth,
      capHeight: morphology.capHeight,
      gillCount: morphology.gillCount,
      gillAttachment: morphology.gillAttachment,
      stemHeight: morphology.stem.height,
      stemThickness: morphology.stem.thickness,
      bioluminescence: morphology.bioluminescence,
      sporePrintColor: morphology.sporePrintColor,
      sizeClass: morphology.sizeClass,
      tier: lore.tier,
      title: lore.title,
      flavorText: lore.flavorText,
      codeInsight: lore.codeInsight,
      domainKnowledge: lore.domainKnowledge,
    };
  });
}

export default function MuseumsPage() {
  const specimens = computeSpecimens();

  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; IMAGINARIUM Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏛️</span> Museums — Procedural Art Exhibitions
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Explore palettes, shaders, pipeline stages, and mycology specimens.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <MuseumsClient specimens={specimens} />
      </div>
    </div>
  );
}
