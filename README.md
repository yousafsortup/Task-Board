# Task Board — Cross-Platform

A small task board built with **one React Native codebase** that runs on a
phone and on a desktop, and genuinely changes shape between them.

Add tasks, complete them, delete them, filter All / Active / Completed. Data
persists locally between restarts.

Walkthrough Recordings:
Part1: https://www.loom.com/share/58d2b88cf98b476ba25aac670b225eeb

Part2: https://www.loom.com/share/92478c60fb8249bc88838f4b288c6b5a

Part3: https://www.loom.com/share/3fc3feffdb0748dab38c9ff3df849002

Part4: https://www.loom.com/share/fd95fb0461fd44d8b12a0ba308809554

Part 5 (Mac OS installer): https://www.loom.com/share/f1e0681ee13141e386bec9fb57d1d073

Extra AI Integration / Auto-task creation from messages: https://www.loom.com/share/8a628b16b80f46428f5448bdd2638eb8


| | |
|---|---|
| **Framework** | React Native 0.86.2 (TypeScript) |
| **Platform targets run** | iOS · Android · desktop (Electron + react-native-web on macOS / Windows) |
| **Persistence** | AsyncStorage on iOS / Android · `localStorage` on desktop — both behind one interface |
| **Installers** | macOS `.dmg` · Windows NSIS `.exe` (both via `npm run desktop:build`) |
| **Tests** | 82 passing (`npm test`) |

---

## Why React Native (not Flutter)

This project needed one codebase that could reach **phone and desktop**, with a
layout that adapts by window size. React Native was the better fit for that
brief than Flutter, for three practical reasons:

1. **Community and hiring.** React / React Native sit on the largest frontend
   ecosystem (npm, TypeScript, Jest, a huge pool of React engineers). Flutter is
   production-ready, but the shared React skill graph is wider and maps directly
   onto web and Electron work.
2. **Same language family as desktop shelling.** This app’s desktop target is
   Electron + `react-native-web`. Staying in React means one mental model for
   components, state and tests across Metro (mobile) and Vite (desktop), instead
   of Dart on mobile and a separate web stack.
3. **Messaging products already ship this stack.** Several large communication
   apps use React or React Native in production (see below). That is evidence the
   stack scales past demos — not a claim that every chat app uses it.

### What major messaging apps actually use (React / React Native only)

Compiled from public engineering blogs and tech reporting.

| App | Where React / React Native shows up |
|---|---|
| **Discord** | **React Native** on iOS and Android; desktop is **Electron + React / TypeScript** (same web client in a shell). Discord has published repeatedly on adopting and sticking with React Native. |
| **Meta Messenger (desktop)** | Migrated **Messenger Desktop from Electron to React Native for Desktop** (Meta + Microsoft, 2023) — smaller binary, faster load, fewer crashes — while reusing most of the existing React JS. |
| **Slack** | Desktop is **Electron** with a **React + Redux** UI (not React Native on mobile; mobile stays native). |
| **Signal** | Desktop is **Electron** with a **React + Redux** UI; mobile clients are native. |

**Accuracy note on Meta / Facebook:** Meta *created* React Native and uses it
widely (including many surfaces in the main Facebook app). The well-documented
Messenger rewrite that moved *to* React Native is **Messenger Desktop**, not the
2020 mobile “LightSpeed” rewrite — that one was deliberately **native** (UIKit /
platform UI + portable C), not React Native. So “Facebook rewrote Messenger to
React Native” is only true for the desktop client, and that is how it is cited
above.

This repo follows a similar shape to Discord’s split: React Native for mobile,
Electron for an installable desktop window, with as much UI logic shared as the
tooling allows (`react-native-web` here).

---

## 1. Before you start

You need **Node 22.11.0 or newer** — React Native 0.86 will not run on older
versions. The repo ships an `.nvmrc`, so:

```bash
nvm use
```

If you don't have that version yet: `nvm install 22.11.0`.

The app lives in `frontend/`, so install its dependencies there:

```bash
cd frontend
npm install
```

> Every command in sections 2–4 and 6 runs from `frontend/`.
> Section 5 (the API) runs from `server/`.

---

## 2. Run it on the desktop  ⏱ ~30 seconds

This is the quickest way to see the app.

```bash
cd frontend && npm run desktop
```

A real Electron window opens. **Drag its edge to make it narrow** — the layout
switches from the three-pane desktop view to the phone view live, because it
reacts to window size rather than to which OS it's on.

> The window's minimum width is deliberately set to 360px so you can drag it
> all the way down to phone width.

### Want an actual installable app instead?

