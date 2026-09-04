import { useState, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GetEntitiesRelationshipResponse } from '../types';

interface GraphSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GraphSearchModal({ isOpen, onClose }: GraphSearchModalProps) {
  const [keyword, setKeyword] = useState('');
  const [graphData, setGraphData] = useState<GetEntitiesRelationshipResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fgRef = useRef<any>();

  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setGraphData(null);

    const query = `
      query SearchGraph($keyword: String!) {
        searchGraph(keyword: $keyword) {
          nodes { id name type }
          edges {
            type
            source { id }
            target { id }
          }
        }
      }
    `;

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { keyword } })
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL Error');
      }

      const data = result.data.searchGraph;
      
      // ForceGraph expects nodes to have 'id' and links to have 'source' and 'target'
      setGraphData({
        nodes: data.nodes,
        edges: data.edges.map((e: any) => ({
          source: e.source.id,
          target: e.target.id,
          type: e.type,
        }))
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-card border border-border-custom rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom bg-sidebar">
          <h2 className="text-lg font-semibold text-primary">Knowledge Graph Search</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-card-hover transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col flex-1 overflow-hidden p-6 gap-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search entities (e.g. netflix, polygamy)..." 
              className="flex-1 py-2.5 px-4 bg-app border border-border-custom rounded-xl text-primary focus:border-brand focus:ring-2 focus:ring-brand-light focus:outline-none transition-all placeholder:text-muted"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-brand text-white font-medium rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}

          {/* Graph Container */}
          <div className="flex-1 w-full bg-app rounded-xl border border-border-custom overflow-hidden relative">
            {!graphData && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                Enter a keyword to visualize the knowledge graph
              </div>
            )}
            
            {graphData && graphData.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                No entities found for "{keyword}"
              </div>
            )}

            {graphData && graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={fgRef}
                graphData={{ nodes: graphData.nodes, links: graphData.edges }}
                nodeLabel="type"
                linkColor={() => '#4b5563'} 
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const label = node.name;
                  const fontSize = 14 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 

                  // Draw background rounded rectangle
                  ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // dark bg
                  ctx.beginPath();
                  ctx.roundRect(
                    node.x - bckgDimensions[0] / 2, 
                    node.y - bckgDimensions[1] / 2, 
                    bckgDimensions[0], 
                    bckgDimensions[1],
                    4 / globalScale // border radius
                  );
                  ctx.fill();
                  
                  // Draw text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#e0e7ff'; // light indigo text
                  ctx.fillText(label, node.x, node.y);

                  node.__bckgDimensions = bckgDimensions; // save for pointer area
                }}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                  ctx.fillStyle = color;
                  const bckgDimensions = node.__bckgDimensions;
                  if (bckgDimensions) {
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                  }
                }}
                onNodeClick={(node: any) => {
                  fgRef.current?.centerAt(node.x, node.y, 1000);
                  fgRef.current?.zoom(4, 2000);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
