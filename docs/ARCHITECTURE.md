# WuwaCalculator Architecture

This project is organized into explicit app layers to keep route wiring, feature logic, and shared UI separated.

## Layers

- `src/application`
  - App bootstrap and app-wide wiring.
  - Entry point, root providers, shell, and route table composition.
- `src/routes`
  - Route-level components only.
  - Grouped by domain (`calculator`, `content`, `legal`, `settings`, `auth`, `system`).
- `src/features`
  - Feature modules and reusable domain UI/logic.
  - Calculator, optimizer, echoes, settings, suggestions, rotations, etc.
- `src/shared`
  - Cross-route utilities and primitives.
  - Shared UI (`shared/ui`), styles (`shared/styles`), hooks, constants, state, and helpers.
- `src/data`
  - Static game data, generated maps, and ingest scripts.
- `src/assets`
  - Visual assets (icons, attribute images, media).

## Alias Conventions

Use these aliases for new code:

- `@app/*` -> `src/application/*`
- `@routes/*` -> `src/routes/*`
- `@features/*` -> `src/features/*`
- `@shared/*` -> `src/shared/*`
- `@/*` -> `src/*` (general fallback)