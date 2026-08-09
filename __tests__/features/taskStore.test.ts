import { createInMemoryTaskRepository } from '../../src/data/repositories/InMemoryTaskRepository';
import { createTaskStore } from '../../src/features/tasks/state/taskStore';
import {
  selectCounts,
  selectVisibleTasks,
} from '../../src/features/tasks/state/selectors';
import type {
  Task,
  TaskDraft,
  TaskId,
  TaskPatch,
  TaskRepository,
} from '../../src/domain';
import { createFixedClock } from '../../src/shared/lib/clock';
import { createSequentialIdGenerator } from '../../src/shared/lib/id';
import { makeTask } from '../support/factories';

const buildStore = (repository?: TaskRepository) =>
  createTaskStore({
    repository:
      repository ??
      createInMemoryTaskRepository({
        clock: createFixedClock(1_000),
        createId: createSequentialIdGenerator('task'),
      }),
  });

describe('task store — add / complete / delete flow', () => {
  it('hydrates from the repository', async () => {
    const store = buildStore(
      createInMemoryTaskRepository({ seed: [makeTask({ id: 'seeded' })] }),
    );

    await store.getState().hydrate();

    expect(store.getState().status).toBe('ready');
    expect(store.getState().tasks).toHaveLength(1);
  });

  it('adds a task and puts it at the head of the list', async () => {
    const store = buildStore();
    await store.getState().hydrate();

    const result = await store.getState().addTask({ title: 'First task' });

    expect(result.ok).toBe(true);
    expect(store.getState().tasks[0]).toMatchObject({
      title: 'First task',
      completed: false,
    });
  });

  it('reports validation failures without adding anything', async () => {
    const store = buildStore();
    await store.getState().hydrate();

    const result = await store.getState().addTask({ title: '  ' });

    expect(result.ok).toBe(false);
    expect(store.getState().tasks).toHaveLength(0);
    expect(store.getState().error).toMatch(/title/i);
  });

  it('toggles a task complete and back again', async () => {
    const store = buildStore();
    await store.getState().hydrate();
    await store.getState().addTask({ title: 'Toggle me' });
    const id = store.getState().tasks[0].id;

    await store.getState().toggleTask(id);
    expect(store.getState().tasks[0].completed).toBe(true);
    expect(store.getState().tasks[0].completedAt).not.toBeNull();

    await store.getState().toggleTask(id);
    expect(store.getState().tasks[0].completed).toBe(false);
    expect(store.getState().tasks[0].completedAt).toBeNull();
  });

  it('deletes a task and clears the selection pointing at it', async () => {
    const store = buildStore();
    await store.getState().hydrate();
    await store.getState().addTask({ title: 'Doomed' });
    const id = store.getState().tasks[0].id;
    store.getState().selectTask(id);

    await store.getState().deleteTask(id);

    expect(store.getState().tasks).toHaveLength(0);
    expect(store.getState().selectedId).toBeNull();
  });

  it('clears every completed task in one action', async () => {
    const store = buildStore();
    await store.getState().hydrate();
    await store.getState().addTask({ title: 'Keep me' });
    await store.getState().addTask({ title: 'Finish me' });
    await store.getState().toggleTask(store.getState().tasks[0].id);

    await store.getState().clearCompleted();

    expect(store.getState().tasks.map(task => task.title)).toEqual(['Keep me']);
  });
});

describe('task store — filtering', () => {
  const seedBoard = async () => {
    const store = buildStore();
    await store.getState().hydrate();
    await store.getState().addTask({ title: 'Open one' });
    await store.getState().addTask({ title: 'Open two' });
    await store.getState().addTask({ title: 'Closed one' });
    await store.getState().toggleTask(store.getState().tasks[0].id);
    return store;
  };

  it('narrows the visible list without discarding data', async () => {
    const store = await seedBoard();

    store.getState().setFilter('active');
    let state = store.getState();
    expect(
      selectVisibleTasks(state.tasks, state.filter, state.sortOrder),
    ).toHaveLength(2);

    store.getState().setFilter('completed');
    state = store.getState();
    expect(
      selectVisibleTasks(state.tasks, state.filter, state.sortOrder),
    ).toHaveLength(1);

    store.getState().setFilter('all');
    state = store.getState();
    expect(
      selectVisibleTasks(state.tasks, state.filter, state.sortOrder),
    ).toHaveLength(3);
    expect(selectCounts(state.tasks)).toEqual({
      all: 3,
      active: 2,
      completed: 1,
    });
  });

  it('notifies the preferences sink when the filter changes', async () => {
    const onPreferencesChange = jest.fn();
    const store = createTaskStore({
      repository: createInMemoryTaskRepository(),
      onPreferencesChange,
    });

    store.getState().setFilter('completed');
    store.getState().setSortOrder('title');

    expect(onPreferencesChange).toHaveBeenLastCalledWith({
      filter: 'completed',
      sortOrder: 'title',
    });
  });
});

describe('task store — optimistic updates', () => {
  /** A repository that reads fine but rejects every write. */
  const createFailingRepository = (seed: Task[]): TaskRepository => ({
    findAll: async () => [...seed],
    create: async (_draft: TaskDraft) => {
      throw new Error('offline');
    },
    update: async (_id: TaskId, _patch: TaskPatch) => {
      throw new Error('offline');
    },
    remove: async (_id: TaskId) => {
      throw new Error('offline');
    },
    removeCompleted: async () => {
      throw new Error('offline');
    },
  });

  it('rolls a failed toggle back and surfaces the error', async () => {
    const seeded = makeTask({ id: 'x', completed: false });
    const store = buildStore(createFailingRepository([seeded]));
    await store.getState().hydrate();

    await store.getState().toggleTask('x');

    expect(store.getState().tasks[0].completed).toBe(false);
    expect(store.getState().error).toBe('offline');
  });

  it('restores a deleted task when the write fails', async () => {
    const seeded = makeTask({ id: 'x' });
    const store = buildStore(createFailingRepository([seeded]));
    await store.getState().hydrate();

    await store.getState().deleteTask('x');

    expect(store.getState().tasks).toHaveLength(1);
    expect(store.getState().error).toBe('offline');
  });

  it('clears the error banner on demand', async () => {
    const store = buildStore(createFailingRepository([makeTask({ id: 'x' })]));
    await store.getState().hydrate();
    await store.getState().toggleTask('x');

    store.getState().dismissError();

    expect(store.getState().error).toBeNull();
  });
});
