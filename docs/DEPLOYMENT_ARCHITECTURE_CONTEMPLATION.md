# Deployment Architecture Contemplation

> **Status:** Research & Decision Framework
> **Scope:** Dendrovia Monorepo — Hosting, CDN, Caching, Build Pipeline
> **Last Updated:** 2026-02-15

---

## Table of Contents

1. [Context & Premise](#1-context--premise)
2. [Classification of Completeness](#2-classification-of-completeness)
3. [Architecture Profile](#3-architecture-profile)
4. [Decision Points](#4-decision-points)
   - [DP-0: Framework — Next.js vs Vite+React](#dp-0-framework--nextjs-vs-vitereact)
   - [DP-1: Next.js Output Mode](#dp-1-nextjs-output-mode)
   - [DP-2: Primary Hosting Platform](#dp-2-primary-hosting-platform)
   - [DP-3: CDN & Asset Delivery Strategy](#dp-3-cdn--asset-delivery-strategy)
   - [DP-4: HD Pack / Optional Asset Distribution](#dp-4-hd-pack--optional-asset-distribution)
   - [DP-5: Build & Deploy Pipeline](#dp-5-build--deploy-pipeline)
   - [DP-6: Domain & DNS](#dp-6-domain--dns)
5. [Platform Analysis](#5-platform-analysis)
   - [Vercel](#vercel)
   - [Cloudflare Workers + Pages](#cloudflare-workers--pages)
   - [Hetzner + Coolify](#hetzner--coolify)
   - [AWS via SST](#aws-via-sst)
   - [Render](#render)
6. [OpenNext & the Deploy-Anywhere Ecosystem](#6-opennext--the-deploy-anywhere-ecosystem)
   - [OpenNext Deep Dive](#opennext-deep-dive)
   - [Competing & Complementary Projects](#competing--complementary-projects)
   - [Self-Hosting Tools](#self-hosting-tools)
   - [The Vercel Lock-in Debate](#the-vercel-lock-in-debate)
7. [DP-0 Evidence: The Framework Question](#7-dp-0-evidence-the-framework-question)
8. [Asset Delivery Model: SDF Composites & Tiling Textures](#8-asset-delivery-model-sdf-composites--tiling-textures)
9. [Caching Architecture](#9-caching-architecture)
10. [Content-Hash Pipeline](#10-content-hash-pipeline)
11. [Service Worker + CDN Interaction Model](#11-service-worker--cdn-interaction-model)
12. [Implementation Phases](#12-implementation-phases)
13. [Risk Register](#13-risk-register)
14. [Appendix: Technical Reference](#appendix-technical-reference)

---

## 1. Context & Premise

Dendrovia is a browser-based 3D RPG that transforms Git repositories into explorable worlds. The monorepo contains **7 Next.js 16.1.5 applications** (React 19, Three.js/R3F) sharing **10+ workspace packages** orchestrated by TurboRepo with Bun.

### Governing Principles

1. **Asset-light from the start.** Initial payload budget: <1MB total, <300KB JS. Critical path uses SDF composites and high-reuse tiling — not raw texture bitmaps. A small set of base textures + shader transforms produces world-scale visual variety.
2. **Client does the heavy lifting.** WebGL rendering, OPFS/IndexedDB caching, Zustand state — the server's role is to serve a shell and static assets.
3. **Deterministic and cacheable.** Generated shaders and topology data are pure functions of their inputs. Once built, they never change for a given content hash.
4. **Progressive enhancement.** Core experience works with zero CDN. HD pack, multiplayer, and advanced features layer on top.
5. **Avoid premature lock-in.** Prefer standard web primitives over platform-specific features. The app should be deployable anywhere with reasonable effort.

### What We're Serving

| Asset Class | Format | Size Range | Volatility | Cache Strategy |
|-------------|--------|------------|------------|----------------|
| App shell (HTML/JS/CSS) | Next.js output | 150-300KB | Per-deploy | Content-hashed, immutable |
| GLSL/WGSL shaders | Text | 1-10KB each | Per-build | Content-hashed, immutable |
| SDF composite shaders | GLSL | 2-15KB each | Per-build | Content-hashed, immutable |
| Base tiling textures | WebP/KTX2 | 16-128KB each | Rare | Immutable, high-reuse (few files, many lookups) |
| Topology JSON | JSON | 10-100KB | Per-build | Content-hashed, immutable |
| Palette JSON | JSON | 5-50KB | Per-build | Content-hashed, immutable |
| Mesh data | JSON | 10-500KB | Per-build | Content-hashed, immutable |
| Manifest | JSON | 2-10KB | Per-deploy | Short TTL, revalidate |
| Service worker | JS | ~3.4KB | Per-deploy | No-cache, must-revalidate |
| HD textures (optional) | WebP/KTX2 | 100KB-5MB | Rare | Long TTL, CDN-cached |
| Audio (optional) | OGG/MP3 | 500KB-10MB | Rare | Long TTL, CDN-cached |

**Asset philosophy:** Not everything is procedural. The visual style — a codified "melted plastic" aesthetic — is achieved through a **composite method**: a small palette of base tiling textures (low KB count, high reuse) combined with SDF operations, shader transformations, and procedural palettes at runtime. This means the texture *budget* is small (a handful of 64-128KB tiling bases), but the textures themselves are real assets that need proper caching and delivery. The shader/transformation layer provides the differentiation — the same base texture, distorted and recolored per-zone, produces world-scale variety without world-scale bandwidth.

---

## 2. Classification of Completeness

### What's Built & Ready

| Component | Status | Notes |
|-----------|--------|-------|
| TurboRepo task graph | Complete | `chronos#parse` → `imaginarium#distill` → `operatus#manifest` → `architectus#build` |
| OPERATUS cache hierarchy | Complete | Memory → OPFS → IndexedDB → network, with hash validation |
| OPERATUS manifest generator | Complete | SHA-256 content hashes (16-char), recursive scan, type detection |
| OPERATUS asset loader | Complete | Priority-based loading, manifest-driven, cache-integrated |
| OPERATUS service worker | Complete | Standalone 3.4KB, cache invalidation via BroadcastChannel |
| OPERATUS auto-save | Complete | Interval + event-driven + emergency beforeunload |
| Zustand persistence | Complete | Custom IndexedDB storage adapter with lz-string compression |
| Shared type contracts | Complete | `AssetManifest`, `MeshManifestEntry`, `CodeTopology`, etc. |
| CI pipeline | Complete | GitHub Actions: test, typecheck, lint, build (PR #feat/ci-pipeline) |
| `bun.lock` | Present | Text format, committed, reproducible installs |

### What's Missing for Deployment

| Gap | Severity | Impact |
|-----|----------|--------|
| No `output` mode in `next.config.js` | **High** | Default SSR requires Node.js server; no static export or standalone binary |
| No `headers()` configuration | **High** | Zero cache-control on generated assets; browsers and CDNs re-fetch everything |
| No deployment config | **High** | No `vercel.json`, `Dockerfile`, `wrangler.toml`, or deployment scripts |
| No `.env.example` / env documentation | **Medium** | Unclear what environment variables are required or optional |
| No content-hashed filenames on generated assets | **Medium** | OPERATUS manifest has hashes, but filenames on disk are not hashed (e.g. `dendrite.glsl` not `dendrite.a3f8b2c1.glsl`) |
| Generated asset directories empty | **Medium** | `packages/imaginarium/generated/` is gitignored; build pipeline must run before deployment |
| `playground-ludus` ignores TS errors | **Low** | `typescript.ignoreBuildErrors: true` in next.config — masks real errors |
| `playground-chronos` API routes use filesystem | **Low** | Hardcoded paths to `generated/` and `.chronos/` — breaks in ephemeral containers |
| No error monitoring | **Low** | No Sentry, LogRocket, or equivalent |
| Default public/ assets | **Low** | `dendrovia-quest/public/` still has Vercel/TurboRepo placeholder SVGs |

### Deployment Readiness Score: ~55%

The infrastructure *code* is solid. What's missing is the *configuration* that connects it to the outside world.

---

## 3. Architecture Profile

### Rendering Model

All 7 apps use **Next.js App Router** with a thin server layer:
- Layouts are server components (metadata, fonts)
- Pages are `'use client'` (React state, WebGL, event handlers)
- Only `playground-chronos` has API routes (2 endpoints, filesystem-dependent)
- No `middleware.ts` or `proxy.ts` in any app
- No ISR, no server actions, no streaming SSR in current use

**Implication:** The apps are effectively **client-side SPAs with server-rendered shells**. The server does almost nothing at runtime beyond initial HTML delivery. This is the ideal profile for static export or edge deployment.

### Build Pipeline

```
chronos#parse                    → packages/chronos/generated/*.json
    ↓
imaginarium#distill              → packages/imaginarium/generated/*.{glsl,json}
    ↓
operatus#manifest                → packages/imaginarium/generated/operatus-manifest.json
    ↓
architectus#build                → packages/architectus/dist/**
    ↓
next build (per app)             → apps/*/.next/**
```

All pipeline stages are deterministic and cacheable via TurboRepo. Remote caching (Vercel or self-hosted) can eliminate redundant rebuilds across CI runs and deploys.

### Dependency Map (Apps → Packages)

```
dendrovia-quest ──┬── @dendrovia/shared
                  ├── @dendrovia/architectus
                  ├── @dendrovia/ludus
                  ├── @dendrovia/oculus
                  ├── @dendrovia/operatus
                  └── @dendrovia/dendrite

playground-X ─────┬── @dendrovia/shared
                  ├── @dendrovia/{pillar}
                  └── @dendrovia/dendrite (some)
```

All apps share `@dendrovia/shared`. All use `@xyflow/react` + `@dagrejs/dagre` for the dendrite visualization. Three.js apps additionally import `@react-three/fiber`, `@react-three/drei`, `three`.

### Webpack Requirement

4 of 7 apps use `--webpack` flag because Turbopack does not yet handle their custom resolve configurations (extensionAlias, Node.js shims). This is relevant for:
- OpenNext compatibility (Turbopack builds are experimental in OpenNext)
- Build times (webpack is slower but proven)

---

## 4. Decision Points

### DP-0: Framework — Next.js vs Vite+React

**Question:** Is Next.js the right framework for Dendrovia, or would a simpler stack serve better?

This is the highest-leverage decision. It changes *everything* downstream — hosting options, deployment complexity, bundle size, maintenance burden, and the relevance of every other DP in this document. See [Section 7](#7-dp-0-evidence-the-framework-question) for the full evidence base.

| Option | Description | Deployment Story |
|--------|-------------|-----------------|
| **A: Stay on Next.js** | Keep current stack. Accept SSR framework overhead for a client-side app. | Requires OpenNext or Vercel. Platform-specific config. Adapter maintenance. |
| **B: Migrate to Vite + React** | Replace Next.js with Vite. Add TanStack Router or React Router. | `vite build` → static `dist/`. Deploy to *any* static host. Zero server. |
| **C: Hybrid** | Keep Next.js for `dendrovia-quest` (if SSR features are planned), migrate playgrounds to Vite. | Mixed deployment. More build config, but each app uses the right tool. |

#### Considerations for Option A (Stay on Next.js)

- Pros: No migration effort. Established monorepo wiring (`transpilePackages`). File-based routing. `next/font` optimization. Future SSR capability if needed.
- Cons: ~50KB larger baseline bundle vs Vite. Deployment requires adapters (OpenNext) or Vercel. Framework churn (Next.js 16 renamed middleware to proxy.ts, changed cache directives). 4 apps need `--webpack` flag for compatibility. Every page is `'use client'` — SSR features are unused.
- Lock-in: Moderate. Next.js roadmap is Vercel-controlled.

#### Considerations for Option B (Migrate to Vite + React)

- Pros: Simpler deployment (static files → any CDN). ~42KB baseline vs ~92KB. Faster dev server. No framework churn. No deployment adapters needed. TurboRepo works with Vite. Three.js/R3F community primarily uses Vite.
- Cons: Migration effort (~1 day per app). Lose file-based routing (replaceable with TanStack Router). Lose `next/font` (replaceable with `@font-face` CSS). Lose `metadata` export (replaceable with react-helmet-async).
- Lock-in: Near zero.

#### Considerations for Option C (Hybrid)

- Pros: Best-of-both. Quest app retains SSR optionality. Playgrounds get simpler builds.
- Cons: Two build pipelines to maintain. Inconsistent developer experience across apps.

#### Recommendation

**Option B is the technically correct answer** for an app where every page is `'use client'`. Next.js is solving problems (SSR, ISR, edge rendering) that Dendrovia doesn't have. However, migration has a real cost in time and testing.

**Pragmatic path:** Stay on Next.js for Phase 1 (ship the demo fast). Use `output: 'export'` to minimize the SSR overhead. Evaluate migration to Vite after the demo is live and the deployment pipeline is proven. This defers the migration cost without locking in further — `output: 'export'` produces static files regardless, so the deployment config transfers cleanly to Vite.

---

### DP-1: Next.js Output Mode

**Question:** Which `output` mode should we configure in `next.config.js`?

| Option | What It Produces | Server Required | Headers Control | Fits Dendrovia? |
|--------|-----------------|-----------------|-----------------|-----------------|
| **Default (none)** | `.next/` with server bundles | Yes (Node.js + `next start`) | Yes (`headers()` function) | Over-provisioned |
| **`standalone`** | Minimal `server.js` + traced deps | Yes (Node.js, but self-contained) | Yes | Good for Docker/VPS |
| **`export`** | Static `out/` directory (HTML/JS/CSS only) | No (any static file server) | No (no server = no custom headers) | Lightest, but loses `headers()` |

#### Considerations

**`export` (static)**
- Pros: Simplest deployment. Serve from any CDN/S3/nginx. Zero server cost. Fastest TTFB.
- Cons: No `headers()` function — cache-control must be set at the CDN/server level, not in Next.js config. No API routes (breaks `playground-chronos`). No ISR if we ever want it. No `middleware.ts`. No image optimization.
- Specific: We'd need to handle cache headers externally (Vercel route config, Cloudflare Page Rules, nginx config). This is fine — it's where cache headers *should* live for a production CDN setup anyway.

**`standalone`**
- Pros: Self-contained Node.js server. Docker-friendly. Supports all Next.js features including `headers()`. Good for VPS/container deploys.
- Cons: Requires Node.js runtime. Larger deployment artifact. Must copy `public/` and `.next/static/` manually.
- Specific: Monorepo requires `outputFileTracingRoot` set to repo root for correct file tracing.

**Default (no output)**
- Pros: Maximum feature support. Easiest local dev parity.
- Cons: Requires full `node_modules` at runtime. Largest deployment. Only makes sense on Vercel (which handles this natively).

#### Recommendation

**Start with `export` for `dendrovia-quest`** (the demo/main app). It aligns with the "client does the heavy lifting" principle. Set cache headers at the platform level. If `playground-chronos` API routes are needed in production, deploy it separately with `standalone`.

---

### DP-2: Primary Hosting Platform

**Question:** Where does the main app (`dendrovia-quest`) live?

See [Section 5: Platform Analysis](#5-platform-analysis) for full breakdown.

#### Decision Matrix

| Factor | Weight | Vercel | Cloudflare | Hetzner+Coolify | AWS (SST) | Render |
|--------|--------|--------|------------|-----------------|-----------|--------|
| Time to first deploy | High | 5 | 3 | 2 | 3 | 4 |
| Demo-tier cost ($0-5/mo) | High | 5 | 5 | 2 | 4 | 4 |
| Cache-control granularity | High | 4 | 5 | 5 | 5 | 3 |
| CDN/edge coverage | High | 5 | 5 | 3* | 5 | 2 |
| TurboRepo+Bun compat | Medium | 5 | 3 | 3 | 3 | 3 |
| Vendor lock-in risk | Medium | 3 | 4 | 5 | 3 | 5 |
| Ops complexity | Medium | 5 | 4 | 2 | 3 | 4 |
| HD pack CDN cost | Low | 3 | 5 | 4* | 4 | 2 |
| Scale-up cost trajectory | Low | 2 | 5 | 5 | 4 | 3 |
| **Weighted Total** | | **41** | **40** | **31** | **36** | **31** |

*Hetzner scores assume Cloudflare free CDN in front.

#### Recommendation

**Vercel for phase 1** (zero-config, free, native TurboRepo). **Cloudflare for phase 2** if we need better cost scaling or R2 for HD assets. The migration path is well-defined via OpenNext.

---

### DP-3: CDN & Asset Delivery Strategy

**Question:** How do generated assets (shaders, topology, palettes) reach the browser efficiently?

| Strategy | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **A: Bundle via Turbopack** | Import GLSL/JSON as modules (`?raw`), Turbopack content-hashes them into `_next/static/` | Auto-hashed. Immutable headers automatic. Zero config. | Increases JS bundle size. Assets bundled into chunks, not individually cacheable. Turbopack `?raw` support varies. |
| **B: `public/` + manifest** | Copy generated assets to `public/generated/` at build time. Filenames include content hash. AssetLoader resolves via manifest. | Individually cacheable. Works with any platform. Clear separation of code and data. | No auto-immutable headers on `public/` (must configure at platform level). Extra build step to copy. |
| **C: Dedicated asset route** | `app/generated/[...path]/route.ts` serves assets with custom headers. | Full header control in Next.js. Dynamic serving. | Requires Node.js runtime (not compatible with `export`). Each request hits the server. |
| **D: Separate asset origin** | Assets on R2/S3, served via CDN worker with custom headers. Main app fetches cross-origin. | Complete separation. Independent scaling. Best caching control. | CORS setup. Extra infrastructure. Overkill for <1MB of assets. |

#### Considerations

- **Strategy A** is simplest but defeats the purpose of OPERATUS's manifest-driven loading. Assets become part of the JS bundle rather than independently cacheable resources.
- **Strategy B** is the sweet spot. OPERATUS already has the manifest with hashes. We just need a build step that produces hashed filenames and copies them to `public/generated/`.
- **Strategy C** works but ties us to SSR mode.
- **Strategy D** is the right answer at scale (especially for HD pack), but premature for generated shaders/JSON.

#### Recommendation

**Strategy B for generated assets** (shaders, topology, palettes, meshes). **Strategy D for HD pack** when that becomes relevant. This gives us individually cacheable assets with content-hash URLs, platform-agnostic serving, and a clean upgrade path.

---

### DP-4: HD Pack / Optional Asset Distribution

**Question:** When we add optional textures/audio, where do they live?

| Option | Cost Model | Egress | Integration |
|--------|-----------|--------|-------------|
| **Cloudflare R2** | $0.015/GB stored, **$0 egress** | Free | Workers serve with custom headers, S3-compatible API |
| **AWS S3 + CloudFront** | $0.023/GB stored, $0.085/GB egress | Paid | SST integrates natively, CloudFront caching |
| **Vercel Blob** | Included in plan, bandwidth metered | Plan-limited | Native integration, simple API |
| **Backblaze B2 + CF** | $0.005/GB stored, $0 egress via CF | Free via Bandwidth Alliance | S3-compatible, cheapest raw storage |

#### Recommendation

**Cloudflare R2.** Zero egress is the decisive factor for large binary assets. S3-compatible API means we can switch later. Even if the main app is on Vercel, R2 can serve as a standalone asset CDN.

---

### DP-5: Build & Deploy Pipeline

**Question:** How do builds get triggered, artifacts get produced, and deploys happen?

| Stage | Current State | Target State |
|-------|---------------|--------------|
| CI checks | GitHub Actions (test, typecheck, lint, build) | Same (landed on `feat/ci-pipeline`) |
| Build orchestration | TurboRepo local | TurboRepo + remote cache |
| Deploy trigger | None | Push to main → auto-deploy |
| Preview deploys | None | PR push → preview URL |
| Rollback | None | Platform-specific (Vercel instant, others via Git revert) |

#### Considerations

- **TurboRepo remote caching** is free on Vercel and dramatically speeds up CI + deploys. Even if we don't host on Vercel, we can use Vercel's remote cache for TurboRepo.
- **Preview deploys** are built-in on Vercel and Cloudflare Pages. On Hetzner/AWS, this requires Coolify or custom scripting.
- The build pipeline must run in order: `chronos#parse` → `imaginarium#distill` → `operatus#manifest` → `next build`. This is already encoded in `turbo.json`.

#### Recommendation

Enable TurboRepo remote caching (Vercel, free). Configure auto-deploy on the chosen platform. Add a deploy step to CI after all checks pass.

---

### DP-6: Domain & DNS

**Question:** Where does DNS live, and how do we route traffic?

| Option | Pros | Cons |
|--------|------|------|
| **Cloudflare DNS (free)** | Free, fast propagation, proxy mode for DDoS protection, pairs naturally with R2 | Another account to manage |
| **Vercel DNS** | Integrated with hosting, automatic SSL | Only useful if hosting on Vercel |
| **Route53** | Programmatic via SST, full control | $0.50/zone/month, AWS lock-in |
| **Registrar DNS** | Simplest | Usually slow propagation, limited features |

#### Recommendation

**Cloudflare DNS** regardless of hosting platform. Free, fast, and positions us for R2/Workers if we grow into them. Proxy mode adds DDoS protection and the ability to add Page Rules for cache-control overrides.

---

## 5. Platform Analysis

### Vercel

**Model:** Managed Next.js platform with global edge network.

| Aspect | Detail |
|--------|--------|
| **Hobby tier** | $0/mo. 100GB bandwidth, 6000 build-min, 150K function invocations. Personal/non-commercial only. |
| **Pro tier** | $20/user/mo. 1TB bandwidth, 1M function invocations. |
| **TurboRepo** | Native zero-config. Auto-detects monorepo. `turbo-ignore` for selective rebuilds. Remote cache included. |
| **Bun** | `bun install` auto-detected from lockfile. Bun runtime for functions in beta. |
| **Caching** | `_next/static/*` → automatic immutable. `public/*` → `max-age=0` by default (must override). Custom `headers()` supported. Edge cache: 31 days. |
| **Monorepo** | Each app = separate Vercel project from same repo. Import repo N times. |
| **Deploy** | Push to main → auto-deploy. PR → preview URL. Instant rollback. |

**Specific to Dendrovia:**
- Deploy `dendrovia-quest` as primary project. Playgrounds optional.
- Generated assets in `public/generated/` need explicit `Cache-Control` via `vercel.json` `headers` or `next.config.js headers()`.
- The `--webpack` flag on 4 apps is fine — Vercel supports both Turbopack and webpack builds.
- Hobby tier bandwidth (100GB) = ~50K-100K page loads of a 1MB app. Sufficient for demo.

**Lock-in considerations:**
- Next.js is Vercel's product. Some features (PPR, `proxy.ts`, certain caching behaviors) work best or only on Vercel.
- OpenNext exists as an escape hatch. Migration to Cloudflare/AWS is well-documented.
- The deeper concern: Vercel optimizes for features that push toward more server-side compute (ISR, server actions, RSC streaming), which increases dependency on their infrastructure. Dendrovia's client-heavy architecture mitigates this.

---

### Cloudflare Workers + Pages

**Model:** Edge-first platform. Static assets via Pages (free unlimited bandwidth), dynamic routes via Workers (V8 isolates).

| Aspect | Detail |
|--------|--------|
| **Free tier** | Unlimited static bandwidth. 100K Worker requests/day. 10GB R2 storage. |
| **Workers Paid** | $5/mo. 10M requests included. $0.30/additional million. |
| **Next.js** | Via `@opennextjs/cloudflare` adapter. Transforms Next.js output for Workers runtime. |
| **Bun** | `bun install` supported (set `BUN_VERSION` env var). Runtime is V8, not Bun. |
| **Caching** | Full Cache API access. Custom `Cache-Control` on any response. Page Rules for path-based overrides. |
| **R2** | S3-compatible object store. $0 egress. $0.015/GB/mo storage. |
| **Deploy** | Wrangler CLI or Git integration. Preview URLs on PRs. |

**Specific to Dendrovia:**
- Zero egress makes R2 ideal for HD pack CDN.
- Unlimited free static bandwidth means generated assets (shaders, JSON) cost nothing to serve.
- OpenNext adapter does NOT yet support `proxy.ts` (Next.js 16). `middleware.ts` works.
- Workers run V8 isolates, not Node.js. Any server-side code must be compatible with the Workers runtime (no `fs`, limited `crypto`). For Dendrovia, server-side code is minimal — mostly initial HTML rendering.
- 128MB memory limit per Worker request. Fine for HTML generation; important to know for any future server-side computation.

**Lock-in considerations:**
- Locked to Cloudflare for hosting, but OpenNext makes the Next.js layer portable.
- R2 is S3-compatible — data is portable.
- Workers runtime is proprietary (V8 isolates, not Node.js). Code that works in Workers may need adjustment for other platforms.

---

### Hetzner + Coolify

**Model:** Raw VPS + open-source PaaS layer for deployment UX.

| Aspect | Detail |
|--------|--------|
| **VPS cost** | CX23: ~$3.49/mo (2 vCPU, 4GB RAM, 40GB SSD, 20TB bandwidth). CAX11 (ARM): ~$3.79/mo. |
| **Coolify** | Self-hosted (free) or cloud ($5/mo). Git-push deploy, preview URLs, auto-SSL, monitoring. |
| **Total** | ~$7-15/mo for complete setup. |
| **TurboRepo** | Nixpacks auto-detects Bun from lockfile. Custom build commands for turbo pipeline. |
| **Caching** | Full control — you own the server. Set any headers via nginx, Node.js, or app config. |
| **CDN** | None included. Must add Cloudflare free (or another CDN) in front. |
| **Deploy** | Coolify: git push → webhook → build → deploy. Or manual Docker builds. |

**Specific to Dendrovia:**
- 20TB included bandwidth is effectively unlimited for any realistic traffic level.
- Single-region deployment. Without a CDN, TTFB varies by user location. Cloudflare free tier (proxy mode) solves this.
- Coolify handles Docker builds, SSL, deployments, and basic monitoring. Reduces ops burden significantly.
- `standalone` output mode recommended for Docker deploys (smallest image).
- Must manage server security, updates, backups. Coolify handles some but not all.

**Lock-in considerations:**
- Near zero. Standard Linux server. Docker containers. Any code runs anywhere.
- Coolify is open source — replaceable with any deployment tool.

---

### AWS via SST

**Model:** Infrastructure-as-code deploying Next.js to Lambda + S3 + CloudFront via OpenNext.

| Aspect | Detail |
|--------|--------|
| **Cost** | $0-2/mo at demo scale (free tier). $5-15/mo at moderate traffic. |
| **SST v3 (Ion)** | Pulumi/Terraform-based. `sst.aws.Nextjs` component handles everything. |
| **Infrastructure** | Lambda (SSR), S3 (static), CloudFront (CDN), DynamoDB (ISR cache), SQS (revalidation). |
| **Caching** | CloudFront cache behaviors per path pattern. Full granularity. |
| **Deploy** | `sst deploy` from CLI or CI. Stage-based (dev, staging, production). |

**Specific to Dendrovia:**
- SST provides the most fine-grained infrastructure control.
- CloudFront cache behaviors can set different policies per asset type: `/_next/static/*` → immutable, `/generated/*.glsl` → immutable, `/manifest.json` → revalidate.
- Lambda cold starts matter for SSR. For Dendrovia's thin server layer, this is a minor concern.
- AWS billing is complex: Lambda, S3, CloudFront, Route53, DynamoDB are all separate line items. SST abstracts provisioning but not billing.

**Lock-in considerations:**
- Moderate. Lambda, CloudFront, S3 are AWS services. But OpenNext means the Next.js layer is portable.
- SST can deploy to other providers (future), reducing IaC lock-in.

---

### Render

**Model:** Managed container/web service platform.

| Aspect | Detail |
|--------|--------|
| **Free tier** | $0. Spins down after 15min inactivity (cold start on first request). 100GB bandwidth. |
| **Starter** | $7/mo. 0.5 CPU, 512MB RAM. 100GB bandwidth. |
| **Caching** | Full header control (you run the server). No built-in CDN. |
| **Monorepo** | Supported via root directory setting and build filters. |
| **Deploy** | Git push → auto-deploy. Preview environments on paid plans. |

**Specific to Dendrovia:**
- Free tier cold starts are problematic for a 3D game — users wait 10-30 seconds for the first request.
- No CDN means every request goes to a single region. Must add Cloudflare in front.
- Straightforward Docker support if needed.
- Nothing Render does that Hetzner+Coolify doesn't do cheaper, or that Vercel/Cloudflare doesn't do better.

**Assessment:** Not recommended for this use case.

---

## 6. OpenNext & the Deploy-Anywhere Ecosystem

### OpenNext Deep Dive

**What it is:** An open-source build adapter that transforms Next.js output into deployable packages for non-Vercel platforms. Created December 2022 by the SST team (Dax Raad, Jay V) after its predecessor `serverless-next.js` became unmaintainable.

**Architecture:** `open-next build` runs `next build` in standalone mode, then transforms the output into platform-specific components:

| Component | Purpose |
|-----------|---------|
| Server Function | Wraps NextServer in Lambda/Worker handler. SSR, SSG, ISR, API routes, server actions. |
| Image Optimization | Dedicated function with bundled sharp. Handles `next/image`. |
| Revalidation Function | Polls SQS/R2 queue for ISR cache refresh. |
| Warmer Function | Scheduled pings to prevent cold starts. |
| Tag Provider | DynamoDB/KV for cache tag-based on-demand revalidation. |
| Static Assets | Hashed files for S3/CDN with immutable headers. |

**Three official adapters, three corporate maintainers:**

| Adapter | Maintainer | Target | Maturity |
|---------|-----------|--------|----------|
| `@opennextjs/aws` | SST community | Lambda + S3 + CloudFront | Most mature. v3.9.14 (Jan 2026). |
| `@opennextjs/cloudflare` | Cloudflare (employees) | Workers + R2 | 1.0-beta. All Next.js 16 minor/patch supported. |
| `@opennextjs/netlify` | Netlify (employees) | Netlify Functions + Edge | Joined OpenNext org Oct 2024. |

**Governance:** Multi-stakeholder but SST-originated. SST's `Nextjs` component is the primary consumer of the AWS adapter. If SST pivots, AWS adapter velocity could drop. Cloudflare and Netlify maintaining their own adapters adds meaningful independence.

**Next.js version compatibility:**
- AWS: Next.js 14.2.15 through 15.3.2 tested. Later versions "usually work."
- Cloudflare: All Next.js 16 minor/patch versions supported.
- Gap: `proxy.ts` (Next.js 16 replacement for `middleware.ts`) not yet supported on any adapter.

**Known limitations:**
1. Middleware does NOT execute on CDN-cached responses (unlike Vercel). Affects auth-gated cached pages and i18n.
2. `proxy.ts` not supported. Must use deprecated `middleware.ts`.
3. OpenNext chose NOT to use Next.js's undocumented `minimalMode` — behavioral differences exist.
4. Vercel commonly breaks custom cache handler APIs on minor updates, impacting ISR.
5. Image optimization adds ~500ms to Lambda cold starts (sharp library).

**Performance vs Vercel:**

| Metric | Vercel | OpenNext AWS | OpenNext Cloudflare |
|--------|--------|-------------|-------------------|
| SSR cold start | <50ms (Fluid Compute) | 100-1000ms (Lambda) | <5ms (V8 isolates) |
| Edge p95 latency | ~40ms | ~216ms (Lambda@Edge) | ~40ms (Workers) |
| ISR revalidation | Immediate | Queue-based (SQS delay) | R2-based |

**Future: Deployment Adapters RFC (April 2025)**

Vercel posted an RFC for an official adapter API — `modifyConfig()` and `onBuildComplete()` hooks that would give OpenNext (and all platforms) stable, documented integration points instead of reverse-engineering internal manifests. Alpha in Next.js 16. No stable implementations yet. If this lands, OpenNext becomes a thin wrapper rather than a deep patching system.

**Notable adopters:** NHS England, Udacity, Gymshark UK.

### Competing & Complementary Projects

| Project | Status | What It Does | Relevance to Dendrovia |
|---------|--------|-------------|----------------------|
| **serverless-next.js** | Archived Jan 2025 | OpenNext's predecessor. Could not keep up with App Router. | Historical context only. |
| **@cloudflare/next-on-pages** | Superseded | Edge-runtime-only Next.js on CF Pages. Replaced by OpenNext CF. | Not recommended. Use OpenNext CF instead. |
| **terraform-aws-open-next** (RJPearson94) | Active | Terraform module for OpenNext on AWS. | Relevant if choosing AWS without SST. |
| **Nitro (UnJS)** | Mature | Universal server engine for Nuxt/Angular/SolidStart. 15+ deploy presets. | Does NOT support Next.js. Relevant only if migrating away from Next.js entirely. |
| **Vinxi** | Active | Meta-bundler (Vite + Nitro). Powers SolidStart and TanStack Start. | Not Next.js compatible. Relevant for framework migration. |
| **TanStack Start** | Release Candidate | Full-stack React framework via Vinxi. No RSC yet. | Viable Next.js alternative. Type-safety-first. Deploys via Nitro presets. |
| **Waku** | Alpha (Feb 2026) | Minimal React framework with RSC on Vite + Hono. 50% smaller bundles than Next.js. | Too immature for production. Worth monitoring. |

### Self-Hosting Tools

| Tool | Type | GUI | Best For | Dendrovia Fit |
|------|------|-----|----------|---------------|
| **Coolify** | PaaS | Full web UI | Heroku-like on your VPS. Docker Compose, monitoring. | Good. Most feature-rich. |
| **Dokku** | PaaS | CLI only | Minimalists. Lightest resource usage. Plugin ecosystem. | Good if you prefer CLI. |
| **CapRover** | PaaS | Web UI + CLI | Docker Swarm clustering, one-click marketplace. | Overkill for single-app. |
| **Kamal** | Deployer | CLI | Docker on bare metal. Zero-downtime deploys. From 37signals. | Good. No daemon overhead. |
| **Fly.io** | Managed | CLI | Docker containers at global edge locations. | Decent but unpredictable costs. |

### The Vercel Lock-in Debate

**Vercel-exclusive or Vercel-advantaged features (2026 state):**

| Feature | Outside Vercel? | Gap |
|---------|----------------|-----|
| Basic SSR/SSG/ISR | Yes | Custom cache handler needed for ISR at scale |
| App Router, RSC, Server Actions | Yes | No meaningful gap |
| `use cache` / `use cache: remote` | Yes (filesystem) | Vercel has edge-distributed cache |
| PPR (Partial Prerendering) | Partially | Self-hosted: single-request. Vercel: CDN-level shell + dynamic stream. |
| `proxy.ts` | Yes (in theory) | OpenNext doesn't support it yet |
| Fluid Compute (cold start elimination) | No | Vercel-exclusive |
| Image optimization | Yes (manual sharp) | Vercel's is faster, cheaper |
| Analytics / Web Vitals | No | Use alternatives (Plausible, Fathom) |
| Preview deployments | No | Use CI alternatives or Coolify |

**The `minimalMode` concern:** Internal undocumented flag Vercel uses in production. Changes how NextServer handles routing and caching. OpenNext deliberately avoids it, creating behavioral differences. A recent CVE (CVE-2025-59472) in minimal mode's PPR resume endpoint demonstrated the risk of undocumented internal APIs.

**Bottom line:** The lock-in is structural, not legal (Next.js is MIT). The framework roadmap is Vercel-controlled. Features that benefit Vercel's platform receive disproportionate investment. For Dendrovia — which uses none of these server features — the lock-in risk is low but the overhead is real.

---

## 7. DP-0 Evidence: The Framework Question

### What Dendrovia Actually Uses from Next.js

| Feature | Used? | Replaceable With |
|---------|-------|-----------------|
| File-based routing | Yes | TanStack Router, React Router |
| `next/font/local` | Yes | `@font-face` CSS (manual) |
| `metadata` export | Yes | `react-helmet-async` or `<title>` in index.html |
| `transpilePackages` | Yes | Vite `optimizeDeps` + workspace resolution |
| `'use client'` pages | All 7 apps | Not needed in Vite (everything is client) |
| SSR / SSG / ISR | No | — |
| Server Actions | No | — |
| RSC data patterns | No | — |
| API routes | 1 app (chronos) | Standalone API server or build script |
| `next/image` | No | — |
| Middleware / proxy | No | — |
| `use cache` | No | — |

**Every page in every app is marked `'use client'`.** The server renders an empty `<html>` shell with font links. All 3D rendering, state management, and data handling happens client-side.

### Bundle Size Impact

| Stack | Baseline JS | Notes |
|-------|-------------|-------|
| Next.js 16 | ~92KB | Framework runtime, router, hydration |
| Vite + React 19 | ~42KB | React + ReactDOM only |
| **Delta** | **~50KB** | 17% of the <300KB JS budget |

### Migration Effort Estimate

| Task | Per App | Notes |
|------|---------|-------|
| Replace routing | 1-2 hours | File-based → TanStack Router config |
| Replace `next/font` | 15 minutes | Manual `@font-face` CSS |
| Replace `metadata` | 15 minutes | `<title>` in `index.html` or react-helmet |
| Create `vite.config.ts` | 30 minutes | Workspace resolution, GLSL loader |
| Update TurboRepo config | 30 minutes | Change `build` outputs from `.next/**` to `dist/**` |
| Remove `'use client'` directives | 5 minutes | No longer needed without SSR framework |
| Test and verify | 1-2 hours | Ensure all functionality works |
| **Total per app** | **~4-5 hours** | |
| **7 apps** | **~3-4 days** | Parallelizable |

### The R3F Community Factor

The React Three Fiber community overwhelmingly uses Vite, not Next.js. R3F's documentation, examples, starter templates, and community projects are Vite-based. Next.js + R3F requires workarounds (`--webpack` flag, browser shims for `fs`/`crypto`, `transpilePackages` config) that don't exist in the Vite ecosystem.

---

## 8. Asset Delivery Model: SDF Composites & Tiling Textures

### The "Melted Plastic" Aesthetic Pipeline

Dendrovia's visual identity is not purely procedural. It uses a **composite method** that combines:

1. **Base tiling textures** — A small palette of hand-authored or semi-procedural tiling textures (noise maps, surface normals, roughness maps). These are the "raw material" — perhaps 5-15 textures total, each 64-128KB in optimized WebP/KTX2 format.

2. **SDF operations** — Signed Distance Fields define shapes, boundaries, and transitions. SDF shaders are tiny (2-15KB GLSL) and compose algebraically (union, intersection, subtraction, smooth blending).

3. **Shader transformations** — Distortion, recoloring, UV manipulation, and procedural palette application. The same base texture, processed through different transformation parameters per zone/biome, produces visual variety without additional texture downloads.

4. **Procedural palettes** — JSON-defined color ramps that drive per-zone theming. Multiple palettes applied to the same base texture + SDF produce distinct environments.

### Budget Impact

| Category | Count | Size Per | Total | Cache Behavior |
|----------|-------|----------|-------|----------------|
| Base tiling textures | 5-15 | 64-128KB | **320KB-1.9MB** | Immutable, loaded once, infinite reuse |
| SDF composite shaders | 10-30 | 2-15KB | **20-450KB** | Immutable, loaded per-zone |
| Procedural palettes | 10-50 | 5-20KB | **50KB-1MB** | Immutable, loaded per-zone |
| Transformation params | per-zone | <1KB | negligible | Part of topology JSON |

**Critical insight:** Base tiling textures are the largest assets, but they are **load-once, use-everywhere**. A single 128KB noise texture might be referenced by every zone in the game. The OPERATUS cache hierarchy ensures these textures survive across sessions (OPFS/IndexedDB), so the bandwidth cost is effectively a one-time first-visit expense.

### Delivery Tiers

| Tier | Contents | When Loaded | Priority |
|------|----------|-------------|----------|
| **Critical** | Core SDF shaders, 2-3 base textures, topology | Before first render | CRITICAL (blocks) |
| **Visible** | Zone-specific palettes, remaining base textures | During loading screen | VISIBLE (blocks loading screen) |
| **Background** | Additional SDF variants, mesh data | After game starts | BACKGROUND (idle time) |
| **Optional (HD Pack)** | High-res texture variants, audio, detail meshes | On-demand from CDN | OPTIONAL (user-initiated) |

### Implications for Platform Choice

- **Critical tier** is small (<500KB). Any platform serves this fast.
- **Base textures** are few but relatively large. Content-hashed + immutable headers are essential. The CDN matters most here — first-visit users download these from the nearest edge.
- **HD pack** is where R2's zero-egress shines. High-res texture variants (1-5MB each) with long CDN TTLs.
- The **SW cache** (OPERATUS) means repeat visitors never re-download base textures. The CDN serves them once, then the browser holds them indefinitely.

---

## 9. Caching Architecture

### The Full Stack (Innermost to Outermost)

```
┌──────────────────────────────────────────────────────┐
│  1. JS Memory Map (OPERATUS CacheManager)            │
│     Instant. Volatile. Per-tab.                      │
├──────────────────────────────────────────────────────┤
│  2. OPFS (Origin Private File System)                │
│     Fast. Persistent. Per-origin. Hash-validated.    │
├──────────────────────────────────────────────────────┤
│  3. IndexedDB (fallback for no-OPFS browsers)        │
│     Medium. Persistent. Per-origin.                  │
├──────────────────────────────────────────────────────┤
│  4. Service Worker Cache API                         │
│     Independent of HTTP cache. Per-origin.           │
│     Survives page reloads. Intercepts fetch().       │
├──────────────────────────────────────────────────────┤
│  5. Browser HTTP Cache                               │
│     Respects Cache-Control headers.                  │
│     max-age / immutable / must-revalidate.           │
├──────────────────────────────────────────────────────┤
│  6. CDN Edge Cache                                   │
│     Respects s-maxage. Geographically distributed.   │
│     Shared across all users in a region.             │
├──────────────────────────────────────────────────────┤
│  7. Origin Server                                    │
│     Next.js (or static file server).                 │
│     Last resort. Should almost never be hit for      │
│     content-hashed assets after initial deploy.      │
└──────────────────────────────────────────────────────┘
```

### Cache-Control Header Strategy

| Resource Pattern | Cache-Control | Rationale |
|-----------------|---------------|-----------|
| `/_next/static/*` | `public, max-age=31536000, immutable` | Auto-set by Next.js. Content-hashed by Turbopack/webpack. |
| `/generated/*.{hash}.*` | `public, max-age=31536000, immutable` | Content-hashed at build time. Safe to cache forever. |
| `/generated/manifest.json` | `public, max-age=0, must-revalidate` | Must be fresh to detect new deploys. Small file, cheap to revalidate. |
| `/sw.js` | `no-cache, no-store, must-revalidate` | Browser must always check for SW updates. Even 1-byte change triggers update lifecycle. |
| HTML pages | `public, s-maxage=3600, stale-while-revalidate=86400` | CDN caches for 1h, serves stale for 24h during revalidation. Browser always revalidates. |
| `/cdn/*` (HD pack) | `public, s-maxage=86400, stale-while-revalidate=604800` | CDN caches 24h, stale-while-revalidate for 7 days. Large files, expensive to re-transfer. |

### OPERATUS Integration

OPERATUS layers 1-4 are already built. The deployment decision affects layers 5-7:
- **Layer 5 (HTTP cache):** Controlled by headers we set in `next.config.js` or platform config.
- **Layer 6 (CDN):** Depends on platform choice (Vercel Edge, CloudFront, Cloudflare).
- **Layer 7 (Origin):** Depends on hosting choice and output mode.

The key insight: OPERATUS's client-side caching means **repeat visitors almost never hit the CDN**, let alone the origin. The CDN is primarily for *first-visit* performance and *geographic distribution*.

---

## 10. Content-Hash Pipeline

### Current State

The OPERATUS `ManifestGenerator` already computes SHA-256 content hashes (16-char) for every generated asset and writes them into the manifest. But **filenames on disk are not hashed** — the manifest maps `dendrite.glsl` → hash `a3f8b2c1e5f6d7e8`, but the file on disk is still `dendrite.glsl`.

### Target State

Extend the manifest pipeline to produce hashed filenames:

```
Input:  packages/imaginarium/generated/shaders/dendrite.glsl
Output: apps/dendrovia-quest/public/generated/shaders/dendrite.a3f8b2c1.glsl
Manifest entry: { "shaders/dendrite.glsl": { hash: "a3f8b2c1", path: "shaders/dendrite.a3f8b2c1.glsl" } }
```

### Implementation Sketch

Extend `operatus#manifest` task to:
1. Scan `packages/imaginarium/generated/`
2. Compute content hashes (already done)
3. Copy each file with hashed filename to a staging directory
4. Write manifest mapping original names → hashed names
5. Copy staging directory to `apps/dendrovia-quest/public/generated/`

The `AssetLoader` already resolves paths via the manifest — it just needs to use the `path` field (which would now contain the hashed filename) instead of constructing paths from the key.

### When to Build This

This is a **Phase 2** concern. For Phase 1, unhashed filenames with short-TTL cache headers are acceptable. Content hashing becomes important when we want `immutable` headers to eliminate all revalidation traffic.

---

## 11. Service Worker + CDN Interaction Model

### How They Cooperate

The Service Worker Cache API operates **independently** from HTTP caching. `Cache-Control` headers do NOT influence what gets stored in the SW's cache. The SW intercepts `fetch()` events *before* the browser HTTP cache is consulted.

```
                                    ┌─────────┐
  fetch('/generated/dendrite.glsl') │ Browser │
                │                   └────┬────┘
                ▼                        │
         ┌──────────┐                   │
         │  Service  │ ── cache hit ──▶ response (instant)
         │  Worker   │
         │  Cache    │ ── cache miss ──▶ falls through to HTTP cache
         └──────────┘                   │
                                        ▼
                                 ┌──────────┐
                                 │  HTTP     │ ── cache hit ──▶ response (fast)
                                 │  Cache    │
                                 │  (disk)   │ ── cache miss ──▶ falls through to CDN
                                 └──────────┘
                                        │
                                        ▼
                                   ┌────────┐
                                   │  CDN   │ ── edge hit ──▶ response (fast)
                                   │  Edge  │
                                   │        │ ── edge miss ──▶ origin
                                   └────────┘
```

### OPERATUS's Existing Strategy (Already Correct)

The existing service worker (`packages/operatus/src/sw/service-worker.ts`) implements:
- **Generated assets:** Cache-first. Once in SW cache, CDN is never hit.
- **Manifest:** Network-first. Always checks for updates, falls back to cached.
- **INVALIDATE_CACHE message:** App can purge stale SW caches when manifest changes.

### What This Means for Deployment

The SW layer makes the CDN choice **less critical for repeat visitors**. Even with a slow CDN or no CDN, returning users get instant loads from the SW cache. The CDN matters most for:
1. First-time visitors (cold SW cache)
2. Cache invalidation moments (new deploy)
3. Geographic distribution of first loads

---

## 12. Implementation Phases

### Phase 1: Ship the Demo

**Goal:** `dendrovia-quest` live on a URL, loading fast, with proper caching.

| Step | Action | Depends On |
|------|--------|------------|
| 1.1 | Choose hosting platform (DP-2) | This document |
| 1.2 | Add `output: 'export'` to `dendrovia-quest/next.config.js` (or configure for chosen platform) | DP-1 decision |
| 1.3 | Add `headers()` or platform-equivalent cache config | 1.2 |
| 1.4 | Create deployment config (`vercel.json` / `wrangler.toml` / `Dockerfile`) | 1.1 |
| 1.5 | Add deploy step to CI pipeline | 1.4 |
| 1.6 | Configure Cloudflare DNS | 1.1 |
| 1.7 | Clean up `public/` placeholder assets | — |
| 1.8 | Create `.env.example` documenting required vars | — |
| 1.9 | Verify build pipeline produces assets before `next build` | — |
| 1.10 | Deploy and verify caching headers via browser DevTools | 1.5 |

**Estimated effort:** 1-2 sessions. Mostly configuration, not code.

### Phase 2: Content-Hash Pipeline

**Goal:** All generated assets served with `immutable` headers via content-hashed filenames.

| Step | Action | Depends On |
|------|--------|------------|
| 2.1 | Extend `ManifestGenerator` to produce hashed filenames | Phase 1 |
| 2.2 | Add build step to copy hashed assets to `public/generated/` | 2.1 |
| 2.3 | Update `AssetLoader` to resolve hashed paths from manifest | 2.2 |
| 2.4 | Add `immutable` cache headers for `/generated/*.{hash}.*` paths | 2.3 |
| 2.5 | Verify cache behavior end-to-end | 2.4 |

**Estimated effort:** 1 session.

### Phase 3: HD Pack CDN

**Goal:** Optional texture/audio assets served from R2 with zero egress cost.

| Step | Action | Depends On |
|------|--------|------------|
| 3.1 | Create Cloudflare R2 bucket | — |
| 3.2 | Write R2 Worker for asset serving with custom headers | 3.1 |
| 3.3 | Update OPERATUS `CDNLoader` to point at R2 worker URL | 3.2 |
| 3.4 | Add CORS headers for cross-origin SW fetches | 3.2 |
| 3.5 | Create upload script for HD pack assets | 3.1 |

**Estimated effort:** 1 session.

### Phase 4: Production Hardening

**Goal:** Monitoring, error tracking, performance baselines.

| Step | Action |
|------|--------|
| 4.1 | Add error monitoring (Sentry or equivalent) |
| 4.2 | Add web vitals tracking (CLS, LCP, FID) |
| 4.3 | Set up uptime monitoring |
| 4.4 | Document runbook for common operations (deploy, rollback, cache purge) |
| 4.5 | Fix `playground-ludus` `ignoreBuildErrors` |
| 4.6 | Address `playground-chronos` filesystem API route dependencies |

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Next.js overhead for a client-only app | High | Medium | Use `output: 'export'` now. Evaluate Vite migration after demo ships (DP-0). |
| Vercel hobby tier is non-commercial only | Medium | High | Upgrade to Pro ($20/mo) or migrate to Cloudflare/Hetzner before monetization |
| OpenNext doesn't support Next.js 16 `proxy.ts` | Low | Low | We don't use `proxy.ts`. No action needed. |
| OpenNext adapter lag after Next.js releases | Medium | Medium | AWS adapter typically 2-8 weeks behind. CF adapter faster. Pin Next.js version during deploy. |
| Turbopack incompatibility with 4 apps using `--webpack` | Low | Medium | Continue using `--webpack`. Monitor Turbopack compatibility. |
| Generated assets not present at deploy time | Medium | High | Ensure CI pipeline runs full `turbo build` (not just `next build`). Validate manifest exists. |
| Base tiling textures too large for critical path | Low | Medium | Keep critical tier to 2-3 base textures (<256KB). Defer rest to VISIBLE tier. |
| OPFS not available in all browsers | Low | Low | OPERATUS already falls back to IndexedDB. No action needed. |
| Service Worker + CDN cache coherence | Low | Medium | SW invalidation via manifest hash change. INVALIDATE_CACHE message already implemented. |
| Cloudflare Workers runtime incompatibility | Medium | Medium | Test with `wrangler dev` locally before committing. Minimal server-side code reduces surface. |
| Hetzner server goes down | Low | High | Coolify provides basic monitoring. Add uptime alerts. Keep deployment reproducible for quick failover. |
| Build times grow with monorepo size | Medium | Low | TurboRepo remote caching. Only rebuild changed packages. |
| Deployment Adapters RFC doesn't stabilize | Medium | Low | OpenNext continues as-is. No dependency on the RFC. |
| SDF aesthetic requires more base textures than budgeted | Low | Low | Compositing approach specifically minimizes texture count. Monitor during art development. |

---

## Appendix: Technical Reference

### A. Next.js `headers()` Configuration

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/generated/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};
```

Note: `headers()` requires a Node.js server (`output: 'standalone'` or default). For `output: 'export'`, headers must be set at the platform level.

### B. Vercel Headers Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/generated/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

### C. Cloudflare R2 Worker Pattern

```javascript
export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const cache = caches.default;

    // Check edge cache
    let response = await cache.match(request);
    if (response) return response;

    // Fetch from R2
    const object = await env.BUCKET.get(url.pathname.slice(1));
    if (!object) return new Response('Not Found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    headers.set('Access-Control-Allow-Origin', 'https://dendrovia.dev');

    response = new Response(object.body, { headers });
    context.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};
```

### D. SST v3 Configuration

```typescript
// sst.config.ts
export default $config({
  app(input) {
    return {
      name: 'dendrovia',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket('HDPack');
    const web = new sst.aws.Nextjs('Quest', {
      path: 'apps/dendrovia-quest',
      link: [bucket],
      domain: { name: 'dendrovia.dev' },
    });
    return { url: web.url };
  },
});
```

### E. Docker Standalone Build

```dockerfile
FROM oven/bun:1.3.5 AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock package.json ./
COPY packages/*/package.json ./packages/
COPY apps/dendrovia-quest/package.json ./apps/dendrovia-quest/
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build --filter=dendrovia-quest

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/dendrovia-quest/.next/standalone ./
COPY --from=builder /app/apps/dendrovia-quest/public ./public
COPY --from=builder /app/apps/dendrovia-quest/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### F. Platform Pricing Quick Reference (Feb 2026)

| Platform | Free Tier | Paid Start | Bandwidth Free | Bandwidth Overage |
|----------|-----------|------------|----------------|-------------------|
| Vercel | $0 (non-commercial) | $20/user/mo | 100GB | $0.15/GB |
| Cloudflare Pages | $0 | $5/mo (Workers) | Unlimited static | N/A (static free) |
| Cloudflare R2 | 10GB stored | $0.015/GB/mo | $0 egress always | $0 |
| Hetzner CX23 | — | $3.49/mo | 20TB | $1.19/TB |
| AWS Lambda | 1M req/mo always free | Pay per use | — | — |
| AWS CloudFront | 1TB/mo (free plan) | $15/mo flat | Included | Per plan |
| Render | $0 (cold starts) | $7/mo | 100GB | $0.10/GB |

### G. Bun Platform Support Matrix

| Platform | `bun install` | `bun` Runtime | Detection |
|----------|---------------|---------------|-----------|
| Vercel | Auto (from lockfile) | Beta (Functions) | `bun.lock` / `bun.lockb` |
| Cloudflare | Yes (`BUN_VERSION` env) | No (V8 isolates) | Manual config |
| Hetzner/Coolify | Yes (Nixpacks) | Yes (Docker) | `bun.lock` |
| AWS (SST) | Via Docker | Via Docker | Manual config |
| Render | Via Docker | Via Docker | Manual config |
| GitHub Actions | `oven-sh/setup-bun@v2` | Yes | Manual config |

---

*This document is a living reference. Update as decisions are made and recorded as ADRs.*
