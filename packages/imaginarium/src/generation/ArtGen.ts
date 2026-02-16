/**
 * ArtGen — AI art generation orchestrator.
 *
 * Default for MVP: 'skip' — AI is optional, pipeline works without it.
 * Never throws — returns { image: null } on any failure.
 */

import type { CodeTopology } from '@dendrovia/shared';
import { buildPrompt } from './PromptBuilder';
import { hashString } from '../utils/hash';
import { DeterministicCache } from '../cache/DeterministicCache';

export type ArtProvider = 'stability' | 'flux' | 'local' | 'skip';

export interface ArtGenOptions {
  provider?: ArtProvider;
  cacheDir?: string;
}

export interface ArtGenResult {
  image: Uint8Array | null;
  prompt: string;
  seed: number;
  provider: ArtProvider;
  cached: boolean;
}

export async function generate(
  topology: CodeTopology,
  options?: ArtGenOptions,
): Promise<ArtGenResult> {
  const provider = options?.provider ?? (process.env.IMAGINARIUM_PROVIDER as ArtProvider) ?? 'skip';
  const prompt = buildPrompt(topology);
  const seedStr = hashString(prompt);
  const seed = parseInt(seedStr.substring(0, 8), 16) % 1000000;

  if (provider === 'skip') {
    return { image: null, prompt, seed, provider, cached: false };
  }

  // Check cache
  if (options?.cacheDir) {
    const cache = new DeterministicCache(options.cacheDir);
    const cached = await cache.get<Uint8Array>({ prompt, seed, provider });
    if (cached) {
      return { image: cached, prompt, seed, provider, cached: true };
    }
  }

  try {
    let image: Uint8Array | null = null;

    switch (provider) {
      case 'stability':
        image = await callStabilityAPI(prompt, seed);
        break;
      case 'flux':
        image = await callFluxAPI(prompt, seed);
        break;
      case 'local':
        image = await callLocalAPI(prompt, seed);
        break;
    }

    // Cache result
    if (image && options?.cacheDir) {
      const cache = new DeterministicCache(options.cacheDir);
      await cache.set({ prompt, seed, provider }, image);
    }

    return { image, prompt, seed, provider, cached: false };
  } catch {
    // Never throws
    return { image: null, prompt, seed, provider, cached: false };
  }
}

async function callStabilityAPI(prompt: string, seed: number): Promise<Uint8Array | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      seed,
      width: 512,
      height: 512,
      samples: 1,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json() as { artifacts: Array<{ base64: string }> };
  if (!data.artifacts?.[0]) return null;

  return Uint8Array.from(atob(data.artifacts[0]!.base64), c => c.charCodeAt(0));
}

async function callFluxAPI(prompt: string, seed: number): Promise<Uint8Array | null> {
  const apiKey = process.env.BFL_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': apiKey,
    },
    body: JSON.stringify({ prompt, seed, width: 512, height: 512 }),
  });

  if (!response.ok) return null;
  const data = await response.json() as { sample: string };
  if (!data.sample) return null;

  // Flux returns a URL — fetch the image
  const imgResponse = await fetch(data.sample);
  if (!imgResponse.ok) return null;
  return new Uint8Array(await imgResponse.arrayBuffer());
}

async function callLocalAPI(prompt: string, seed: number): Promise<Uint8Array | null> {
  // ComfyUI local API
  const host = process.env.COMFYUI_HOST ?? 'http://127.0.0.1:8188';
  try {
    const response = await fetch(`${host}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: { text: prompt }, seed }),
    });
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}
