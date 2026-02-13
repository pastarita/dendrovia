/**
 * Deterministic hashing utilities.
 * Uses Bun.CryptoHasher (SHA-256) for stable, collision-resistant hashing.
 */

export function hashString(str: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(str);
  return hasher.digest('hex');
}

export function hashObject(input: unknown): string {
  const normalized = JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
  return hashString(normalized);
}

export function hashFiles(hashes: string[]): string {
  return hashString(hashes.sort().join(':'));
}
