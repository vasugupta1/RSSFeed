interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  starredOnly: boolean;
  setStarredOnly: (starred: boolean) => void;
  onAddFeedClick: () => void;
  onSyncClick: () => void;
  onGraphSearchClick: () => void;
  isSyncing: boolean;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  starredOnly,
  setStarredOnly,
  onAddFeedClick,
  onSyncClick,
  onGraphSearchClick,
  isSyncing
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-sidebar/85 backdrop-blur-md border-b border-border-custom z-10 h-[72px]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9.5 h-9.5 bg-gradient-to-br from-brand to-brand-hover text-white rounded-xl font-bold text-xl shadow-[0_4px_10px_rgba(99,102,241,0.25)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" fill="currentColor" />
          </svg>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-brand bg-clip-text text-transparent">FeedlyLite</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative flex items-center w-64 max-sm:w-44">
          <span className="absolute left-3 text-muted pointer-events-none flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-9 pr-4 bg-app border border-border-custom rounded-xl text-primary text-sm transition-all focus:border-brand focus:ring-3 focus:ring-brand-light focus:outline-none placeholder:text-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Graph Search Button */}
        <button 
          className="flex items-center gap-2 px-3 py-2 bg-card border border-border-custom rounded-xl text-secondary text-sm cursor-pointer transition-all hover:bg-card-hover hover:text-brand"
          onClick={onGraphSearchClick}
          title="Search Knowledge Graph"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="max-sm:hidden">Graph</span>
        </button>

        {/* Toggle Starred Filter */}
        <button 
          className={`flex items-center gap-2 px-3 py-2 bg-card border border-border-custom rounded-xl text-secondary text-sm cursor-pointer transition-all hover:bg-card-hover hover:text-primary ${starredOnly ? 'bg-brand-light! border-brand! text-brand!' : ''}`}
          onClick={() => setStarredOnly(!starredOnly)}
          title="Show Starred Only"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={starredOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="max-sm:hidden">Starred</span>
        </button>

        {/* Sync Feeds Button */}
        <button 
          className={`flex items-center gap-2 px-3 py-2 bg-card border border-border-custom rounded-xl text-secondary text-sm cursor-pointer transition-all hover:bg-card-hover hover:text-primary ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={onSyncClick}
          disabled={isSyncing}
          title="Sync all feeds"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={isSyncing ? 'animate-spin' : ''}
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span className="max-sm:hidden">{isSyncing ? 'Syncing…' : 'Sync'}</span>
        </button>

        {/* Add Feed Button */}
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white border-0 rounded-xl text-sm font-medium cursor-pointer transition-all hover:bg-brand-hover hover:-translate-y-px active:translate-y-0 shadow-sm"
          onClick={onAddFeedClick}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="max-sm:hidden">Add Feed</span>
        </button>
      </div>
    </header>
  );
}
