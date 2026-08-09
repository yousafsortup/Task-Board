import React, { type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './IconButton';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../../responsive/useResponsive';

export interface AdaptiveDialogProps extends PropsWithChildren {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly testID?: string;
}

/**
 * One dialog, two personalities:
 *
 *  - compact  → a bottom sheet that rises from the edge of the screen, with a
 *               grab handle and safe-area padding, the way a phone should
 *  - >= medium → a centred, shadowed panel that never exceeds a comfortable
 *               reading width, the way a desktop window should
 *
 * The caller just renders `<AdaptiveDialog>` and never learns which is which.
 */
export const AdaptiveDialog = ({
  visible,
  onDismiss,
  title,
  subtitle,
  testID,
  children,
}: AdaptiveDialogProps) => {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={isCompact ? 'slide' : 'fade'}
      onRequestClose={onDismiss}
      supportedOrientations={['portrait', 'landscape']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: isCompact ? 'flex-end' : 'center',
            alignItems: isCompact ? 'stretch' : 'center',
            padding: isCompact ? 0 : theme.spacing.xxl,
          }}>
          {/* Scrim: tapping outside dismisses. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onDismiss}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <View
            testID={testID}
            style={[
              {
                width: '100%',
                maxWidth: isCompact ? undefined : 520,
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderBottomWidth: isCompact ? 0 : 1,
                borderTopLeftRadius: theme.radii.xl,
                borderTopRightRadius: theme.radii.xl,
                borderBottomLeftRadius: isCompact ? 0 : theme.radii.xl,
                borderBottomRightRadius: isCompact ? 0 : theme.radii.xl,
                paddingBottom: isCompact ? insets.bottom + theme.spacing.lg : theme.spacing.xl,
                maxHeight: '90%',
              },
              theme.elevation.high,
            ]}>
            {isCompact ? (
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  marginTop: theme.spacing.md,
                  backgroundColor: theme.colors.borderStrong,
                }}
              />
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.spacing.md,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
              }}>
              <View style={{ flex: 1 }}>
                <Text variant="heading">{title}</Text>
                {subtitle ? (
                  <Text
                    variant="caption"
                    color="textTertiary"
                    style={{ marginTop: 2 }}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <IconButton
                name="close"
                accessibilityLabel="Close"
                onPress={onDismiss}
                testID="dialog-close"
              />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.xl,
                paddingBottom: theme.spacing.sm,
                gap: theme.spacing.lg,
              }}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
