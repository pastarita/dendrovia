/**
 * Domain Registry — Single source of truth for SpacePark domains,
 * pillar-domain affinity scores, and per-pillar descriptions.
 */

export type DomainSlug = "museums" | "zoos" | "halls" | "gyms" | "generators" | "spatial-docs" | "foundry";
export type PillarName = "ARCHITECTUS" | "CHRONOS" | "IMAGINARIUM" | "LUDUS" | "OCULUS" | "OPERATUS";
export type AffinityTier = "hero" | "featured" | "reference";

export interface DomainSubPage {
  name: string;
  shortName: string;
  /** Relative slug within the domain, e.g. "primitives" */
  slug: string;
}

export interface DomainDef {
  name: string;
  slug: DomainSlug;
  path: string;
  icon: string;
}

export interface RankedDomain extends DomainDef {
  affinity: number;
  tier: AffinityTier;
  desc: string;
}

export const ALL_DOMAINS: DomainDef[] = [
  { name: "Museums",      slug: "museums",      path: "/museums",      icon: "\u{1F3DB}\uFE0F" },
  { name: "Zoos",         slug: "zoos",         path: "/zoos",         icon: "\u{1F981}" },
  { name: "Halls",        slug: "halls",        path: "/halls",        icon: "\u{1F3F0}" },
  { name: "Gyms",         slug: "gyms",         path: "/gyms",         icon: "\u{1F3CB}\uFE0F" },
  { name: "Generators",   slug: "generators",   path: "/generators",   icon: "\u26A1" },
  { name: "Spatial Docs", slug: "spatial-docs",  path: "/spatial-docs", icon: "\u{1F4D0}" },
  { name: "Foundry",      slug: "foundry",       path: "/foundry",      icon: "\u{1F525}" },
];

const DOMAIN_SLUG_SET = new Set<DomainSlug>(ALL_DOMAINS.map((d) => d.slug));

/**
 * Affinity matrix: each pillar rates each domain 1-5.
 * 5 = "this is what you come here for" (hero domain)
 * 1 = "available but not the point"
 */
export const PILLAR_DOMAIN_AFFINITY: Record<PillarName, Record<DomainSlug, number>> = {
  ARCHITECTUS: {
    museums: 2, zoos: 3, halls: 1, gyms: 5, generators: 3, "spatial-docs": 2, foundry: 1,
  },
  CHRONOS: {
    museums: 3, zoos: 2, halls: 3, gyms: 5, generators: 1, "spatial-docs": 2, foundry: 1,
  },
  IMAGINARIUM: {
    museums: 3, zoos: 4, halls: 2, gyms: 3, generators: 5, "spatial-docs": 1, foundry: 2,
  },
  LUDUS: {
    museums: 2, zoos: 4, halls: 1, gyms: 5, generators: 2, "spatial-docs": 1, foundry: 1,
  },
  OCULUS: {
    museums: 4, zoos: 5, halls: 2, gyms: 4, generators: 1, "spatial-docs": 2, foundry: 5,
  },
  OPERATUS: {
    museums: 2, zoos: 1, halls: 5, gyms: 1, generators: 3, "spatial-docs": 4, foundry: 3,
  },
};

