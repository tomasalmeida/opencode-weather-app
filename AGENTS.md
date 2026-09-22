# AGENTS.md

## Project shape

- Single-package Bun + TypeScript CLI. No workspaces/monorepo.
- Entrypoint: `index.ts` (set as `module` in `package.json`) — composition root only; all logic lives in `src/`:
  - `src/cli.ts` — menu loop, prompts, actions (injectable `ask`/`print`/`geocode`/`forecast` for tests)
  - `src/storage.ts` — load/save/validate JSON state; `src/config.ts` — config path
  - `src/geocoding.ts` — city name → lat/lon; `src/weather.ts` — lat/lon → °C
  - `src/temperature.ts` — conversion/formatting; `src/types.ts` — shared types
- External APIs (no auth, no API key):
  1. Geocode: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
  2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
  The forecast call requires lat/lon from step 1 — never call it with a city name.
- State persisted at `~/.weather-cli/config.json` (`USERPROFILE` checked before `HOME`):
  `{ cities, defaultCityId, unit }`. Unit is `"C"` by default; `"F"` after the user switches.
  Open-Meteo always returns Celsius — convert only for display (`°F = °C × 9/5 + 32`).
- City `id` is `"<latitude>,<longitude>"`; duplicates are detected by that id. Deleting the
  default city clears `defaultCityId` (it is not auto-reassigned). The first added city becomes default.

## Commands

```bash
bun install              # install deps (updates bun.lock)
bun start                # run the CLI (alias: bun run index.ts)
bun test                 # tests (*.test.ts next to sources; bun's builtin runner)
bun run typecheck        # bunx tsc --noEmit (noEmit only; no build step)
bun run build            # standalone binary at out/weather (out/ is gitignored)
```

There is no linter, formatter, CI, or pre-commit config in this repo — do not invent `lint` scripts.

Verification order: `bun run typecheck && bun test`, then smoke-run the CLI.

## Conventions and gotchas

- `tsconfig.json` is strict: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` are on. `noUnusedLocals`/`noUnusedParameters` are off.
- `verbatimModuleSyntax` + `moduleResolution: bundler` + `allowImportingTsExtensions`: use `import type` for type-only imports and keep `.ts` extensions in relative imports.
- Do not type mock fetchers as `typeof fetch` (Bun's type requires `preconnect`) — use `FetchLike` from `src/types.ts`.
- CLI input uses a queueing readline wrapper in `src/cli.ts` (`createStdinAsk`); plain `rl.question()` drops piped lines that arrive between prompts. Piped input works: `printf '9\n' | bun run index.ts`.
- API/fetch functions take an optional `fetchImpl` parameter — inject mocks in tests instead of network calls. Tests must not hit the network.
- ESM only (`"type": "module"`).
- `typescript` is a **peer** dependency (`^7`); `@types/bun` is the only dev dependency. `bun test` and Bun globals typecheck via `"types": ["bun"]`.
- Keep `bun.lock` in sync with any `package.json` change; commit both.
- README is in Spanish and describes intent, not implemented behavior — trust the code over the README when they diverge. User-facing CLI messages are Spanish.
- `.gitignore` covers `node_modules`, `out`, `dist`, `coverage`, `.env*`. No `.env` or env vars are required (Open-Meteo is keyless).
- Smoke tests that must not touch the real config should override `HOME` (e.g. `HOME=$(mktemp -d) bun run index.ts`).
