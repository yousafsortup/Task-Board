import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  DESKTOP,
  PHONE,
  TABLET,
  createTestServices,
  renderApp,
} from '../support/renderApp';

/**
 * Entrance animations are decorative and keep scheduling frames after the
 * assertions are done. Fake timers let each test drain them before teardown,
 * which keeps the output free of `act(...)` warnings without weakening what
 * is actually being tested.
 */
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** Adds a task through whichever composer the current layout is showing. */
const addTask = async (title: string, openComposerFirst: boolean) => {
  if (openComposerFirst) {
    fireEvent.press(await screen.findByTestId('fab-add-task'));
  }

  const input = await screen.findByTestId('composer-title');
  fireEvent.changeText(input, title);
  fireEvent.press(screen.getByTestId('composer-submit'));

  await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
};

describe('Task Board — add / complete / delete on a phone-sized screen', () => {
  it('adds a task through the bottom-sheet composer', async () => {
    renderApp({ viewport: PHONE });
    await screen.findByTestId('layout-stack');

    await addTask('Buy milk', true);

    expect(screen.getByText('Buy milk')).toBeTruthy();
  });

  it('completes a task and moves it out of the Active filter', async () => {
    renderApp({ viewport: PHONE });
    await screen.findByTestId('layout-stack');
    await addTask('Water the plants', true);

    const checkbox = screen.getByLabelText(
      'Mark "Water the plants" as complete',
    );
    fireEvent.press(checkbox);

    await waitFor(() =>
      expect(
        screen.getByLabelText('Mark "Water the plants" as active'),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('filter-tabs-active'));
    await waitFor(() => expect(screen.queryByText('Water the plants')).toBeNull());

    fireEvent.press(screen.getByTestId('filter-tabs-completed'));
    await waitFor(() =>
      expect(screen.getByText('Water the plants')).toBeTruthy(),
    );
  });

  it('deletes a task', async () => {
    renderApp({ viewport: PHONE });
    await screen.findByTestId('layout-stack');
    await addTask('Cancel the subscription', true);

    fireEvent.press(screen.getByLabelText('Delete "Cancel the subscription"'));

    await waitFor(() =>
      expect(screen.queryByText('Cancel the subscription')).toBeNull(),
    );
  });

  it('shows an empty state when there is nothing to show', async () => {
    renderApp({ viewport: PHONE });
    await screen.findByTestId('layout-stack');

    expect(await screen.findByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Your board is clear')).toBeTruthy();
  });
});

describe('Task Board — layout adapts to the window, not the platform', () => {
  it('uses the single-column stack layout at phone width', async () => {
    renderApp({ viewport: PHONE });

    expect(await screen.findByTestId('layout-stack')).toBeTruthy();
    expect(screen.queryByTestId('filter-sidebar')).toBeNull();
    expect(screen.queryByTestId('detail-pane')).toBeNull();
  });

  it('adds a persistent sidebar — but no detail pane — at tablet width', async () => {
    renderApp({ viewport: TABLET });

    expect(await screen.findByTestId('layout-pane')).toBeTruthy();
    expect(screen.getByTestId('filter-sidebar')).toBeTruthy();
    expect(screen.queryByTestId('detail-pane')).toBeNull();
    // The composer is inline once there is room for it.
    expect(screen.getByTestId('task-composer')).toBeTruthy();
  });

  it('adds the third pane at desktop width', async () => {
    renderApp({ viewport: DESKTOP });

    expect(await screen.findByTestId('layout-pane')).toBeTruthy();
    expect(screen.getByTestId('filter-sidebar')).toBeTruthy();
    expect(screen.getByTestId('detail-pane')).toBeTruthy();
    expect(screen.getByTestId('detail-empty')).toBeTruthy();
  });

  it('filters from the sidebar on desktop, exactly as the tabs do on phone', async () => {
    renderApp({ viewport: DESKTOP });
    await screen.findByTestId('layout-pane');
    await addTask('Review the pull request', false);

    fireEvent.press(screen.getByTestId('sidebar-filter-completed'));
    await waitFor(() =>
      expect(screen.queryByText('Review the pull request')).toBeNull(),
    );

    fireEvent.press(screen.getByTestId('sidebar-filter-active'));
    await waitFor(() =>
      expect(screen.getByText('Review the pull request')).toBeTruthy(),
    );
  });

  it('opens the selected task in the detail pane on desktop', async () => {
    renderApp({ viewport: DESKTOP });
    await screen.findByTestId('layout-pane');
    await addTask('Draft the release notes', false);

    fireEvent.press(screen.getByText('Draft the release notes'));

    await waitFor(() => expect(screen.getByTestId('task-detail')).toBeTruthy());
  });
});

describe('Task Board — persistence across restarts', () => {
  it('reloads tasks written by a previous session', async () => {
    const services = createTestServices();

    const first = renderApp({ viewport: PHONE, services });
    await screen.findByTestId('layout-stack');
    await addTask('Survive a restart', true);
    first.unmount();

    // Same services (same storage), brand new component tree — i.e. a relaunch.
    renderApp({ viewport: PHONE, services });

    expect(await screen.findByText('Survive a restart')).toBeTruthy();
  });
});
