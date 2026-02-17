/**
 * GET /api/results?dir=<outputDir>&file=<filename>
 *
 * Reads a specific output file from a CHRONOS analysis run.
 * If no file specified, lists available files in the output directory.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dir = url.searchParams.get('dir');
  const file = url.searchParams.get('file');

  if (!dir) {
    return Response.json({ error: 'Missing "dir" parameter' }, { status: 400 });
  }

  // Security: only allow reading from ~/.chronos/ or monorepo generated/ dirs
  if (!dir.includes('.chronos') && !dir.includes('generated')) {
    return Response.json({ error: 'Invalid directory' }, { status: 403 });
  }

  if (!existsSync(dir)) {
    return Response.json({ error: 'Output directory not found' }, { status: 404 });
  }

  if (!file) {
    // List available files
    const entries = await readdir(dir);
    const jsonFiles = entries.filter((e) => e.endsWith('.json'));
    return Response.json({ files: jsonFiles });
  }

  // Prevent path traversal
  const sanitized = basename(file);
  const filePath = join(dir, sanitized);

  if (!existsSync(filePath)) {
    return Response.json({ error: `File not found: ${sanitized}` }, { status: 404 });
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Response.json({ filename: sanitized, content: parsed });
  } catch {
    return Response.json({ error: `Failed to read ${sanitized}` }, { status: 500 });
  }
}
