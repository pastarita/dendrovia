# PR: Add onboarding flow with welcome screen, contextual hints, and particle background

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/onboarding-flow                                       |
+--------------------------------------------------------------+
|                      MODERATE **                             |
|                                                              |
|          skip  [per-pale: OCULUS | APP]  skip                |
|                   mullet x 3                                 |
|                                                              |
|                [oculus, app]                                  |
|                                                              |
|           files: 9 | +954 / -2                               |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [oculus, app] mullet x3 skip/skip/pass/skip +954/-2

---

## Summary

New users are dropped into the 3D RPG world with zero introduction. This PR adds a complete first-run onboarding experience: a WelcomeScreen modal explaining the world, sequential contextual hints that guide exploration, localStorage persistence so onboarding is skipped on return visits, and an ambient particle canvas behind the game phase.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| `useOnboarding` hook | Three-phase state machine (welcome/exploring/complete) with localStorage persistence | Complete |
| WelcomeScreen | OrnateFrame modal with lore, feature icons, controls grid, pulse-glow enter button | Complete |
| OnboardingHints | 5 sequential contextual tooltips with auto-dismiss, activePanel-triggered sequencing | Complete |
| FalconModeOverlay wiring | Previously-built component now rendered in HUD (self-guards on cameraMode) | Complete |
| ParticleBackground | Canvas-based ambient particle system with 60 drifting particles in OCULUS palette | Complete |
| OCULUS barrel exports | WelcomeScreen, OnboardingHints, useOnboarding exported with types | Complete |
| Hook unit tests | 17 tests covering phase transitions, persistence, idempotency, corruption recovery | Complete |

## Files Changed

```
apps/dendrovia-quest/
  app/
    components/
      DendroviaQuest.tsx .......... Wire useOnboarding + render WelcomeScreen/OnboardingHints
      ParticleBackground.tsx ...... New: ambient canvas particle system (OCULUS palette)
    page.tsx ...................... Add ParticleBackground to game phase

packages/oculus/
  src/
    hooks/
      useOnboarding.ts ........... New: onboarding state hook with localStorage persistence
    components/
      WelcomeScreen.tsx .......... New: full-screen welcome modal using OrnateFrame
      OnboardingHints.tsx ........ New: sequential contextual hint tooltip system
      HUD.tsx .................... Add FalconModeOverlay render
    index.ts .................... Export new components and hook
    __tests__/
      useOnboarding.test.ts ..... New: 17 unit tests for onboarding state logic
```

## Commits

1. `f9d6c5a` feat(oculus): add useOnboarding hook with localStorage persistence
2. `7a3e75f` feat(oculus): add WelcomeScreen modal and OnboardingHints tooltip system
3. `ad08a37` feat(oculus): wire FalconModeOverlay into HUD and export onboarding API
4. `f5e0046` feat(app): integrate onboarding flow and particle background into DendroviaQuest
5. `5bb04f7` test(oculus): add useOnboarding state transition and persistence tests

## Test Plan

- [x] `bun test packages/oculus/` — 54 tests pass (37 existing + 17 new)
- [x] `bun test` — 990 tests pass across 53 files, 0 failures
- [ ] Clear localStorage (`localStorage.removeItem('dendrovia-onboarding-v1')`) and load app — WelcomeScreen appears
- [ ] Click "Enter the Forest" — welcome fades, orbit hint appears
- [ ] Wait through hint sequence — hints auto-dismiss and sequence correctly
- [ ] Reload — onboarding skipped (persisted as complete)
- [ ] Toggle to falcon camera mode — FalconModeOverlay shows stats at bottom-center
- [ ] Game phase renders ParticleBackground behind 3D scene
