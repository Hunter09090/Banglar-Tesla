# বাংলার টেসলা | Banglar Tesla

A Bangladesh-inspired city traffic driving game. The project is being built in small, testable milestones so the core controls, gameplay rules, and save format stay stable as the game grows.

## Project principles
- **Mobile-first, desktop-friendly:** touch controls and keyboard support.
- **No framework or build step for the first playable milestone:** easy to run and publish on GitHub Pages.
- **Small modules:** input, game state, rendering, and persistence stay separate.
- **One source of truth:** balance values and save version are centralized.
- **Honest milestones:** the current build is a 2D perspective arcade prototype, not realistic 3D yet.

## Run
Open `index.html` in a modern browser, or serve the repository with GitHub Pages.

## Controls
- **A / D** or **← / →**: steer
- **W / ↑**: accelerate
- **S / ↓**: brake
- **Space**: Jet Boost (short burst; consumes charge)
- **E**: pick up / drop off a passenger when prompted
- Touch the on-screen buttons on mobile.

## Roadmap
1. **Foundation (current):** responsive canvas, reliable input, traffic, boost charge, passenger missions, local save, readable HUD.
2. **Driving feel:** handling and collision tuning, camera options, sound, pause/restart.
3. **Bangladesh details:** rickshaws, buses, pedestrians, roadworks, traffic police, weather, markets, Bangla passenger dialogue.
4. **Visual upgrade:** replace primitive drawings with licensed/original assets and move toward a proper 3D engine only after the gameplay loop is proven.
5. **Progression:** mission variety, upgrades, achievements, cloud save.
6. **Multiplayer:** only after single-player systems and server/security requirements are defined.

## Architecture
- `src/main.js`: app startup and UI wiring
- `src/game.js`: simulation, missions, collisions, rendering
- `src/input.js`: keyboard and touch input
- `src/style.css`: responsive interface

## Save data
Progress is stored locally in the browser. The save includes a version field so future updates can migrate data safely. Clearing browser storage removes local progress.

## Important
This repository is the canonical project. Changes should be small, tested, and committed with clear messages. Do not add fake multiplayer or claim 3D/cloud features until implemented and tested.
