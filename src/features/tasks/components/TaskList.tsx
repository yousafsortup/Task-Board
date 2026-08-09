import React, { useCallback } from 'react';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';

import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';
import { useTheme } from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import type { Task, TaskFilter } from '../../../domain';

export interface TaskListProps {
  readonly tasks: readonly Task[];
  readonly filter: TaskFilter;
  readonly selectedId: string | null;
  readonly onToggle: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onSelect: (id: string) => void;
  readonly onEmptyAction?: () => void;
  readonly emptyActionLabel?: string;
  readonly ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  readonly contentPadding?: number;
}

/**
 * The list adapts its *shape*, not just its width: a single column on a phone,
 * and two columns once the window is wide enough that a single column would
 * leave a canyon of whitespace down each side.
 *
 * `FlatList` needs a fresh identity when `numColumns` changes, hence the `key`.
 */
export const TaskList = ({
  tasks,
  filter,
  selectedId,
  onToggle,
  onDelete,
  onSelect,
  onEmptyAction,
  emptyActionLabel,
  ListHeaderComponent,
  contentPadding,
}: TaskListProps) => {
  const theme = useTheme();
  const { isWide } = useResponsive();
  const numColumns = isWide ? 2 : 1;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Task>) => (
      <View style={numColumns > 1 ? { flex: 1 / numColumns } : undefined}>
        <TaskRow
          task={item}
          index={index}
          selected={item.id === selectedId}
          onToggle={onToggle}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      </View>
    ),
    [numColumns, selectedId, onToggle, onDelete, onSelect],
  );

  const keyExtractor = useCallback((task: Task) => task.id, []);

  return (
    <FlatList
      key={`task-list-${numColumns}`}
      testID="task-list"
      style={{ flex: 1 }}
      data={tasks as Task[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      columnWrapperStyle={
        numColumns > 1 ? { gap: theme.spacing.md } : undefined
      }
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState
          filter={filter}
          onAction={onEmptyAction}
          actionLabel={emptyActionLabel}
        />
      }
      contentContainerStyle={{
        padding: contentPadding ?? theme.spacing.lg,
        gap: theme.spacing.xxs,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // Windowing keeps long boards responsive on a phone; the same numbers
      // are harmless on desktop where the viewport is larger anyway.
      initialNumToRender={12}
      windowSize={9}
      removeClippedSubviews={false}
    />
  );
};
