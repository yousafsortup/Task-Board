import React, { memo, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import {
  Checkbox,
  Icon,
  IconButton,
  Text,
  Touchable,
  USE_NATIVE_DRIVER,
  useTheme,
} from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import { formatRelativeTime } from '../../../shared/lib/datetime';
import type { Task } from '../../../domain';

export interface TaskRowProps {
  readonly task: Task;
  readonly selected?: boolean;
  readonly onToggle: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onSelect: (id: string) => void;
  /** Staggers the entry animation when a whole list mounts at once. */
  readonly index?: number;
}

const TaskRowComponent = ({
  task,
  selected = false,
  onToggle,
  onDelete,
  onSelect,
  index = 0,
}: TaskRowProps) => {
  const theme = useTheme();
  const { pointerFine, isCompact } = useResponsive();

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: theme.motion.normal,
      delay: Math.min(index, 8) * 22,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [entrance, index, theme.motion.normal]);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}>
      <Touchable
        testID={`task-row-${task.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}${task.completed ? ', completed' : ''}`}
        accessibilityState={{ selected }}
        onPress={() => onSelect(task.id)}
        style={({ hovered, pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          paddingVertical: isCompact ? theme.spacing.sm : theme.spacing.md,
          paddingLeft: theme.spacing.xs,
          paddingRight: theme.spacing.sm,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accentBorder : 'transparent',
          backgroundColor: selected
            ? theme.colors.accentSoft
            : pressed
              ? theme.colors.surfacePressed
              : hovered
                ? theme.colors.surfaceHover
                : 'transparent',
        })}>
        {({ hovered }) => (
          <>
            <Checkbox
              checked={task.completed}
              onChange={() => onToggle(task.id)}
              accessibilityLabel={
                task.completed
                  ? `Mark "${task.title}" as active`
                  : `Mark "${task.title}" as complete`
              }
              testID={`task-checkbox-${task.id}`}
              size={isCompact ? 22 : 20}
            />

            <View style={{ flex: 1, paddingTop: isCompact ? 10 : 5, gap: 3 }}>
              <Text
                variant="bodyStrong"
                color={task.completed ? 'textTertiary' : 'textPrimary'}
                strikethrough={task.completed}
                numberOfLines={2}>
                {task.title}
              </Text>

              {task.note ? (
                <Text variant="body" color="textSecondary" numberOfLines={2}>
                  {task.note}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginTop: 2,
                }}>
                <Text variant="caption" color="textTertiary">
                  {task.completed
                    ? `Completed ${formatRelativeTime(task.completedAt ?? task.updatedAt)}`
                    : `Added ${formatRelativeTime(task.createdAt)}`}
                </Text>
                {task.note ? (
                  <>
                    <Icon name="dot" size={8} color="textTertiary" />
                    <Text variant="caption" color="textTertiary">
                      note
                    </Text>
                  </>
                ) : null}
              </View>
            </View>

            {/*
              On a pointer device the delete control stays hidden until the row
              is hovered, keeping long lists calm. On touch there is no hover,
              so it is always visible and always 44pt.
            */}
            <View
              style={{
                opacity: pointerFine ? (hovered || selected ? 1 : 0) : 1,
                paddingTop: isCompact ? 4 : 2,
              }}>
              <IconButton
                name="trash"
                tone="danger"
                size={isCompact ? 17 : 15}
                accessibilityLabel={`Delete "${task.title}"`}
                testID={`task-delete-${task.id}`}
                onPress={() => onDelete(task.id)}
              />
            </View>
          </>
        )}
      </Touchable>
    </Animated.View>
  );
};

/**
 * Memoised on the task reference. Because the domain layer treats tasks as
 * immutable, an unchanged task is referentially equal and the row skips
 * re-rendering entirely — which is what keeps a 500-row list smooth.
 */
export const TaskRow = memo(TaskRowComponent);
TaskRow.displayName = 'TaskRow';