/** Per-pillar descriptions for each domain */
const PILLAR_DOMAIN_DESCRIPTIONS: Record<PillarName, Record<DomainSlug, string>> = {
  ARCHITECTUS: {
    museums:       "Exhibition mode \u2014 rendered scene showcases",
    zoos:          "Catalog mode \u2014 component & shader zoo",
    halls:         "Reference mode \u2014 rendering pipeline docs",
    gyms:          "Interactive sandbox \u2014 live 3D experimentation",
    generators:    "Creation tools \u2014 scene & shader generators",
    "spatial-docs": "Documentation surfaces \u2014 spatial API reference",
    foundry:       "Visual QA \u2014 frame rendering not applicable here",
  },
  CHRONOS: {
    museums:       "Exhibition mode \u2014 historical commit exhibitions",
    zoos:          "Catalog mode \u2014 parsed artifact catalogs",
    halls:         "Reference mode \u2014 parser pipeline docs",
    gyms:          "Interactive sandbox \u2014 live parsing experiments",
    generators:    "Creation tools \u2014 timeline generators",
    "spatial-docs": "Documentation surfaces \u2014 CHRONOS API reference",
    foundry:       "Visual QA \u2014 frame rendering not applicable here",
  },
  IMAGINARIUM: {
    museums:       "Exhibition mode \u2014 generated art exhibitions",
    zoos:          "Catalog mode \u2014 shader & palette catalog",
    halls:         "Reference mode \u2014 distillation pipeline docs",
    gyms:          "Interactive sandbox \u2014 live shader experimentation",
    generators:    "Creation tools \u2014 palette & SDF generators",
    "spatial-docs": "Documentation surfaces \u2014 IMAGINARIUM API reference",
    foundry:       "Visual QA \u2014 upstream palette stress-testing",
  },
  LUDUS: {
    museums:       "Exhibition mode \u2014 game design exhibitions",
    zoos:          "Catalog mode \u2014 rule & mechanic catalogs",
    halls:         "Reference mode \u2014 game system docs",
    gyms:          "Interactive sandbox \u2014 live mechanic experimentation",
    generators:    "Creation tools \u2014 encounter & quest generators",
    "spatial-docs": "Documentation surfaces \u2014 LUDUS API reference",
    foundry:       "Visual QA \u2014 frame rendering not applicable here",
  },
  OCULUS: {
    museums:       "Exhibition mode \u2014 interface exhibitions",
    zoos:          "Catalog mode \u2014 UI component catalogs",
    halls:         "Reference mode \u2014 UI system docs",
    gyms:          "Interactive sandbox \u2014 live component experimentation",
    generators:    "Creation tools \u2014 UI & layout generators",
    "spatial-docs": "Documentation surfaces \u2014 OCULUS API reference",
    foundry:       "Visual QA \u2014 frame matrix & ornament regression testing",
  },
  OPERATUS: {
    museums:       "Exhibition mode \u2014 infrastructure exhibitions",
    zoos:          "Catalog mode \u2014 asset & config catalogs",
    halls:         "Reference mode \u2014 infrastructure docs",
    gyms:          "Interactive sandbox \u2014 live infrastructure experimentation",
    generators:    "Creation tools \u2014 manifest & config generators",
    "spatial-docs": "Documentation surfaces \u2014 OPERATUS API reference",
    foundry:       "Visual QA \u2014 frame registry validation & screenshot automation",
  },
};

function affinityToTier(score: number): AffinityTier {
  if (score >= 5) return "hero";
  if (score >= 3) return "featured";
  return "reference";
}

/** Returns all domains for a pillar, sorted by affinity (highest first), with tier and description. */
export function getDomainsForPillar(pillar: PillarName): RankedDomain[] {
  const affinities = PILLAR_DOMAIN_AFFINITY[pillar];
  const descriptions = PILLAR_DOMAIN_DESCRIPTIONS[pillar];

  return [...ALL_DOMAINS]
    .map((d) => ({
      ...d,
      affinity: affinities[d.slug],
      tier: affinityToTier(affinities[d.slug]),
      desc: descriptions[d.slug],
    }))
    .sort((a, b) => b.affinity - a.affinity);
}

/** For a given domain, returns pillars sorted by affinity (strongest first). */
export function getPillarsForDomain(slug: DomainSlug): { pillar: PillarName; affinity: number }[] {
  const pillars = Object.keys(PILLAR_DOMAIN_AFFINITY) as PillarName[];
  return pillars
    .map((p) => ({ pillar: p, affinity: PILLAR_DOMAIN_AFFINITY[p][slug] }))
    .sort((a, b) => b.affinity - a.affinity);
}

export function isDomainSlug(value: string): value is DomainSlug {
  return DOMAIN_SLUG_SET.has(value as DomainSlug);
}

export function isPillarName(value: string): value is PillarName {
  return value in PILLAR_DOMAIN_AFFINITY;
}

// ── Sub-page definitions per pillar per domain ─────────────────────────────

/**
 * Sub-pages that exist within a domain for a specific pillar.
 * Only pillars with actual content have entries here.
 */
