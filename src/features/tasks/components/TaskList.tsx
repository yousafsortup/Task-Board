import React, { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from 'react-native';

import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';
import { Divider, useTheme } from '../../../design-system';
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
  readonly contentPadding?: number;
}

/**
 * Width at which a second column earns its place. Below it, a single wide
 * column is more readable than two cramped ones.
 */
const TWO_COLUMN_MIN_WIDTH = 880;

/**
 * The list adapts its *shape*, not just its width: one column on a phone, two
 * once there is genuinely room.
 *
 * The decision is made from the list's own measured width rather than the
 * window's, which matters because the sidebar and detail pane eat into it — a
 * 1440px window with three panes leaves the list about 800px, and that is one
 * column's worth of space, not two. This is a container query in spirit, and
 * it is why the layout never looks cramped at in-between sizes.
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
  contentPadding,
}: TaskListProps) => {
  const theme = useTheme();
  const [availableWidth, setAvailableWidth] = useState(0);
  const numColumns = availableWidth >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setAvailableWidth(event.nativeEvent.layout.width);
  }, []);

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

  /** Hairlines keep a dense single column scannable; a grid reads fine without. */
  const renderSeparator = useCallback(
    () => <Divider inset={theme.spacing.xxl} style={{ marginVertical: 2 }} />,
    [theme.spacing.xxl],
  );

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <FlatList
        key={`task-list-${numColumns}`}
        testID="task-list"
        style={{ flex: 1 }}
        data={tasks as Task[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        columnWrapperStyle={
          numColumns > 1
            ? { gap: theme.spacing.lg, marginBottom: theme.spacing.sm }
            : undefined
        }
        ItemSeparatorComponent={numColumns === 1 ? renderSeparator : undefined}
        ListEmptyComponent={
          <EmptyState
            filter={filter}
            onAction={onEmptyAction}
            actionLabel={emptyActionLabel}
          />
        }
        contentContainerStyle={{
          padding: contentPadding ?? theme.spacing.lg,
          paddingTop: theme.spacing.xs,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Windowing keeps long boards smooth on a phone; the same numbers are
        // harmless on desktop, where the viewport is larger anyway.
        initialNumToRender={12}
        windowSize={9}
        removeClippedSubviews={false}
      />
    </View>
  );
};
