/**
 * POST /api/distill — Run IMAGINARIUM distillation pipeline
 *
 * Spawns `bun run distill.ts <topologyPath> <outputDir>` as a child process.
 * Parses stdout for progress markers and streams SSE events to the client.
 *
 * Body: { topologyDir: string }
 *   topologyDir — the CHRONOS output directory containing topology.json
 *
 * Returns SSE stream with pipeline progress, then final result.
 */

import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

export async function POST(request: Request) {
  const body = await request.json();
  const topologyDir: string = body.topologyDir;

  if (!topologyDir || typeof topologyDir !== 'string') {
    return Response.json({ error: 'Missing "topologyDir" field' }, { status: 400 });
  }

  // Security: only allow reading from known directories
  if (!topologyDir.includes('.chronos') && !topologyDir.includes('generated')) {
    return Response.json({ error: 'Invalid topology directory' }, { status: 403 });
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

      send({ step: 'distill-start', message: 'Launching IMAGINARIUM distillation...' });

      const monorepoRoot = resolve(process.cwd(), '../..');
      const distillScript = resolve(monorepoRoot, 'packages/imaginarium/src/distill.ts');
      const topologyPath = join(topologyDir, 'topology.json');
      const outputDir = join(topologyDir, 'imaginarium');

      const proc = spawn('bun', ['run', distillScript, topologyPath, outputDir], {
        cwd: monorepoRoot,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let buffer = '';
      let manifestPath = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Parse IMAGINARIUM output markers
          if (trimmed.includes('IMAGINARIUM')) {
            send({ step: 'distill-init', message: 'IMAGINARIUM pipeline initialized' });
          } else if (trimmed.startsWith('Palettes:')) {
            send({ step: 'distill-palettes', message: trimmed });
          } else if (trimmed.startsWith('Shaders:')) {
            send({ step: 'distill-shaders', message: trimmed });
          } else if (trimmed.startsWith('Noise:')) {
            send({ step: 'distill-noise', message: trimmed });
          } else if (trimmed.startsWith('L-System:')) {
            send({ step: 'distill-lsystem', message: trimmed });
          } else if (trimmed.startsWith('Manifest:')) {
            manifestPath = trimmed.replace('Manifest:', '').trim();
            send({ step: 'distill-manifest', message: trimmed, manifestPath });
          } else if (trimmed.startsWith('Duration:')) {
            send({ step: 'distill-duration', message: trimmed });
          } else if (trimmed.includes('Results')) {
            send({ step: 'distill-results', message: 'Compiling results...' });
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
            step: 'distill-complete',
            message: 'Distillation complete',
            manifestPath: manifestPath || join(outputDir, 'manifest.json'),
            outputDir,
          });
        } else {
          send({
            step: 'error',
            message: stderrOutput.trim() || `Distillation exited with code ${code}`,
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
