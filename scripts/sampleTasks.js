/**
 * Sample board used when capturing screenshots, so every platform shot shows
 * the same content and the comparison is about *layout*, not data.
 *
 * The shape matches what `LocalTaskRepository` writes, because the capture
 * scripts seed storage directly rather than driving the UI.
 */
const HOUR = 3_600_000;

const build = (now = Date.now()) => [
  {
    id: 'seed-1',
    title: 'Ship the cross-platform task board',
    note: 'One React Native codebase, running on iOS and the desktop.',
    completed: false,
    createdAt: now - HOUR,
    updatedAt: now - HOUR,
    completedAt: null,
  },
  {
    id: 'seed-2',
    title: 'Review the responsive breakpoints',
    note: 'Sidebar appears at 700px, detail pane at 1000px, two columns at 1360px.',
    completed: false,
    createdAt: now - 3 * HOUR,
    updatedAt: now - 3 * HOUR,
    completedAt: null,
  },
  {
    id: 'seed-3',
    title: 'Add a note to the release checklist',
    note: null,
    completed: false,
    createdAt: now - 6 * HOUR,
    updatedAt: now - 6 * HOUR,
    completedAt: null,
  },
  {
    id: 'seed-4',
    title: 'Wire the repository port to the Docker API',
    note: 'HttpTaskRepository satisfies the same contract as the local one.',
    completed: true,
    createdAt: now - 26 * HOUR,
    updatedAt: now - 2 * HOUR,
    completedAt: now - 2 * HOUR,
  },
  {
    id: 'seed-5',
    title: 'Write the widget tests for the add/complete flow',
    note: null,
    completed: true,
    createdAt: now - 30 * HOUR,
    updatedAt: now - 5 * HOUR,
    completedAt: now - 5 * HOUR,
  },
];

module.exports = {
  TASKS_STORAGE_KEY: 'taskboard.tasks.v1',
  PREFERENCES_STORAGE_KEY: 'taskboard.preferences.v1',
  buildSampleTasks: build,
  buildStoragePayload: (now) =>
    JSON.stringify({ version: 1, tasks: build(now) }),
};
