import React, { useCallback } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Text,
  ThemeModeControl,
  useTheme,
} from '../../../design-system';
import { formatDayHeadline } from '../../../shared/lib/datetime';
import {
  TASK_FILTER_LABELS,
  TASK_SORT_LABELS,
  TASK_SORT_ORDERS,
  type TaskCounts,
  type TaskFilter,
  type TaskSortOrder,
} from '../../../domain';

export interface BoardHeaderProps {
  readonly variant: 'compact' | 'pane';
  readonly filter: TaskFilter;
  readonly counts: TaskCounts;
  readonly sortOrder: TaskSortOrder;
  readonly onChangeSort: (order: TaskSortOrder) => void;
}

const remainingCopy = (counts: TaskCounts): string => {
  if (counts.all === 0) {
    return 'Nothing on the board yet';
  }
  if (counts.active === 0) {
    return 'All caught up';
  }
  return `${counts.active} ${counts.active === 1 ? 'task' : 'tasks'} left`;
};

export const BoardHeader = ({
  variant,
  filter,
  counts,
  sortOrder,
  onChangeSort,
}: BoardHeaderProps) => {
  const theme = useTheme();
  const isCompact = variant === 'compact';

  const cycleSort = useCallback(() => {
    const index = TASK_SORT_ORDERS.indexOf(sortOrder);
    onChangeSort(TASK_SORT_ORDERS[(index + 1) % TASK_SORT_ORDERS.length]);
  }, [sortOrder, onChangeSort]);

  return (
    <View
      testID="board-header"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: isCompact ? theme.spacing.lg : theme.spacing.xxl,
        paddingTop: isCompact ? theme.spacing.md : theme.spacing.xl,
        paddingBottom: isCompact ? theme.spacing.sm : theme.spacing.md,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        {isCompact ? (
          <>
            <Text variant="display">Task Board</Text>
            {/*
              The date is dropped on a phone. There is only room for one line
              beside the controls, and "3 tasks left" is the part that earns
              its place — adapting the *content*, not just the box it sits in.
            */}
            <Text variant="caption" color="textTertiary" numberOfLines={1}>
              {remainingCopy(counts)}
            </Text>
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}>
              <Text variant="title">{TASK_FILTER_LABELS[filter]}</Text>
              <Badge label={counts[filter]} />
            </View>
            <Text variant="caption" color="textTertiary">
              {`${formatDayHeadline()} · ${remainingCopy(counts)}`}
            </Text>
          </>
        )}
      </View>

      <Button
        label={`Sort: ${TASK_SORT_LABELS[sortOrder]}`}
        variant="ghost"
        size="sm"
        onPress={cycleSort}
        testID="sort-toggle"
        accessibilityLabel={`Sort order: ${TASK_SORT_LABELS[sortOrder]}. Tap to change.`}
      />

      {isCompact ? <ThemeModeControl /> : null}
    </View>
  );
};
