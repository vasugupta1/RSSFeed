import { useState, useMemo, useEffect } from 'react';
import type { Feed, FeedItem } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArticleList from './components/ArticleList';
import ReaderView from './components/ReaderView';
import AddFeedModal from './components/AddFeedModal';
import GraphSearchModal from './components/GraphSearchModal';

interface BackendArticle {
  url?: string;
  title?: string;
  summary?: string[];
  keywords?: string[];
}

function RssFeedWebApp() {
  // Application State
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [activeFeedId, setActiveFeedId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [starredOnly, setStarredOnly] = useState<boolean>(false);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  // Custom XML Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState<boolean>(false);
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Build a Feed object from backend article data
  const buildBackendFeed = (data: BackendArticle[]): Feed => ({
    id: 'backend',
    title: 'Subscribed Feeds',
    link: '',
    description: 'Articles from your subscribed RSS feeds',
    items: data
      .filter((item) => item.url)
      .map((item, idx: number) => ({
        id: `backend-${idx}`,
        title: item.title || item.url || '',
        link: item.url || '',
        description: Array.isArray(item.summary) && item.summary.length > 0
          ? item.summary[0]
          : '',
        pubDate: new Date().toUTCString(),
        read: false,
        starred: false,
        summary: Array.isArray(item.summary) ? item.summary : [],
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
      })),
  });

  // Fetch all articles from the backend GET /api/articles
  const fetchAllArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        const backendFeed = buildBackendFeed(data as BackendArticle[]);
        setFeeds(prev => {
          const withoutBackend = prev.filter(f => f.id !== 'backend');
          return backendFeed.items.length > 0
            ? [...withoutBackend, backendFeed]
            : withoutBackend;
        });
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  // Load articles from backend on mount
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    void fetchAllArticles();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add custom feed via backend POST /api/feed
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!feedUrl.trim()) {
      setModalError('Feed URL cannot be empty.');
      return;
    }

    try {
      // Call backend API
      const backendResponse = await fetch('/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: feedUrl })
      });
      
      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
      }

      // Success — close modal, clear input, reload articles from backend
      setIsModalOpen(false);
      setFeedUrl('');
      await fetchAllArticles();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to add feed.';
      setModalError(errMsg);
    }
  };

  // Sync all feeds via POST /api/sync
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) {
        console.error('Sync failed:', res.status, res.statusText);
      }
      // Refresh articles after sync
      await fetchAllArticles();
    } catch (err) {
      console.error('Failed to sync feeds:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle article starred state
  const handleToggleStar = (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeeds(prevFeeds => 
      prevFeeds.map(feed => ({
        ...feed,
        items: feed.items.map(item => 
          item.id === articleId ? { ...item, starred: !item.starred } : item
        )
      }))
    );
  };

  // Toggle article read/unread state
  const handleToggleRead = (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeeds(prevFeeds => 
      prevFeeds.map(feed => ({
        ...feed,
        items: feed.items.map(item => 
          item.id === articleId ? { ...item, read: !item.read } : item
        )
      }))
    );
  };

  // Select article and mark as read
  const handleSelectArticle = (articleId: string) => {
    setActiveArticleId(articleId);
    setFeeds(prevFeeds => 
      prevFeeds.map(feed => ({
        ...feed,
        items: feed.items.map(item => 
          item.id === articleId ? { ...item, read: true } : item
        )
      }))
    );
  };

  // Flattened items with reference to their feed channel
  const allArticles = useMemo(() => {
    const list: (FeedItem & { feedTitle: string; feedId: string })[] = [];
    feeds.forEach(feed => {
      feed.items.forEach(item => {
        list.push({
          ...item,
          feedTitle: feed.title,
          feedId: feed.id
        });
      });
    });
    // Sort by publication date (most recent first)
    return list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }, [feeds]);

  // Compute feed list stats
  const feedStats = useMemo(() => {
    const stats: Record<string, { total: number; unread: number }> = {};
    let totalAll = 0;
    let unreadAll = 0;
    let totalStarred = 0;

    feeds.forEach(feed => {
      let total = 0;
      let unread = 0;
      feed.items.forEach(item => {
        total++;
        if (!item.read) unread++;
        if (item.starred) totalStarred++;
      });
      stats[feed.id] = { total, unread };
      totalAll += total;
      unreadAll += unread;
    });

    return {
      all: { total: totalAll, unread: unreadAll },
      starred: { total: totalStarred, unread: 0 },
      byFeed: stats
    };
  }, [feeds]);

  // Filtered list of articles to display in the middle column
  const filteredArticles = useMemo(() => {
    return allArticles.filter(article => {
      // Feed filter
      if (activeFeedId !== 'all' && activeFeedId !== 'starred' && article.feedId !== activeFeedId) {
        return false;
      }
      if (activeFeedId === 'starred' && !article.starred) {
        return false;
      }
      
      // Starred filter
      if (starredOnly && !article.starred) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          (article.content && article.content.toLowerCase().includes(query)) ||
          article.feedTitle.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allArticles, activeFeedId, starredOnly, searchQuery]);

  // Current active article item detail
  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return allArticles.find(item => item.id === activeArticleId) || null;
  }, [allArticles, activeArticleId]);

  // Dynamically update the browser tab title on selecting an article
  useEffect(() => {
    if (activeArticle) {
      document.title = `${activeArticle.title} | FeedlyLite`;
    } else {
      document.title = 'FeedlyLite';
    }
    return () => {
      document.title = 'FeedlyLite';
    };
  }, [activeArticle]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-app">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        starredOnly={starredOnly}
        setStarredOnly={setStarredOnly}
        onAddFeedClick={() => setIsModalOpen(true)}
        onSyncClick={handleSync}
        onGraphSearchClick={() => setIsGraphModalOpen(true)}
        isSyncing={isSyncing}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)]">
        <Sidebar
          feeds={feeds}
          activeFeedId={activeFeedId}
          setActiveFeedId={setActiveFeedId}
          setStarredOnly={setStarredOnly}
          feedStats={feedStats}
        />

        <ArticleList
          filteredArticles={filteredArticles}
          activeFeedId={activeFeedId}
          feeds={feeds}
          activeArticleId={activeArticleId}
          handleSelectArticle={handleSelectArticle}
          handleToggleStar={handleToggleStar}
        />

        <ReaderView
          key={activeArticle?.id || 'empty'}
          activeArticle={activeArticle}
          setActiveArticleId={setActiveArticleId}
          handleToggleRead={handleToggleRead}
          handleToggleStar={handleToggleStar}
        />
      </div>

      <AddFeedModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        feedUrl={feedUrl}
        setFeedUrl={setFeedUrl}
        modalError={modalError}
        handleAddFeed={handleAddFeed}
      />
      
      <GraphSearchModal 
        isOpen={isGraphModalOpen} 
        onClose={() => setIsGraphModalOpen(false)} 
      />
    </div>
  );
}

export default RssFeedWebApp;
