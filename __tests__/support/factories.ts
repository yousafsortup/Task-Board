import type { Task } from '../../src/domain';

let sequence = 0;

/**
 * Builds a valid `Task` with sensible defaults so each test only has to state
 * the field it actually cares about.
 */
export const makeTask = (overrides: Partial<Task> = {}): Task => {
  sequence += 1;
  const createdAt = overrides.createdAt ?? 1_700_000_000_000 + sequence * 1_000;
  const completed = overrides.completed ?? false;

  return {
    id: overrides.id ?? `task-${sequence}`,
    title: overrides.title ?? `Task ${sequence}`,
    note: overrides.note ?? null,
    completed,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    completedAt:
      overrides.completedAt ?? (completed ? createdAt + 500 : null),
  };
};

export const resetTaskFactory = () => {
  sequence = 0;
};
