import React from 'react';
import { View } from 'react-native';

import { Button, Icon, Text, useTheme, type IconName } from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import type { TaskFilter } from '../../../domain';

export interface EmptyStateProps {
  readonly filter: TaskFilter;
  readonly onAction?: () => void;
  readonly actionLabel?: string;
}

const COPY: Record<
  TaskFilter,
  { icon: IconName; title: string; body: string }
> = {
  all: {
    icon: 'inbox',
    title: 'Your board is clear',
    body: 'Add the first task and it will show up right here — on every device you run this on.',
  },
  active: {
    icon: 'check',
    title: 'Nothing left to do',
    body: 'Every task is complete. Switch to “All” to look back over what you finished.',
  },
  completed: {
    icon: 'dot',
    title: 'Nothing completed yet',
    body: 'Tick a task off and it will be filed here.',
  },
};

export const EmptyState = ({ filter, onAction, actionLabel }: EmptyStateProps) => {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const copy = COPY[filter];

  return (
    <View
      testID="empty-state"
      accessibilityRole="summary"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: isCompact ? theme.spacing.xxxl : theme.spacing.giant,
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.accentSoft,
          borderWidth: 1,
          borderColor: theme.colors.accentBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name={copy.icon} size={28} color="accent" />
      </View>

      <Text variant="heading" align="center">
        {copy.title}
      </Text>

      <Text
        variant="body"
        color="textSecondary"
        align="center"
        style={{ maxWidth: 340 }}>
        {copy.body}
      </Text>

      {onAction && actionLabel ? (
        <Button
          label={actionLabel}
          icon="plus"
          variant="secondary"
          size="md"
          onPress={onAction}
          style={{ marginTop: theme.spacing.xs }}
        />
      ) : null}
    </View>
  );
};
