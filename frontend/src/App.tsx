import { useState, useMemo, useEffect } from 'react';
import type { Feed, FeedItem } from './types';
import { parseXml } from './utils/feedParser';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArticleList from './components/ArticleList';
import ReaderView from './components/ReaderView';
import AddFeedModal from './components/AddFeedModal';

function App() {
  // Application State
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [activeFeedId, setActiveFeedId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [starredOnly, setStarredOnly] = useState<boolean>(false);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  // Custom XML Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [feedFormat, setFeedFormat] = useState<'xml' | 'atom'>('xml');
  const [modalError, setModalError] = useState<string | null>(null);

  // Cached AI Summaries State
  const [cachedSummaries, setCachedSummaries] = useState<Set<string>>(new Set());

  // Fetch cached AI summaries on mount
  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCachedSummaries(new Set(data.map((item: any) => item.url)));
        }
      })
      .catch(err => console.error('Failed to fetch cached summaries:', err));
  }, []);

  // Add custom feed
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
        body: JSON.stringify({ url: feedUrl, format: feedFormat })
      });
      
      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
      }

      // Fetch locally to parse and display in the UI
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
      }
      const xmlText = await response.text();
      const newFeed = parseXml(xmlText);
      setFeeds([...feeds, newFeed]);
      setActiveFeedId(newFeed.id);
      setIsModalOpen(false);
      setFeedUrl('');
      setFeedFormat('xml');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch or parse feed.';
      setModalError(errMsg);
    }
  };

  // Load sample feed XML in modal for testing
  // Removed sample loading functionality as feed is now added via URL

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

    let totalSummarized = 0;

    feeds.forEach(feed => {
      let total = 0;
      let unread = 0;
      feed.items.forEach(item => {
        total++;
        if (!item.read) unread++;
        if (item.starred) totalStarred++;
        if (cachedSummaries.has(item.link)) totalSummarized++;
      });
      stats[feed.id] = { total, unread };
      totalAll += total;
      unreadAll += unread;
    });

    return {
      all: { total: totalAll, unread: unreadAll },
      starred: { total: totalStarred, unread: 0 },
      summarized: { total: totalSummarized, unread: 0 },
      byFeed: stats
    };
  }, [feeds, cachedSummaries]);

  // Filtered list of articles to display in the middle column
  const filteredArticles = useMemo(() => {
    return allArticles.filter(article => {
      // Feed filter
      if (activeFeedId !== 'all' && activeFeedId !== 'starred' && activeFeedId !== 'summarized' && article.feedId !== activeFeedId) {
        return false;
      }
      if (activeFeedId === 'starred' && !article.starred) {
        return false;
      }
      if (activeFeedId === 'summarized' && !cachedSummaries.has(article.link)) {
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
          cachedSummaries={cachedSummaries}
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
        feedFormat={feedFormat}
        setFeedFormat={setFeedFormat}
        modalError={modalError}
        handleAddFeed={handleAddFeed}
      />
    </div>
  );
}

export default App;
