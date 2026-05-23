import type { Feed, FeedItem } from '../mockData';

interface FlatArticle extends FeedItem {
  feedTitle: string;
  feedId: string;
}

interface ArticleListProps {
  filteredArticles: FlatArticle[];
  activeFeedId: string;
  feeds: Feed[];
  activeArticleId: string | null;
  handleSelectArticle: (id: string) => void;
  handleToggleStar: (id: string, e?: React.MouseEvent) => void;
}

export default function ArticleList({
  filteredArticles,
  activeFeedId,
  feeds,
  activeArticleId,
  handleSelectArticle,
  handleToggleStar
}: ArticleListProps) {
  const getHeaderTitle = () => {
    if (activeFeedId === 'all') return 'All Articles';
    if (activeFeedId === 'starred') return 'Starred';
    return feeds.find(f => f.id === activeFeedId)?.title || 'Articles';
  };

  return (
    <section className="w-[400px] bg-app border-r border-border-custom flex flex-col overflow-hidden shrink-0 max-md:flex-1 max-md:w-auto">
      <div className="px-5 py-4 border-b border-border-custom flex items-center justify-between bg-app">
        <span className="text-sm font-semibold text-primary">
          {getHeaderTitle()}
        </span>
        <span className="text-xs text-muted">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center text-muted">
            <span className="text-5xl mb-4 opacity-50">📂</span>
            <span className="text-lg font-semibold text-secondary mb-2">No articles found</span>
            <span className="text-sm max-w-[280px] leading-relaxed">Try clearing your filters or adding a new RSS feed.</span>
          </div>
        ) : (
          filteredArticles.map(article => (
            <div 
              key={article.id} 
              className={`group bg-card border rounded-xl p-4 cursor-pointer relative transition-all duration-200 flex flex-col gap-2 shadow-sm-custom hover:translate-y-[-2px] hover:border-border-custom/80 hover:shadow-custom ${activeArticleId === article.id ? 'border-brand! ring-1 ring-brand' : 'border-border-custom'} ${article.read ? 'opacity-75' : ''}`}
              onClick={() => handleSelectArticle(article.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-primary leading-snug transition-colors group-hover:text-brand">{article.title}</h3>
                {!article.read && <span className="w-2 h-2 bg-brand rounded-full shrink-0 mt-1.5 shadow-[0_0_6px_rgba(99,102,241,0.6)]" title="Unread"></span>}
              </div>
              
              <p className="text-xs text-secondary line-clamp-2 leading-relaxed">{article.description}</p>
              
              <div className="flex items-center gap-2.5 text-xs text-muted mt-auto">
                <span className="font-semibold text-brand">{article.feedTitle}</span>
                <span>•</span>
                <span>{new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                
                <button 
                  className={`bg-transparent border-0 text-muted cursor-pointer p-1 rounded-md flex items-center justify-center transition-all hover:text-amber-500 hover:bg-amber-500/10 ml-auto ${article.starred ? 'text-amber-500!' : ''}`}
                  onClick={(e) => handleToggleStar(article.id, e)}
                  title={article.starred ? "Unstar article" : "Star article"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={article.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
