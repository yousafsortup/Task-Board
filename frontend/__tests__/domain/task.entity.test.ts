import {
  applyTaskPatch,
  createTask,
  TASK_TITLE_MAX_LENGTH,
  toggleTaskCompletion,
  validateTaskDraft,
} from '../../src/domain';
import { createFixedClock } from '../../src/shared/lib/clock';
import { createSequentialIdGenerator } from '../../src/shared/lib/id';
import { makeTask } from '../support/factories';

describe('validateTaskDraft', () => {
  it('accepts a title and normalises surrounding whitespace', () => {
    const result = validateTaskDraft({ title: '  Buy   milk  ' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe('Buy milk');
    }
  });

  it('rejects a blank title', () => {
    const result = validateTaskDraft({ title: '   ' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe('title');
    }
  });

  it('rejects a title beyond the maximum length', () => {
    const result = validateTaskDraft({
      title: 'x'.repeat(TASK_TITLE_MAX_LENGTH + 1),
    });

    expect(result.ok).toBe(false);
  });

  it('treats an empty note as no note at all', () => {
    const result = validateTaskDraft({ title: 'Task', note: '   ' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.note).toBeNull();
    }
  });
});

describe('createTask', () => {
  it('stamps the task with the injected clock and id generator', () => {
    const clock = createFixedClock(1_000);
    const createId = createSequentialIdGenerator('task');

    const task = createTask({ title: 'Ship it', note: null }, { clock, createId });

    expect(task).toMatchObject({
      id: 'task-1',
      title: 'Ship it',
      note: null,
      completed: false,
      createdAt: 1_000,
      updatedAt: 1_000,
      completedAt: null,
    });
  });
});

describe('applyTaskPatch', () => {
  const clock = createFixedClock(5_000);

  it('records completedAt when a task is completed', () => {
    const result = applyTaskPatch(
      makeTask({ completed: false }),
      { completed: true },
      clock,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.completed).toBe(true);
      expect(result.value.completedAt).toBe(5_000);
      expect(result.value.updatedAt).toBe(5_000);
    }
  });

  it('clears completedAt when a task is reopened', () => {
    const result = applyTaskPatch(
      makeTask({ completed: true }),
      { completed: false },
      clock,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.completedAt).toBeNull();
    }
  });

  it('preserves the original completion time on a no-op re-complete', () => {
    const task = makeTask({ completed: true, completedAt: 42 });
    const result = applyTaskPatch(task, { completed: true }, clock);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.completedAt).toBe(42);
    }
  });

  it('returns the identical reference when nothing changed', () => {
    const task = makeTask({ title: 'Same', note: null });
    const result = applyTaskPatch(task, { title: 'Same' }, clock);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Referential equality is what lets memoised rows skip re-rendering.
      expect(result.value).toBe(task);
    }
  });

  it('rejects a patch that would blank the title', () => {
    const result = applyTaskPatch(makeTask(), { title: '  ' }, clock);

    expect(result.ok).toBe(false);
  });
});

describe('toggleTaskCompletion', () => {
  it('flips completion in both directions', () => {
    const clock = createFixedClock(9_000);
    const open = makeTask({ completed: false });

    const closed = toggleTaskCompletion(open, clock);
    expect(closed.completed).toBe(true);

    const reopened = toggleTaskCompletion(closed, clock);
    expect(reopened.completed).toBe(false);
    expect(reopened.completedAt).toBeNull();
  });
});
