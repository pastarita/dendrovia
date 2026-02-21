/**
 * Avatar asset manifest.
 * Bird avatar configurations and asset references.
 */

export interface AvatarConfig {
  id: string;
  species: string;
  description: string;
}

export const AVATAR_MANIFEST: AvatarConfig[] = [
  { id: "default-bird", species: "corvus", description: "Default crow avatar" },
  { id: "owl-scholar", species: "strix", description: "Scholarly owl variant" },
  { id: "falcon-scout", species: "falco", description: "Reconnaissance falcon" },
];