```bash
cd frontend && npm run desktop:build
```

Installers land in `frontend/release/`:

| Host OS | Output |
|---|---|
| macOS | `Task Board-1.0.0.dmg` |
| Windows | NSIS installer `Task Board Setup 1.0.0.exe` |
| Linux | AppImage |

Same command on each platform — electron-builder picks the target from the OS
you're building on. The Windows installer has been produced and verified.

---

## 3. Run it on iOS  ⏱ ~5–10 minutes the first time

Requires Xcode. Install the native dependencies once:

```bash
cd frontend/ios && pod install && cd ..
```

Then build and run (from `frontend/`):

```bash
npm run ios
```

That opens the iPhone simulator and installs the app.

### If it shows a red "Unable to resolve module" screen

That means something else on your machine is already using port **8081** (the
Metro bundler's default) — commonly another React Native or Expo project. Your
app connects to the wrong server. Two ways out:

**Option A — build a self-contained app (no bundler needed):**

```bash
cd frontend && npm run ios -- --mode Release
```

The JavaScript is bundled into the app, so it doesn't need Metro at all. This
is what the screenshots below were taken from.

**Option B — free port 8081** by stopping the other project, then `npm run ios`.

---

## 4. Run it on Android  ⏱ ~5–10 minutes the first time

Requires Android Studio (SDK + an emulator or a USB device), JDK, and the usual
React Native Android environment variables in your shell:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:$PATH"
```

(Adjust the paths if your SDK or JDK live elsewhere. On Windows, set the same
variables to your Android Studio / SDK install locations.)

Start an emulator from Android Studio (or plug in a device with USB debugging),
then from `frontend/`:

```bash
npm run android
```

That script runs Metro on port **8083** (`react-native run-android --port 8083`)
so it stays out of the way of other projects that still use 8081. Android has
been built, installed on an emulator, and verified end-to-end.

If `adb` or Java are "not found", your terminal hasn't picked up those exports —
`source ~/.zshrc` (or open a new terminal) and try again. `npx react-native doctor`
is useful if something still looks wrong.

### Pointing Android at the HTTP API

Two traps bite Android specifically:

1. **Metro must start with the env var.** `TASKBOARD_DATA_SOURCE` is inlined
   when Metro bundles JS. If Metro is already running from a normal
   `npm run android`, flipping the env on a second command does nothing —
   stop Metro (Ctrl+C in its terminal, or free port 8083) and start fresh.
2. **`localhost` is wrong inside the emulator.** On the AVD, `localhost` is the
   emulator, not your Mac. The app defaults to `http://10.0.2.2:4000` on Android
   (the emulator’s alias for the host). Use your Mac’s LAN IP for a USB device.

With Docker (or `npm start` in `server/`) already serving `:4000`:

```bash
# terminal 1 — Metro, with HTTP mode baked in
cd frontend
TASKBOARD_DATA_SOURCE=http npx react-native start --port 8083 --reset-cache

# terminal 2 — install / launch on the emulator
cd frontend
TASKBOARD_DATA_SOURCE=http npm run android
```

Quick check from the host that the API is up: `curl http://localhost:4000/health`.

---

## 5. The optional local API (Docker)  ⏱ ~1 minute

**You do not need this to run the app.** By default everything is stored
locally on the device, exactly as the brief allows.

This exists to show that swapping local storage for a real backend is a
one-line change, not a rewrite.

### Step 1 — start the API

Make sure Docker Desktop is running, then:

```bash
cd server && docker compose up -d --build
```

Check it's alive:

```bash
curl http://localhost:4000/health
```

You should see `{"status":"ok","tasks":0}`.

### Step 2 — point the app at it

From `frontend/`, run either target with one environment variable:

```bash
TASKBOARD_DATA_SOURCE=http npm run desktop
```

```bash
TASKBOARD_DATA_SOURCE=http npm run ios
```

```bash
# Android: Metro must start with this env (see section 4). Emulator uses 10.0.2.2 by default.
TASKBOARD_DATA_SOURCE=http npx react-native start --port 8083 --reset-cache
# then, in another terminal:
TASKBOARD_DATA_SOURCE=http npm run android
```

### Run Android + iOS + desktop against the same Docker API

One API process, three clients. They all share the same tasks.

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  iOS sim    │   │ Android AVD  │   │   Desktop    │
│ localhost   │   │  10.0.2.2   │   │  localhost   │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       └────────────┬────┴──────────────────┘
                    ▼
           http://…:4000  (Docker or npm start)
                    ▼
              /data/tasks.json
```

Use **four terminals** (from `frontend/` except the API):

```bash
# 0 — API (from server/)
cd server && docker compose up -d
# or: cd server && npm start

# 1 — Metro in HTTP mode (shared by iOS + Android)
cd frontend && npm run start:http
# first time after switching modes, prefer:
# TASKBOARD_DATA_SOURCE=http npx react-native start --port 8083 --reset-cache

# 2 — iOS
cd frontend && npm run ios:http

# 3 — Android
cd frontend && npm run android:http

# 4 — Desktop (own Vite process; does not use Metro)
cd frontend && npm run desktop:http
```

Add a task on desktop → pull-to-refresh / reopen on phone → same board. Verify with:

```bash
curl http://localhost:4000/tasks
# Docker volume:
docker exec taskboard-api cat /data/tasks.json
```

The app now reads and writes over HTTP instead of local storage. **No app code
changes** — the switch happens in `frontend/src/app/services/createServices.ts`, which
picks a different implementation of the same `TaskRepository` interface.

Here it is working. Both tasks below were created **only** through the
container (with `curl`), and local storage was cleared before the screenshot —
so everything on screen came over HTTP:

![Desktop running against the Docker API](docs/screenshots/desktop-06-http-api.png)

> Use `npm run desktop` (the dev-server flow) for API mode. The *packaged* app
> loads from a `file://` origin, and Chromium blocks cross-origin requests from
> there regardless of CORS headers — so the packaged build is local-storage
> only.

### Step 3 — stop it when you're done

```bash
cd server && docker compose down
```

### No Docker? Run it with plain Node

```bash
cd server && npm start
```

Same API, same port. Task data is written to `server/data/tasks.json`.

### What the API supports

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/tasks` | List every task |
| `POST` | `/tasks` | Create — `{ "title": "…", "note": "…" }` |
| `PATCH` | `/tasks/:id` | Update title, note, or completion |
| `DELETE` | `/tasks/:id` | Delete one |
| `DELETE` | `/tasks?filter=completed` | Delete all completed |

It's a zero-dependency Node server (`server/server.js`) — the point was to
prove the seam, not to showcase a framework.

---

## 6. Tests and checks

```bash
cd frontend
npm test          # 82 tests
npm run typecheck # TypeScript, no errors
npm run verify    # typecheck + lint + tests together
```

What's covered:

- **Filter, sort and validation rules** — pure functions, no rendering needed.
- **Repository behaviour** — persistence, concurrent writes, and recovery from
  a corrupt storage payload.
- **Optimistic updates** — a failing write rolls the UI back.
- **The add / complete / delete flow** — driven through the real UI.
- **Responsive layout** — the app is rendered at phone, tablet and desktop
  widths, asserting the layout actually changes shape at each one.

---

## 7. Screenshots

All taken from the running app: iOS from the simulator, desktop from the
Electron window.

### iOS — iPhone 17 Pro (iOS 26.1)

| List | Task detail | New task |
|---|---|---|
| ![iOS list](docs/screenshots/ios-01-list-light.png) | ![iOS detail sheet](docs/screenshots/ios-02-detail-sheet.png) | ![iOS composer](docs/screenshots/ios-03-composer-sheet.png) |

| Active filter | Dark mode |
|---|---|
| ![iOS active filter](docs/screenshots/ios-04-filter-active.png) | ![iOS dark mode](docs/screenshots/ios-05-dark.png) |

### Desktop — Electron

Three panes at full width: filter rail, task list, task detail.

![Desktop wide](docs/screenshots/desktop-01-wide-light.png)

Dark mode:

![Desktop dark](docs/screenshots/desktop-02-wide-dark.png)

**The same desktop app, resized.** At medium width the detail pane folds away
and the rail stays; at phone width it becomes the phone layout, with the
segmented filter and floating add button:

| Medium window | Narrow window |
|---|---|
| ![Desktop split](docs/screenshots/desktop-03-split-light.png) | ![Desktop narrow](docs/screenshots/desktop-04-narrow-light.png) |

Wide enough, and the list becomes a two-column grid:

![Desktop ultrawide](docs/screenshots/desktop-05-ultrawide-dark.png)

> Reproduce them yourself, from `frontend/`:
> `npm run web:build && npx electron scripts/capture-desktop.js`, and
> `node scripts/seed-ios-simulator.js` to put the same sample board on a
> booted simulator.

---

## 8. How the cross-platform part actually works

This is the part the brief cares about, so here is the short version. There's a
longer walkthrough in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### The layout responds to size, not to the operating system

There is no `if (Platform.OS === 'ios')` anywhere in the layout code. One hook,
`useResponsive`, reads the live window size and answers questions like *"is
there room for a sidebar?"*:

| Width | Layout | What you get |
|---|---|---|
| `< 700px` | Stack | One column, filter tabs, floating add button, bottom sheets |
| `700–999px` | Split | Persistent filter rail + list; detail opens as a sheet |
| `≥ 1000px` | Triptych | Rail + list + detail pane, all visible at once |
| `≥ 1360px` | + grid | List becomes two columns *if the list pane itself is wide enough* |

Because it reads live window dimensions, an iPad rotating and a desktop window
being dragged take the identical code path.

Hover states and hit targets follow the **input device**, not the platform:
44pt touch targets where there's a finger, tighter 32pt ones where there's a
mouse. The delete button hides until you hover on desktop, and is always
visible on touch, where there is no hover.

### One codebase, with the platform split pushed to the edge

The only per-platform files in the entire project are two **storage adapters**
and a keyboard-shortcut hook:

```
keyValueStore.ts       → AsyncStorage   (iOS / Android)
keyValueStore.web.ts   → localStorage   (desktop)
```

Everything above that line — the domain rules, the repository, the store, every
screen and component — is byte-identical on both targets. The bundler picks the
right file by extension; nothing in the app branches on platform.

### Swapping storage for an API is one line

The app talks to a `TaskRepository` interface. Three implementations satisfy
it: local storage, HTTP, and in-memory (used by tests). Which one gets built is
decided in a single place, `createServices.ts` — that's the whole reason
section 5 above works without touching app code.

---

## 9. Project structure

The repository holds two independent projects side by side, each with its own
`package.json` and its own lifecycle:

```
taskboard/
├── README.md            You are here.
├── docs/                Architecture notes and screenshots.
│
├── frontend/            The app — iOS, Android and desktop.
│   ├── src/             ← see below
│   ├── ios/  android/   Native projects.
│   ├── electron/        Desktop shell (main + preload process).
│   ├── scripts/         Screenshot capture and simulator seeding.
│   ├── __tests__/       Test suites.
│   └── package.json
│
└── server/              Optional Dockerised API (section 5).
    ├── server.js        Zero-dependency Node service.
    ├── Dockerfile
    └── package.json
```

They are deliberately *not* wired together with workspaces: the server shares
no code with the app, so a plain folder split gives the same separation with
none of the monorepo tooling.

Inside `frontend/src`:

```
src/
├── domain/          Business rules. Plain TypeScript — no React, no I/O.
│                    Task model, filtering, sorting, the repository interface.
├── data/            Adapters: storage drivers, mappers, the three repositories.
├── features/tasks/  The feature: store, components, and the two layouts.
├── design-system/   Theme tokens, light/dark palettes, UI primitives.
├── responsive/      Breakpoints and the hook that drives layout from size.
├── shared/          Small cross-cutting utilities.
└── app/             Composition root: wires everything together.
```

Dependencies point inwards: `features` and `data` both depend on `domain`, and
`domain` depends on nothing — not even React. That's what keeps the business
rules testable without a simulator and identical across platforms.

---

## 10. Assumptions and shortcuts

Worth being upfront about:

- **Desktop = Electron + react-native-web.** `react-native-macos` only supports
  React Native up to 0.81, and this is 0.86 — so a native macOS fork wasn't
  available. Electron gives a real, resizable desktop window and an installable
  package from the same source tree.
- **No task ordering by hand, no due dates, no categories.** The brief said
  "nothing exotic" and I took that seriously; the effort went into the layout,
  the architecture and the tests instead.
- **Editing a task** happens in the detail view (pane on desktop, sheet on
  phone) rather than inline in the list.
- **The screenshots are seeded** with a fixed sample board so the iOS and
  desktop shots show identical content and the comparison is purely about
  layout. The seeding scripts are in `frontend/scripts/`.

---

## 11. Bonuses attempted

| Bonus | Status |
|---|---|
| Dark mode | ✅ Full light/dark themes, plus an "Auto" mode that follows the OS |
| Widget tests for filter + add/complete | ✅ 82 tests, including UI tests at three window sizes |
| Offline-friendly repository layer | ✅ The `TaskRepository` port — swapping to an API is one line |
| Local API instead of local storage, Dockerised | ✅ `server/` — zero-dependency Node API, Dockerfile + compose |
| Installable desktop build | ✅ `npm run desktop:build` — macOS `.dmg` and Windows NSIS `.exe` |
| Native iOS build | ✅ Runs on the iPhone 17 Pro simulator |
| Native Android build | ✅ Runs on the Android emulator (`npm run android`, Metro on 8083) |
