import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardHeader } from '../components/BoardHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { TaskComposer } from '../components/TaskComposer';
import { TaskDetailPanel } from '../components/TaskDetailPanel';
import { TaskList } from '../components/TaskList';
import { AdaptiveDialog, SegmentedControl, useTheme } from '../../../design-system';
import {
  TASK_FILTERS,
  TASK_FILTER_LABELS,
  type TaskFilter,
} from '../../../domain';
import type { TaskBoardViewModel } from '../hooks/useTaskBoard';

export interface StackLayoutProps {
  readonly board: TaskBoardViewModel;
}

/**
 * Phone layout: one column, one job at a time.
 *
 * Composing and editing are modal (a bottom sheet) because a phone has no
 * room to show list *and* form at once — the opposite trade-off from
 * `PaneLayout`, made from exactly the same view-model.
 */
export const StackLayout = ({ board }: StackLayoutProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const filterOptions = TASK_FILTERS.map(value => ({
    value,
    label: TASK_FILTER_LABELS[value],
    badge: board.counts[value],
  }));

  return (
    <View
      testID="layout-stack"
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
      }}>
      <BoardHeader
        variant="compact"
        filter={board.filter}
        counts={board.counts}
        sortOrder={board.sortOrder}
        onChangeSort={board.changeSort}
      />

      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        }}>
        <SegmentedControl<TaskFilter>
          testID="filter-tabs"
          accessibilityLabel="Filter tasks"
          options={filterOptions}
          value={board.filter}
          onChange={board.changeFilter}
        />
      </View>

      <ErrorBanner message={board.error} onDismiss={board.dismissError} />

      <TaskList
        tasks={board.visibleTasks}
        filter={board.filter}
        selectedId={board.selectedId}
        onToggle={board.toggleTask}
        onDelete={board.deleteTask}
        onSelect={board.selectTask}
        onEmptyAction={board.openComposer}
        emptyActionLabel="Add your first task"
        contentPadding={theme.spacing.lg}
      />

      <FloatingActionButton onPress={board.openComposer} />

      <AdaptiveDialog
        visible={board.composerOpen}
        onDismiss={board.closeComposer}
        title="New task"
        subtitle="Give it a title, and a note if it needs one."
        testID="composer-dialog">
        <TaskComposer
          ref={board.composerRef}
          embedded
          autoFocus
          busy={board.isSubmitting}
          onSubmit={board.addTask}
          onDismiss={board.closeComposer}
        />
      </AdaptiveDialog>

      <AdaptiveDialog
        visible={board.detailOpen && board.selectedTask !== null}
        onDismiss={board.closeDetail}
        title="Task details"
        subtitle={board.selectedTask?.title}
        testID="detail-dialog">
        <TaskDetailPanel
          embedded
          task={board.selectedTask}
          onSave={board.saveTask}
          onToggle={board.toggleTask}
          onDelete={board.deleteTask}
        />
      </AdaptiveDialog>
    </View>
  );
};
