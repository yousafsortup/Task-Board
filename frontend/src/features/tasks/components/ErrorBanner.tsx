import React from 'react';
import { View } from 'react-native';

import { IconButton, Text, useTheme } from '../../../design-system';

export interface ErrorBannerProps {
  readonly message: string | null;
  readonly onDismiss: () => void;
}

/**
 * Non-blocking failure surface. Persistence errors are rare locally but very
 * real once the repository talks to a network, so the UI has a place to put
 * them from day one.
 */
export const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => {
  const theme = useTheme();

  if (!message) {
    return null;
  }

  return (
    <View
      testID="error-banner"
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.dangerSoft,
        borderWidth: 1,
        borderColor: theme.colors.danger,
      }}>
      <Text variant="caption" color="danger" style={{ flex: 1 }}>
        {message}
      </Text>
      <IconButton
        name="close"
        size={14}
        accessibilityLabel="Dismiss error"
        onPress={onDismiss}
      />
    </View>
  );
};
