import {
  PersistenceError,
  TaskNotFoundError,
  validateTaskDraft,
  type Task,
  type TaskDraft,
  type TaskId,
  type TaskPatch,
  type TaskRepository,
} from '../../domain';
import { toTaskEntities, toTaskEntity } from '../mappers/task.mapper';

export interface HttpTaskRepositoryDeps {
  /** e.g. `http://localhost:4000` — the Dockerised API under `server/`. */
  readonly baseUrl: string;
  readonly fetchFn?: typeof fetch;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Proof that the local storage choice is not baked into the app: this class
 * satisfies exactly the same port as `LocalTaskRepository`, so switching the
 * whole app to a real backend is a single line in `createServices()`.
 *
 * Ships with the assessment's optional Node/Docker mock API (`server/`).
 */
export class HttpTaskRepository implements TaskRepository {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(deps: HttpTaskRepositoryDeps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, '');
    /*
     * `fetch` must keep its original receiver. Storing the bare global on an
     * instance field and calling it as `this.fetchFn(...)` re-binds `this` to
     * the repository, which browsers reject with "Illegal invocation" — so it
     * is bound to the global object here.
     */
    this.fetchFn = deps.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async findAll(): Promise<Task[]> {
    return toTaskEntities(await this.request('GET', '/tasks'));
  }

  async create(draft: TaskDraft): Promise<Task> {
    const validated = validateTaskDraft(draft);
    if (!validated.ok) {
      throw validated.error;
    }

    const created = toTaskEntity(
      await this.request('POST', '/tasks', validated.value),
    );

    if (created === null) {
      throw new PersistenceError('The API returned an unusable task.');
    }
    return created;
  }

  async update(id: TaskId, patch: TaskPatch): Promise<Task> {
    const updated = toTaskEntity(
      await this.request('PATCH', `/tasks/${encodeURIComponent(id)}`, patch),
    );

    if (updated === null) {
      throw new PersistenceError('The API returned an unusable task.');
    }
    return updated;
  }

  async remove(id: TaskId): Promise<void> {
    await this.request('DELETE', `/tasks/${encodeURIComponent(id)}`);
  }

  async removeCompleted(): Promise<TaskId[]> {
    const payload = await this.request('DELETE', '/tasks?filter=completed');
    const ids = (payload as { removed?: unknown })?.removed;
    return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new TaskNotFoundError(path.split('/').pop() ?? path);
      }

      if (!response.ok) {
        throw new PersistenceError(
          `${method} ${path} failed with ${response.status}.`,
        );
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (cause) {
      if (cause instanceof TaskNotFoundError || cause instanceof PersistenceError) {
        throw cause;
      }
      throw new PersistenceError(`${method} ${path} failed.`, cause);
    } finally {
      clearTimeout(timer);
    }
  }
}
