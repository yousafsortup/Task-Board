import React, { forwardRef, useCallback, useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

/**
 * React Native owns its own focus/blur event shapes (they differ from the
 * DOM's), so the handlers are typed from `TextInputProps` rather than spelled
 * out — that way they stay correct across React Native versions.
 */
type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>

import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';

export interface TextFieldProps
  extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  readonly label?: string;
  readonly errorText?: string | null;
  readonly helperText?: string;
  readonly multiline?: boolean;
  readonly minHeight?: number;
  readonly containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Text input with a themed focus ring. `TextInput` already adapts its own
 * behaviour per platform (software keyboard vs. hardware keyboard), so this
 * wrapper only has to own the visual state.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      errorText,
      helperText,
      multiline = false,
      minHeight,
      containerStyle,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

    const handleFocus = useCallback<FocusHandler>(
      event => {
        setFocused(true);
        onFocus?.(event);
      },
      [onFocus],
    );

    const handleBlur = useCallback<BlurHandler>(
      event => {
        setFocused(false);
        onBlur?.(event);
      },
      [onBlur],
    );

    const hasError = Boolean(errorText);
    const borderColor = hasError
      ? theme.colors.danger
      : focused
        ? theme.colors.accent
        : theme.colors.border;

    return (
      <View style={containerStyle}>
        {label ? (
          <Text
            variant="label"
            color="textSecondary"
            style={{ marginBottom: theme.spacing.xs }}>
            {label}
          </Text>
        ) : null}

        <View
          style={{
            borderRadius: theme.radii.md,
            borderWidth: 1,
            borderColor,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            justifyContent: 'center',
            minHeight: minHeight ?? (multiline ? 88 : 44),
            // A spread shadow with no blur draws a crisp focus ring that
            // renders identically on iOS and in the desktop build.
            boxShadow: focused
              ? `0px 0px 0px 3px ${
                  hasError ? theme.colors.dangerSoft : theme.colors.focusRing
                }`
              : undefined,
          }}>
          <TextInput
            ref={ref}
            {...rest}
            multiline={multiline}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={theme.colors.textTertiary}
            style={{
              ...theme.typography.body,
              fontWeight: theme.typography.body.fontWeight,
              color: theme.colors.textPrimary,
              paddingVertical: multiline ? theme.spacing.md : theme.spacing.sm,
              textAlignVertical: multiline ? 'top' : 'center',
              // Removes the default focus outline the browser draws on web;
              // the ring above replaces it consistently across platforms.
              outlineWidth: 0,
            }}
          />
        </View>

        {hasError || helperText ? (
          <Text
            variant="caption"
            color={hasError ? 'danger' : 'textTertiary'}
            style={{ marginTop: theme.spacing.xs }}>
            {errorText ?? helperText}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';
