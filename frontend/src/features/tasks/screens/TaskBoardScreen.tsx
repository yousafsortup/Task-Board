import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { PaneLayout } from '../layouts/PaneLayout';
import { StackLayout } from '../layouts/StackLayout';
import { useTaskBoard } from '../hooks/useTaskBoard';
import { useTheme } from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import { useKeyboardShortcut } from '../../../shared/hooks/useKeyboardShortcut';

/**
 * The single screen of the app, and the only place that decides which layout
 * to draw.
 *
 * Note what this component does *not* do: it never asks which operating
 * system it is on. It asks how much room it has (`layoutMode`) and renders
 * accordingly, so a resized desktop window and a phone take exactly the same
 * code path.
 */
export const TaskBoardScreen = () => {
  const theme = useTheme();
  const { layoutMode } = useResponsive();
  const board = useTaskBoard();

  // No-op on iOS; real ⌘/Ctrl bindings in the desktop build.
  useKeyboardShortcut([
    { key: 'n', meta: true, handler: board.openComposer },
    {
      key: 'Escape',
      handler: () => {
        if (board.composerOpen) {
          board.closeComposer();
        } else if (board.detailOpen) {
          board.closeDetail();
        } else {
          board.selectTask(null);
        }
      },
    },
  ]);

  if (board.isHydrating) {
    return (
      <View
        testID="board-loading"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return layoutMode === 'stack' ? (
    <StackLayout board={board} />
  ) : (
    <PaneLayout board={board} />
  );
};
