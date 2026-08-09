import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Icon,
  Text,
  TextField,
  useTheme,
} from '../../../design-system';
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
} from '../../../shared/lib/datetime';
import type { Task, TaskPatch } from '../../../domain';

export interface TaskDetailPanelProps {
  readonly task: Task | null;
  readonly onSave: (id: string, patch: TaskPatch) => Promise<boolean>;
  readonly onToggle: (id: string) => void;
  readonly onDelete: (id: string) => void;
  /** Rendered inside the compact dialog rather than as a third pane. */
  readonly embedded?: boolean;
}

interface MetaRowProps {
  readonly label: string;
  readonly value: string;
}

const MetaRow = ({ label, value }: MetaRowProps) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
    <Text variant="caption" color="textTertiary">
      {label}
    </Text>
    <Text variant="caption" color="textSecondary" style={{ flexShrink: 1 }}>
      {value}
    </Text>
  </View>
);

/**
 * Edit surface for one task. It is the third pane on a wide window and the
 * contents of a bottom sheet on a phone — identical component, identical
 * behaviour, different container.
 */
export const TaskDetailPanel = ({
  task,
  onSave,
  onToggle,
  onDelete,
  embedded = false,
}: TaskDetailPanelProps) => {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the draft whenever a different task is selected.
  useEffect(() => {
    setTitle(task?.title ?? '');
    setNote(task?.note ?? '');
    setError(null);
  }, [task?.id, task?.title, task?.note]);

  const dirty = useMemo(() => {
    if (!task) {
      return false;
    }
    return title !== task.title || note !== (task.note ?? '');
  }, [task, title, note]);

  const handleSave = useCallback(async () => {
    if (!task) {
      return;
    }
    setSaving(true);
    const succeeded = await onSave(task.id, { title, note });
    setSaving(false);
    setError(succeeded ? null : 'Could not save those changes.');
  }, [task, title, note, onSave]);

  const handleRevert = useCallback(() => {
    setTitle(task?.title ?? '');
    setNote(task?.note ?? '');
    setError(null);
  }, [task]);

  if (!task) {
    return (
      <View
        testID="detail-empty"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.xxl,
        }}>
        <Icon name="pencil" size={26} color="textTertiary" />
        <Text variant="bodyStrong" color="textSecondary" align="center">
          No task selected
        </Text>
        <Text
          variant="caption"
          color="textTertiary"
          align="center"
          style={{ maxWidth: 240 }}>
          Pick a task from the list to read its note, edit it, or tick it off.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="task-detail"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: embedded ? 0 : theme.spacing.xl,
        gap: theme.spacing.lg,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
        <Checkbox
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          accessibilityLabel={
            task.completed ? 'Mark as active' : 'Mark as complete'
          }
          testID="detail-checkbox"
        />
        <Badge
          label={task.completed ? 'Completed' : 'Active'}
          tone={task.completed ? 'success' : 'accent'}
        />
      </View>

      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
        accessibilityLabel="Edit title"
        testID="detail-title"
        errorText={error}
      />

      <TextField
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="Add more detail…"
        accessibilityLabel="Edit note"
        testID="detail-note"
        multiline
        minHeight={120}
      />

      {dirty ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label="Save changes"
            size="sm"
            busy={saving}
            onPress={() => void handleSave()}
            testID="detail-save"
          />
          <Button
            label="Revert"
            variant="ghost"
            size="sm"
            onPress={handleRevert}
          />
        </View>
      ) : null}

      <Divider />

      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="overline" color="textTertiary">
          DETAILS
        </Text>
        <MetaRow
          label="Created"
          value={formatAbsoluteDateTime(task.createdAt)}
        />
        <MetaRow
          label="Last updated"
          value={formatRelativeTime(task.updatedAt)}
        />
        {task.completedAt !== null ? (
          <MetaRow
            label="Completed"
            value={formatAbsoluteDateTime(task.completedAt)}
          />
        ) : null}
      </View>

      <Divider />

      <Button
        label="Delete task"
        icon="trash"
        variant="ghost"
        size="sm"
        onPress={() => onDelete(task.id)}
        testID="detail-delete"
      />
    </ScrollView>
  );
};
