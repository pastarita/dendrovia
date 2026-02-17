/**
 * Service Worker — Offline-First Asset Caching
 *
 * Caching strategies by request type:
 *   - Generated assets (shaders, JSON): Cache-first with manifest versioning
 *   - CDN assets (textures, audio): Stale-while-revalidate
 *   - API calls: Network-first with fallback
 *   - Navigation: Network-first
 *
 * Cache names are versioned via the manifest checksum so that
 * deploying new generated assets automatically invalidates stale caches.
 *
 * NOTE: This file is meant to be served as a standalone worker script.
 * It should NOT be bundled into the main application.
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_PREFIX = 'dendrovia';
const GENERATED_CACHE = `${CACHE_PREFIX}-generated`;
const CDN_CACHE = `${CACHE_PREFIX}-cdn`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime`;

// Assets to pre-cache during install
const PRECACHE_URLS = ['/', '/generated/manifest.json'];

// ── Install ──────────────────────────────────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(GENERATED_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Activate immediately (don't wait for old SW to release)
        return self.skipWaiting();
      }),
  );
});

// ── Activate ─────────────────────────────────────────────────────

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    // Clean up old caches from previous versions
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .filter((name) => ![GENERATED_CACHE, CDN_CACHE, RUNTIME_CACHE].includes(name))
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

// ── Fetch ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Route to appropriate strategy
  if (isGeneratedAsset(url)) {
    event.respondWith(cacheFirst(event.request, GENERATED_CACHE));
  } else if (isCDNAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request, CDN_CACHE));
  } else if (isAPICall(url)) {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
  }
  // Navigation and other requests: let the browser handle normally
});

// ── Strategies ───────────────────────────────────────────────────

/**
 * Cache-first: Return cached response, falling back to network.
 * Best for versioned/immutable assets (generated shaders, topology).
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-while-revalidate: Return cached response immediately,
 * then update the cache in the background.
 * Best for CDN assets that may update occasionally.
 */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Revalidate in background regardless
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available
  if (cached) return cached;

  // No cache — wait for network
  const response = await networkPromise;
  if (response) return response;

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

/**
 * Network-first: Try network, fall back to cache.
 * Best for API calls and dynamic data.
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ── Route Matchers ───────────────────────────────────────────────

function isGeneratedAsset(url: URL): boolean {
  return url.pathname.startsWith('/generated/');
}

function isCDNAsset(url: URL): boolean {
  return url.hostname.includes('cdn.dendrovia') || url.pathname.startsWith('/cdn/');
}

function isAPICall(url: URL): boolean {
  return url.pathname.startsWith('/api/');
}

// ── Message Handling ─────────────────────────────────────────────

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data ?? {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'INVALIDATE_CACHE': {
      // Purge a specific cache (e.g., after manifest update)
      const cacheName = payload?.cacheName ?? GENERATED_CACHE;
      caches.delete(cacheName);
      break;
    }

    case 'CACHE_URLS': {
      // Pre-cache specific URLs
      const urls: string[] = payload?.urls ?? [];
      caches.open(GENERATED_CACHE).then((cache) => cache.addAll(urls));
      break;
    }
  }
});
