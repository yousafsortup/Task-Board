import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  selectCompletionRatio,
  selectCounts,
  selectTaskById,
  selectVisibleTasks,
} from '../state/selectors';
import { useTaskActions, useTaskStore } from '../state/TaskStoreProvider';
import type {
  Task,
  TaskDraft,
  TaskFilter,
  TaskPatch,
  TaskSortOrder,
} from '../../../domain';
import type { TaskComposerHandle } from '../components/TaskComposer';

/**
 * The board's view-model.
 *
 * Every layout — phone stack, split, triptych — consumes this one hook, which
 * is precisely why there is no per-platform fork of the business logic: the
 * layouts differ in *arrangement* only, never in behaviour.
 */
export const useTaskBoard = () => {
  // Raw slices only. Each is a stable reference between updates, so no
  // selector ever hands React a freshly-allocated snapshot.
  const tasks = useTaskStore(state => state.tasks);
  const filter = useTaskStore(state => state.filter);
  const sortOrder = useTaskStore(state => state.sortOrder);
  const status = useTaskStore(state => state.status);
  const error = useTaskStore(state => state.error);
  const selectedId = useTaskStore(state => state.selectedId);
  const isSubmitting = useTaskStore(state => state.isSubmitting);

  const actions = useTaskActions();

  const composerRef = useRef<TaskComposerHandle>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    void actions.hydrate();
  }, [actions]);

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, filter, sortOrder),
    [tasks, filter, sortOrder],
  );

  const counts = useMemo(() => selectCounts(tasks), [tasks]);
  const completion = useMemo(() => selectCompletionRatio(tasks), [tasks]);
  const selectedTask = useMemo(
    () => selectTaskById(tasks, selectedId),
    [tasks, selectedId],
  );

  const addTask = useCallback(
    async (draft: TaskDraft): Promise<boolean> => {
      const result = await actions.addTask(draft);
      return result.ok;
    },
    [actions],
  );

  const saveTask = useCallback(
    async (id: string, patch: TaskPatch): Promise<boolean> => {
      const result = await actions.updateTask(id, patch);
      return result.ok;
    },
    [actions],
  );

  const toggleTask = useCallback(
    (id: string) => {
      void actions.toggleTask(id);
    },
    [actions],
  );

  const deleteTask = useCallback(
    (id: string) => {
      void actions.deleteTask(id);
      setDetailOpen(false);
    },
    [actions],
  );

  const clearCompleted = useCallback(() => {
    void actions.clearCompleted();
  }, [actions]);

  const changeFilter = useCallback(
    (next: TaskFilter) => actions.setFilter(next),
    [actions],
  );

  const changeSort = useCallback(
    (next: TaskSortOrder) => actions.setSortOrder(next),
    [actions],
  );

  /** Selecting a task opens the detail sheet where there is no detail pane. */
  const selectTask = useCallback(
    (id: string | null) => {
      actions.selectTask(id);
      setDetailOpen(id !== null);
    },
    [actions],
  );

  const openComposer = useCallback(() => {
    setComposerOpen(true);
    composerRef.current?.focus();
  }, []);

  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);

  return {
    // state
    tasks: tasks as readonly Task[],
    visibleTasks,
    counts,
    completion,
    filter,
    sortOrder,
    status,
    error,
    selectedId,
    selectedTask,
    isSubmitting,
    isHydrating: status === 'hydrating' || status === 'idle',

    // local UI state
    composerRef,
    composerOpen,
    detailOpen,

    // actions
    addTask,
    saveTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    changeFilter,
    changeSort,
    selectTask,
    openComposer,
    closeComposer,
    closeDetail,
    dismissError: actions.dismissError,
  };
};

export type TaskBoardViewModel = ReturnType<typeof useTaskBoard>;
