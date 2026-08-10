# Architecture

The brief asks one question: can a single codebase genuinely work on a phone
*and* a desktop — layout, interaction and data handling actually adapting,
rather than a phone screen stretched wide.

This repository answers that with **two independent projects** side by side.
They share a contract (the task HTTP API), not code:

```
taskboard/
├── frontend/   The app — iOS, Android, and desktop (Electron)
└── server/     Optional zero-dependency Node API
```

Each has its own `package.json` and lifecycle. The rest of this document
explains them separately, then how they connect.

---

# Part A — Frontend

The app lives in `frontend/`. One React Native TypeScript tree targets iOS,
Android, and desktop (Electron + `react-native-web`). Native shells and
bundlers sit at the project root; shared product code sits in `src/`.

## A1. Top-level shape

```
frontend/
├── src/             Shared application code (all platforms)
├── ios/             Native iOS host (Xcode, Pods)
├── android/         Native Android host (Gradle)
├── electron/        Desktop shell only (main + preload)
├── index.js         Metro / native entry
├── index.web.tsx    Vite / web entry
├── index.html       DOM shell for web / Electron
├── vite.config.ts   Desktop bundler
├── metro.config.js  Mobile bundler
├── __tests__/       Jest suites
└── scripts/         Screenshot capture and simulator seeding
```

Inside `src/`:

```
src/
├── domain/          Business rules. Plain TypeScript. No React, no I/O.
├── data/            Adapters that satisfy the domain's interfaces.
├── features/tasks/  The feature: state, components, layouts.
├── design-system/   Tokens, themes, UI primitives.
├── responsive/      Breakpoints and the hook that drives layout from size.
├── shared/          Cross-cutting utilities.
└── app/             Composition root — wires the graph together.
```

Dependencies point **inwards**:

```
        ┌──────────┐
        │   app    │   composition root — knows every concrete class
        └────┬─────┘
             │ builds
   ┌─────────┴──────────┐
   ▼                    ▼
┌────────┐         ┌────────┐
│features│────────▶│ domain │◀────────┐
└────────┘  uses   └────────┘  impl.  │
     │                                │
     │ renders                   ┌────┴───┐
     ▼                           │  data  │
┌──────────────┐                 └────────┘
│design-system │
│ responsive   │
└──────────────┘
```

`domain` depends on nothing. The rules that decide what a task *is*, what
"active" means and how the list is ordered are ordinary functions over plain
data. They run identically on iOS, Android, the desktop, and in Jest —
because they have no idea any of those exist.

---

## A2. How the layout adapts

### It responds to size, never to the operating system

There is no `Platform.OS` check anywhere in the layout code. One hook reads the
live window size and answers questions phrased in terms of *room*:

```ts
const { layoutMode, hasSidebar, hasDetailPane } = useResponsive();
```

`useResponsive` is built on `useWindowDimensions`, which updates on device
rotation *and* on desktop window resize. So dragging a desktop window narrow
and rotating an iPad travel the exact same code path.

| Width | Mode | What appears |
|---|---|---|
| `< 700` | `stack` | One column · filter tabs · floating add button · bottom sheets |
| `700–999` | `split` | Filter rail + list; detail opens as a sheet |
| `≥ 1000` | `triptych` | Rail + list + detail pane, all at once |

The breakpoints are named for what they *enable*, not for devices:
`medium` means "there is room for a navigation rail beside the list". A large
iPad in landscape gets the desktop layout; a narrow desktop window gets the
phone layout. That is the intended behaviour, not a side effect.

### The two layouts share one view-model

```
                  useTaskBoard()          ← all behaviour lives here
                   ╱          ╲
          StackLayout          PaneLayout  ← arrangement only
```

`useTaskBoard` exposes the visible tasks, the counts, and every action. Both
layouts consume it and differ *only* in arrangement. There is no branch inside
either one that changes what an action does — which is precisely why there is
no per-platform fork of the business logic.

The same components are reused across both. `TaskDetailPanel` is the third
pane on a wide window and the contents of a bottom sheet on a phone; identical
component, identical behaviour, different container.

### Container queries, not just window queries

The list becomes a two-column grid when it is wide enough — but it measures
**its own width**, not the window's:

```ts
const numColumns = availableWidth >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
```

This matters. A 1440px window with a sidebar (264px) and a detail pane (380px)
leaves the list about 800px — one column's worth of space. Keying the grid off
the window would produce two cramped columns at exactly the size a reviewer is
most likely to open. Measuring the container is the correct question to ask.

### Interaction follows the input device

Hover and hit targets follow the **pointer**, not the platform badge:

- Touch: 44pt targets; the delete control is always visible, because there is
  no hover to reveal it.
- Fine pointer: 32pt targets; delete stays hidden until the row is hovered,
  which keeps a long list calm.
- Hardware keyboard: ⌘/Ctrl+N focuses the composer, Escape closes.

React Native routes `onHoverIn`/`onHoverOut` from real pointer devices and
simply never fires them on touch, so this needs no platform check either.

