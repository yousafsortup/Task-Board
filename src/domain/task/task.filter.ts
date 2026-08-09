import type { Task } from './task.entity';

export const TASK_FILTERS = ['all', 'active', 'completed'] as const;

export type TaskFilter = (typeof TASK_FILTERS)[number];

export const DEFAULT_TASK_FILTER: TaskFilter = 'all';

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

export const isTaskFilter = (value: unknown): value is TaskFilter =>
  typeof value === 'string' &&
  (TASK_FILTERS as readonly string[]).includes(value);

const PREDICATES: Record<TaskFilter, (task: Task) => boolean> = {
  all: () => true,
  active: task => !task.completed,
  completed: task => task.completed,
};

/**
 * The one piece of logic the whole product hinges on — deliberately a pure
 * function over plain data so it is identical on every platform and can be
 * unit-tested without rendering anything.
 */
export const filterTasks = (
  tasks: readonly Task[],
  filter: TaskFilter,
): Task[] => tasks.filter(PREDICATES[filter]);

export interface TaskCounts {
  readonly all: number;
  readonly active: number;
  readonly completed: number;
}

export const countTasks = (tasks: readonly Task[]): TaskCounts => {
  let completed = 0;
  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
    }
  }
  return {
    all: tasks.length,
    active: tasks.length - completed,
    completed,
  };
};

/** 0–1 completion ratio, used by the desktop progress indicator. */
export const completionRatio = (tasks: readonly Task[]): number => {
  if (tasks.length === 0) {
    return 0;
  }
  return countTasks(tasks).completed / tasks.length;
};
