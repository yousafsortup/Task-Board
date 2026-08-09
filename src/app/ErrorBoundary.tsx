import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * Last line of defence. Deliberately styled with raw primitives rather than
 * the design system: if the theme provider is what failed, this screen still
 * has to render.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // A real app would forward this to Sentry/Crashlytics here.
    console.error('[TaskBoard] Unhandled error', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            backgroundColor: '#0B0C10',
          }}>
          <Text
            style={{
              color: '#ECEEF3',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 8,
            }}>
            Something went wrong
          </Text>
          <Text
            style={{ color: '#9AA3B2', fontSize: 14, textAlign: 'center' }}>
            {error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
