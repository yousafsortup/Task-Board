import {
  completionRatio,
  countTasks,
  filterTasks,
  isTaskFilter,
  TASK_FILTERS,
} from '../../src/domain';
import { makeTask } from '../support/factories';

/**
 * The filter is the feature the assessment calls out by name, so it is tested
 * as pure data-in/data-out — no rendering, no store, no platform.
 */
describe('filterTasks', () => {
  const active = makeTask({ id: 'a', title: 'Active task' });
  const alsoActive = makeTask({ id: 'b', title: 'Another active' });
  const done = makeTask({ id: 'c', title: 'Done task', completed: true });

  const tasks = [active, alsoActive, done];

  it('returns everything for "all"', () => {
    expect(filterTasks(tasks, 'all')).toEqual(tasks);
  });

  it('returns only incomplete tasks for "active"', () => {
    expect(filterTasks(tasks, 'active')).toEqual([active, alsoActive]);
  });

  it('returns only completed tasks for "completed"', () => {
    expect(filterTasks(tasks, 'completed')).toEqual([done]);
  });

  it('never mutates the input array', () => {
    const input = [...tasks];
    filterTasks(input, 'active');
    expect(input).toEqual(tasks);
  });

  it('handles an empty board for every filter', () => {
    for (const filter of TASK_FILTERS) {
      expect(filterTasks([], filter)).toEqual([]);
    }
  });
});

describe('countTasks', () => {
  it('splits the board into all / active / completed', () => {
    const tasks = [
      makeTask({ id: '1' }),
      makeTask({ id: '2', completed: true }),
      makeTask({ id: '3', completed: true }),
    ];

    expect(countTasks(tasks)).toEqual({ all: 3, active: 1, completed: 2 });
  });

  it('reports zeroes for an empty board', () => {
    expect(countTasks([])).toEqual({ all: 0, active: 0, completed: 0 });
  });

  it('always satisfies active + completed === all', () => {
    const tasks = Array.from({ length: 25 }, (_, index) =>
      makeTask({ id: String(index), completed: index % 3 === 0 }),
    );

    const counts = countTasks(tasks);
    expect(counts.active + counts.completed).toBe(counts.all);
  });
});

describe('completionRatio', () => {
  it('is 0 for an empty board rather than NaN', () => {
    expect(completionRatio([])).toBe(0);
  });

  it('is 1 when everything is done', () => {
    expect(
      completionRatio([
        makeTask({ id: '1', completed: true }),
        makeTask({ id: '2', completed: true }),
      ]),
    ).toBe(1);
  });

  it('reports the completed fraction', () => {
    expect(
      completionRatio([
        makeTask({ id: '1', completed: true }),
        makeTask({ id: '2' }),
        makeTask({ id: '3' }),
        makeTask({ id: '4' }),
      ]),
    ).toBe(0.25);
  });
});

describe('isTaskFilter', () => {
  it('accepts the known filters and rejects anything else', () => {
    expect(isTaskFilter('active')).toBe(true);
    expect(isTaskFilter('archived')).toBe(false);
    expect(isTaskFilter(undefined)).toBe(false);
  });
});
