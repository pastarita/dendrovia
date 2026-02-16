# Turbo Dev Orchestration — Design Document

> Smart launcher system for Dendrovia's playground dev servers and pillar workspaces.

---

## Two Systems, Two Axes

Dendrovia has **two orthogonal dev orchestration concerns**:

### Axis 1: Pillar Checkouts (existing `launch` system)
Opens iTerm2/Ghostty windows for the 6 pillar checkouts at `/denroot/{PILLAR}/dendrovia/`. Each window is a full monorepo clone with pillar-specific `CLAUDE.md` context. This system is about **cognitive workspace layout** — giving each pillar its own terminal environment.

**Commands:** `bun run launch`, `bun run launch:dev`, `bun run launch --ghostty`

### Axis 2: Playground Dev Servers (new `td` system)
Runs `turbo dev` inside the ARCHITECTUS monorepo to start Next.js playground apps on ports 3010-3016 (Quest at 3010, playgrounds at 3011-3016). This system is about **process orchestration** — spinning up dev servers and managing their lifecycle.

**Commands:** `bun run td`, `bun run td:play`, `bun run td:architectus`, etc.

### The Convergence (future smart launcher)
The smart launcher bridges both axes: it opens the terminal windows (Axis 1) AND starts the dev servers (Axis 2), with intelligence about what's already running, port conflicts, and window reuse.

---

## Layer 1: `td` Aliases (Implemented)

Thin aliases over `turbo dev` (TurboRepo 2.7+ first-class dev command).

### Why `turbo dev` instead of `turbo run dev`

| Feature | `turbo run dev` | `turbo dev` |
|---------|----------------|-------------|
| Caching | Skipped (persistent) | Skipped by design |
| Optimized for | Build pipelines | Watch/dev workflows |
| First-class | No (generic task) | Yes (dedicated command) |
| TUI | Standard | Dev-optimized |

### Script Registry

```
td                 turbo dev                                    All (apps + packages)
td:play            turbo dev --filter='./apps/playground-*'     6 playgrounds only
td:apps            turbo dev --filter='./apps/*'                All 7 apps (playgrounds + quest)
td:quest           turbo dev --filter=dendrovia-quest           Just :3000
td:architectus     turbo dev --filter=@dendrovia/playground-*   Individual pillar
td:chronos         ...
td:imaginarium     ...
td:ludus           ...
td:oculus          ...
td:operatus        ...
```

### Port Map

| App | Port | Package | Filter |
|-----|------|---------|--------|
| dendrovia-quest | 3000 | `dendrovia-quest` | `--filter=dendrovia-quest` |
| Quest (Hub) | 3010 | `dendrovia-quest` | `--filter=dendrovia-quest` |
| ARCHITECTUS | 3011 | `@dendrovia/playground-architectus` | `--filter=@dendrovia/playground-architectus` |
| CHRONOS | 3012 | `@dendrovia/playground-chronos` | `--filter=@dendrovia/playground-chronos` |
| IMAGINARIUM | 3013 | `@dendrovia/playground-imaginarium` | `--filter=@dendrovia/playground-imaginarium` |
| LUDUS | 3014 | `@dendrovia/playground-ludus` | `--filter=@dendrovia/playground-ludus` |
| OCULUS | 3015 | `@dendrovia/playground-oculus` | `--filter=@dendrovia/playground-oculus` |
| OPERATUS | 3016 | `@dendrovia/playground-operatus` | `--filter=@dendrovia/playground-operatus` |

---

## Layer 2: Smart Launcher (Future)

A TypeScript orchestration script that wraps Layer 1 with intelligence.

### Design Principles

1. **Idempotent** — Running the launcher twice should not duplicate anything
2. **Additive** — Can spin up new servers without disturbing running ones
3. **Discoverable** — Always knows what's running and where
4. **Terminal-aware** — Finds and reuses existing iTerm/Ghostty windows/tabs
5. **Composable** — Works as both CLI and programmatic API

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Smart Launcher CLI                   │
│   bun run td:smart [--pillars] [--open-browser]  │
├─────────────────────────────────────────────────┤
│                 Orchestrator                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │   Port    │ │  Window   │ │   Process     │  │
│  │  Scanner  │ │  Finder   │ │   Manager     │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
├─────────────────────────────────────────────────┤
│              Layer 1 (td aliases)                 │
│            turbo dev --filter=...                 │
└─────────────────────────────────────────────────┘
```

---

### Component 1: Port Scanner

Detects what's already running before spinning up new processes.

```typescript
interface PortStatus {
  port: number;
  occupied: boolean;
  pid?: number;
  command?: string;        // e.g., "next dev --port 3011"
  pillar?: string;         // resolved from port map
  healthy?: boolean;       // HTTP health check passed
  stale?: boolean;         // process exists but not responding
}
```

**Implementation ideas:**
- `lsof -i :PORT -t` to check port occupancy (macOS)
- `Bun.fetch(`http://localhost:${port}`)` with short timeout for health check
- Parse `ps` output to match PIDs to known turbo/next processes
- Detect "stale" processes: port occupied but HTTP unresponsive for >5s

**Pre-flight report:**
```
Port Scan:
  :3010  ● quest         (pid 12345, healthy)
  :3011  ○ architectus   (available)
  :3012  ○ chronos       (available)
  :3013  ● imaginarium   (pid 12348, healthy)
  :3014  ○ ludus         (available)
  :3015  ○ oculus        (available)
  :3016  ○ operatus      (available)

