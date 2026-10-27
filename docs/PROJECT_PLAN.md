# Project decisions — Banglar Tesla

This file records decisions that should not be changed casually. If a decision needs to change, update this document in the same commit and explain why.

## Product target
A Bangladesh-inspired driving game set in busy Dhaka/Chattogram-like streets. The long-term target is polished 3D, but we will not pretend the current canvas prototype is 3D.

## Decisions locked for the first playable milestone
- **Platform:** mobile browser and desktop browser first.
- **Technology:** plain HTML/CSS/JavaScript modules for the first playable loop. No framework/build tooling until it solves a real problem.
- **Perspective:** 2D perspective/arcade prototype now; evaluate a proper 3D engine after controls and mission loop are fun.
- **Core loop:** drive through traffic → find passenger → pick up → reach destination → earn fare → repeat.
- **Jet Boost:** a short, limited-charge burst to help pass a front obstacle. It is not free flight.
- **Controls:** keyboard on desktop and touch buttons on mobile.
- **Persistence:** local browser save first, versioned so the format can be migrated. Cloud saves are a later milestone.
- **Multiplayer:** explicitly out of scope until the single-player loop is stable and server/security requirements are designed.
- **Tone:** playful Bangladeshi traffic, passenger dialogue, rickshaws, buses, pedestrians, traffic police and local street details.

## Architecture boundaries
- `src/input.js` translates keyboard/touch events into game actions.
- `src/game.js` owns simulation, collision rules, missions, drawing and local save.
- `src/main.js` connects the game to the page UI.
- `src/style.css` owns layout and visual styling.
- `index.html` is the page shell.
- `CONFIG` in `src/game.js` is the current source of truth for tuning values.

Keep input, simulation and UI separate. Do not mix persistence logic into UI event handlers.

## Milestones and acceptance criteria
### M0 — Foundation (current)
- Game opens without a build step.
- Responsive canvas and mobile/desktop controls exist.
- Traffic, steering, boost charge, passenger pickup/dropoff, score and local progress exist.
- README explains current limitations honestly.

### M1 — Playability and reliability
- Test on a real Android phone and desktop browser.
- Fix lane alignment, collision fairness, marker timing, pause/restart and small-screen layout.
- Add deterministic testing/debug mode before adding lots of content.
- Confirm local progress survives reload and handles unavailable local storage safely.

### M2 — Bangladesh flavour
- Add distinct, readable rickshaw, bus, CNG/auto-rickshaw, roadworks and pedestrian behaviours.
- Add Bangla passenger dialogue and fare negotiation.
- Add traffic-police warning and clear, fair game-over rules.
- Add charging stations before expanding boost-related systems.

### M3 — Presentation
- Add sound effects and settings.
- Add first-person and third-person camera only when the chosen rendering technology supports them properly.
- Use original or properly licensed assets.

### M4 — Engine decision / 3D
Before switching engines, compare options against Android performance, browser support, asset pipeline, touch controls, project complexity and deployment. Keep this playable version as the reference for the core loop.

### M5 — Progression and online
- Achievements, upgrades and richer missions.
- Cloud save only after authentication, data ownership and failure recovery are designed.
- Multiplayer only after authoritative server simulation, cheating prevention, privacy and hosting costs are understood.

## Change discipline
1. Make one focused change per commit.
2. Test the changed behaviour before building more on top of it.
3. Update this file when a core decision changes.
4. Do not add placeholder features that appear functional but are not.
5. Prefer stable, reusable systems over a long list of rushed features.
