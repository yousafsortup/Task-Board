import type { Task, TaskDraft, TaskId, TaskPatch } from './task.entity';

/**
 * The port the application layer talks to. It is intentionally shaped like a
 * remote collection resource (async, id-addressed, returns the persisted
 * entity) so that swapping the local implementation for an HTTP one is a
 * one-line change in the composition root — not a rewrite.
 *
 * Implementations live in `src/data/repositories`:
 *  - `LocalTaskRepository` — key/value storage (AsyncStorage / localStorage)
 *  - `HttpTaskRepository`  — the Dockerised JSON API under `server/`
 *  - `InMemoryTaskRepository` — tests and Storybook-style previews
 */
export interface TaskRepository {
  /** Every task, in no guaranteed order. Ordering is a UI concern. */
  findAll(): Promise<Task[]>;

  create(draft: TaskDraft): Promise<Task>;

  /** Rejects with `TaskNotFoundError` when the id is unknown. */
  update(id: TaskId, patch: TaskPatch): Promise<Task>;

  remove(id: TaskId): Promise<void>;

  /** Bulk delete of finished work; returns the ids that were removed. */
  removeCompleted(): Promise<TaskId[]>;
}
