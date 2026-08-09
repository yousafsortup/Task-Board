import { sortTasks } from '../../src/domain';
import { makeTask } from '../support/factories';

describe('sortTasks', () => {
  const oldOpen = makeTask({ id: 'old-open', title: 'Beta', createdAt: 100 });
  const newOpen = makeTask({ id: 'new-open', title: 'Alpha', createdAt: 300 });
  const oldDone = makeTask({
    id: 'old-done',
    title: 'Delta',
    createdAt: 50,
    completed: true,
    completedAt: 400,
  });
  const newDone = makeTask({
    id: 'new-done',
    title: 'Charlie',
    createdAt: 200,
    completed: true,
    completedAt: 900,
  });

  const tasks = [oldOpen, newDone, newOpen, oldDone];

  it('"smart" floats open work to the top, newest first', () => {
    expect(sortTasks(tasks, 'smart').map(task => task.id)).toEqual([
      'new-open',
      'old-open',
      'new-done',
      'old-done',
    ]);
  });

  it('"newest" and "oldest" are exact mirrors', () => {
    const newest = sortTasks(tasks, 'newest').map(task => task.id);
    const oldest = sortTasks(tasks, 'oldest').map(task => task.id);

    expect(newest).toEqual([...oldest].reverse());
  });

  it('"title" sorts case-insensitively', () => {
    expect(sortTasks(tasks, 'title').map(task => task.title)).toEqual([
      'Alpha',
      'Beta',
      'Charlie',
      'Delta',
    ]);
  });

  it('does not mutate the source array', () => {
    const input = [...tasks];
    sortTasks(input, 'title');
    expect(input).toEqual(tasks);
  });
});
