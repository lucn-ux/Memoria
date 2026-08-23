import React from 'react';
import {
  Search,
  SlidersHorizontal,
  Pin,
  Heart,
  Image as ImageIcon,
  Film,
  Mic,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Trash2,
} from 'lucide-react';
import { MemoryItem, FilterState, ViewMode } from '../types';

interface MemoryListProps {
  memories: MemoryItem[];
  selectedMemoryId: string | null;
  onSelectMemory: (id: string) => void;
  onDeleteMemory: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  filterState: FilterState;
  onFilterChange: (update: Partial<FilterState>) => void;
}

export const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  selectedMemoryId,
  onSelectMemory,
  onDeleteMemory,
  onToggleFavorite,
  onTogglePin,
  filterState,
  onFilterChange,
}) => {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'nostalgic':
        return '🌙';
      case 'serene':
        return '🌿';
      case 'joyful':
        return '✨';
      case 'reflective':
        return '🌊';
      case 'inspired':
        return '⚡';
      case 'peaceful':
        return '🕊️';
      case 'cozy':
        return '☕';
      case 'bittersweet':
        return '🍂';
      default:
        return '📝';
    }
  };

  return (
    <div
      id="desktop-memory-list-pane"
      className="w-80 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md flex flex-col h-full select-none shrink-0"
    >
      {/* Search and View Controls Header */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-memories"
            type="text"
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search notes, tags, places..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {filterState.searchQuery && (
            <button
              id="btn-clear-search-query"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <select
              id="select-sort-memories"
              value={filterState.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="bg-transparent text-[11px] font-medium text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Newest Memory</option>
              <option value="date_asc">Oldest Memory</option>
              <option value="updated_desc">Recently Edited</option>
              <option value="title_asc">Alphabetical (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="btn-view-cards"
              onClick={() => onFilterChange({ viewMode: 'cards' })}
              className={`p-1 rounded ${filterState.viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
              title="Card View"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              id="btn-view-compact"
              onClick={() => onFilterChange({ viewMode: 'compact' })}
              className={`p-1 rounded ${filterState.viewMode === 'compact' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
              title="Compact View"
            >
              <ListIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Memory Entries List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y-0">
        {memories.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs px-4">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse text-indigo-500" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No memories found</p>
            <p className="text-[11px] mt-1 text-slate-400">Try resetting search filters or capture a new memory above.</p>
          </div>
        ) : (
          memories.map((mem) => {
            const isSelected = selectedMemoryId === mem.id;
            const photoCount = mem.media.filter((m) => m.type === 'image').length;
            const videoCount = mem.media.filter((m) => m.type === 'video').length;
            const audioCount = mem.media.filter((m) => m.type === 'audio').length;
            const coverImage = mem.media.find((m) => m.type === 'image')?.url;

            if (filterState.viewMode === 'compact') {
              return (
                <div
                  key={mem.id}
                  id={`memory-item-compact-${mem.id}`}
                  onClick={() => onSelectMemory(mem.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2 text-xs border ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white font-medium'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{getMoodEmoji(mem.mood)}</span>
                    <span className="truncate font-medium">{mem.title || 'Untitled Memory'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 font-mono">
                    <span>{formatDate(mem.date)}</span>
                    {mem.isPinned && <Pin className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mem.id}
                id={`memory-card-${mem.id}`}
                onClick={() => onSelectMemory(mem.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all text-xs border group relative ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Top Row: Mood Badge, Date, Pin & Fav */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" title={`Mood: ${mem.mood}`}>
                      {getMoodEmoji(mem.mood)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {formatDate(mem.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`btn-pin-${mem.id}`}
                      onClick={(e) => onTogglePin(mem.id, e)}
                      className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                        mem.isPinned ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                      title={mem.isPinned ? 'Unpin Note' : 'Pin to top'}
                    >
                      <Pin className={`w-3 h-3 ${mem.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      id={`btn-fav-${mem.id}`}
                      onClick={(e) => onToggleFavorite(mem.id, e)}
                      className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                        mem.isFavorite ? 'text-rose-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                      title={mem.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                    >
                      <Heart className={`w-3 h-3 ${mem.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      id={`btn-del-mem-${mem.id}`}
                      onClick={(e) => onDeleteMemory(mem.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-1">
                  {mem.title || 'Untitled Memory'}
                </h4>

                {/* Snippet */}
                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed mb-2.5 font-serif">
                  {mem.content ? mem.content.replace(/[#*`>_-]/g, '') : 'No written notes recorded yet...'}
                </p>

                {/* Attached Media Thumbnail Strip */}
                {coverImage && (
                  <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50">
                    <img src={coverImage} alt="Memory preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Badges Bar: Media Counters, Location */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {photoCount > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
                        <ImageIcon className="w-3 h-3" />
                        <span>{photoCount}</span>
                      </span>
                    )}
                    {videoCount > 0 && (
                      <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium">
                        <Film className="w-3 h-3" />
                        <span>{videoCount}</span>
                      </span>
                    )}
                    {audioCount > 0 && (
                      <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                        <Mic className="w-3 h-3" />
                        <span>{audioCount}</span>
                      </span>
                    )}
                    {mem.aiReflection && (
                      <span title="Curated AI Reflection">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                      </span>
                    )}
                  </div>

                  {mem.location && (
                    <span className="flex items-center gap-0.5 truncate max-w-[120px] text-slate-500">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{mem.location}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
