import React from 'react';
import { View } from 'react-native';

import {
  Badge,
  Divider,
  Icon,
  ProgressBar,
  Text,
  ThemeModeControl,
  Touchable,
  useTheme,
} from '../../../design-system';
import {
  TASK_FILTERS,
  TASK_FILTER_LABELS,
  type TaskCounts,
  type TaskFilter,
} from '../../../domain';

export interface FilterSidebarProps {
  readonly filter: TaskFilter;
  readonly counts: TaskCounts;
  readonly completion: number;
  readonly onChangeFilter: (filter: TaskFilter) => void;
  readonly onClearCompleted: () => void;
}

const FILTER_ICON = {
  all: 'inbox',
  active: 'dot',
  completed: 'check',
} as const;

/**
 * Persistent navigation for `medium` and wider. This is the piece that makes
 * the desktop window feel like a desktop app rather than a stretched phone:
 * filters become a permanent rail with live counts instead of a control the
 * user has to go back to.
 */
export const FilterSidebar = ({
  filter,
  counts,
  completion,
  onChangeFilter,
  onClearCompleted,
}: FilterSidebarProps) => {
  const theme = useTheme();

  return (
    <View
      testID="filter-sidebar"
      style={{
        width: theme.layout.sidebarWidth,
        backgroundColor: theme.colors.backgroundSunken,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="check" size={16} color="onAccent" strokeWidth={2.4} />
        </View>
        <Text variant="heading">Task Board</Text>
      </View>

      <View accessibilityRole="tablist" style={{ gap: 2 }}>
        {TASK_FILTERS.map(value => {
          const selected = value === filter;
          return (
            <Touchable
              key={value}
              testID={`sidebar-filter-${value}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${TASK_FILTER_LABELS[value]}, ${counts[value]} tasks`}
              onPress={() => onChangeFilter(value)}
              style={({ hovered, pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                height: 38,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radii.sm,
                backgroundColor: selected
                  ? theme.colors.surface
                  : pressed
                    ? theme.colors.surfacePressed
                    : hovered
                      ? theme.colors.surfaceHover
                      : 'transparent',
                borderWidth: 1,
                borderColor: selected ? theme.colors.border : 'transparent',
              })}>
              <Icon
                name={FILTER_ICON[value]}
                size={15}
                color={selected ? 'accent' : 'textTertiary'}
              />
              <Text
                variant="label"
                color={selected ? 'textPrimary' : 'textSecondary'}
                style={{ flex: 1 }}>
                {TASK_FILTER_LABELS[value]}
              </Text>
              <Badge
                label={counts[value]}
                tone={selected ? 'accent' : 'neutral'}
              />
            </Touchable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="overline" color="textTertiary">
            PROGRESS
          </Text>
          <Text variant="caption" color="textSecondary">
            {`${counts.completed}/${counts.all}`}
          </Text>
        </View>
        <ProgressBar
          value={completion}
          accessibilityLabel="Completed tasks"
        />
      </View>

      <Divider />

      <View style={{ gap: theme.spacing.sm }}>
        <Touchable
          testID="sidebar-clear-completed"
          accessibilityRole="button"
          accessibilityLabel="Delete all completed tasks"
          disabled={counts.completed === 0}
          onPress={onClearCompleted}
          style={({ hovered }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            height: 34,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radii.sm,
            opacity: counts.completed === 0 ? 0.4 : 1,
            backgroundColor: hovered ? theme.colors.dangerSoft : 'transparent',
          })}>
          <Icon name="trash" size={14} color="textTertiary" />
          <Text variant="caption" color="textSecondary">
            Clear completed
          </Text>
        </Touchable>

        <View style={{ paddingHorizontal: theme.spacing.sm, gap: theme.spacing.xs }}>
          <Text variant="overline" color="textTertiary">
            APPEARANCE
          </Text>
          <ThemeModeControl variant="segmented" />
        </View>
      </View>
    </View>
  );
};
