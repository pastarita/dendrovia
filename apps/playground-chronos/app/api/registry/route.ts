/**
 * GET /api/registry — List previously analyzed repos from ~/.chronos/registry.json
 */

import { loadRegistry } from '@dendrovia/chronos';

export async function GET() {
  try {
    const registry = loadRegistry();
    return Response.json(registry);
  } catch {
    return Response.json({ version: '1', entries: [] });
  }
}