export const DOMAIN_SUB_PAGES: Partial<Record<PillarName, Partial<Record<DomainSlug, DomainSubPage[]>>>> = {
  ARCHITECTUS: {
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
      { name: "L-System Sandbox", shortName: "L-Systems", slug: "l-systems" },
    ],
    museums: [
      { name: "Topology Museum", shortName: "Topology", slug: "topology" },
    ],
    zoos: [
      { name: "Component Gallery", shortName: "Components", slug: "components" },
    ],
  },
  CHRONOS: {
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
      { name: "Analysis Pipeline", shortName: "Analyze", slug: "analyze" },
    ],
    zoos: [
      { name: "Overview", shortName: "Overview", slug: "overview" },
      { name: "Files", shortName: "Files", slug: "files" },
      { name: "Commits", shortName: "Commits", slug: "commits" },
      { name: "Hotspots", shortName: "Hotspots", slug: "hotspots" },
      { name: "Contributors", shortName: "Contributors", slug: "contributors" },
      { name: "Couplings", shortName: "Couplings", slug: "couplings" },
      { name: "Complexity", shortName: "Complexity", slug: "complexity" },
      { name: "Contract", shortName: "Contract", slug: "contract" },
    ],
  },
  IMAGINARIUM: {
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
    ],
    museums: [
      { name: "Specimen Gallery", shortName: "Gallery", slug: "gallery" },
    ],
  },
  LUDUS: {
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
      { name: "Combat Sandbox", shortName: "Combat", slug: "combat" },
      { name: "Balance Simulator", shortName: "Balance", slug: "balance" },
    ],
    museums: [
      { name: "Game Mechanics Museum", shortName: "Mechanics", slug: "mechanics" },
    ],
    zoos: [
      { name: "Bestiary & Catalogs", shortName: "Bestiary", slug: "bestiary" },
    ],
    halls: [
      { name: "Game Rules Hall", shortName: "Rules", slug: "rules" },
    ],
    generators: [
      { name: "Game Content Generators", shortName: "Content", slug: "content" },
    ],
  },
  OCULUS: {
    zoos: [
      { name: "Primitives Gallery", shortName: "Primitives", slug: "primitives" },
      { name: "View Components", shortName: "Views", slug: "views" },
      { name: "Compositions", shortName: "Compositions", slug: "compositions" },
      { name: "Ornate Frames", shortName: "Frames", slug: "frames" },
    ],
    museums: [
      { name: "Event Flow Exhibition", shortName: "Event Flow", slug: "event-flow" },
      { name: "Cross-Pillar Interface Map", shortName: "Cross-Pillar", slug: "cross-pillar" },
    ],
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
      { name: "HUD Sandbox", shortName: "HUD Sandbox", slug: "hud-sandbox" },
      { name: "Battle Arena", shortName: "Battle Arena", slug: "battle-arena" },
    ],
    foundry: [
      { name: "Frame Matrix", shortName: "Frame Matrix", slug: "frame-matrix" },
    ],
  },
  OPERATUS: {
    gyms: [
      { name: "Dendrite Observatory", shortName: "Dendrite", slug: "dendrite" },
      { name: "Cache Inspector", shortName: "Cache", slug: "cache-inspector" },
      { name: "Event Stream", shortName: "Events", slug: "event-stream" },
      { name: "Persistence Sandbox", shortName: "Persistence", slug: "persistence-sandbox" },
    ],
    museums: [
      { name: "Asset Lifecycle", shortName: "Lifecycle", slug: "asset-lifecycle" },
      { name: "Cross-Pillar Map", shortName: "Cross-Pillar", slug: "cross-pillar" },
    ],
    zoos: [
      { name: "Manifest Catalog", shortName: "Manifest", slug: "manifest" },
      { name: "Contract Validator", shortName: "Contract", slug: "contract" },
    ],
  },
};

/** Returns sub-pages for a given pillar+domain, or empty array if none. */
export function getSubPages(pillar: PillarName, domain: DomainSlug): DomainSubPage[] {
  return DOMAIN_SUB_PAGES[pillar]?.[domain] ?? [];
}

/** Returns the default sub-page slug for a pillar+domain, or null if no sub-pages. */
export function getDefaultSubPage(pillar: PillarName, domain: DomainSlug): string | null {
  const pages = getSubPages(pillar, domain);
  return pages.at(0)?.slug ?? null;
}
