/**
 * OPFS (Origin Private File System) Cache
 *
 * Browser-native persistent file system for caching generated assets.
 * Falls back gracefully when OPFS is unavailable (older browsers, non-secure contexts).
 *
 * Uses the asynchronous File System Access API surface (getFileHandle + createWritable)
 * which has broad support in modern browsers including Safari 15.2+.
 */

export interface CacheEntry {
  data: string | ArrayBuffer;
  /** ISO-8601 timestamp of when this entry was cached */
  cachedAt: string;
  /** Content hash for invalidation */
  hash?: string;
  /** Size in bytes */
  size: number;
}

export interface CacheStats {
  entryCount: number;
  totalBytes: number;
  oldestEntry: string | null;
}

/** Check if OPFS is available in the current environment */
export function isOPFSSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in navigator.storage
  );
}

export class OPFSCache {
  private root: FileSystemDirectoryHandle | null = null;
  private metaDir: FileSystemDirectoryHandle | null = null;

  async init(): Promise<void> {
    if (this.root) return;
    if (!isOPFSSupported()) {
      throw new Error('OPFS is not supported in this environment');
    }

    this.root = await navigator.storage.getDirectory();

    // Create a subdirectory for dendrovia assets
    this.root = await this.root.getDirectoryHandle('dendrovia', { create: true });

    // Metadata directory for cache entry info
    this.metaDir = await this.root.getDirectoryHandle('_meta', { create: true });
  }

  private async ensureInit(): Promise<void> {
    if (!this.root) await this.init();
  }

  /**
   * Write data to OPFS cache
   */
  async write(path: string, data: string | ArrayBuffer, hash?: string): Promise<void> {
    await this.ensureInit();

    const safeName = this.encodePath(path);
    const file = await this.root!.getFileHandle(safeName, { create: true });
    const writable = await file.createWritable();

    await writable.write(data);
    await writable.close();

    // Write metadata
    const size = typeof data === 'string' ? new Blob([data]).size : data.byteLength;
    const meta: CacheEntry = {
      data: '', // Not stored in meta, just for the interface
      cachedAt: new Date().toISOString(),
      hash,
      size,
    };

    const metaFile = await this.metaDir!.getFileHandle(safeName + '.json', { create: true });
    const metaWritable = await metaFile.createWritable();
    await metaWritable.write(JSON.stringify(meta));
    await metaWritable.close();
  }

  /**
   * Read string data from OPFS cache
   */
  async read(path: string): Promise<string | null> {
    await this.ensureInit();

    try {
      const safeName = this.encodePath(path);
      const file = await this.root!.getFileHandle(safeName);
      const fileData = await file.getFile();
      return await fileData.text();
    } catch {
      return null;
    }
  }

  /**
   * Read binary data from OPFS cache
   */
  async readBinary(path: string): Promise<ArrayBuffer | null> {
    await this.ensureInit();

    try {
      const safeName = this.encodePath(path);
      const file = await this.root!.getFileHandle(safeName);
      const fileData = await file.getFile();
      return await fileData.arrayBuffer();
    } catch {
      return null;
    }
  }

  /**
   * Check if a path exists in cache
   */
  async exists(path: string): Promise<boolean> {
    await this.ensureInit();

    try {
      const safeName = this.encodePath(path);
      await this.root!.getFileHandle(safeName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get metadata for a cached entry
   */
  async getMeta(path: string): Promise<Omit<CacheEntry, 'data'> | null> {
    await this.ensureInit();

    try {
      const safeName = this.encodePath(path);
      const metaFile = await this.metaDir!.getFileHandle(safeName + '.json');
      const fileData = await metaFile.getFile();
      const raw = await fileData.text();
      const meta = JSON.parse(raw) as CacheEntry;
      return { cachedAt: meta.cachedAt, hash: meta.hash, size: meta.size };
    } catch {
      return null;
    }
  }

  /**
   * Check if a cached entry matches the expected hash (for invalidation)
   */
  async isValid(path: string, expectedHash: string): Promise<boolean> {
    const meta = await this.getMeta(path);
    if (!meta) return false;
    return meta.hash === expectedHash;
  }

  /**
   * Delete a cached entry
   */
  async delete(path: string): Promise<void> {
    await this.ensureInit();

    const safeName = this.encodePath(path);

    try {
      await this.root!.removeEntry(safeName);
    } catch {
      // Entry doesn't exist, that's fine
    }

    try {
      await this.metaDir!.removeEntry(safeName + '.json');
    } catch {
      // Meta doesn't exist, that's fine
    }
  }

  /**
   * List all cached entry paths
   */
  async list(): Promise<string[]> {
    await this.ensureInit();

    const entries: string[] = [];

    for await (const [name, handle] of this.root! as any) {
      if (handle.kind === 'file' && name !== '_meta') {
        entries.push(this.decodePath(name));
      }
    }

    return entries;
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    await this.ensureInit();

    let entryCount = 0;
    let totalBytes = 0;
    let oldestEntry: string | null = null;
    let oldestTime = Infinity;

    for await (const [name, handle] of this.root! as any) {
      if (handle.kind === 'file') {
        entryCount++;
        const file = await handle.getFile();
        totalBytes += file.size;

        const meta = await this.getMeta(this.decodePath(name));
        if (meta) {
          const time = new Date(meta.cachedAt).getTime();
          if (time < oldestTime) {
            oldestTime = time;
            oldestEntry = meta.cachedAt;
          }
        }
      }
    }

    return { entryCount, totalBytes, oldestEntry };
  }

  /**
   * Clear all cached entries
   */
  async clear(): Promise<void> {
    await this.ensureInit();

    // Remove and recreate the dendrovia directory
    const parent = await navigator.storage.getDirectory();

    try {
      await parent.removeEntry('dendrovia', { recursive: true });
    } catch {
      // Directory might not exist
    }

    // Reinitialize
    this.root = null;
    this.metaDir = null;
    await this.init();
  }

  /**
   * Encode a path to be safe for OPFS file names.
   * OPFS doesn't support slashes in file names.
   */
  private encodePath(path: string): string {
    return path.replace(/\//g, '__').replace(/\\/g, '__');
  }

  /**
   * Decode an encoded path back to original
   */
  private decodePath(encoded: string): string {
    return encoded.replace(/__/g, '/');
  }
}