---

## A3. How the platform split is contained

The **entire** per-platform surface of the app is a handful of edge files:

```
data/storage/keyValueStore.ts        → AsyncStorage      (iOS / Android)
data/storage/keyValueStore.web.ts    → localStorage      (desktop)
shared/hooks/useKeyboardShortcut.ts  → no-op on native
shared/hooks/useKeyboardShortcut.web.ts → real bindings on desktop
```

Both storage files are *driven adapters* — the outermost edge, where bytes
leave the application. Everything above that line is byte-identical on every
target.

The bundler picks the right file by extension (Metro for native, Vite
configured to prefer `.web.*` on desktop). No code branches; the module graph
differs, the application does not.

Entry points differ by one line:

```js
// index.js  (iOS / Android)          // index.web.tsx  (desktop)
AppRegistry.registerComponent(…)      AppRegistry.registerComponent(…)
                                      AppRegistry.runApplication(…, { rootTag })
```

A native host starts the surface itself; a browser has to be handed a DOM node.

### How each target boots

| Target | Bundler | Entry | Host |
|---|---|---|---|
| iOS / Android | Metro | `index.js` | Native project under `ios/` / `android/` |
| Desktop (dev) | Vite + Electron | `index.html` → `index.web.tsx` | `electron/main.js` loads the Vite URL |
| Desktop (packaged) | Vite build → `dist/` | same web entry | Electron loads `dist/index.html` |

`electron/` owns only the window. No product logic lives in the main process;
preload exposes a minimal bridge. `npm run desktop:build` produces a macOS
`.dmg` or a Windows NSIS `.exe` depending on the host OS.

Android Metro is started on port **8083** (`npm run android`) so it stays clear
of other React Native projects still using 8081.

---

## A4. Data flow inside the app

```
  Component
      │  calls an action
      ▼
  useTaskBoard  ──────────▶  taskStore (zustand)
                                  │  optimistic update, then persist
                                  ▼
                           TaskRepository  ← an interface, not a class
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
   LocalTaskRepository    HttpTaskRepository   InMemoryTaskRepository
     (KeyValueStore)         (fetch → API)          (tests)
```

`createServices.ts` is the only file that names concrete implementations. It
reads `appConfig` and builds either a local or HTTP repository, plus a
preferences store on the same key/value adapter.

### Why the store is a factory, not a singleton

```ts
const store = createTaskStore({ repository });
```

Because it is built rather than imported, a test, a preview, or a second window
can each mount the real UI over a different data source. This is what makes the
integration tests possible: they render the actual application over an
in-memory repository, with no global state to reset between cases.

### Why mutations are optimistic

Toggling a task updates the UI first and persists afterwards; a failed write
restores the previous snapshot and surfaces the error. Local storage rarely
fails, so this looks like over-engineering — until you switch the repository to
HTTP, at which point it is exactly the behaviour you need, and no code above
the repository changes.

### Why writes are serialised

`LocalTaskRepository` runs every mutation through a promise queue. Without it,
two rapid taps both read the same snapshot and the second write silently
discards the first — the classic read-modify-write race on a key/value store.
There is a test that fires ten concurrent creates and asserts all ten survive.

### Why the DTO layer exists

Persisted data outlives the code that wrote it. The mapper parses defensively:
a corrupt blob yields an empty board instead of a crash loop on launch, and a
single malformed record is dropped while its neighbours load. It also still
reads the bare-array format an earlier version would have written.

---

## A5. Theming

Components never name a colour. They ask for a semantic role —
`colors.textSecondary`, `colors.surfaceHover` — and the active theme supplies
the value. Dark mode is therefore a data change, not a code change, and the
"Auto" setting follows the OS live.

Shadows use `boxShadow`, the modern cross-platform property: React Native's
New Architecture renders it natively and react-native-web maps it to CSS, so
one token covers both targets with no deprecation warnings.

Icons are composed from layout primitives rather than an icon font or SVG
package — no native asset linking, no web shim, no extra dependency, and they
inherit theme colours for free.

---

## A6. Testing strategy

82 tests, arranged by how much they cost to run:

| Layer | What is asserted | Needs |
|---|---|---|
| Domain | Filter, sort, validation, completion semantics | Nothing |
| Data | Persistence, concurrent writes, corrupt payloads, HTTP contract | Nothing |
| Store | Add/complete/delete flows, optimistic rollback | Nothing |
| Integration | The real UI at phone, tablet and desktop widths | Renderer |

The integration tests drive the viewport rather than stubbing an `isPhone`
flag, so they exercise the same responsive code path a resized window does:

```ts
renderApp({ viewport: DESKTOP });
expect(screen.getByTestId('detail-pane')).toBeTruthy();
```

Two bugs found in development are pinned by regression tests: the storage write
race, and `fetch` losing its receiver when stored on an instance field — the
latter only failing in a browser, which is exactly the kind of gap a
mock-everything test suite leaves open.

---

## A7. Frontend trade-offs

