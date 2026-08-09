# Architecture

The brief asks one question: can a single codebase genuinely work on a phone
*and* a desktop — layout, interaction and data handling actually adapting,
rather than a phone screen stretched wide.

This document explains how the code answers that, and why it is arranged the
way it is.

---

## 1. The shape of the codebase

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

`domain` depends on nothing. That is the whole trick: the rules that decide
what a task *is*, what "active" means and how the list is ordered are ordinary
functions over plain data. They run identically on iOS, on the desktop, and in
Jest — because they have no idea any of those exist.

---

## 2. How the layout adapts

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

## 3. How the platform split is contained

The **entire** per-platform surface of this project is three files:

```
data/storage/keyValueStore.ts        → AsyncStorage      (iOS / Android)
data/storage/keyValueStore.web.ts    → localStorage      (desktop)
shared/hooks/useKeyboardShortcut.ts  → no-op on native, real on desktop
```

Both are *driven adapters* — the outermost edge, where bytes leave the
application. Everything above that line is byte-identical on both targets.

The bundler picks the right file by extension (Metro prefers `.native.*`, Vite
is configured to prefer `.web.*`). No code branches; the module graph differs,
the application does not.

The only other platform-shaped file is the entry point, and the difference is
one line:

```js
// index.js  (iOS / Android)          // index.web.tsx  (desktop)
AppRegistry.registerComponent(…)      AppRegistry.registerComponent(…)
                                      AppRegistry.runApplication(…, { rootTag })
```

A native host starts the surface itself; a browser has to be handed a DOM node.

---

## 4. Data flow

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

## 5. Swapping local storage for a real API

`createServices.ts` is the only file that names concrete implementations:

```ts
const taskRepository =
  config.dataSource === 'http'
    ? new HttpTaskRepository({ baseUrl: config.apiBaseUrl })
    : new LocalTaskRepository({ store: keyValueStore });
```

That is the entire change. Run the API in `server/`, set
`TASKBOARD_DATA_SOURCE=http`, and every screen is reading and writing over the
network — with no edit to any component, store, or domain file.

This was verified end to end: tasks created only through the containerised API
(via `curl`, with local storage cleared) render in the desktop app.

---

## 6. Theming

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

## 7. Testing strategy

81 tests, arranged by how much they cost to run:

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

## 8. Trade-offs

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
