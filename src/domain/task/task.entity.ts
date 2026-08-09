import { ValidationError } from '../errors';
import type { Clock } from '../../shared/lib/clock';
import type { IdGenerator } from '../../shared/lib/id';
import { err, ok, type Result } from '../../shared/types/result';

export type TaskId = string;

/**
 * The single source of truth for what a task *is*. Immutable by contract:
 * every mutation returns a new object, which keeps React re-renders honest
 * and makes optimistic updates trivially reversible.
 */
export interface Task {
  readonly id: TaskId;
  readonly title: string;
  /** Optional free-form note. `null` (never `undefined`) when absent. */
  readonly note: string | null;
  readonly completed: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly completedAt: number | null;
}

/** What the UI collects before a task exists. */
export interface TaskDraft {
  readonly title: string;
  readonly note?: string | null;
}

/** The subset of a task a caller is allowed to change. */
export interface TaskPatch {
  readonly title?: string;
  readonly note?: string | null;
  readonly completed?: boolean;
}

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_NOTE_MAX_LENGTH = 1000;

const collapseWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const normaliseNote = (note: string | null | undefined): string | null => {
  if (note == null) {
    return null;
  }
  const trimmed = note.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/**
 * Validates and normalises raw input. Returning a `Result` (rather than
 * throwing) lets the composer surface inline field errors without try/catch.
 */
export const validateTaskDraft = (
  draft: TaskDraft,
): Result<Required<TaskDraft>, ValidationError> => {
  const title = collapseWhitespace(draft.title ?? '');

  if (title.length === 0) {
    return err(new ValidationError('A task needs a title.', 'title'));
  }

  if (title.length > TASK_TITLE_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`,
        'title',
      ),
    );
  }

  const note = normaliseNote(draft.note);

  if (note != null && note.length > TASK_NOTE_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Keep the note under ${TASK_NOTE_MAX_LENGTH} characters.`,
        'note',
      ),
    );
  }

  return ok({ title, note });
};

/** Builds a valid `Task` from a validated draft. */
export const createTask = (
  draft: Required<TaskDraft>,
  deps: { readonly clock: Clock; readonly createId: IdGenerator },
): Task => {
  const timestamp = deps.clock.now();
  return {
    id: deps.createId(),
    title: draft.title,
    note: draft.note,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
};

/**
 * Applies a patch, keeping `completedAt` consistent with `completed`.
 * Returns the *same reference* when nothing actually changed so that
 * memoised list rows do not re-render for no reason.
 */
export const applyTaskPatch = (
  task: Task,
  patch: TaskPatch,
  clock: Clock,
): Result<Task, ValidationError> => {
  const nextTitle =
    patch.title === undefined ? task.title : collapseWhitespace(patch.title);
  const nextNote =
    patch.note === undefined ? task.note : normaliseNote(patch.note);
  const nextCompleted =
    patch.completed === undefined ? task.completed : patch.completed;

  if (nextTitle.length === 0) {
    return err(new ValidationError('A task needs a title.', 'title'));
  }

  if (nextTitle.length > TASK_TITLE_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`,
        'title',
      ),
    );
  }

  if (nextNote != null && nextNote.length > TASK_NOTE_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Keep the note under ${TASK_NOTE_MAX_LENGTH} characters.`,
        'note',
      ),
    );
  }

  const unchanged =
    nextTitle === task.title &&
    nextNote === task.note &&
    nextCompleted === task.completed;

  if (unchanged) {
    return ok(task);
  }

  const now = clock.now();

  return ok({
    ...task,
    title: nextTitle,
    note: nextNote,
    completed: nextCompleted,
    updatedAt: now,
    completedAt: nextCompleted
      ? task.completed
        ? task.completedAt
        : now
      : null,
  });
};

/** Convenience wrapper used by the checkbox affordance. */
export const toggleTaskCompletion = (task: Task, clock: Clock): Task => {
  const result = applyTaskPatch(task, { completed: !task.completed }, clock);
  // Toggling can never fail validation — the title is untouched.
  return result.ok ? result.value : task;
};
