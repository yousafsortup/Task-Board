import { createStore, type StoreApi } from 'zustand/vanilla';

import {
  DEFAULT_TASK_FILTER,
  toError,
  type Task,
  type TaskDraft,
  type TaskFilter,
  type TaskId,
  type TaskPatch,
  type TaskRepository,
  type TaskSortOrder,
} from '../../../domain';
import { err, ok, type Result } from '../../../shared/types/result';

export type TaskStatus = 'idle' | 'hydrating' | 'ready' | 'error';

export interface TaskState {
  readonly tasks: readonly Task[];
  readonly filter: TaskFilter;
  readonly sortOrder: TaskSortOrder;
  readonly status: TaskStatus;
  readonly error: string | null;
  /** Which task the detail pane / detail sheet is showing. */
  readonly selectedId: TaskId | null;
  readonly isSubmitting: boolean;
}

export interface TaskActions {
  hydrate(): Promise<void>;
  addTask(draft: TaskDraft): Promise<Result<Task, Error>>;
  toggleTask(id: TaskId): Promise<void>;
  updateTask(id: TaskId, patch: TaskPatch): Promise<Result<Task, Error>>;
  deleteTask(id: TaskId): Promise<void>;
  clearCompleted(): Promise<void>;
  setFilter(filter: TaskFilter): void;
  setSortOrder(order: TaskSortOrder): void;
  selectTask(id: TaskId | null): void;
  dismissError(): void;
}

export type TaskStore = TaskState & TaskActions;

export interface TaskStoreDeps {
  readonly repository: TaskRepository;
  /** Persists UI preferences; fire-and-forget by design. */
  readonly onPreferencesChange?: (preferences: {
    filter: TaskFilter;
    sortOrder: TaskSortOrder;
  }) => void;
  readonly initialFilter?: TaskFilter;
  readonly initialSortOrder?: TaskSortOrder;
}

/**
 * The store is created by a factory rather than at module scope. That single
 * decision is what makes the app testable: every test builds its own store
 * over an in-memory repository, with no global state to reset between cases.
 *
 * Mutations are optimistic — the UI updates first, then persistence confirms,
 * and a failure rolls the snapshot back. Local storage rarely fails, but this
 * is exactly the behaviour a networked repository needs, so swapping in
 * `HttpTaskRepository` requires no changes here.
 */
export const createTaskStore = (
  deps: TaskStoreDeps,
): StoreApi<TaskStore> => {
  const { repository } = deps;

  return createStore<TaskStore>((set, get) => {
    const persistPreferences = () => {
      const { filter, sortOrder } = get();
      deps.onPreferencesChange?.({ filter, sortOrder });
    };

    /** Restores a snapshot and surfaces the failure. */
    const rollback = (snapshot: readonly Task[], cause: unknown) => {
      set({ tasks: snapshot, error: toError(cause).message });
    };

    return {
      tasks: [],
      filter: deps.initialFilter ?? DEFAULT_TASK_FILTER,
      sortOrder: deps.initialSortOrder ?? 'smart',
      status: 'idle',
      error: null,
      selectedId: null,
      isSubmitting: false,

      async hydrate() {
        set({ status: 'hydrating', error: null });
        try {
          const tasks = await repository.findAll();
          set({ tasks, status: 'ready' });
        } catch (cause) {
          set({ status: 'error', error: toError(cause).message });
        }
      },

      async addTask(draft) {
        set({ isSubmitting: true, error: null });
        try {
          const task = await repository.create(draft);
          set(state => ({
            tasks: [task, ...state.tasks],
            isSubmitting: false,
          }));
          return ok(task);
        } catch (cause) {
          const error = toError(cause);
          set({ isSubmitting: false, error: error.message });
          return err(error);
        }
      },

      async toggleTask(id) {
        const snapshot = get().tasks;
        const current = snapshot.find(task => task.id === id);
        if (!current) {
          return;
        }

        const optimisticAt = Date.now();
        set({
          error: null,
          tasks: snapshot.map(task =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  updatedAt: optimisticAt,
                  completedAt: task.completed ? null : optimisticAt,
                }
              : task,
          ),
        });

        try {
          const saved = await repository.update(id, {
            completed: !current.completed,
          });
          set(state => ({
            tasks: state.tasks.map(task => (task.id === id ? saved : task)),
          }));
        } catch (cause) {
          rollback(snapshot, cause);
        }
      },

      async updateTask(id, patch) {
        const snapshot = get().tasks;
        try {
          const saved = await repository.update(id, patch);
          set(state => ({
            tasks: state.tasks.map(task => (task.id === id ? saved : task)),
            error: null,
          }));
          return ok(saved);
        } catch (cause) {
          const error = toError(cause);
          // Validation failures must not discard the user's other edits.
          set({ tasks: snapshot, error: error.message });
          return err(error);
        }
      },

      async deleteTask(id) {
        const snapshot = get().tasks;
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          error: null,
        }));

        try {
          await repository.remove(id);
        } catch (cause) {
          rollback(snapshot, cause);
        }
      },

      async clearCompleted() {
        const snapshot = get().tasks;
        const removedIds = new Set(
          snapshot.filter(task => task.completed).map(task => task.id),
        );
        if (removedIds.size === 0) {
          return;
        }

        set(state => ({
          tasks: state.tasks.filter(task => !removedIds.has(task.id)),
          selectedId:
            state.selectedId !== null && removedIds.has(state.selectedId)
              ? null
              : state.selectedId,
          error: null,
        }));

        try {
          await repository.removeCompleted();
        } catch (cause) {
          rollback(snapshot, cause);
        }
      },

      setFilter(filter) {
        set({ filter });
        persistPreferences();
      },

      setSortOrder(sortOrder) {
        set({ sortOrder });
        persistPreferences();
      },

      selectTask(selectedId) {
        set({ selectedId });
      },

      dismissError() {
        set({ error: null });
      },
    };
  });
};
