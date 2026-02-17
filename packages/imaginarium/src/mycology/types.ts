/**
 * MYCOLOGY TYPE SYSTEM
 *
 * Complete taxonomic hierarchy mirroring real-world mycology,
 * parameterized by code properties. Maps biological reality
 * onto Dendrovia's codebase visualization.
 *
 * Kingdom Fungi -> Division -> Class -> Order -> Family -> Genus -> Species
 * Each taxonomic rank maps to a code-analysis dimension.
 */

// ---------------------------------------------------------------------------
// Taxonomic Ranks
// ---------------------------------------------------------------------------

/**
 * Division <- module coupling pattern
 *   Basidiomycota ("club fungi") = modules with broad, visible interfaces (many exports)
 *   Ascomycota ("sac fungi") = modules with contained, encapsulated interfaces (few exports)
 *   Zygomycota ("conjugation fungi") = modules that exist only to bridge two others
 */
export type FungalDivision = 'Basidiomycota' | 'Ascomycota' | 'Zygomycota';

/**
 * Class <- derived from division + structural role
 */
export type FungalClass =
  | 'Agaricomycetes' // Basidiomycota: standard mushroom-formers
  | 'Tremellomycetes' // Basidiomycota: jelly-like, amorphous modules
  | 'Sordariomycetes' // Ascomycota: flask-shaped, encapsulated
  | 'Eurotiomycetes' // Ascomycota: compact, mold-like
  | 'Mucoromycetes'; // Zygomycota: bridging, fast-growing

/**
 * Order <- dependency graph role
 */
export type FungalOrder =
  | 'Agaricales' // utility/helper modules (most common)
  | 'Boletales' // data-access modules (symbiotic with specific trees)
  | 'Polyporales' // framework/infrastructure modules (shelf fungi)
  | 'Russulales' // configuration modules (brittle, snap cleanly)
  | 'Cantharellales' // event/messaging modules (channeling)
  | 'Xylariales'; // dead-code/deprecated modules (decomposers)

/**
 * Family <- intermediate grouping within order
 */
export type FungalFamily =
  | 'Amanitaceae' // entry points, high-complexity
  | 'Agaricaceae' // standard utilities
  | 'Boletaceae' // data access
  | 'Cantharellaceae' // event emitters
  | 'Russulaceae' // config/constants
  | 'Mycenaceae' // tiny helpers
  | 'Polyporaceae' // framework/middleware
  | 'Marasmiaceae' // resilient small modules
  | 'Tricholomataceae' // mixed/general purpose
  | 'Xylariaceae'; // deprecated/dead code

/**
 * Genus <- specific code characteristic (20 canonical genera)
 */
export type FungalGenus =
  | 'Amanita' // high-complexity entry points
  | 'Agaricus' // standard utility functions
  | 'Boletus' // database/data-access modules
  | 'Cantharellus' // event emitters / message passing
  | 'Russula' // config files / constants
  | 'Lactarius' // modules exporting streams/generators
  | 'Coprinus' // short-lived / frequently deleted files
  | 'Mycena' // small helper functions (<50 LOC)
  | 'Armillaria' // monolithic modules with hidden reach
  | 'Trametes' // middleware / adapter patterns
  | 'Ganoderma' // long-lived, stable core modules
  | 'Cordyceps' // modules that "infect" others (monkey-patching)
  | 'Morchella' // complex algorithms (high cyclomatic complexity)
  | 'Pleurotus' // side-effect modules (logging, monitoring)
  | 'Psilocybe' // debug/dev-only modules
  | 'Hericium' // pure functions / functional modules
  | 'Xylaria' // deprecated / dead code
  | 'Clavaria' // simple linear pipelines
  | 'Phallus' // modules with code smells
  | 'Tuber'; // hidden/internal modules (not exported)

// ---------------------------------------------------------------------------
// Taxonomy Composite
// ---------------------------------------------------------------------------

export interface FungalTaxonomy {
  division: FungalDivision;
  class: FungalClass;
  order: FungalOrder;
  family: FungalFamily;
  genus: FungalGenus;
  species: string; // generated per-specimen (deterministic)
}

// ---------------------------------------------------------------------------
// Morphology
// ---------------------------------------------------------------------------

export type CapShape =
  | 'convex' // balanced complexity (most common)
  | 'campanulate' // bell: high entry complexity, simpler internals
  | 'umbonate' // central bump: single dominant function
  | 'infundibuliform' // funnel: event sink / collector
  | 'plane' // flat: many small exports
  | 'depressed'; // heavily-consumed module

export type GillAttachment =
  | 'free' // loosely coupled
  | 'adnate' // moderately coupled
  | 'decurrent' // tightly coupled
  | 'adnexed'; // partially coupled

export type StemForm = {
  height: number; // log(LOC)
  thickness: number; // number of dependents (normalized 0-1)
  bulbous: boolean; // large constructor / initialization
  rooting: boolean; // deep dependency chain
  ringed: boolean; // has middleware wrapper
};