Action: Start architectus, chronos, ludus, oculus, operatus
Skip: quest (already running), imaginarium (already running)
```

---

### Component 2: Window Finder

Discovers existing iTerm2/Ghostty windows and tabs that are relevant.

**iTerm2 approach:**
- Use iTerm2's Python API or AppleScript to enumerate windows/tabs
- Match by window title (set to pillar name + port by the launcher)
- Match by working directory (`/Users/Patmac/denroot/ARCHITECTUS/dendrovia`)
- Match by running command (contains `next dev --port`)

**Ghostty approach:**
- Ghostty windows identified by title set during launch
- AppleScript window enumeration via System Events

```typescript
interface TerminalWindow {
  terminal: "iterm" | "ghostty";
  windowId: string;
  tabId?: string;
  title: string;
  cwd?: string;
  runningCommand?: string;
  pillar?: string;          // resolved from title/cwd/command
  focused: boolean;
}
```

**Behaviors:**
- If a window exists for a pillar, **focus it** rather than opening a new one
- If a tab exists but the process died, **reuse the tab** and restart
- If no window exists, **create one** with the correct title and layout

---

### Component 3: Process Manager

Lifecycle management for turbo dev processes.

**Start strategies:**
1. **Turbo-managed** (default): Run `turbo dev --filter=...` and let TurboRepo manage the process tree. TurboRepo's TUI shows all tasks.
2. **Direct**: Run `next dev --port XXXX` directly in the target app directory. More control, but loses TurboRepo's dependency awareness.
3. **Hybrid**: Use turbo for the initial start, but track individual PIDs for health monitoring.

**Stop strategies:**
- `kill` the turbo process (cascades to children)
- `lsof -ti :PORT | xargs kill` to kill by port
- Graceful shutdown: send SIGTERM, wait 5s, SIGKILL

**Restart logic:**
```
if port occupied AND healthy → skip (already running)
if port occupied AND stale → kill stale process, restart
if port free → start fresh
```

---

### Component 4: Browser Integration

Auto-open browser tabs for running playgrounds.

```typescript
interface BrowserConfig {
  autoOpen: boolean;
  browser: "default" | "chrome" | "firefox" | "safari";
  tabGroupName?: string;    // Chrome tab groups
  delay: number;            // ms to wait after server start before opening
}
```

**Implementation:**
- `open http://localhost:3011` (macOS default browser)
- `open -a "Google Chrome" --args --new-tab http://localhost:3011` (Chrome-specific)
- Only open tabs for *newly started* servers, not already-running ones
- Optional: Create Chrome tab group named "Dendrovia Playgrounds"

---

### Component 5: Status Dashboard

A persistent view of what's running.

**CLI mode** (`bun run td:status`):
```
Dendrovia Dev Status
─────────────────────────────────────

  🌳 QUEST        :3010  ● running  (pid 12344, 2m uptime)
  🏛️ ARCHITECTUS  :3011  ● running  (pid 12345, 2m uptime)
  📜 CHRONOS      :3012  ● running  (pid 12346, 2m uptime)
  🎨 IMAGINARIUM  :3013  ● running  (pid 12347, 2m uptime)
  🎮 LUDUS        :3014  ○ stopped
  👁️ OCULUS       :3015  ○ stopped
  💾 OPERATUS     :3016  ○ stopped
  🌳 QUEST        :3010  ● running  (pid 12340, 15m uptime)

  Running: 4/7  │  Ports: 3010-3013 active
```

**Watch mode** (`bun run td:status --watch`):
- Polls every 2s, refreshes the display
- Color-coded: green = healthy, yellow = starting, red = crashed
- Shows log tail from turbo's output

---

### Unified CLI Design

```
bun run td:smart [options]

Options:
  --pillars, -p <names>    Which playgrounds to start (default: all 6)
  --quest                  Also start quest (:3010)
  --open-browser, -b       Open browser tabs for started servers
  --status                 Show current status and exit
  --watch                  Watch mode (continuous status)
  --kill                   Kill all running playground processes
  --kill-port <port>       Kill process on specific port
  --restart <pillar>       Restart a specific pillar
  --dry-run                Show what would happen
  --no-preflight           Skip port scan (just run turbo dev)
```

**Example workflows:**

```bash
# Morning startup: start everything, open browser
bun run td:smart --open-browser

# Already have some running, add LUDUS
bun run td:smart --pillars LUDUS

# Check what's running
bun run td:smart --status

# Something crashed, restart it
bun run td:smart --restart chronos

# End of day: kill everything
bun run td:smart --kill
```

---

## Integration with Existing Launch System

