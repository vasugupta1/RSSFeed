import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header Component', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    starredOnly: false,
    setStarredOnly: vi.fn(),
    onAddFeedClick: vi.fn(),
    onSyncClick: vi.fn(),
    isSyncing: false,
  };

  it('renders the application header and branding', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('FeedlyLite')).toBeInTheDocument();
  });

  it('renders search input with correct placeholder and value', async () => {
    const user = userEvent.setup();
    render(<Header {...defaultProps} searchQuery="tech" />);
    
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('tech');

    // Simulate typing
    await user.type(input, 'news');
    // Note: since searchQuery is controlled, we check if the callback was invoked
    expect(defaultProps.setSearchQuery).toHaveBeenCalled();
  });

  it('handles toggling Starred filter', async () => {
    const user = userEvent.setup();
    const setStarredOnlyMock = vi.fn();
    
    const { rerender } = render(
      <Header {...defaultProps} starredOnly={false} setStarredOnly={setStarredOnlyMock} />
    );

    const starredBtn = screen.getByRole('button', { name: /starred/i });
    expect(starredBtn).toBeInTheDocument();
    expect(starredBtn).not.toHaveClass('bg-brand-light!'); // Verify non-active class behavior (V4 tailwind might match slightly differently, but we can verify click calls)

    await user.click(starredBtn);
    expect(setStarredOnlyMock).toHaveBeenCalledWith(true);

    // Rerender with starredOnly=true
    rerender(<Header {...defaultProps} starredOnly={true} setStarredOnly={setStarredOnlyMock} />);
    const activeStarredBtn = screen.getByRole('button', { name: /starred/i });
    expect(activeStarredBtn).toHaveClass('bg-brand-light!');
  });

  it('calls onSyncClick when sync button is clicked and not syncing', async () => {
    const user = userEvent.setup();
    const onSyncClickMock = vi.fn();

    render(<Header {...defaultProps} onSyncClick={onSyncClickMock} isSyncing={false} />);
    
    const syncBtn = screen.getByTitle('Sync all feeds');
    expect(syncBtn).toBeInTheDocument();
    expect(syncBtn).not.toBeDisabled();
    
    await user.click(syncBtn);
    expect(onSyncClickMock).toHaveBeenCalledTimes(1);
  });

  it('disables sync button and displays loading text when syncing', () => {
    render(<Header {...defaultProps} isSyncing={true} />);
    
    const syncBtn = screen.getByTitle('Sync all feeds');
    expect(syncBtn).toBeDisabled();
    expect(screen.getByText('Syncing…')).toBeInTheDocument();
  });

  it('calls onAddFeedClick when add feed button is clicked', async () => {
    const user = userEvent.setup();
    const onAddFeedClickMock = vi.fn();

    render(<Header {...defaultProps} onAddFeedClick={onAddFeedClickMock} />);
    
    const addFeedBtn = screen.getByRole('button', { name: /add feed/i });
    expect(addFeedBtn).toBeInTheDocument();
    
    await user.click(addFeedBtn);
    expect(onAddFeedClickMock).toHaveBeenCalledTimes(1);
  });
});
