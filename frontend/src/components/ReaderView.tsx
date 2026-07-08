import { useState, useEffect } from 'react';
import type { FeedItem } from '../types';
import { fetchArticleContent } from '../utils/readability';
import type { CrawlUrlResponse } from '../utils/readability';
import BulletList from '../components/BulletList';

interface FlatArticle extends FeedItem {
  feedTitle: string;
  feedId: string;
}

interface ReaderViewProps {
  activeArticle: FlatArticle | null;
  setActiveArticleId: (id: string | null) => void;
  handleToggleRead: (id: string, e?: React.MouseEvent) => void;
  handleToggleStar: (id: string, e?: React.MouseEvent) => void;
}

export default function ReaderView({
  activeArticle,
  setActiveArticleId,
  handleToggleRead,
  handleToggleStar
}: ReaderViewProps) {
  // 'full' runs the text-density parser; 'summary' falls back to the direct RSS feed description
  const [viewMode, setViewMode] = useState<'full' | 'summary'>('full');
  
  // Extraction states
  const [crawlData, setCrawlData] = useState<CrawlUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [articleByline, setArticleByline] = useState<string>('');

  // Automatically trigger the 4-step pipeline on article selection
  useEffect(() => {
    if (!activeArticle) {
      setCrawlData(null);
      setError(null);
      setArticleByline('');
      return;
    }

    // If the article already has pre-loaded summary/keywords from /api/articles,
    // use them directly instead of calling the crawler API
    if (activeArticle.summary && activeArticle.summary.length > 0) {
      setCrawlData({
        url: activeArticle.link,
        title: activeArticle.title,
        summary: activeArticle.summary,
        keywords: activeArticle.keywords || [],
      });
      setIsLoading(false);
      setError(null);
      setArticleByline('');
      setViewMode('full');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setCrawlData(null);
    setArticleByline('');
    setViewMode('full'); // Reset back to full reader mode by default

    const targetUrl = activeArticle.link;

    fetchArticleContent(targetUrl)
      .then(data => {
        if (!isMounted) return;
        setCrawlData(data);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Readability extraction pipeline failed:', err);
        setError(err instanceof Error ? err.message : 'An unexpected scraping error occurred.');
        setViewMode('summary'); // Gracefully fallback to RSS summary on failure
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeArticle]);

  // Premium Shimmer Skeleton Loading Animation
  const SkeletonLoader = () => (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-pulse py-4">
      {/* Category & Date */}
      <div className="h-3 w-32 bg-border-custom rounded-md"></div>
      
      {/* Title */}
      <div className="space-y-3">
        <div className="h-8 w-full bg-border-custom rounded-xl"></div>
        <div className="h-8 w-3/4 bg-border-custom rounded-xl"></div>
      </div>
      
      {/* Author Details bar */}
      <div className="flex items-center gap-3 py-5 border-y border-border-custom my-4">
        <div className="w-8 h-8 rounded-full bg-border-custom"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-36 bg-border-custom rounded-md"></div>
          <div className="h-2 w-24 bg-border-custom rounded-md"></div>
        </div>
      </div>

      {/* Paragraph blocks */}
      <div className="space-y-4">
        <div className="h-4 w-full bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-full bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-11/12 bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-5/6 bg-border-custom/75 rounded-lg"></div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="h-4 w-full bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-11/12 bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-full bg-border-custom/75 rounded-lg"></div>
        <div className="h-4 w-2/3 bg-border-custom/75 rounded-lg"></div>
      </div>

      {/* Hero Image frame */}
      <div className="h-56 w-full bg-border-custom/50 rounded-2xl my-8"></div>
    </div>
  );

  return (
    <section className={`flex-1 bg-reader flex flex-col overflow-hidden max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:left-16 max-md:z-20 max-md:translate-x-full max-md:transition-transform max-md:duration-250 ${activeArticle ? 'max-md:translate-x-0' : ''}`}>
      {activeArticle ? (
        <>
          {/* Reader Header Navigation Bar */}
          <div className="px-8 py-4 border-b border-border-custom flex items-center justify-between min-h-[72px] bg-sidebar/80 backdrop-blur-md z-5">
            {/* Back button for mobile viewports */}
            <button 
              className="hidden max-md:flex bg-transparent border-0 text-secondary cursor-pointer p-2 text-lg items-center justify-center hover:text-brand" 
              onClick={() => setActiveArticleId(null)}
              title="Back to list"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* View mode toggle removed */}

            {/* Action Toggles (Star / Read status) */}
            <div className="flex items-center gap-3 ml-auto">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-transparent border border-border-custom rounded-xl text-secondary text-xs cursor-pointer transition-all hover:bg-card-hover hover:text-primary hover:border-border-custom/80"
                onClick={(e) => handleToggleRead(activeArticle.id, e)}
                title={activeArticle.read ? "Mark as unread" : "Mark as read"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{activeArticle.read ? 'Mark Unread' : 'Mark Read'}</span>
              </button>

              <button 
                className={`flex items-center gap-2 px-3 py-2 bg-transparent border border-border-custom rounded-xl text-secondary text-xs cursor-pointer transition-all hover:bg-card-hover hover:text-primary hover:border-border-custom/80 ${activeArticle.starred ? 'border-amber-500! text-amber-500! bg-amber-500/5!' : ''}`}
                onClick={(e) => handleToggleStar(activeArticle.id, e)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={activeArticle.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{activeArticle.starred ? 'Starred' : 'Star'}</span>
              </button>
            </div>
          </div>

          {/* Core Content Area */}
          <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center w-full">
            {isLoading ? (
              <SkeletonLoader />
            ) : error && viewMode === 'full' ? (
              /* Scraper / Connection Error State Callout */
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto gap-5 bg-card/40 border border-border-custom rounded-2xl shadow-lg-custom">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-xl font-bold">⚠️</div>
                <div className="space-y-2">
                  <h3 className="font-sans font-semibold text-primary text-sm">Full Extraction Unavailable</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Could not fetch page details automatically. The target website may be blocking access or requiring security authentication (e.g. Cloudflare).
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                  <button 
                    onClick={() => setViewMode('summary')}
                    className="flex-1 px-4 py-2.5 border border-border-custom text-secondary hover:bg-card-hover rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    Read RSS Summary
                  </button>
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-hover transition-all shadow-sm"
                  >
                    <span>Visit Original Website</span>
                  </a>
                </div>
              </div>
            ) : viewMode === 'full' ? (
              /* Full Extraction Reader View Output */
              <article className="max-w-2xl w-full animate-fade-in">
                {/* Meta details bar */}
                <div className="flex items-center gap-3 text-xs text-muted mb-4 font-sans font-medium">
                  <span className="font-bold text-brand uppercase tracking-wider text-[11px]">{activeArticle.feedTitle}</span>
                  <span>•</span>
                  <span>{new Date(activeArticle.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <h1 className="font-serif text-3xl md:text-4xl leading-tight text-primary mb-6 font-bold tracking-tight">{activeArticle.title}</h1>

                {/* Author profile tag */}
                <div className="text-xs text-secondary mb-8 border-b border-border-custom pb-5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center text-[10px] font-bold">
                    {(articleByline || activeArticle.author || 'E').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">By {articleByline || activeArticle.author || 'Editorial Team'}</span>
                </div>

                {/* AI Summary bullet points */}
                <div className="reader-body-custom">
                  {crawlData && crawlData.summary.length > 0 && (
                    <BulletList items={crawlData.summary} />
                  )}
                </div>

                {/* Keywords tags */}
                {crawlData && crawlData.keywords && crawlData.keywords.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {crawlData.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1.5 bg-brand/10 text-brand text-xs font-semibold rounded-lg border border-brand/20"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-16 pt-8 border-t border-border-custom flex justify-start">
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand text-white rounded-2xl font-semibold transition-all hover:bg-brand-hover hover:-translate-y-px shadow-[0_4px_12px_rgba(99,102,241,0.2)] text-xs"
                  >
                    <span>Visit Host Website</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </article>
            ) : (
              /* Fallback RSS Summary Mode */
              <article className="max-w-2xl w-full animate-fade-in">
                <div className="flex items-center gap-3 text-xs text-muted mb-4 font-sans font-medium">
                  <span className="font-bold text-brand uppercase tracking-wider text-[11px]">{activeArticle.feedTitle}</span>
                  <span>•</span>
                  <span>RSS Direct Summary</span>
                </div>
                
                <h1 className="font-serif text-3xl md:text-4xl leading-tight text-primary mb-6 font-bold tracking-tight">{activeArticle.title}</h1>

                <div className="text-xs text-secondary mb-8 border-b border-border-custom pb-5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center text-[10px] font-bold">
                    {(activeArticle.author || 'E').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">By {activeArticle.author || 'Editorial Team'}</span>
                </div>

                <div className="font-serif text-[17px] md:text-[18px] leading-relaxed text-secondary space-y-6">
                  {/* Clean standard feed paragraph */}
                  <p>{activeArticle.content || activeArticle.description || 'No direct summary content available.'}</p>
                  <p className="text-sm text-muted italic bg-sidebar p-4 rounded-xl border border-border-custom font-sans">
                    Note: Complete article content was not fetched. To read the live full-text version, toggle "Full Article" above or visit the host website using the button below.
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-border-custom flex gap-4">
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand text-white rounded-2xl font-semibold transition-all hover:bg-brand-hover hover:-translate-y-px shadow-[0_4px_12px_rgba(99,102,241,0.2)] text-xs"
                  >
                    <span>Open Original Page</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </article>
            )}
          </div>
        </>
      ) : (
        /* Empty / No Selection State */
        <div className="flex flex-col items-center justify-center h-full p-10 text-center text-muted animate-fade-in">
          <span className="text-6xl mb-4 filter drop-shadow-md">📖</span>
          <span className="text-lg font-semibold text-secondary mb-2">No article selected</span>
          <span className="text-sm max-w-[280px] leading-relaxed text-muted">Select an article from the list to view its contents in distraction-free reading mode.</span>
        </div>
      )}
    </section>
  );
}
