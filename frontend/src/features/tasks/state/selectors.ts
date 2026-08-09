import {
  completionRatio,
  countTasks,
  filterTasks,
  sortTasks,
  type Task,
  type TaskCounts,
  type TaskFilter,
  type TaskId,
  type TaskSortOrder,
} from '../../../domain';

/**
 * Derivation lives here, as pure functions of the smallest inputs each one
 * needs — not inside components and not inside the store.
 *
 * Narrow signatures matter for two reasons: they are trivially unit-testable
 * without constructing a whole store state, and they map one-to-one onto the
 * `useMemo` dependency arrays in `useTaskBoard`, so nothing recomputes unless
 * its actual inputs changed.
 */

/** What the user sees: filter first, then order. */
export const selectVisibleTasks = (
  tasks: readonly Task[],
  filter: TaskFilter,
  sortOrder: TaskSortOrder,
): Task[] => sortTasks(filterTasks(tasks, filter), sortOrder);

export const selectCounts = (tasks: readonly Task[]): TaskCounts =>
  countTasks(tasks);

export const selectCompletionRatio = (tasks: readonly Task[]): number =>
  completionRatio(tasks);

export const selectTaskById = (
  tasks: readonly Task[],
  id: TaskId | null,
): Task | null =>
  id === null ? null : (tasks.find(task => task.id === id) ?? null);

export const selectHasCompleted = (tasks: readonly Task[]): boolean =>
  tasks.some(task => task.completed);
