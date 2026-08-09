import {
  LocalTaskRepository,
  TASKS_STORAGE_KEY,
} from '../../src/data/repositories/LocalTaskRepository';
import { createInMemoryKeyValueStore } from '../../src/data/storage/inMemoryKeyValueStore';
import { TaskNotFoundError, ValidationError } from '../../src/domain';
import { createFixedClock } from '../../src/shared/lib/clock';
import { createSequentialIdGenerator } from '../../src/shared/lib/id';

const createRepository = (seed: Record<string, string> = {}) => {
  const store = createInMemoryKeyValueStore(seed);
  const repository = new LocalTaskRepository({
    store,
    clock: createFixedClock(1_000),
    createId: createSequentialIdGenerator('task'),
  });
  return { store, repository };
};

const readPersisted = (store: ReturnType<typeof createInMemoryKeyValueStore>) =>
  JSON.parse(store.snapshot()[TASKS_STORAGE_KEY]);

describe('LocalTaskRepository', () => {
  it('starts empty when nothing has been stored', async () => {
    const { repository } = createRepository();
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('persists a created task in the versioned envelope', async () => {
    const { store, repository } = createRepository();

    const task = await repository.create({ title: 'Write the README' });

    expect(task.id).toBe('task-1');
    expect(readPersisted(store)).toMatchObject({
      version: 1,
      tasks: [{ id: 'task-1', title: 'Write the README' }],
    });
  });

  it('rejects an invalid draft before touching storage', async () => {
    const { store, repository } = createRepository();

    await expect(repository.create({ title: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(store.snapshot()[TASKS_STORAGE_KEY]).toBeUndefined();
  });

  it('updates a task and reports the new state', async () => {
    const { repository } = createRepository();
    const created = await repository.create({ title: 'Ship' });

    const updated = await repository.update(created.id, { completed: true });

    expect(updated.completed).toBe(true);
    await expect(repository.findAll()).resolves.toEqual([updated]);
  });

  it('raises TaskNotFoundError for unknown ids', async () => {
    const { repository } = createRepository();

    await expect(repository.update('nope', { completed: true })).rejects.toBeInstanceOf(
      TaskNotFoundError,
    );
    await expect(repository.remove('nope')).rejects.toBeInstanceOf(
      TaskNotFoundError,
    );
  });

  it('removes a single task', async () => {
    const { repository } = createRepository();
    const keep = await repository.create({ title: 'Keep' });
    const drop = await repository.create({ title: 'Drop' });

    await repository.remove(drop.id);

    await expect(repository.findAll()).resolves.toEqual([keep]);
  });

  it('removes every completed task at once', async () => {
    const { repository } = createRepository();
    const open = await repository.create({ title: 'Open' });
    const first = await repository.create({ title: 'First' });
    const second = await repository.create({ title: 'Second' });
    await repository.update(first.id, { completed: true });
    await repository.update(second.id, { completed: true });

    const removed = await repository.removeCompleted();

    expect(removed.sort()).toEqual([first.id, second.id].sort());
    await expect(repository.findAll()).resolves.toEqual([open]);
  });

  /**
   * The regression this guards against: two mutations reading the same
   * snapshot and the second overwriting the first. The write queue serialises
   * them, so every task survives.
   */
  it('does not lose writes issued concurrently', async () => {
    const { repository } = createRepository();

    await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repository.create({ title: `Task ${index}` }),
      ),
    );

    await expect(repository.findAll()).resolves.toHaveLength(10);
  });

  it('survives a corrupt payload instead of crashing on launch', async () => {
    const { repository } = createRepository({
      [TASKS_STORAGE_KEY]: '{ this is not json',
    });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('drops individual malformed records but keeps the good ones', async () => {
    const { repository } = createRepository({
      [TASKS_STORAGE_KEY]: JSON.stringify({
        version: 1,
        tasks: [
          { id: 'good', title: 'Real task', completed: false, createdAt: 1 },
          { id: '', title: 'No id' },
          null,
          'nonsense',
        ],
      }),
    });

    const tasks = await repository.findAll();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('good');
  });

  it('reads a bare legacy array as well as the current envelope', async () => {
    const { repository } = createRepository({
      [TASKS_STORAGE_KEY]: JSON.stringify([
        { id: 'legacy', title: 'From an older build', completed: true, createdAt: 5 },
      ]),
    });

    const tasks = await repository.findAll();

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: 'legacy', completed: true });
  });
});
