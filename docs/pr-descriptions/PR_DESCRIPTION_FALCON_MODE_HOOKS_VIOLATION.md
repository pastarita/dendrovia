# PR Description — Falcon Mode Hooks Violation

```
+--------------------------------------------------------------+
|   fix/falcon-mode-hooks-violation                            |
+--------------------------------------------------------------+
|                      TRIVIAL +                               |
|                                                              |
|            skip  [Vert]  skip                                |
|                    cross x 1                                 |
|                                                              |
|                    [oculus]                                   |
|                  plain division                              |
|                                                              |
|            files: 1 | +2 / -3                                |
+--------------------------------------------------------------+
|   "The path made clear"                                      |
+--------------------------------------------------------------+

Compact: + [oculus] cross x1 skip/skip/skip/skip +2/-3
```

## Summary

Fixes React error #300 ("Rendered fewer hooks than expected") triggered when toggling falcon mode in OCULUS. A conditional early return was placed before `useMemo`, violating React's Rules of Hooks.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Hooks order compliance | Move early return after `useMemo` so hook count is stable across renders | Complete |

## Files Changed

```
packages/
  oculus/
    src/components/FalconModeOverlay.tsx — Move cameraMode guard after useMemo hook call
```

## Commits

1. `1e5cec4` fix(oculus): move early return after useMemo to comply with Rules of Hooks

## Test Plan

- [x] 1004 tests pass (2 pre-existing failures in imaginarium placement, unrelated)
- [ ] Toggle falcon mode on/off in production app — no React error #300
- [ ] Verify falcon overlay renders stats when in falcon mode
- [ ] Verify overlay does not render when not in falcon mode
