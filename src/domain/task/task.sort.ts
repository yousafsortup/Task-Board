import type { Task } from './task.entity';

export const TASK_SORT_ORDERS = ['smart', 'newest', 'oldest', 'title'] as const;

export type TaskSortOrder = (typeof TASK_SORT_ORDERS)[number];

export const TASK_SORT_LABELS: Record<TaskSortOrder, string> = {
  smart: 'Smart',
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Alphabetical',
};

const byNewest = (a: Task, b: Task): number => b.createdAt - a.createdAt;
const byOldest = (a: Task, b: Task): number => a.createdAt - b.createdAt;
const byTitle = (a: Task, b: Task): number =>
  a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

/**
 * "Smart" ordering: open work floats to the top, newest first; finished work
 * settles underneath in the order it was completed (most recent first).
 */
const bySmart = (a: Task, b: Task): number => {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  if (a.completed && b.completed) {
    return (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt);
  }
  return byNewest(a, b);
};

const COMPARATORS: Record<TaskSortOrder, (a: Task, b: Task) => number> = {
  smart: bySmart,
  newest: byNewest,
  oldest: byOldest,
  title: byTitle,
};

/** Pure, non-mutating sort. */
export const sortTasks = (
  tasks: readonly Task[],
  order: TaskSortOrder,
): Task[] => [...tasks].sort(COMPARATORS[order]);
