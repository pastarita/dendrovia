/**
 * API Route — Serve world data JSON from the filesystem.
 *
 * Maps requests like:
 *   GET /api/worlds/dendrovia/chronos/topology.json
 * to the file:
 *   {monorepoRoot}/worlds/dendrovia/chronos/topology.json
 *
 * Validates that the resolved path stays within the worlds/ directory.
 */

import { readFileSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { NextResponse } from 'next/server';
import { findMonorepoRoot } from '@dendrovia/shared/paths';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const relativePath = normalize(segments.join('/'));

  // Block path traversal
  if (relativePath.includes('..') || relativePath.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const root = findMonorepoRoot();
    const worldsDir = resolve(join(root, 'worlds'));
    const filePath = resolve(join(worldsDir, relativePath));

    // Ensure resolved path is still within worlds/
    if (!filePath.startsWith(worldsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const content = readFileSync(filePath, 'utf-8');

    // Determine Content-Type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'json') contentType = 'application/json';
    else if (ext === 'glsl') contentType = 'text/plain';

    return new NextResponse(content, {
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[WORLDS API] Failed to serve ${relativePath}: ${message}`);
    return NextResponse.json(
      { error: 'Not found', detail: message },
      { status: 404 },
    );
  }
}
