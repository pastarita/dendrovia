/**
 * Minimal Bun global declarations for Next.js/Turbopack type checking.
 * The full Bun runtime provides these APIs; this file ensures TS doesn't
 * error when transpiling imaginarium source in a non-Bun context.
 */
declare namespace Bun {
  function file(path: string): { text(): Promise<string>; exists(): Promise<boolean> };
  function write(path: string, data: string | Uint8Array): Promise<number>;
  function hash(data: string | Uint8Array): number;
}
