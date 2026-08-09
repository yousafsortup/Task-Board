import { LocalTaskRepository } from './LocalTaskRepository';
import { createInMemoryKeyValueStore } from '../storage/inMemoryKeyValueStore';
import type { Clock } from '../../shared/lib/clock';
import type { IdGenerator } from '../../shared/lib/id';
import type { Task } from '../../domain';
import { toTaskCollectionDto } from '../mappers/task.mapper';
import { TASKS_STORAGE_KEY } from './LocalTaskRepository';

/**
 * A repository with no side effects outside the process — used by the test
 * suite and by the "try it without persistence" path. It reuses
 * `LocalTaskRepository` so tests exercise the real logic, not a stunt double.
 */
export const createInMemoryTaskRepository = (options?: {
  readonly seed?: readonly Task[];
  readonly clock?: Clock;
  readonly createId?: IdGenerator;
}): LocalTaskRepository =>
  new LocalTaskRepository({
    store: createInMemoryKeyValueStore(
      options?.seed
        ? {
            [TASKS_STORAGE_KEY]: JSON.stringify(
              toTaskCollectionDto(options.seed),
            ),
          }
        : {},
    ),
    clock: options?.clock,
    createId: options?.createId,
  });
