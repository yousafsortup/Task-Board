import type { Task } from '../../domain';
import {
  TASK_SCHEMA_VERSION,
  type TaskCollectionDto,
  type TaskDto,
} from '../dto/task.dto';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const asBoolean = (value: unknown): boolean => value === true;

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const toTaskDto = (task: Task): TaskDto => ({
  id: task.id,
  title: task.title,
  note: task.note,
  completed: task.completed,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  completedAt: task.completedAt,
});

/**
 * Parses one persisted record. Returns `null` instead of throwing so a single
 * corrupt entry cannot take the whole board down on launch.
 */
export const toTaskEntity = (input: unknown): Task | null => {
  if (!isRecord(input)) {
    return null;
  }

  const id = asString(input.id);
  const title = asString(input.title);

  if (id.length === 0 || title.length === 0) {
    return null;
  }

  const createdAt = asNumber(input.createdAt, Date.now());
  const completed = asBoolean(input.completed);

  return {
    id,
    title,
    note: asNullableString(input.note),
    completed,
    createdAt,
    updatedAt: asNumber(input.updatedAt, createdAt),
    completedAt: completed
      ? (asNullableNumber(input.completedAt) ?? createdAt)
      : null,
  };
};

export const toTaskCollectionDto = (
  tasks: readonly Task[],
): TaskCollectionDto => ({
  version: TASK_SCHEMA_VERSION,
  tasks: tasks.map(toTaskDto),
});

/**
 * Reads the storage envelope. Tolerates both the current envelope and a bare
 * array (the shape a v0 build would have written), which is exactly the kind
 * of drift the DTO boundary exists to absorb.
 */
export const toTaskEntities = (input: unknown): Task[] => {
  const rawTasks = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.tasks)
      ? input.tasks
      : [];

  const tasks: Task[] = [];
  for (const raw of rawTasks) {
    const task = toTaskEntity(raw);
    if (task !== null) {
      tasks.push(task);
    }
  }
  return tasks;
};
