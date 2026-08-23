import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Mic,
  Sparkles,
  Hourglass,
  Heart,
  Tag,
  Image as ImageIcon,
  Film,
  FileText,
  Plus,
  HardDrive,
  Download,
  FolderPlus,
  Trash2,
} from 'lucide-react';
import { MemoryCollection, FilterState, MoodType, MemoryItem } from '../types';

interface SidebarProps {
  collections: MemoryCollection[];
  memories: MemoryItem[];
  filterState: FilterState;
  onFilterChange: (update: Partial<FilterState>) => void;
  onAddCollection: (name: string, color: string) => void;
  onOpenExportModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collections,
  memories,
  filterState,
  onFilterChange,
  onAddCollection,
  onOpenExportModal,
  isCollapsed,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('indigo');

  // Compute counts
  const totalCount = memories.length;
  const favoriteCount = memories.filter((m) => m.isFavorite).length;
  const capsuleCount = memories.filter((m) => m.isTimeCapsule).length;

  const photoCount = memories.filter((m) => m.media.some((med) => med.type === 'image')).length;
  const videoCount = memories.filter((m) => m.media.some((med) => med.type === 'video')).length;
  const audioCount = memories.filter((m) => m.media.some((med) => med.type === 'audio')).length;

  // Extract all unique tags
  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags || []))).slice(0, 15);

  const moods: { id: MoodType; label: string; emoji: string; color: string }[] = [
    { id: 'nostalgic', label: 'Nostalgic', emoji: '🌙', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { id: 'serene', label: 'Serene', emoji: '🌿', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    { id: 'joyful', label: 'Joyful', emoji: '✨', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40' },
    { id: 'reflective', label: 'Reflective', emoji: '🌊', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
    { id: 'inspired', label: 'Inspired', emoji: '⚡', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
    { id: 'peaceful', label: 'Peaceful', emoji: '🕊️', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
    { id: 'cozy', label: 'Cozy', emoji: '☕', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40' },
    { id: 'bittersweet', label: 'Bittersweet', emoji: '🍂', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
  ];

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      onAddCollection(newColName.trim(), newColColor);
      setNewColName('');
      setShowAddModal(false);
    }
  };

  const getCollectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-4 h-4" />;
      case 'Mic':
        return <Mic className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Hourglass':
        return <Hourglass className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  // Estimate stored media bytes
  const totalMediaBytes = memories.reduce((acc, m) => {
    const memBytes = m.media.reduce((sum, item) => sum + (item.size || 0), 0);
    return acc + memBytes;
  }, 0);
  const formattedStorage =
    totalMediaBytes > 1024 * 1024
      ? `${(totalMediaBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalMediaBytes / 1024)} KB`;

  if (isCollapsed) {
    return null;
  }

  return (
    <aside
      id="desktop-app-sidebar"
      className="w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col justify-between select-none h-full overflow-y-auto shrink-0"
    >
      <div className="p-3 space-y-5">
        {/* Core Collections Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Curated Collections
            </span>
            <button
              id="btn-add-collection-trigger"
              onClick={() => setShowAddModal(true)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
              title="Add New Collection"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {collections.map((col) => {
              const isSelected = filterState.selectedCollectionId === col.id && !filterState.onlyFavorites;
              const count =
                col.id === 'all'
                  ? totalCount
                  : memories.filter((m) => m.collectionId === col.id).length;

              return (
                <button
                  key={col.id}
                  id={`btn-col-${col.id}`}
                  onClick={() => {
                    onFilterChange({
                      selectedCollectionId: col.id,
                      onlyFavorites: false,
                      onlyTimeCapsules: col.id === 'capsules',
                    });
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="opacity-80 shrink-0">{getCollectionIcon(col.icon)}</span>
                    <span className="truncate">{col.name}</span>
                  </div>
                  <span className="text-[11px] opacity-60 font-mono">{count}</span>
                </button>
              );
            })}

            {/* Starred / Favorites */}
            <button
              id="btn-favorites-collection"
              onClick={() => {
                onFilterChange({
                  onlyFavorites: !filterState.onlyFavorites,
                  onlyTimeCapsules: false,
                });
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterState.onlyFavorites
                  ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 ${filterState.onlyFavorites ? 'fill-rose-500 text-rose-500' : 'text-rose-500/70'}`} />
                <span>Favorites & Treasures</span>
              </div>
              <span className="text-[11px] opacity-60 font-mono">{favoriteCount}</span>
            </button>
          </div>
        </div>

        {/* Media Types Filter */}
        <div>
          <div className="px-2 py-1 mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Media Filter
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              id="btn-filter-media-photos"
              onClick={() =>
                onFilterChange({
                  selectedMediaType: filterState.selectedMediaType === 'image' ? 'all' : 'image',
                })
              }
              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                filterState.selectedMediaType === 'image'
                  ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold'
                  : 'bg-white/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Photos</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">{photoCount}</span>
            </button>

            <button
              id="btn-filter-media-video"
              onClick={() =>
                onFilterChange({
                  selectedMediaType: filterState.selectedMediaType === 'video' ? 'all' : 'video',
                })
              }
              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                filterState.selectedMediaType === 'video'
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-semibold'
                  : 'bg-white/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-rose-500" />
                <span>Videos</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">{videoCount}</span>
            </button>

            <button
              id="btn-filter-media-audio"
              onClick={() =>
                onFilterChange({
                  selectedMediaType: filterState.selectedMediaType === 'audio' ? 'all' : 'audio',
                })
              }
              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                filterState.selectedMediaType === 'audio'
                  ? 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold'
                  : 'bg-white/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-500" />
                <span>Audio</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">{audioCount}</span>
            </button>

            <button
              id="btn-filter-media-text"
              onClick={() =>
                onFilterChange({
                  selectedMediaType: filterState.selectedMediaType === 'text' ? 'all' : 'text',
                })
              }
              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                filterState.selectedMediaType === 'text'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                  : 'bg-white/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Written</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">{totalCount}</span>
            </button>
          </div>
        </div>

        {/* Mood & Atmosphere Filter */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Atmosphere / Mood
            </span>
            {filterState.selectedMood && (
              <button
                id="btn-clear-mood-filter"
                onClick={() => onFilterChange({ selectedMood: undefined })}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {moods.map((m) => {
              const isSelected = filterState.selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  id={`mood-pill-${m.id}`}
                  onClick={() =>
                    onFilterChange({ selectedMood: isSelected ? undefined : m.id })
                  }
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'ring-2 ring-slate-900 dark:ring-white ' + m.color
                      : m.color + ' opacity-80 hover:opacity-100'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags Cloud */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Memory Tags
              </span>
              {filterState.selectedTag && (
                <button
                  id="btn-clear-tag-filter"
                  onClick={() => onFilterChange({ selectedTag: undefined })}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.map((tag) => {
                const isSelected = filterState.selectedTag === tag;
                return (
                  <button
                    key={tag}
                    id={`tag-pill-${tag}`}
                    onClick={() =>
                      onFilterChange({ selectedTag: isSelected ? undefined : tag })
                    }
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300/60'
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5 opacity-60" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Storage & Backup Controls */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-900/40 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Local Vault</span>
          </div>
          <span className="font-mono">{formattedStorage}</span>
        </div>

        <button
          id="btn-open-export-modal"
          onClick={onOpenExportModal}
          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup & Archive</span>
        </button>
      </div>

      {/* Add Collection Dialog */}
      {showAddModal && (
        <div
          id="add-collection-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateCollection}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 w-full max-w-xs shadow-xl space-y-3"
          >
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              New Memory Collection
            </h4>

            <div>
              <label htmlFor="input-new-col-name" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Collection Name
              </label>
              <input
                id="input-new-col-name"
                type="text"
                autoFocus
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Summer in Italy"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                id="btn-cancel-new-col"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-new-col"
                disabled={!newColName.trim()}
                className="px-3 py-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-md disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
