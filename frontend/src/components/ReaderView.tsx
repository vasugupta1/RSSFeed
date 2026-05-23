import { useState } from 'react';
import type { FeedItem } from '../mockData';
import { extractArticleContent } from '../utils/feedParser';

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
  const [viewMode, setViewMode] = useState<'reader' | 'web'>('reader');
  
  // Clean Web Extractor states
  const [webContent, setWebContent] = useState<string | null>(null);
  const [isLoadingWeb, setIsLoadingWeb] = useState<boolean>(false);
  const [webError, setWebError] = useState<string | null>(null);

  // Trigger web content fetch as an event-driven handler
  const handleSwitchToWeb = () => {
    setViewMode('web');
    if (!webContent && !isLoadingWeb && activeArticle) {
      setIsLoadingWeb(true);
      setWebError(null);
      
      const targetUrl = activeArticle.link;
      
      // Attempt to fetch live page via corsproxy.io
      fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`)
        .then(res => {
          if (!res.ok) throw new Error('Live page fetch blocked or failed');
          return res.text();
        })
        .then(htmlText => {
          // Check if we got a valid html page (not a block or empty page)
          if (htmlText.length > 500 && !htmlText.includes('403 Forbidden') && !htmlText.includes('Access Denied') && !htmlText.includes('Cloudflare')) {
            const cleaned = extractArticleContent(htmlText);
            setWebContent(cleaned);
          } else {
            throw new Error('Blocked by firewall or empty response');
          }
        })
        .catch(err => {
          console.error(err);
          setWebError('Failed to fetch full article contents. This site may be blocking automated web scrapers.');
        })
        .finally(() => {
          setIsLoadingWeb(false);
        });
    }
  };

  return (
    <section className={`flex-1 bg-reader flex flex-col overflow-hidden max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:left-16 max-md:z-20 max-md:translate-x-full max-md:transition-transform max-md:duration-250 ${activeArticle ? 'max-md:translate-x-0' : ''}`}>
      {activeArticle ? (
        <>
          {/* Reader Header */}
          <div className="px-8 py-4 border-b border-border-custom flex items-center justify-between min-h-[72px] bg-sidebar/80 backdrop-blur-md z-5">
            {/* Back button for mobile */}
            <button 
              className="hidden max-md:flex bg-transparent border-0 text-secondary cursor-pointer p-2 text-lg items-center justify-center hover:text-brand" 
              onClick={() => setActiveArticleId(null)}
              title="Back to list"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Toggle View Mode Button (Reader vs Web) */}
            <div className="flex items-center gap-1 bg-app p-1 rounded-xl border border-border-custom max-md:hidden mr-4">
              <button 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${viewMode === 'reader' ? 'bg-brand text-white shadow-xs' : 'text-secondary hover:text-primary'}`}
                onClick={() => setViewMode('reader')}
              >
                Reader Mode
              </button>
              <button 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${viewMode === 'web' ? 'bg-brand text-white shadow-xs' : 'text-secondary hover:text-primary'}`}
                onClick={handleSwitchToWeb}
              >
                Web View
              </button>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Mark Read/Unread Toggle */}
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

              {/* Toggle Star */}
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

          {/* Reader Content Area / Web View */}
          {viewMode === 'reader' ? (
            <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center">
              <article className="max-w-2xl w-full">
                <div className="flex items-center gap-3 text-xs text-muted mb-4">
                  <span className="font-bold text-brand">{activeArticle.feedTitle}</span>
                  <span>•</span>
                  <span>{new Date(activeArticle.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <h1 className="font-serif text-3xl md:text-4xl leading-tight text-primary mb-5 font-bold">{activeArticle.title}</h1>

                <div className="text-xs text-secondary mb-8 border-b border-border-custom pb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">
                    {(activeArticle.author || 'A').charAt(0).toUpperCase()}
                  </div>
                  <span>By {activeArticle.author || 'Editorial Team'}</span>
                </div>

                <div className="font-serif text-[17px] leading-relaxed text-secondary space-y-5">
                  <p>{activeArticle.content || activeArticle.description}</p>
                  <p>Additional paragraphs and assets are dynamically aggregated. Readers can tap below to visit the official content host and inspect references, comments and context.</p>
                </div>

                <div className="mt-12 pt-6 border-t border-border-custom flex justify-start">
                  <a 
                    href={activeArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-medium transition-all hover:bg-brand-hover hover:-translate-y-px shadow-[0_4px_10px_rgba(99,102,241,0.2)]"
                  >
                    <span>Visit Website</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </article>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center w-full">
              {isLoadingWeb ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted w-full">
                  <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium animate-pulse">Extracting ad-free content...</span>
                </div>
              ) : webError ? (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-4 max-w-md mx-auto my-auto">
                  <span className="text-4xl">⚠️</span>
                  <span className="text-sm font-semibold text-primary">{webError}</span>
                  
                  <div className="mt-2">
                    <a 
                      href={activeArticle.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center justify-center px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-hover shadow-xs"
                    >
                      <span>Open Website in new tab</span>
                    </a>
                  </div>
                </div>
              ) : (
                <article className="max-w-2xl w-full">
                  <div className="flex items-center gap-3 text-xs text-muted mb-4">
                    <span className="font-bold text-brand">{activeArticle.feedTitle}</span>
                    <span>•</span>
                    <span>Clean Web Extract</span>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl leading-tight text-primary mb-8 font-bold">{activeArticle.title}</h1>
                  
                  <div 
                    className="font-serif text-[17px] leading-relaxed text-secondary space-y-6 reader-body-custom" 
                    dangerouslySetInnerHTML={{ __html: webContent || '' }}
                  />
                  
                  <div className="mt-12 pt-6 border-t border-border-custom flex gap-4">
                    <a 
                      href={activeArticle.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-xs font-medium hover:bg-brand-hover hover:-translate-y-px shadow-sm"
                    >
                      <span>Visit Original Website</span>
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
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center text-muted">
          <span className="text-5xl mb-4 opacity-50">📖</span>
          <span className="text-lg font-semibold text-secondary mb-2">No article selected</span>
          <span className="text-sm max-w-[280px] leading-relaxed">Select an article from the list to view its contents in distraction-free reading mode.</span>
        </div>
      )}
    </section>
  );
}
