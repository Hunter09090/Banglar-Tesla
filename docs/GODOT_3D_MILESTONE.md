# M1 — First 3D vertical slice

## What is included
- Godot 4 project using GDScript and the Compatibility renderer.
- Procedurally generated road, lane markers, simple city buildings, player car and traffic vehicles.
- Third-person chase-style camera.
- Keyboard steering and on-screen touch steering/boost buttons.
- Limited-charge Jet Boost, score counter and collision counter.
- No third-party assets or network dependencies.

## What is intentionally not included yet
- Final realistic vehicle/building models, animations, sound, weather, passenger missions, charging stations, save data, first-person camera, APK export, or published Godot Web build.
- Multiplayer or cloud saves.

## Verification checklist
1. Open godot/project.godot with the standard Godot 4 editor on Windows.
2. Run the project. Confirm the road, buildings, player vehicle, traffic and HUD appear.
3. Press A/D and arrow keys. Confirm the car moves left/right within the road.
4. Hold Space. Confirm boost charge falls while boost is active and slowly recharges afterward.
5. Drive into a traffic vehicle. Confirm the hit counter rises and boost charge drops.
6. Resize the game window and verify the scene remains visible.
7. Before merging more gameplay, test the exported build on a real Android device and in a Chromium-based browser.

## Known limitation
This initial slice is procedural low-poly geometry, not photorealistic art. It proves that the Godot project and driving loop can run before investing in detailed assets. Visual quality will be raised incrementally while measuring frame rate and memory on the target phone.
