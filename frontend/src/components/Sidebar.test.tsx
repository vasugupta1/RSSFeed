import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import type { Feed } from '../types';

describe('Sidebar Component', () => {
  const mockFeeds: Feed[] = [
    {
      id: 'feed-1',
      title: 'TechCrunch',
      link: 'https://techcrunch.com',
      description: 'Startup news',
      items: [],
    },
    {
      id: 'feed-2',
      title: 'Hacker News',
      link: 'https://news.ycombinator.com',
      description: 'Hacker news',
      items: [],
    }
  ];

  const mockFeedStats = {
    all: { total: 10, unread: 4 },
    starred: { total: 2, unread: 0 },
    summarized: { total: 5, unread: 1 },
    byFeed: {
      'feed-1': { total: 6, unread: 3 },
      'feed-2': { total: 4, unread: 1 },
    }
  };

  const defaultProps = {
    feeds: mockFeeds,
    activeFeedId: 'all',
    setActiveFeedId: vi.fn(),
    setStarredOnly: vi.fn(),
    feedStats: mockFeedStats,
  };

  it('renders fixed navigation categories with correct unread counts', () => {
    render(<Sidebar {...defaultProps} />);

    // Check headings
    expect(screen.getByText('Feeds')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();

    // Check standard items
    expect(screen.getByText('All Feeds')).toBeInTheDocument();
    expect(screen.getByText('Starred Articles')).toBeInTheDocument();
    expect(screen.getByText('AI Summarized')).toBeInTheDocument();

    // Check counts
    expect(screen.getByText('4')).toBeInTheDocument(); // Unread count for All Feeds
    expect(screen.getByText('2')).toBeInTheDocument(); // Starred total count
    expect(screen.getByText('5')).toBeInTheDocument(); // AI Summarized total count
  });

  it('renders subscriptions list with appropriate titles and unread indicators', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('TechCrunch')).toBeInTheDocument();
    expect(screen.getByText('Hacker News')).toBeInTheDocument();

    // First letter placeholders
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('H')).toBeInTheDocument();

    // Unread count badges
    expect(screen.getByText('3')).toBeInTheDocument(); // feed-1 unread
    expect(screen.getByText('1')).toBeInTheDocument(); // feed-2 unread
  });

  it('calls setActiveFeedId and setStarredOnly when clicking categories', async () => {
    const user = userEvent.setup();
    const setActiveFeedIdMock = vi.fn();
    const setStarredOnlyMock = vi.fn();

    render(
      <Sidebar 
        {...defaultProps} 
        setActiveFeedId={setActiveFeedIdMock} 
        setStarredOnly={setStarredOnlyMock} 
      />
    );

    // Click "Starred Articles"
    const starredBtn = screen.getByRole('button', { name: /starred articles/i });
    await user.click(starredBtn);
    expect(setActiveFeedIdMock).toHaveBeenCalledWith('starred');
    expect(setStarredOnlyMock).toHaveBeenCalledWith(false);

    // Click "AI Summarized"
    const summarizedBtn = screen.getByRole('button', { name: /ai summarized/i });
    await user.click(summarizedBtn);
    expect(setActiveFeedIdMock).toHaveBeenCalledWith('summarized');
    expect(setStarredOnlyMock).toHaveBeenCalledWith(false);

    // Click "All Feeds"
    const allBtn = screen.getByRole('button', { name: /all feeds/i });
    await user.click(allBtn);
    expect(setActiveFeedIdMock).toHaveBeenCalledWith('all');
    expect(setStarredOnlyMock).toHaveBeenCalledWith(false);
  });

  it('calls setActiveFeedId and setStarredOnly when clicking a subscription', async () => {
    const user = userEvent.setup();
    const setActiveFeedIdMock = vi.fn();
    const setStarredOnlyMock = vi.fn();

    render(
      <Sidebar 
        {...defaultProps} 
        setActiveFeedId={setActiveFeedIdMock} 
        setStarredOnly={setStarredOnlyMock} 
      />
    );

    const subscriptionBtn = screen.getByRole('button', { name: /techcrunch/i });
    await user.click(subscriptionBtn);
    expect(setActiveFeedIdMock).toHaveBeenCalledWith('feed-1');
    expect(setStarredOnlyMock).toHaveBeenCalledWith(false);
  });

  it('highlights the active feed item', () => {
    const { rerender } = render(<Sidebar {...defaultProps} activeFeedId="all" />);
    const allBtn = screen.getByRole('button', { name: /all feeds/i });
    expect(allBtn).toHaveClass('bg-brand-light');

    rerender(<Sidebar {...defaultProps} activeFeedId="feed-2" />);
    const feed2Btn = screen.getByRole('button', { name: /hacker news/i });
    expect(feed2Btn).toHaveClass('bg-brand-light');
    expect(screen.getByRole('button', { name: /all feeds/i })).not.toHaveClass('bg-brand-light');
  });
});
