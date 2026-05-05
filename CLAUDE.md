# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# One-shot: open iTerm2 window with 3 tabs (service / web / app)
pnpm dev

# Manual (3 terminals)
pnpm dev:service    # FastAPI backend, uvicorn reload, port 8000
pnpm dev:web        # Vite dev server, --host --port 5174 --mode dev
pnpm dev:ios        # Expo run:ios --device (development build, NOT Expo Go)

# Sync LAN IP for physical iPhone debugging
pnpm sync:lan-env
```

### Build

```bash
# Web production build
pnpm --filter web build     # vue-tsc -b && vite build

# iOS development build (installs to connected device)
cd app/ios && xcodebuild -workspace Tempo.xcworkspace -scheme Tempo -configuration Debug -allowProvisioningUpdates build
```

### Test

```bash
# App (jest-expo)
cd app && pnpm test                    # all tests
cd app && pnpm exec jest __tests__/scheduleStorage.test.ts   # single file

# Service (pytest)
cd service && uv run pytest            # all tests
cd service && uv run pytest tests/test_parse.py -v   # single file
```

## Architecture

### Monorepo Layout

Three independent subprojects under one repo:

- **`app/`** — Expo React Native client (the "shell"). Contains native modules (`@react-native-voice/voice`, `react-native-webview`, etc.) that **cannot run in Expo Go**. Must be built as a development build (`expo run:ios --device`).
- **`web/`** — Vue 3 + Vite frontend. Built as static files, loaded inside the RN shell via `react-native-webview`.
- **`service/`** — FastAPI backend. Currently mock parsing; designed to be replaced with real LLM calls later.

### App Architecture (`app/`)

The RN shell follows a **two-layer architecture** (`core + modules`):

- **`core/`** — Shared infrastructure. Contains navigation, theme, UI primitives, API client config, i18n, and session management. **Must not import from `modules/`**.
- **`modules/`** — Feature modules organized by business domain. Each module follows a standard internal structure:
  ```
  modules/<module>/
  ├── screens/         ← Page-level components
  ├── components/      ← Shared UI components within the module
  ├── hooks/           ← Custom hooks (optional)
  ├── navigation/      ← Sub-navigators (optional)
  └── repo/            ← Data layer: storage, repository, types (optional)
  ```
  Create subdirectories only when they contain code. Empty directories are not allowed.

### Hybrid Shell + WebView

The mobile app is **not** a pure RN app nor a pure web app. The RN shell (`app/`) provides:
- Main stack navigation (`MainStackNavigator`)
- Native modules (voice recognition, AsyncStorage, safe area)
- A `WebView` that loads the Vue frontend

The Vue frontend (`web/`) is developed independently and served by Vite in dev mode. The RN shell injects config via `injectedJavaScriptBeforeContentLoaded`:

```js
window.__TEMPO_CONFIG__ = { apiBaseUrl: "..." };
```

See `app/core/config/tempoWebConfig.ts` for URL resolution logic.

### Local-First Data

No backend database yet. All schedule data lives in device storage:
- **App**: `AsyncStorage` key `tempo.schedule`
- **Web**: `localStorage`
- **Cold start behavior**: App overwrites storage with `DEFAULT_SCHEDULE_ITEMS` seed on first load after kill. See `docs/app-schedule-local-storage.md`.

### Time Handling

**Unix millisecond timestamps are the single source of truth** for all persisted datetime. UI formatting happens at render time. See `.cursor/rules/datetime-ms-source-of-truth.mdc`.

Schedule card time ranges:
- Same day: `YYYY/M/D HH:mm - HH:mm`
- Cross day: `YYYY/M/D HH:mm - YYYY/M/D HH:mm`
- No weekday abbreviation

### i18n

- **App**: `i18next` + `react-i18next`, with `expo-localization` for system locale. Namespaces: `ai`, `common`, `schedule`.
- **Web**: Same i18n keys; currently simpler setup.
- App display name switches by system language (`Tempo` / `轻程`) via `app/languages/` and `CFBundleAllowMixedLocalizations`.

### Navigation & Deep Linking

- **App**: React Navigation v7. Deep link prefixes: `tempo://` and `https://tempo.app`. Route definition in `app/core/navigation/`.
- Main stack path: `/app/schedule`, notifications: `/app/schedule/notifications`.

### Environment & LAN Debugging

Physical iPhone development requires the phone and Mac to be on the same WiFi:
1. `pnpm sync:lan-env` writes LAN IP to `web/.env.dev` and `app/.env.dev`
2. Web Vite reads `web/.env.dev` via `--mode dev`
3. App reads `app/.env.dev` via `app.config.ts`
4. After env changes: `cd app && pnpm exec expo start --clear`

## Code Conventions

### TSDoc / JSDoc

- Exported functions, classes, types: one-line summary. Add `@param` / `@returns` when non-obvious.
- Format/parse/normalize functions **must include `@example`** with fenced code block showing real input/output.
- Internal functions: at minimum one-line summary.

### Figma → Code

- RN shell (`app/`) and WebView page (`web/`) are separate targets. Do not mix RN-only APIs into Web code or Vite globals into RN.
- Web colors reference `web/src/style.css` `:root` CSS variables. Do not add arbitrary hardcoded colors.
- RN uses `StyleSheet.create`, bottom-of-file placement.

### README Sync

When `app/`, `web/`, or `service/` directory structure changes (add/remove/move directories or key files), update that subproject's `README.md` directory tree and file summaries in the same commit.
