/**
 * POST /api/analyze — Run CHRONOS pipeline on a GitHub repo
 *
 * Spawns `bun run analyze.ts <url>` as a child process because CHRONOS uses
 * Bun-specific APIs (Bun.spawn, Bun.write, Bun.file) that require the Bun
 * runtime. Next.js API routes run on Node.js, so we bridge via subprocess.
 *
 * Parses stdout for progress markers and streams SSE events to the client.
 *
 * Body: { url: string }
 * Returns SSE stream with pipeline progress, then final result.
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

export async function POST(request: Request) {
  const body = await request.json();
  const input: string = body.url;

  if (!input || typeof input !== 'string') {
    return Response.json({ error: 'Missing "url" field' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send(data: Record<string, unknown>) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      }

      send({ step: 'resolve', message: 'Launching CHRONOS pipeline...' });

      // Resolve paths relative to the app's cwd (apps/playground-chronos)
      const monorepoRoot = resolve(process.cwd(), '../..');
      const analyzeScript = resolve(monorepoRoot, 'packages/chronos/src/analyze.ts');

      const proc = spawn('bun', ['run', analyzeScript, input.trim()], {
        cwd: monorepoRoot,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let buffer = '';
      const stats: Record<string, unknown> = {};
      let outputDir = '';
      let repo = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Parse progress markers from analyze.ts stdout
          if (trimmed.startsWith('[resolve]')) {
            send({ step: 'resolve', message: trimmed.replace('[resolve] ', '') });
          } else if (trimmed.startsWith('Repo:')) {
            repo = trimmed.replace('Repo:', '').trim();
            send({ step: 'resolved', message: `Repository: ${repo}`, repo });
          } else if (/^\[\d\/6\]/.test(trimmed)) {
            const match = trimmed.match(/^\[(\d)\/6\]\s*(.+)/);
            if (match) {
              send({ step: `step-${match[1]}`, message: match[2] });
            }
          } else if (trimmed.startsWith('[deepwiki]')) {
            send({ step: 'deepwiki', message: trimmed.replace('[deepwiki] ', '') });
          } else if (trimmed.startsWith('[registry]')) {
            send({ step: 'registry', message: trimmed.replace('[registry] ', '') });
          }
          // Parse final summary stats
          else if (trimmed.startsWith('Files parsed:')) {
            stats.fileCount = parseInt(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Commits:') && !trimmed.includes('parsed')) {
            stats.commitCount = parseInt(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Hotspots:')) {
            stats.hotspotCount = parseInt(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Contributors:')) {
            stats.contributorCount = parseInt(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Languages:')) {
            stats.languageCount = parseInt(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Total time:')) {
            stats.duration = parseFloat(trimmed.split(':')[1]) || 0;
          } else if (trimmed.startsWith('Output:')) {
            outputDir = trimmed.replace('Output:', '').trim();
          } else if (trimmed.startsWith('DeepWiki:')) {
            stats.deepwikiAvailable = trimmed.includes('enriched');
          }
        }
      });

      let stderrOutput = '';
      proc.stderr.on('data', (chunk: Buffer) => {
        stderrOutput += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          send({
            step: 'complete',
            message: 'Analysis complete',
            repo,
            outputDir,
            stats,
            deepwikiAvailable: !!stats.deepwikiAvailable,
          });
        } else {
          send({
            step: 'error',
            message: stderrOutput.trim() || `Process exited with code ${code}`,
          });
        }
        controller.close();
      });

      proc.on('error', (err) => {
        send({ step: 'error', message: `Failed to spawn bun: ${err.message}` });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