**Electron rather than a native macOS target.** `react-native-macos` supports
React Native only up to 0.81, and this project is on 0.86. Electron plus
`react-native-web` gives a real, resizable desktop window and an installable
package from the same source tree.

**Zustand rather than Redux.** The state here is one list and three UI flags.
Redux Toolkit would add ceremony without adding safety; zustand's vanilla
store gives dependency injection and testability with far less surface area.

**No navigation library.** There is one screen. Adding React Navigation would
mean shipping a router to render a single route.

**Hand-built icons.** An icon font needs per-platform asset linking and
`react-native-svg` needs a native module plus a web shim. For the eight glyphs
this app uses, composed views were the smaller and more portable answer.

---

# Part B — Server

The API lives in `server/`. It is **optional**. By default the frontend stores
tasks locally (AsyncStorage / `localStorage`). The server exists to prove that
swapping local storage for a real backend is a one-line change in the app, not
a rewrite.

It is a zero-dependency Node process — `node:http` only, no Express, no ORM.

## B1. Top-level shape

```
server/
├── server.js            Entire API in one file
├── package.json         `npm start` → node server.js
├── Dockerfile           Node 22 Alpine image
├── docker-compose.yml   Port 4000 + named volume for data
└── data/                Created at runtime (gitignored)
    └── tasks.json       Plain-Node persistence path
```

There is no shared TypeScript package with the frontend. The contract is the
HTTP surface below; the frontend's `HttpTaskRepository` is written to match it.

---

## B2. HTTP surface

Listens on `0.0.0.0:${PORT}` (default **4000**).

| Method | Path | Purpose |
|---|---|---|
| `OPTIONS` | any | CORS preflight → `204` |
| `GET` | `/health` | Liveness — `{ status, tasks }` |
| `GET` | `/tasks` | List every task |
| `POST` | `/tasks` | Create — `{ title, note? }` → `201` |
| `PATCH` | `/tasks/:id` | Update title, note, or completion |
| `DELETE` | `/tasks/:id` | Delete one → `204` |
| `DELETE` | `/tasks?filter=completed` | Clear completed → `{ removed }` |

Task shape on the wire:

```json
{
  "id": "…",
  "title": "…",
  "note": "… or null",
  "completed": false,
  "createdAt": 0,
  "updatedAt": 0,
  "completedAt": null
}
```

Validation errors return `422` with `{ error }`. Bad JSON / oversized bodies
return `400`. Missing ids or routes return `404`.

Every response sets `Access-Control-Allow-Origin: *` so the Vite desktop app
and mobile simulators can call it during development.

---

## B3. Persistence

- An in-memory array is loaded once at startup from `DATA_FILE`
  (default `server/data/tasks.json`; in Docker, `/data/tasks.json`).
- Every mutating route serialises through a promise queue so concurrent writes
  cannot clobber the file.
- On-disk format: `{ "version": 1, "tasks": [...] }`. The loader also accepts a
  bare array from earlier experiments.
- A missing or unreadable file yields an empty board — the process still starts.

---

## B4. How to run it

**Plain Node**

```bash
cd server && npm start
```

**Docker**

```bash
cd server && docker compose up -d --build
```

Compose publishes `4000:4000` and mounts a named volume at `/data`, so task data
survives `docker compose down`. The image healthcheck hits `/health`.

Both paths run the same `server.js`.

---

# Part C — How frontend and server connect

They are deliberately *not* a monorepo workspace. The seam is one interface and
one factory:

```
frontend                          server
────────                          ──────
TaskRepository (port)
        │
        ├── LocalTaskRepository   (default — no server needed)
        └── HttpTaskRepository ──── fetch ──▶  GET/POST/PATCH/DELETE /tasks
```

`frontend/src/app/services/createServices.ts` is the only place that chooses:

```ts
const taskRepository =
  config.dataSource === 'http'
    ? new HttpTaskRepository({ baseUrl: config.apiBaseUrl })
    : new LocalTaskRepository({ store: keyValueStore });
```

Environment flags (inlined by Metro Babel / Vite `define`):

| Flag | Default | Effect |
|---|---|---|
| `TASKBOARD_DATA_SOURCE` | `local` | `http` selects the HTTP repository |
| `TASKBOARD_API_URL` | `http://localhost:4000` | Base URL for `HttpTaskRepository` |

Example:

```bash
# terminal 1
cd server && docker compose up -d

# terminal 2
cd frontend && TASKBOARD_DATA_SOURCE=http npm run desktop
# or: TASKBOARD_DATA_SOURCE=http npm run ios
# or: TASKBOARD_DATA_SOURCE=http npm run android
```

No component, store, or domain file changes. That is the whole point of the
repository port.

### Packaged desktop caveat

HTTP mode works from the Vite/Electron *dev* flow and from mobile. A *packaged*
Electron app loads from `file://`, and Chromium blocks cross-origin `fetch`
from there regardless of CORS headers — so the installable build stays on
local storage. Use `npm run desktop` when demonstrating the API.
