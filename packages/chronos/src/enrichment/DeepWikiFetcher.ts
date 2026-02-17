/**
 * DeepWikiFetcher — Fetch AI-generated documentation from DeepWiki
 *
 * Uses the DeepWiki MCP endpoint (JSON-RPC over HTTP) to retrieve
 * wiki structure and content for public GitHub repos.
 *
 * Results are cached to ~/.chronos/deepwiki/{owner}/{repo}.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DeepWikiEnrichment } from '@dendrovia/shared';

// Re-export so consumers can import from here or from shared
export type { DeepWikiEnrichment } from '@dendrovia/shared';

// Local alias for topic shape used in flatten logic
interface WikiTopic {
  title: string;
  id: string;
  children?: WikiTopic[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEEPWIKI_MCP_URL = 'https://mcp.deepwiki.com/mcp';
const DEEPWIKI_CACHE_DIR = join(homedir(), '.chronos', 'deepwiki');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 15_000;

// ── JSON-RPC helper ──────────────────────────────────────────────────────────

let rpcId = 1;

async function mcpCall(method: string, params: Record<string, unknown>): Promise<unknown> {
  const body = {
    jsonrpc: '2.0',
    id: rpcId++,
    method: 'tools/call',
    params: {
      name: method,
      arguments: params,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(DEEPWIKI_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DeepWiki HTTP ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      result?: { content?: Array<{ text?: string }> };
      error?: { message: string };
    };

    if (json.error) {
      throw new Error(`DeepWiki RPC error: ${json.error.message}`);
    }

    // MCP tools/call returns content array with text items
    const text = json.result?.content?.[0]?.text;
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ── Cache management ─────────────────────────────────────────────────────────

function getCachePath(owner: string, repo: string): string {
  return join(DEEPWIKI_CACHE_DIR, owner, `${repo}.json`);
}

function readCache(owner: string, repo: string): DeepWikiEnrichment | null {
  const path = getCachePath(owner, repo);
  if (!existsSync(path)) return null;

  try {
    const raw = readFileSync(path, 'utf-8');
    const cached = JSON.parse(raw) as DeepWikiEnrichment;

    // Check TTL
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age > CACHE_TTL_MS) return null;

    return cached;
  } catch {
    return null;
  }
}

function writeCache(owner: string, repo: string, data: DeepWikiEnrichment): void {
  const path = getCachePath(owner, repo);
  mkdirSync(join(DEEPWIKI_CACHE_DIR, owner), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// ── Flatten topics for content fetch ─────────────────────────────────────────

function flattenTopics(topics: WikiTopic[], maxDepth = 2, depth = 0): WikiTopic[] {
  const flat: WikiTopic[] = [];
  for (const t of topics) {
    flat.push(t);
    if (t.children && depth < maxDepth) {
      flat.push(...flattenTopics(t.children, maxDepth, depth + 1));
    }
  }
  return flat;
}

// ── Main fetch function ──────────────────────────────────────────────────────

export async function fetchDeepWikiEnrichment(owner: string, repo: string): Promise<DeepWikiEnrichment | null> {
  // Check cache first
  const cached = readCache(owner, repo);
  if (cached) {
    return cached;
  }

  const repoName = `${owner}/${repo}`;
  const wikiUrl = `https://deepwiki.com/${owner}/${repo}`;

  try {
    // Step 1: Get wiki structure
    const structure = (await mcpCall('read_wiki_structure', { repoName })) as {
      pages?: Array<{ title: string; id: string; children?: Array<{ title: string; id: string }> }>;
    } | null;

    if (!structure?.pages?.length) {
      return null; // Repo not indexed by DeepWiki
    }

    const topics: WikiTopic[] = structure.pages.map((p) => ({
      title: p.title,
      id: p.id,
      children: p.children?.map((c) => ({ title: c.title, id: c.id })),
    }));

    // Step 2: Fetch content for top-level overview topics (max 5)
    const topTopics = flattenTopics(topics).slice(0, 5);
    let overview: string | undefined;
    const moduleDocumentation: Record<string, string> = {};

    for (const topic of topTopics) {
      try {
        const content = (await mcpCall('read_wiki_contents', {
          repoName,
          pagePath: topic.id,
        })) as { content?: string } | string | null;

        const text = typeof content === 'string' ? content : (content as { content?: string })?.content;

        if (!text) continue;

        if (!overview) {
          // First content becomes the overview
          overview = text.slice(0, 2000); // Cap at 2k chars
        } else {
          moduleDocumentation[topic.id] = text.slice(0, 1000);
        }
      } catch {}
    }

    const enrichment: DeepWikiEnrichment = {
      wikiUrl,
      overview,
      topics,
      moduleDocumentation: Object.keys(moduleDocumentation).length > 0 ? moduleDocumentation : undefined,
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    writeCache(owner, repo, enrichment);

    return enrichment;
  } catch {
    // DeepWiki unavailable — non-fatal
    return null;
  }
}
