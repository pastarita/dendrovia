# Proof of Concept: The Thin Vertical Slice

## Philosophy

> "Instead of building all six pillars horizontally, we drill one specific feature through the entire stack. This forces the APIs between the pillars to mature immediately."

This package demonstrates the **complete Dendrovia pipeline** for a single file:

```
CHRONOS (Parse)
    ↓
IMAGINARIUM (Distill)
    ↓
ARCHITECTUS (Render)
    ↓
LUDUS (Interact)
    ↓
OCULUS (Display)
```

## The Slice: "Visualize One File"

1. **CHRONOS**: Parse `package.json` from this repository
2. **IMAGINARIUM**: Generate a color palette from the file's language/metadata
3. **ARCHITECTUS**: Render a single SDF branch in 3D space
4. **LUDUS**: Detect when the player clicks the branch
5. **OCULUS**: Show a 2D overlay with the file's contents

## Running the Slice

```bash
bun run slice
```

This will:
- Parse the file metadata (simulated)
- Generate a procedural color palette
- Launch a Three.js scene with one raymarched SDF
- Allow clicking to view the "code" in a 2D overlay

## Success Criteria

✅ Can extract basic metadata from a file
✅ Can generate a deterministic color palette
✅ Can render a working SDF shader
✅ 60fps on desktop
✅ Click-to-read interaction works

## Lessons Learned

(This section will be updated as we build)

### Architectural Validations

- [ ] EventBus communication works between pillars
- [ ] SDF rendering is performant enough
- [ ] Color extraction from metadata is viable
- [ ] 2D overlay doesn't break 3D scene

### Failures/Pivots

(Document what doesn't work)