export type SporePrintColor =
  | 'white' // TypeScript
  | 'brown' // JavaScript
  | 'black' // Rust
  | 'purple' // Python
  | 'pink' // Ruby
  | 'cream' // Go
  | 'ochre'; // Java (+ fallback)

export type BioluminescenceLevel =
  | 'none' // normal module
  | 'faint' // moderate churn
  | 'bright' // high churn hotspot
  | 'pulsing'; // actively changing (recent commits)

export type SizeClass =
  | 'tiny' // <30 LOC
  | 'small' // 30-100
  | 'medium' // 100-500
  | 'large' // 500-2000
  | 'massive'; // 2000+

export interface MushroomMorphology {
  capShape: CapShape;
  capWidth: number; // 0-1 normalized
  capHeight: number; // 0-1 normalized
  gillAttachment: GillAttachment;
  gillCount: number; // 4-24
  stem: StemForm;
  sporePrintColor: SporePrintColor;
  bioluminescence: BioluminescenceLevel;
  sizeClass: SizeClass;
  spots: boolean; // Amanita-type spotted cap
  scaleColor: string; // hex color for cap surface
  gillColor: string; // hex color for gills
}

// ---------------------------------------------------------------------------
// Mycelial Network
// ---------------------------------------------------------------------------

export type MycorrhizalType =
  | 'ectomycorrhizal' // external wrapping: read-only consumers
  | 'endomycorrhizal' // deep penetration: extends/modifies internals
  | 'saprotrophic' // decomposition: consuming deprecated code
  | 'parasitic'; // one-directional extraction: monkey-patch/override

export type SignalType =
  | 'nutrient' // data flow (function returns, exports)
  | 'jasmonic' // error/warning propagation
  | 'salicylic' // type information flow
  | 'strigolactone'; // lazy/deferred connections

export interface MycelialNode {
  id: string; // file path
  genus: FungalGenus;
  connections: number; // total edge count
  isHub: boolean; // highly-connected module
}

export interface MycelialEdge {
  source: string; // importer path
  target: string; // imported path
  type: MycorrhizalType;
  signalTypes: SignalType[];
  strength: number; // 0-1
  bidirectional: boolean; // mutual imports
}

export interface HyphalCluster {
  id: string; // directory path or package name
  nodeIds: string[]; // file paths in this cluster
  internalEdges: number;
  externalEdges: number;
  density: number; // 0-1 internal connectivity
}

export interface MycelialNetwork {
  nodes: MycelialNode[];
  edges: MycelialEdge[];
  clusters: HyphalCluster[];
  hubNodes: string[]; // highly-connected modules (CMN hubs)
}

// ---------------------------------------------------------------------------
// Lore
// ---------------------------------------------------------------------------

export type LoreTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface MushroomLore {
  tier: LoreTier;
  title: string; // mycological name: "Amanita complexia var. typescript"
  flavorText: string; // atmospheric description
  codeInsight: string; // technical fact
  domainKnowledge?: string; // deep insight: pattern name, architectural role
  codeSnippet?: string; // actual code excerpt
  discoveredAt?: number; // timestamp (set by LUDUS at runtime)
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export type SubstrateType =
  | 'soil' // ground near tree (default)
  | 'bark' // growing on tree trunk
  | 'deadwood' // on deprecated/dead branches
  | 'leaf-litter' // forest floor, among fallen code
  | 'subterranean'; // hidden, not visible until discovered

export interface MushroomPlacement {
  position: [number, number, number]; // world coordinates (hint)
  hostTree?: string; // associated tree/file path
  substrate: SubstrateType;
  clusterSize: number; // 1 = solitary, >1 = fairy ring / cluster
  rotation: number; // y-axis rotation in radians
  scale: number; // relative scale factor
}

// ---------------------------------------------------------------------------
// Specimen (the concrete placed entity)
// ---------------------------------------------------------------------------

export interface FungalSpecimen {
  id: string; // deterministic hash
  filePath: string; // source file this represents
  taxonomy: FungalTaxonomy;
  morphology: MushroomMorphology;
  lore: MushroomLore;
  placement: MushroomPlacement;
  assets: {
    svgPath?: string; // path to generated SVG
    meshDataPath?: string; // path to mesh data JSON
  };
}

// ---------------------------------------------------------------------------
// Archetype (reusable template before placement)
// ---------------------------------------------------------------------------

export interface MushroomArchetype {
  genus: FungalGenus;
  taxonomy: FungalTaxonomy;
  morphology: MushroomMorphology;
  lore: MushroomLore;
}

// ---------------------------------------------------------------------------
// Pipeline Output
// ---------------------------------------------------------------------------

export interface MycologyManifest {
  version: string;
  specimenCount: number;
  networkEdgeCount: number;
  specimens: string; // path to specimens.json
  network: string; // path to network.json
  assetDir: string; // path to svg asset directory
  meshDir?: string; // path to meshes directory (e.g. 'mycology/meshes')
  generatedAt: number; // timestamp
}

export interface MycologyCatalogedEvent {
  specimenCount: number;
  networkEdgeCount: number;
  manifestPath: string;
}
