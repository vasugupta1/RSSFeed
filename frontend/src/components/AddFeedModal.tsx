interface AddFeedModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  feedUrl: string;
  setFeedUrl: (url: string) => void;
  modalError: string | null;
  handleAddFeed: (e: React.FormEvent) => void;
  isIngesting?: boolean;
}

export default function AddFeedModal({
  isModalOpen,
  setIsModalOpen,
  feedUrl,
  setFeedUrl,
  modalError,
  handleAddFeed,
  isIngesting = false
}: AddFeedModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" onClick={() => !isIngesting && setIsModalOpen(false)}>
      <div className="bg-card border border-border-custom rounded-2xl w-full max-w-lg shadow-lg-custom flex flex-col overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border-custom flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Add Custom RSS/Atom Feed</h2>
          <button 
            className="bg-transparent border-0 text-muted cursor-pointer text-xl p-1 flex items-center justify-center rounded-full transition-all hover:text-primary hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={() => setIsModalOpen(false)} 
            disabled={isIngesting}
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddFeed}>
          <div className="p-6 flex flex-col gap-4">
            {modalError && (
              <div className="px-3.5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm animate-shake">
                {modalError}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-secondary">Enter RSS Feed URL</label>
              <input
                type="url"
                placeholder="https://example.com/feed.xml"
                className="w-full p-3 bg-app border border-border-custom rounded-xl text-primary focus:border-brand focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                disabled={isIngesting}
                required
              />
              {/* Sample load button removed */}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border-custom flex items-center justify-end gap-3 bg-sidebar">
            <button 
              type="button" 
              className="px-4 py-2 bg-transparent border border-border-custom rounded-xl text-secondary text-sm cursor-pointer transition-all hover:bg-card-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => setIsModalOpen(false)}
              disabled={isIngesting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-brand border-0 rounded-xl text-white text-sm font-medium cursor-pointer transition-all hover:bg-brand-hover disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isIngesting}
            >
              {isIngesting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Ingesting Feed...</span>
                </>
              ) : (
                'Parse & Subscribe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
