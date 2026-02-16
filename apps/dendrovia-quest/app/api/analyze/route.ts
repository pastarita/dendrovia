/**
 * POST /api/analyze — Run CHRONOS pipeline on a GitHub repo
 *
 * Spawns `bun run analyze.ts <url>` as a child process because CHRONOS uses
 * Bun-specific APIs (Bun.spawn, Bun.write, Bun.file) that require the Bun
 * runtime. Next.js API routes run on Node.js, so we bridge via subprocess.
 *
 * Parses stdout pino JSON lines and streams SSE events to the client.
 *
 * Body: { url: string }
 * Returns SSE stream with pipeline progress, then final result.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

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

      // Resolve paths relative to the monorepo root
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

          // Try pino JSON first (analyze.ts outputs structured JSON when piped)
          try {
            const json = JSON.parse(trimmed);
            if (json.msg) {
              if (json.msg.includes('Resolving')) {
                send({ step: 'resolve', message: json.msg });
              } else if (json.msg.includes('resolved')) {
                repo = json.repo ?? json.repository ?? '';
                send({ step: 'resolved', message: `Repository: ${repo}`, repo });
              } else if (json.msg.includes('analysis complete')) {
                outputDir = json.outputDir ?? '';
                stats.fileCount = json.filesParsed ?? 0;
                stats.commitCount = json.commits ?? 0;
                stats.hotspotCount = json.hotspots ?? 0;
                stats.contributorCount = json.contributors ?? 0;
                stats.languageCount = json.languages ?? 0;
                stats.duration = json.totalTime ?? '';
                stats.deepwikiAvailable = json.deepwiki === 'enriched';
              } else if (json.msg.includes('DeepWiki')) {
                send({ step: 'deepwiki', message: json.msg });
              } else if (json.msg.includes('registry')) {
                send({ step: 'registry', message: json.msg });
              } else {
                send({ step: 'info', message: json.msg });
              }
            }
            continue;
          } catch {
            // Not JSON — fall through to plaintext handling
          }

          // Plaintext fallback (banner lines, non-pino output)
          if (trimmed.startsWith('[resolve]')) {
            send({ step: 'resolve', message: trimmed.replace('[resolve] ', '') });
          } else if (trimmed.startsWith('Output:')) {
            outputDir = trimmed.replace('Output:', '').trim();
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
