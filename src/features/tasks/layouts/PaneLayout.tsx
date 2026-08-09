import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardHeader } from '../components/BoardHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { FilterSidebar } from '../components/FilterSidebar';
import { TaskComposer } from '../components/TaskComposer';
import { TaskDetailPanel } from '../components/TaskDetailPanel';
import { TaskList } from '../components/TaskList';
import { AdaptiveDialog, useTheme } from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import type { TaskBoardViewModel } from '../hooks/useTaskBoard';

export interface PaneLayoutProps {
  readonly board: TaskBoardViewModel;
}

/**
 * Desktop layout: a permanent filter rail, an always-available composer, and
 * — once the window is wide enough — a third pane for the selected task.
 *
 * Panes appear and disappear as the window is resized, live, because
 * `useResponsive` is driven by `useWindowDimensions`. Between `medium` and
 * `expanded` the detail view falls back to the same dialog the phone uses,
 * so no state or component is duplicated to support the middle size.
 */
export const PaneLayout = ({ board }: PaneLayoutProps) => {
  const theme = useTheme();
  const { hasDetailPane } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="layout-pane"
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
      }}>
      <FilterSidebar
        filter={board.filter}
        counts={board.counts}
        completion={board.completion}
        onChangeFilter={board.changeFilter}
        onClearCompleted={board.clearCompleted}
      />

      <View style={{ flex: 1, minWidth: 0 }}>
        <BoardHeader
          variant="pane"
          filter={board.filter}
          counts={board.counts}
          sortOrder={board.sortOrder}
          onChangeSort={board.changeSort}
        />

        <View
          style={{
            paddingHorizontal: theme.spacing.xxl,
            paddingBottom: theme.spacing.md,
          }}>
          <TaskComposer
            ref={board.composerRef}
            busy={board.isSubmitting}
            onSubmit={board.addTask}
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
          contentPadding={theme.spacing.xxl}
        />
      </View>

      {hasDetailPane ? (
        <View
          testID="detail-pane"
          style={{
            width: theme.layout.detailPaneWidth,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}>
          <TaskDetailPanel
            task={board.selectedTask}
            onSave={board.saveTask}
            onToggle={board.toggleTask}
            onDelete={board.deleteTask}
          />
        </View>
      ) : (
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
      )}
    </View>
  );
};
