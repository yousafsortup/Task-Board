import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';

import type { TaskActions, TaskStore } from './taskStore';

const TaskStoreContext = createContext<StoreApi<TaskStore> | null>(null);

export interface TaskStoreProviderProps extends PropsWithChildren {
  readonly store: StoreApi<TaskStore>;
}

/**
 * Provides the store *instance* rather than importing a singleton, so tests
 * and previews can mount the real UI over any repository they like.
 */
export const TaskStoreProvider = ({
  store,
  children,
}: TaskStoreProviderProps) => (
  <TaskStoreContext.Provider value={store}>{children}</TaskStoreContext.Provider>
);

/** Subscribes to a slice of task state. Always pass a narrow selector. */
export const useTaskStore = <TSlice,>(
  selector: (state: TaskStore) => TSlice,
): TSlice => {
  const store = useContext(TaskStoreContext);
  if (store === null) {
    throw new Error('useTaskStore must be used inside a <TaskStoreProvider>.');
  }
  return useStore(store, selector);
};

/**
 * The action bundle, with a *stable identity* for the store's lifetime.
 *
 * The store factory creates each action function exactly once and zustand
 * never replaces them, so memoising the first snapshot is safe — and it is
 * what makes `actions` usable in a `useEffect` dependency array without
 * re-running the effect on every state change.
 *
 * The return type is narrowed to `TaskActions` so nobody can accidentally read
 * (stale) state from the memoised snapshot.
 */
export const useTaskActions = (): TaskActions => {
  const store = useContext(TaskStoreContext);
  if (store === null) {
    throw new Error('useTaskActions must be used inside a <TaskStoreProvider>.');
  }
  return useMemo(() => store.getState(), [store]);
};
