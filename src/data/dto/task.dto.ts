/**
 * The wire/disk shape of a task. Kept separate from the domain `Task` on
 * purpose: persisted data outlives the code that wrote it, so the two are
 * allowed to drift and the mapper absorbs the difference.
 */
export interface TaskDto {
  id: string;
  title: string;
  note: string | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

/** Envelope written to storage — versioned so migrations stay possible. */
export interface TaskCollectionDto {
  version: number;
  tasks: TaskDto[];
}

export const TASK_SCHEMA_VERSION = 1;
