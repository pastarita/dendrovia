/**
 * Deterministic hashing utilities.
 * Uses a simple FNV-1a hash for fast, stable, collision-resistant hashing.
 * Works in all runtimes (Bun, Node, browser) without crypto dependencies.
 */

function fnv1a(str: string, seed = 0x811c9dc5): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

export function hashString(str: string): string {
  // Produce 24 hex chars (3 × 8) by running FNV-1a with cascading seeds
  const h1 = fnv1a(str);
  const h2 = fnv1a(str, h1);
  const h3 = fnv1a(str, h2);
  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    h3.toString(16).padStart(8, '0')
  );
}

export function hashObject(input: unknown): string {
  const normalized = JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
  return hashString(normalized);
}

export function hashFiles(hashes: string[]): string {
  return hashString(hashes.sort().join(':'));
}
