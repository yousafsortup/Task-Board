import {
  applyTaskPatch,
  createTask,
  TaskNotFoundError,
  validateTaskDraft,
  type Task,
  type TaskDraft,
  type TaskId,
  type TaskPatch,
  type TaskRepository,
} from '../../domain';
import type { Clock } from '../../shared/lib/clock';
import { systemClock } from '../../shared/lib/clock';
import { createId, type IdGenerator } from '../../shared/lib/id';
import {
  toTaskCollectionDto,
  toTaskEntities,
} from '../mappers/task.mapper';
import type { KeyValueStore } from '../storage/keyValueStore';

export const TASKS_STORAGE_KEY = 'taskboard.tasks.v1';

export interface LocalTaskRepositoryDeps {
  readonly store: KeyValueStore;
  readonly clock?: Clock;
  readonly createId?: IdGenerator;
  readonly storageKey?: string;
}

/**
 * Local-first implementation of the `TaskRepository` port.
 *
 * Reads are served from an in-memory cache after the first hydrate; writes go
 * through a serialised queue so two rapid mutations can never race and clobber
 * each other's snapshot — the classic bug with "read-modify-write" on a
 * key/value store.
 */
export class LocalTaskRepository implements TaskRepository {
  private readonly store: KeyValueStore;
  private readonly clock: Clock;
  private readonly nextId: IdGenerator;
  private readonly storageKey: string;

  private cache: Task[] | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(deps: LocalTaskRepositoryDeps) {
    this.store = deps.store;
    this.clock = deps.clock ?? systemClock;
    this.nextId = deps.createId ?? createId;
    this.storageKey = deps.storageKey ?? TASKS_STORAGE_KEY;
  }

  async findAll(): Promise<Task[]> {
    const tasks = await this.load();
    return [...tasks];
  }

  async create(draft: TaskDraft): Promise<Task> {
    const validated = validateTaskDraft(draft);
    if (!validated.ok) {
      throw validated.error;
    }

    const task = createTask(validated.value, {
      clock: this.clock,
      createId: this.nextId,
    });

    return this.mutate(tasks => ({
      tasks: [...tasks, task],
      result: task,
    }));
  }

  async update(id: TaskId, patch: TaskPatch): Promise<Task> {
    return this.mutate(tasks => {
      const index = tasks.findIndex(task => task.id === id);
      if (index === -1) {
        throw new TaskNotFoundError(id);
      }

      const patched = applyTaskPatch(tasks[index], patch, this.clock);
      if (!patched.ok) {
        throw patched.error;
      }

      const next = [...tasks];
      next[index] = patched.value;
      return { tasks: next, result: patched.value };
    });
  }

  async remove(id: TaskId): Promise<void> {
    await this.mutate(tasks => {
      if (!tasks.some(task => task.id === id)) {
        throw new TaskNotFoundError(id);
      }
      return { tasks: tasks.filter(task => task.id !== id), result: undefined };
    });
  }

  async removeCompleted(): Promise<TaskId[]> {
    return this.mutate(tasks => {
      const removed = tasks.filter(task => task.completed).map(task => task.id);
      return {
        tasks: tasks.filter(task => !task.completed),
        result: removed,
      };
    });
  }

  private async load(): Promise<Task[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    const raw = await this.store.get(this.storageKey);
    if (raw === null) {
      this.cache = [];
      return this.cache;
    }

    try {
      this.cache = toTaskEntities(JSON.parse(raw));
    } catch {
      // Unparseable payload: start clean rather than trapping the user in a
      // crash loop. The bad blob is overwritten on the next successful write.
      this.cache = [];
    }

    return this.cache;
  }

  /**
   * Runs `mutator` against the freshest snapshot, persists the result, and
   * only then updates the cache — all strictly one at a time.
   */
  private mutate<TResult>(
    mutator: (tasks: Task[]) => { tasks: Task[]; result: TResult },
  ): Promise<TResult> {
    const run = this.writeQueue.then(async () => {
      const current = await this.load();
      const { tasks, result } = mutator(current);
      await this.store.set(
        this.storageKey,
        JSON.stringify(toTaskCollectionDto(tasks)),
      );
      this.cache = tasks;
      return result;
    });

    // Keep the chain alive even when a mutation rejects.
    this.writeQueue = run.catch(() => undefined);
    return run;
  }
}
