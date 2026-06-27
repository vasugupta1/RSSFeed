import type { Feed } from '../mockData';

interface SidebarProps {
  feeds: Feed[];
  activeFeedId: string;
  setActiveFeedId: (id: string) => void;
  setStarredOnly: (starred: boolean) => void;
  feedStats: {
    all: { total: number; unread: number };
    starred: { total: number; unread: number };
    summarized?: { total: number; unread: number };
    byFeed: Record<string, { total: number; unread: number }>;
  };
}

export default function Sidebar({
  feeds,
  activeFeedId,
  setActiveFeedId,
  setStarredOnly,
  feedStats
}: SidebarProps) {
  return (
    <aside className="w-72 bg-sidebar border-r border-border-custom flex flex-col p-5 overflow-y-auto shrink-0 max-md:w-16 max-md:p-2 max-md:items-center">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3 ml-2 max-md:hidden">Feeds</span>
      <div className="flex flex-col gap-1 mb-6 w-full">
        {/* All Articles */}
        <button 
          className={`group flex items-center justify-between p-2.5 border-0 rounded-xl text-sm cursor-pointer text-left transition-all w-full max-md:justify-center max-md:p-2 ${activeFeedId === 'all' ? 'bg-brand-light text-brand font-medium' : 'bg-transparent text-secondary hover:bg-card-hover hover:text-primary'}`}
          onClick={() => { setActiveFeedId('all'); setStarredOnly(false); }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold shrink-0 transition-all max-md:w-9 max-md:h-9 ${activeFeedId === 'all' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </span>
            <span className="truncate max-md:hidden">All Feeds</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 max-md:hidden ${activeFeedId === 'all' ? 'bg-brand text-white' : 'bg-border-custom text-secondary'}`}>
            {feedStats.all.unread}
          </span>
        </button>

        {/* Starred */}
        <button 
          className={`group flex items-center justify-between p-2.5 border-0 rounded-xl text-sm cursor-pointer text-left transition-all w-full max-md:justify-center max-md:p-2 ${activeFeedId === 'starred' ? 'bg-brand-light text-brand font-medium' : 'bg-transparent text-secondary hover:bg-card-hover hover:text-primary'}`}
          onClick={() => { setActiveFeedId('starred'); setStarredOnly(false); }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold shrink-0 transition-all max-md:w-9 max-md:h-9 ${activeFeedId === 'starred' ? 'bg-brand text-white' : 'bg-amber-500/10 text-amber-500'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="truncate max-md:hidden">Starred Articles</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 max-md:hidden ${activeFeedId === 'starred' ? 'bg-brand text-white' : 'bg-border-custom text-secondary'}`}>
            {feedStats.starred.total}
          </span>
        </button>

        {/* Summarized */}
        <button 
          className={`group flex items-center justify-between p-2.5 border-0 rounded-xl text-sm cursor-pointer text-left transition-all w-full max-md:justify-center max-md:p-2 ${activeFeedId === 'summarized' ? 'bg-brand-light text-brand font-medium' : 'bg-transparent text-secondary hover:bg-card-hover hover:text-primary'}`}
          onClick={() => { setActiveFeedId('summarized'); setStarredOnly(false); }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold shrink-0 transition-all max-md:w-9 max-md:h-9 ${activeFeedId === 'summarized' ? 'bg-brand text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
              ✨
            </span>
            <span className="truncate max-md:hidden">AI Summarized</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 max-md:hidden ${activeFeedId === 'summarized' ? 'bg-brand text-white' : 'bg-border-custom text-secondary'}`}>
            {feedStats.summarized?.total || 0}
          </span>
        </button>
      </div>

      <span className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3 ml-2 max-md:hidden">Subscriptions</span>
      <div className="flex flex-col gap-1 w-full">
        {feeds.map(feed => (
          <button 
            key={feed.id}
            className={`group flex items-center justify-between p-2.5 border-0 rounded-xl text-sm cursor-pointer text-left transition-all w-full max-md:justify-center max-md:p-2 ${activeFeedId === feed.id ? 'bg-brand-light text-brand font-medium' : 'bg-transparent text-secondary hover:bg-card-hover hover:text-primary'}`}
            onClick={() => { setActiveFeedId(feed.id); setStarredOnly(false); }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold shrink-0 transition-all max-md:w-9 max-md:h-9 max-md:text-base ${activeFeedId === feed.id ? 'bg-brand text-white' : 'bg-border-custom text-secondary group-hover:bg-border-custom/80'}`}>
                {feed.title.charAt(0).toUpperCase()}
              </span>
              <span className="truncate max-md:hidden">{feed.title}</span>
            </div>
            {feedStats.byFeed[feed.id]?.unread > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 max-md:hidden ${activeFeedId === feed.id ? 'bg-brand text-white' : 'bg-border-custom text-secondary'}`}>
                {feedStats.byFeed[feed.id].unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