The existing `bun run launch` system and the new `td` system serve different purposes but should eventually interoperate.

### Current State

```
launch          Opens 6 iTerm windows (pillar checkouts)
launch:dev      Opens 6 iTerm windows + runs dev servers in each checkout
td              Runs turbo dev in ARCHITECTUS monorepo (playground servers)
```

### Future Convergence

The `launch:dev` command currently runs `bun run dev` in each separate checkout. But the playground apps live in the ARCHITECTUS monorepo. A converged launcher would:

1. Open iTerm windows for each pillar (existing behavior)
2. In the ARCHITECTUS window, run `td:play` to start all playground servers
3. In other pillar windows, their bottom-left pane could show the playground port for that pillar
4. The port scanner verifies all servers are healthy across windows

### Pillar Registry Extension

The `pillar-registry.ts` should be extended to include playground ports:

```typescript
export interface Pillar {
  // ... existing fields
  playgroundPort?: number;      // 3010-3016
  playgroundPackage?: string;   // @dendrovia/playground-architectus
}
```

This creates a single source of truth for both the window launcher and the dev server orchestrator.

---

## TurboRepo Learning Opportunities

This orchestration work is explicitly a learning exercise. Key TurboRepo concepts to explore through building this:

### Already Using
- [x] `turbo dev` — first-class dev command
- [x] `--filter` — workspace-aware filtering by path and package name
- [x] `tasks` config (migrated from `pipeline`)
- [x] `persistent: true` for dev tasks
- [x] `globalEnv` for shared environment variables

### To Explore
- [ ] **`turbo dev` TUI** — How does the dev-mode terminal UI differ from `turbo run`?
- [ ] **`--env-mode`** — strict vs loose environment variable handling
- [ ] **`--output-logs`** — controlling which task logs appear in TUI
- [ ] **`--concurrency`** — limiting parallel tasks (useful for resource-constrained machines)
- [ ] **`dependsOn` for dev** — do dev tasks need dependency ordering? (probably not for playground apps, but yes for packages)
- [ ] **`turbo watch`** — continuous mode that re-runs tasks on file changes
- [ ] **Remote caching** — not relevant for `dev` but worth understanding for `build`
- [ ] **`--graph`** — visualize the task dependency graph
- [ ] **`turbo ls`** — list workspace packages (TurboRepo 2.7+)
- [ ] **`turbo query`** — query the workspace graph
- [ ] **Scoped tasks** — `package#task` syntax for targeting specific package tasks
- [ ] **`inputs`/`outputs`** — fine-grained cache invalidation
- [ ] **`turbo.json` extends** — per-package turbo configuration overrides

### Experiments to Try
1. Run `turbo dev --graph` and inspect the task graph visualization
2. Try `turbo dev --concurrency=3` to see how it throttles playground starts
3. Use `turbo ls` to verify all workspace packages are detected
4. Test `--filter` with different syntaxes: `--filter=@dendrovia/*`, `--filter=...@dendrovia/shared` (dependents of shared)
5. Run `turbo dev --dry-run` to see what turbo *would* execute without running it

---

## Implementation Roadmap

### Phase A: Layer 1 (Done)
- [x] `td` script aliases in root package.json
- [x] `turbo dev` as the base command
- [x] Per-pillar filter scripts

### Phase B: Port Scanner
- [ ] `scripts/td-orchestrator/port-scanner.ts`
- [ ] `bun run td:status` command
- [ ] Pre-flight check before `turbo dev`

### Phase C: Process Manager
- [ ] PID tracking (write to `.turbo/td-pids.json`)
- [ ] `bun run td:smart --kill` and `--restart`
- [ ] Stale process detection and cleanup

### Phase D: Window Integration
- [ ] iTerm2 window/tab discovery
- [ ] Ghostty window discovery
- [ ] Window reuse logic
- [ ] Title-based matching

### Phase E: Browser Integration
- [ ] Auto-open browser tabs for newly started servers
- [ ] Chrome tab group support
- [ ] Configurable browser preference

### Phase F: Convergence
- [ ] Extend `pillar-registry.ts` with playground ports
- [ ] Unified `launch:full` that opens windows + starts servers
- [ ] Status dashboard that shows both windows and servers

---

## File Structure (Future)

```
scripts/
├── launch-workspace.ts              # Existing window launcher
├── workspace-launcher/              # Existing launcher infrastructure
│   ├── pillar-registry.ts           # Extended with playground ports
│   └── ...
└── td-orchestrator/                 # New smart launcher
    ├── index.ts                     # CLI entry point
    ├── port-scanner.ts              # Port occupancy detection
    ├── process-manager.ts           # Start/stop/restart logic
    ├── window-finder.ts             # Terminal window discovery
    ├── browser-opener.ts            # Auto-open browser tabs
    ├── status-display.ts            # CLI status dashboard
    ├── config.ts                    # Port map, pillar metadata
    └── types.ts                     # Shared types
```

---

_Version: 0.1.0_
_Created: 2026-02-13_
_Status: Layer 1 implemented, Layer 2 design phase_
