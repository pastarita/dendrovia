/**
 * Minimal Bun runtime declarations for type checking.
 * @dendrovia/imaginarium uses Bun APIs for server-side pipeline operations.
 * These stubs prevent TS errors when Turbopack type-checks the transpiled source.
 */
declare namespace Bun {
  function file(path: string): { text(): Promise<string>; exists(): Promise<boolean> };
  function write(path: string, data: string | Uint8Array): Promise<number>;
  function hash(data: string | Uint8Array): number;
  class CryptoHasher {
    constructor(algorithm: string);
    update(data: string | Uint8Array): this;
    digest(encoding: string): string;
  }
}
