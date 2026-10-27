# বাংলার টেসলা | Banglar Tesla

A Bangladesh-inspired driving game set in busy Dhaka/Chattogram-like traffic. Development is moving toward a real 3D game for **Android APK and browser**, using small, verifiable milestones.

## Current builds

- **Browser reference prototype:** open the repository's index.html or the GitHub Pages site. This is a 2D perspective/arcade prototype, not 3D.
- **Godot 3D first milestone:** source project is in [godot/](godot/). It uses generated 3D geometry so it can be tested without downloading art assets. It is an early vertical slice, not a finished realistic game and not yet an exported APK/Web build.

## Run the 3D project on Windows

1. Download the standard Godot 4 editor from the [official Godot downloads](https://godotengine.org/download/windows/). Use the standard GDScript version, not the .NET version.
2. Extract and open Godot.
3. In the Project Manager, choose **Import** and select godot/project.godot from this repository.
4. Open the project and press **F6/F5** (or click Run Project) to run the scene.

The first 3D milestone uses Godot's Compatibility renderer to keep the shared Android/browser path practical. Actual performance depends on the computer and phone, so it must be tested before adding heavy visual effects.

## 3D prototype controls

- **A / D** or **← / →**: steer
- **Space**: short Jet Boost, consuming charge
- **On-screen buttons**: steer and boost on touch devices
- Avoid traffic; collisions increase the hit counter and reduce boost charge.

## Stable architecture decisions

- Godot 4 + GDScript for the 3D game.
- Android APK and browser are target platforms.
- Web export is planned as single-threaded for simpler GitHub Pages hosting.
- Root HTML/JavaScript prototype remains a reference until the 3D version is tested.
- Start with procedural geometry; replace it only with original or properly licensed assets.
- Local save before cloud save; single-player before multiplayer.
- One focused change per commit; don't claim a feature is complete before it has been tested.

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for architecture boundaries, milestone acceptance criteria and change discipline.
