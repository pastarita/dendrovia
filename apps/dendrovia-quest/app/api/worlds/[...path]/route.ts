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
    return new NextResponse(content, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
