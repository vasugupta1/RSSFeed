import { useState, useMemo, useEffect } from 'react';
import { INITIAL_FEEDS, SAMPLE_XML_FEED } from './mockData';
import type { Feed, FeedItem } from './mockData';
import { parseXml } from './utils/feedParser';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArticleList from './components/ArticleList';
import ReaderView from './components/ReaderView';
import AddFeedModal from './components/AddFeedModal';

function RssFeedWebApp() {
  // Application State
  const [feeds, setFeeds] = useState<Feed[]>(INITIAL_FEEDS);
  const [activeFeedId, setActiveFeedId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [starredOnly, setStarredOnly] = useState<boolean>(false);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  
  // Custom XML Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customXmlInput, setCustomXmlInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Backend Integration State
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Add custom feed via backend MapIngestFeedEndpoint (POST /api/ingestfeed/{id})
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!customXmlInput.trim()) {
      setModalError('Feed XML content cannot be empty.');
      return;
    }

    const feedId = `feed-${Date.now()}`;
    setIsIngesting(true);

    try {
      console.log(`[RssFeedWebApp] Invoking backend endpoint: POST /api/ingestfeed/${feedId}`);
      
      const response = await fetch(`/api/ingestfeed/${feedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: customXmlInput,
      });

      if (!response.ok) {
        throw new Error(`Backend ingestion failed: ${response.status} ${response.statusText}`);
      }

      console.log('[RssFeedWebApp] Ingestion call succeeded. Decoding response.');

      let newFeed: Feed;
      const responseText = await response.text();

      if (responseText) {
        try {
          // If the backend has been updated to return the parsed feed as JSON:
          const parsedJson = JSON.parse(responseText);
          newFeed = {
            id: feedId,
            title: parsedJson.title || 'Untitled Feed',
            link: parsedJson.link || '',
            description: parsedJson.description || 'No description available.',
            isCustom: true,
            items: (parsedJson.items || []).map((item: any, idx: number) => ({
              id: `custom-item-${Date.now()}-${idx}`,
              title: item.title || 'Untitled Article',
              link: item.link || '',
              description: item.description || '',
              pubDate: item.pubDate || new Date().toUTCString(),
              read: false,
              starred: false,
            })),
          };
        } catch {
          // If parsing response body fails, fall back to parsing the custom XML locally
          console.log('[RssFeedWebApp] Response body is not JSON, parsing XML input locally.');
          newFeed = parseXml(customXmlInput);
        }
      } else {
        // If response body is empty, fall back to parsing the custom XML locally
        console.log('[RssFeedWebApp] Response body is empty (200 OK), parsing XML input locally.');
        newFeed = parseXml(customXmlInput);
      }

      setFeeds([...feeds, newFeed]);
      setActiveFeedId(newFeed.id);
      setIsModalOpen(false);
      setCustomXmlInput('');
    } catch (err) {
      console.error('[RssFeedWebApp] Ingestion/Parsing error occurred:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during backend ingestion.';
      setModalError(errMsg);
    } finally {
      setIsIngesting(false);
    }
  };

  // Load sample feed XML in modal for testing
  const handleLoadSample = () => {
    setCustomXmlInput(SAMPLE_XML_FEED);
    setModalError(null);
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
        customXmlInput={customXmlInput}
        setCustomXmlInput={setCustomXmlInput}
        modalError={modalError}
        handleAddFeed={handleAddFeed}
        handleLoadSample={handleLoadSample}
        isIngesting={isIngesting}
      />
    </div>
  );
}

export default RssFeedWebApp;
