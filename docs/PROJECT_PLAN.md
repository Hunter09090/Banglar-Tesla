# Project decisions — Banglar Tesla

This file records decisions that should not be changed casually. If a decision needs to change, update this document in the same commit and explain why.

## Product target
A Bangladesh-inspired driving game set in busy Dhaka/Chattogram-like streets. The long-term target is visually rich, believable 3D, while remaining playable on mid-range Android devices and in modern desktop/mobile browsers. Visual realism must be balanced against stable frame rate.

## Platform and engine decisions (2026-10-27)
- **Targets:** Android APK and browser (desktop + mobile).
- **Primary 3D engine:** Godot 4, using GDScript (not C#) to keep Android and Web export paths aligned.
- **Rendering:** Compatibility renderer / WebGL 2-friendly settings as the shared baseline. Higher visual quality may be added later behind scalable settings after device tests.
- **Web:** Godot Web export is intended to be single-threaded for easier hosting on GitHub Pages. Native Android should be the better-performing build.
- **Existing browser prototype:** Keep the root-level HTML/JavaScript game as a reference and fallback until the Godot version passes its acceptance tests. The Godot source lives in godot/; do not replace the live site with an untested export.
- **Assets:** Begin with generated primitive geometry. Add original or properly licensed vehicle/building/audio assets only after controls and performance are proven.
- **Save data:** local save first, with an explicit version and migration strategy before the save format expands. Cloud save later.
- **Multiplayer:** explicitly out of scope until single-player is stable and server/security requirements are designed.

## Core gameplay decisions
- Core loop: drive through traffic → find passenger → pick up → reach destination → earn fare → repeat.
- Jet Boost: a short, limited-charge burst to help pass a front obstacle. It is not free flight.
- Controls: keyboard on desktop and touch buttons on mobile.
- Tone: playful Bangladeshi traffic, passenger dialogue, rickshaws, buses, CNG/auto-rickshaws, pedestrians, traffic police and local street details.

## Architecture boundaries
### Browser reference (src/)
- src/input.js translates keyboard/touch events into game actions.
- src/game.js owns the prototype simulation and rendering.
- src/main.js connects the game to the page UI.
- src/style.css owns layout and visual styling.
- index.html is the page shell.

### Godot 3D game (godot/)
- godot/project.godot: project-wide settings and main scene.
- godot/scenes/: scene composition only; avoid putting all game logic in scene text.
- godot/scripts/: simulation and scene-building scripts, split further when they grow.
- godot/assets/: future original/licensed models, textures, audio and fonts.
- godot/tests/: future deterministic gameplay checks and test fixtures.
- Keep input, simulation, rendering, UI and persistence separate as the game grows. The first milestone is intentionally a compact proof of the 3D loop, not the final architecture.

## Milestones and acceptance criteria
### M0 — Browser reference
- Root-level game opens without a build step.
- Responsive canvas and mobile/desktop controls exist.
- Traffic, steering, boost charge, passenger missions, score and local progress exist.
- README states limitations honestly.

### M1 — First 3D vertical slice (in progress)
- Godot project opens and runs with no external assets.
- A 3D road, city block, player vehicle, traffic, third-person camera and visible HUD render.
- Keyboard and touch steering work; boost is limited by charge.
- Traffic can be avoided; a collision has a visible gameplay effect.
- Test manually on Windows and Android before claiming it is stable.
- No claim of realistic final assets, APK, or live 3D browser export until each is actually built and tested.

### M2 — Driving feel and reliability
- Tune lane alignment, handling, collision fairness, camera, pause/restart and small-screen layout.
- Add deterministic test/debug mode.
- Confirm local progress survives reload and handles unavailable storage safely.
- Test on a real Android phone and desktop browser.

### M3 — Bangladesh flavour
- Distinct rickshaw, bus, CNG/auto-rickshaw, roadworks and pedestrian behaviours.
- Bangla passenger dialogue and fare negotiation.
- Traffic-police warning and clear, fair game-over rules.
- Charging stations before expanding boost-related systems.

### M4 — Production presentation
- Add sound, settings, original/licensed assets and first-/third-person cameras.
- Create Android export preset and a single-threaded Web export.
- Benchmark on mid-range Android and browser devices; scale draw distance, shadows, textures and traffic density accordingly.

### M5 — Progression and online
- Achievements, upgrades, richer missions and versioned local save.
- Cloud save only after authentication, data ownership and failure recovery are designed.
- Multiplayer only after authoritative server simulation, cheating prevention, privacy and hosting costs are understood.

## Change discipline
1. Make one focused change per commit.
2. Test the changed behaviour before building more on top of it.
3. Update this file when a core decision changes.
4. Do not add placeholder features that appear functional but are not.
5. Prefer stable, reusable systems over a long list of rushed features.
6. Keep the browser reference intact until the 3D build passes its acceptance checks.
