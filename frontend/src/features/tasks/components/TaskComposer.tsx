import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Platform, TextInput, View } from 'react-native';

import {
  Button,
  Surface,
  Text,
  TextField,
  useTheme,
} from '../../../design-system';
import { useResponsive } from '../../../responsive/useResponsive';
import { TASK_TITLE_MAX_LENGTH, type TaskDraft } from '../../../domain';

export interface TaskComposerHandle {
  focus(): void;
}

export interface TaskComposerProps {
  readonly onSubmit: (draft: TaskDraft) => Promise<boolean>;
  readonly busy?: boolean;
  readonly autoFocus?: boolean;
  /** Rendered inside a dialog, where the card chrome would be redundant. */
  readonly embedded?: boolean;
  readonly onDismiss?: () => void;
}

/**
 * Add-a-task form.
 *
 * The note field stays out of the way until the composer is engaged, which
 * keeps the phone layout to a single line while still offering the full form
 * on desktop. Same component, same logic — only spacing responds to size.
 */
export const TaskComposer = forwardRef<TaskComposerHandle, TaskComposerProps>(
  ({ onSubmit, busy = false, autoFocus = false, embedded = false, onDismiss }, ref) => {
    const theme = useTheme();
    const { isCompact, pointerFine } = useResponsive();

    const titleRef = useRef<TextInput>(null);
    const noteRef = useRef<TextInput>(null);

    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [engaged, setEngaged] = useState(embedded);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        setEngaged(true);
        titleRef.current?.focus();
      },
    }));

    const showNoteField = embedded || engaged || note.length > 0;

    const reset = useCallback(() => {
      setTitle('');
      setNote('');
      setError(null);
    }, []);

    const handleSubmit = useCallback(async () => {
      if (title.trim().length === 0) {
        setError('A task needs a title.');
        titleRef.current?.focus();
        return;
      }

      const succeeded = await onSubmit({ title, note });
      if (succeeded) {
        reset();
        if (embedded) {
          onDismiss?.();
        } else {
          // Keep focus so several tasks can be added in a row.
          titleRef.current?.focus();
        }
      } else {
        setError('Could not save that task. Try again.');
      }
    }, [title, note, onSubmit, reset, embedded, onDismiss]);

    const body = (
      <>
        <TextField
          ref={titleRef}
          value={title}
          onChangeText={value => {
            setTitle(value);
            if (error) {
              setError(null);
            }
          }}
          onFocus={() => setEngaged(true)}
          placeholder="What needs doing?"
          accessibilityLabel="Task title"
          testID="composer-title"
          autoFocus={autoFocus}
          maxLength={TASK_TITLE_MAX_LENGTH}
          returnKeyType={showNoteField ? 'next' : 'done'}
          submitBehavior="submit"
          onSubmitEditing={() => {
            if (showNoteField && !embedded) {
              noteRef.current?.focus();
            } else {
              void handleSubmit();
            }
          }}
          errorText={error}
        />

        {showNoteField ? (
          <TextField
            ref={noteRef}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            accessibilityLabel="Task note"
            testID="composer-note"
            multiline
            minHeight={embedded ? 96 : 72}
            onSubmitEditing={() => void handleSubmit()}
          />
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            justifyContent: 'flex-end',
          }}>
          {pointerFine && !embedded ? (
            <Text variant="caption" color="textTertiary" style={{ flex: 1 }}>
              {`Press ${Platform.OS === 'web' ? '⌘/Ctrl' : '⌘'}+N to jump here`}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {engaged && !embedded && (title.length > 0 || note.length > 0) ? (
            <Button
              label="Clear"
              variant="ghost"
              size={isCompact ? 'md' : 'sm'}
              onPress={reset}
            />
          ) : null}

          <Button
            label="Add task"
            icon="plus"
            size={isCompact ? 'md' : 'sm'}
            busy={busy}
            disabled={title.trim().length === 0}
            onPress={() => void handleSubmit()}
            testID="composer-submit"
            fullWidth={isCompact && embedded}
          />
        </View>
      </>
    );

    if (embedded) {
      return <View style={{ gap: theme.spacing.md }}>{body}</View>;
    }

    return (
      <Surface
        elevation="low"
        radius="lg"
        padding={isCompact ? 'md' : 'lg'}
        style={{ gap: theme.spacing.md }}
        testID="task-composer">
        {body}
      </Surface>
    );
  },
);

TaskComposer.displayName = 'TaskComposer';
