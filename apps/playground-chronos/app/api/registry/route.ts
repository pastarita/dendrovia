/**
 * GET /api/registry — List previously analyzed repos from ~/.chronos/registry.json
 *
 * Reads the registry file directly (Node.js fs) rather than importing from
 * @dendrovia/chronos, which uses .js import extensions incompatible with turbopack.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.chronos', 'registry.json');

export async function GET() {
  try {
    if (!existsSync(REGISTRY_PATH)) {
      return Response.json({ version: '1.0.0', entries: [] });
    }
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(raw);
    return Response.json(registry);
  } catch {
    return Response.json({ version: '1.0.0', entries: [] });
  }
}
