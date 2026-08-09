import { HttpTaskRepository } from '../../src/data/repositories/HttpTaskRepository';
import {
  PersistenceError,
  TaskNotFoundError,
  ValidationError,
} from '../../src/domain';
import { makeTask } from '../support/factories';

/**
 * Contract test for the remote implementation of `TaskRepository`.
 *
 * `fetch` is stubbed rather than hitting the container, so the suite stays
 * runnable without Docker while still pinning down the exact HTTP the app
 * emits — the thing that would break silently if the API changed shape.
 */
const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

/** Mirrors the two arguments the repository actually passes to `fetch`. */
type FetchMock = jest.Mock<
  Promise<Response>,
  [input: string, init?: RequestInit]
>;

const createFetchMock = (
  implementation: (input: string, init?: RequestInit) => Promise<Response>,
): FetchMock => jest.fn(implementation) as FetchMock;

const createRepository = (fetchFn: FetchMock) =>
  new HttpTaskRepository({
    baseUrl: 'http://localhost:4000/',
    fetchFn: fetchFn as unknown as typeof fetch,
  });

describe('HttpTaskRepository — default transport', () => {
  /**
   * Regression test for a bug that only appeared in a browser.
   *
   * Storing the global `fetch` on an instance field and invoking it as
   * `this.fetchFn(...)` re-binds its receiver to the repository. Node does not
   * care; browsers throw "Illegal invocation", so the desktop build failed
   * every request while every mocked test still passed.
   *
   * The stub below reproduces the browser's rule exactly.
   */
  it('calls the global fetch with the global as its receiver', async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];

    globalThis.fetch = function strictFetch(this: unknown, input: RequestInfo | URL) {
      if (this !== globalThis && this !== undefined) {
        throw new TypeError(
          "Failed to execute 'fetch' on 'Window': Illegal invocation",
        );
      }
      calls.push(String(input));
      return Promise.resolve(jsonResponse([]));
    } as unknown as typeof fetch;

    try {
      const repository = new HttpTaskRepository({
        baseUrl: 'http://localhost:4000',
      });

      await expect(repository.findAll()).resolves.toEqual([]);
      expect(calls).toEqual(['http://localhost:4000/tasks']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('HttpTaskRepository', () => {
  it('lists tasks from GET /tasks', async () => {
    const fetchFn = createFetchMock(async () =>
      jsonResponse([makeTask({ id: 'remote' })]),
    );
    const repository = createRepository(fetchFn);

    const tasks = await repository.findAll();

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/tasks',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('remote');
  });

  it('posts a validated draft and maps the response back to an entity', async () => {
    const created = makeTask({ id: 'new', title: 'Ship it' });
    const fetchFn = createFetchMock(async () => jsonResponse(created, 201));
    const repository = createRepository(fetchFn);

    const task = await repository.create({ title: '  Ship   it  ' });

    const init = fetchFn.mock.calls[0][1];
    // The title is normalised by the domain *before* it reaches the network.
    expect(JSON.parse(String(init?.body))).toEqual({
      title: 'Ship it',
      note: null,
    });
    expect(task.id).toBe('new');
  });

  it('rejects an invalid draft without making a request', async () => {
    const fetchFn = createFetchMock(async () => jsonResponse(null));
    const repository = createRepository(fetchFn);

    await expect(repository.create({ title: '  ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('translates a 404 into TaskNotFoundError', async () => {
    const fetchFn = createFetchMock(async () =>
      jsonResponse({ error: 'nope' }, 404),
    );
    const repository = createRepository(fetchFn);

    await expect(
      repository.update('missing', { completed: true }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });

  it('wraps transport failures in PersistenceError', async () => {
    const fetchFn = createFetchMock(async () => {
      throw new Error('ECONNREFUSED');
    });
    const repository = createRepository(fetchFn);

    await expect(repository.findAll()).rejects.toBeInstanceOf(PersistenceError);
  });

  it('treats 204 as an empty body on delete', async () => {
    const fetchFn = createFetchMock(async () => jsonResponse(undefined, 204));
    const repository = createRepository(fetchFn);

    await expect(repository.remove('gone')).resolves.toBeUndefined();
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/tasks/gone',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('asks the API to bulk-delete completed tasks', async () => {
    const fetchFn = createFetchMock(async () =>
      jsonResponse({ removed: ['a', 'b'] }),
    );
    const repository = createRepository(fetchFn);

    await expect(repository.removeCompleted()).resolves.toEqual(['a', 'b']);
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:4000/tasks?filter=completed',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
