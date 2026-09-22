# AGENTS.md

## Project shape

- Single-package Bun + TypeScript CLI. No workspaces/monorepo.
- Entrypoint: `index.ts` (set as `module` in `package.json`). Currently a stub (`console.log("Hello via Bun!")`).
- Goal (from `README.md`): interactive weather CLI that prompts for a city and ends as a shippable executable. Features: default city, multiple saved cities, search/add, delete, set default, °C settings.
- External APIs (no auth, no API key):
  1. Geocode: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
  2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
  The forecast call requires lat/lon from step 1 — never call it with a city name.

## Commands

```bash
bun install          # install deps (updates bun.lock)
bun run index.ts     # run the CLI
bunx tsc --noEmit    # typecheck (noEmit only; no build step)
bun test             # tests (none exist yet; use *.test.ts)
bun build index.ts --compile   # produce a standalone binary (future goal)
```

There are no `scripts` in `package.json` — do not invent `npm run lint` / `npm test`. There is no linter, formatter, CI, or pre-commit config in this repo.

## Conventions and gotchas

- `tsconfig.json` is strict: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` are on. `noUnusedLocals`/`noUnusedParameters` are off.
- `verbatimModuleSyntax` + `moduleResolution: bundler` + `allowImportingTsExtensions`: use `import type` for type-only imports and keep `.ts` extensions in relative imports.
- ESM only (`"type": "module"`).
- `typescript` is a **peer** dependency (`^7`); `@types/bun` is the only dev dependency. `bun test` and Bun globals typecheck via `"types": ["bun"]`.
- Keep `bun.lock` in sync with any `package.json` change; commit both.
- README is in Spanish and describes intent, not implemented behavior — trust the code over the README when they diverge.
- `.gitignore` covers `node_modules`, `out`, `dist`, `coverage`, `.env*`. No `.env` or env vars are required (Open-Meteo is keyless).
