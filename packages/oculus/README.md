# OCULUS - The Interface

> **Philosophy:** "World as Wallpaper, UI as Workbench - The 3D world provides Navigation and Context. The 2D UI provides Investigation and Content."

## Responsibility

OCULUS manages **all user-facing UI** (both 2D overlays and 3D billboards):

1. **HUD** - Health, mana, minimap, active quest
2. **Miller Columns** - File navigation (Finder-style)
3. **Code Reader** - Syntax-highlighted file viewer
4. **Modals** - README viewer, quest cards, item descriptions
5. **Inspector** - Variable/function details

## Core Principle: Orthogonal Text

> "The text must always be orthogonal to the camera when reading. Never force the user to read tilted text."

## Cognitive Boundaries

**Dependencies:**
- LUDUS (receives game state updates)
- ARCHITECTUS (overlays on 3D canvas)

**Consumers:**
- LUDUS (sends user actions like spell casting)

**Interface:**
- Listens to `GameEvents.HEALTH_CHANGED`, `QUEST_UPDATED`, `COMBAT_STARTED`
- Emits `GameEvents.SPELL_CAST`, `ITEM_USED`

## Steering Heuristic

> "The 3D world recedes/blurs when reading code (Depth of Field focus)."

## Key Philosophies

### 1. The Iron Man HUD

**Goal:** Peripheral vision awareness without blocking the view.

Layout:
```
┌─────────────────────────────────────────┐
│ [Health ████████  ] [Mana ██████    ]   │ ← Top: Critical stats
│                                         │
│                          [Minimap]      │ ← Top-right: Spatial context
│                                         │
│                                         │
│ [Active Quest: Hunt Bug #42]           │ ← Bottom: Current objective
│ [Controls: WASD to move, E to interact]│
└─────────────────────────────────────────┘
```

**Visual Style:**
- Transparent backgrounds (don't obscure 3D world)
- Glowing edges (Monument Valley aesthetic)
- Minimal text (icons where possible)
- Smooth fade-in/out transitions

### 2. Miller Columns for Code Navigation

**Why Miller Columns?**
- Shows **hierarchy at a glance** (directory tree)
- Allows **rapid drilling down** (Finder-style)
- Displays **multiple levels simultaneously**

Example:
```
┌─────────┬─────────┬─────────┬─────────┐
│ src/    │ utils/  │ parser/ │ ast.ts  │
│ tests/  │ types/  │ lexer/  │ ⌄       │
│ docs/   │ core/   │ ⌄       │         │
│ ⌄       │ ⌄       │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

**Interaction:**
- Click a directory → next column shows its contents
- Click a file → code viewer opens
- Keyboard navigation (arrow keys, vim bindings)

### 3. Falcon Mode UI vs Player Mode UI

#### Falcon Mode (Overview)
- **HUD:** Minimal (just controls hint)
- **Minimap:** Hidden (you ARE the minimap)
- **Overlays:** Hotspot labels, file names

#### Player Mode (Exploration)
- **HUD:** Full (health, mana, quest tracker)
- **Minimap:** Visible (local area)
- **Overlays:** Interaction prompts ("Press E to Read")

### 4. Modal System

**Philosophy:** Modals are "billboards" in 3D space.

Instead of traditional 2D overlays, modals:
- Render as **planes in 3D space**
- Float in front of the player
- Use **depth of field** to blur the background
- Can be "placed" at specific nodes (README at root)

Example:
```typescript
<BillboardModal position={[0, 2, 0]}>
  <READMEViewer content={readmeText} />
</BillboardModal>
```

## Implementation Status

- [ ] HUD component (health, mana, quest)
- [ ] Miller Column navigator
- [ ] Code reader (syntax highlighting)
- [ ] Modal system (billboards)
- [ ] Inspector panel
- [ ] Minimap
- [ ] Control hints

## UI Components

### HUD (Heads-Up Display)

```typescript
interface HUDProps {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  activeQuest?: Quest;
  mode: 'falcon' | 'player';
}

<HUD
  health={80}
  maxHealth={100}
  mana={50}
  maxMana={100}
  activeQuest={currentQuest}
  mode="player"
/>
```

### Miller Columns

```typescript
<MillerColumns
  tree={fileTree}
  onSelect={(path) => loadFile(path)}
  selectedPath="/src/utils/parser.ts"
/>
```

### Code Reader

```typescript
<CodeReader
  filePath="/src/index.ts"
  content={sourceCode}
  language="typescript"
  highlightLines={[15, 16, 17]}
  onClose={() => setReading(false)}
/>
```

## Accessibility

- **Keyboard-first:** All interactions work without mouse
- **High contrast:** Readable in bright/dark environments
- **Scalable text:** Adjustable font size
- **Screen reader:** Semantic HTML for overlays

## Performance Considerations

**Challenge:** UI updates on every frame (React re-renders)

**Solution:**
- Use Zustand for state (selective subscriptions)
- Memoize expensive components
- Lazy render off-screen panels
- Virtual scrolling for long file lists

## Visual Design System

### Colors

Pulled from IMAGINARIUM-generated palette:

```typescript
const theme = {
  primary: palette.primary,     // Interactive elements
  secondary: palette.secondary, // Backgrounds
  accent: palette.accent,       // Highlights
  glow: palette.glow,          // Hover/active states
  background: 'rgba(0,0,0,0.7)', // Semi-transparent
};
```

### Typography

```css
--font-display: 'Courier New', monospace; /* Code aesthetic */
--font-body: 'Arial', sans-serif;         /* Readability */
--font-mono: 'Fira Code', monospace;      /* Code blocks */
```

### Spacing

Monument Valley-inspired: **clean, generous whitespace**

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 48px;
```

## Future Enhancements

- [ ] Customizable HUD layouts
- [ ] Themes (light/dark mode)
- [ ] Quest journal
- [ ] Character sheet
- [ ] Keybind customization UI
