/**
 * Deterministic hashing utilities.
 * Uses a simple FNV-1a hash for fast, stable, collision-resistant hashing.
 * Works in all runtimes (Bun, Node, browser) without crypto dependencies.
 */

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function hashString(str: string): string {
  return fnv1a(str);
}

export function hashObject(input: unknown): string {
  const normalized = JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
  return hashString(normalized);
}

export function hashFiles(hashes: string[]): string {
  return hashString(hashes.sort().join(':'));
}
