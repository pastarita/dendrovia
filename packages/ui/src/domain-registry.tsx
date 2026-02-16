/**
 * Domain Registry — Single source of truth for SpacePark domains,
 * pillar-domain affinity scores, and per-pillar descriptions.
 */

export type DomainSlug = "museums" | "zoos" | "halls" | "gyms" | "generators" | "spatial-docs";
export type PillarName = "ARCHITECTUS" | "CHRONOS" | "IMAGINARIUM" | "LUDUS" | "OCULUS" | "OPERATUS";
export type AffinityTier = "hero" | "featured" | "reference";

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
];

/**
 * Affinity matrix: each pillar rates each domain 1-5.
 * 5 = "this is what you come here for" (hero domain)
 * 1 = "available but not the point"
 */
export const PILLAR_DOMAIN_AFFINITY: Record<PillarName, Record<DomainSlug, number>> = {
  ARCHITECTUS: {
    museums: 2, zoos: 3, halls: 1, gyms: 5, generators: 3, "spatial-docs": 2,
  },
  CHRONOS: {
    museums: 3, zoos: 2, halls: 3, gyms: 5, generators: 1, "spatial-docs": 2,
  },
  IMAGINARIUM: {
    museums: 3, zoos: 4, halls: 2, gyms: 3, generators: 5, "spatial-docs": 1,
  },
  LUDUS: {
    museums: 2, zoos: 4, halls: 1, gyms: 5, generators: 2, "spatial-docs": 1,
  },
  OCULUS: {
    museums: 4, zoos: 5, halls: 2, gyms: 4, generators: 1, "spatial-docs": 2,
  },
  OPERATUS: {
    museums: 2, zoos: 1, halls: 5, gyms: 1, generators: 3, "spatial-docs": 4,
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
  },
  CHRONOS: {
    museums:       "Exhibition mode \u2014 historical commit exhibitions",
    zoos:          "Catalog mode \u2014 parsed artifact catalogs",
    halls:         "Reference mode \u2014 parser pipeline docs",
    gyms:          "Interactive sandbox \u2014 live parsing experiments",
    generators:    "Creation tools \u2014 timeline generators",
    "spatial-docs": "Documentation surfaces \u2014 CHRONOS API reference",
  },
  IMAGINARIUM: {
    museums:       "Exhibition mode \u2014 generated art exhibitions",
    zoos:          "Catalog mode \u2014 shader & palette catalog",
    halls:         "Reference mode \u2014 distillation pipeline docs",
    gyms:          "Interactive sandbox \u2014 live shader experimentation",
    generators:    "Creation tools \u2014 palette & SDF generators",
    "spatial-docs": "Documentation surfaces \u2014 IMAGINARIUM API reference",
  },
  LUDUS: {
    museums:       "Exhibition mode \u2014 game design exhibitions",
    zoos:          "Catalog mode \u2014 rule & mechanic catalogs",
    halls:         "Reference mode \u2014 game system docs",
    gyms:          "Interactive sandbox \u2014 live mechanic experimentation",
    generators:    "Creation tools \u2014 encounter & quest generators",
    "spatial-docs": "Documentation surfaces \u2014 LUDUS API reference",
  },
  OCULUS: {
    museums:       "Exhibition mode \u2014 interface exhibitions",
    zoos:          "Catalog mode \u2014 UI component catalogs",
    halls:         "Reference mode \u2014 UI system docs",
    gyms:          "Interactive sandbox \u2014 live component experimentation",
    generators:    "Creation tools \u2014 UI & layout generators",
    "spatial-docs": "Documentation surfaces \u2014 OCULUS API reference",
  },
  OPERATUS: {
    museums:       "Exhibition mode \u2014 infrastructure exhibitions",
    zoos:          "Catalog mode \u2014 asset & config catalogs",
    halls:         "Reference mode \u2014 infrastructure docs",
    gyms:          "Interactive sandbox \u2014 live infrastructure experimentation",
    generators:    "Creation tools \u2014 manifest & config generators",
    "spatial-docs": "Documentation surfaces \u2014 OPERATUS API reference",
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
