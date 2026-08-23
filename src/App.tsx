import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MemoryItem,
  MemoryCollection,
  FilterState,
  AppLayout,
  AppTheme,
  MediaAttachment,
} from './types';
import {
  initStorage,
  saveMemoryToDB,
  deleteMemoryFromDB,
  saveCollectionToDB,
  DEFAULT_COLLECTIONS,
} from './lib/db';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { MemoryList } from './components/MemoryList';
import { MemoryEditor } from './components/MemoryEditor';
import { TimelineView } from './components/TimelineView';
import { MemoryCinemaView } from './components/MemoryCinemaView';
import { TimeCapsuleView } from './components/TimeCapsuleView';
import { AudioRecorderModal } from './components/AudioRecorderModal';
import { MediaLightbox } from './components/MediaLightbox';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [collections, setCollections] = useState<MemoryCollection[]>(DEFAULT_COLLECTIONS);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<AppLayout>('studio');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('linen');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCollectionId: 'all',
    selectedMood: undefined,
    selectedMediaType: 'all',
    selectedTag: undefined,
    onlyFavorites: false,
    onlyTimeCapsules: false,
    sortBy: 'date_desc',
    viewMode: 'cards',
  });

  // Modal States
  const [isAudioRecorderOpen, setIsAudioRecorderOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    mediaList: MediaAttachment[];
    index: number;
  }>({
    isOpen: false,
    mediaList: [],
    index: 0,
  });

  // Load initial IndexedDB data
  const loadData = useCallback(async () => {
    try {
      const data = await initStorage();
      setMemories(data.memories);
      setCollections(data.collections);
      if (data.memories.length > 0 && !selectedMemoryId) {
        setSelectedMemoryId(data.memories[0].id);
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }, [selectedMemoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New Memory
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewMemory();
      }
      // Ctrl/Cmd + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('input-search-memories');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memories]);

  // Create new memory note
  const handleCreateNewMemory = () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMemory: MemoryItem = {
      id: 'mem-' + Date.now(),
      title: 'New Memory',
      content: '',
      date: formattedDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: 'serene',
      weather: 'golden_hour',
      location: '',
      isFavorite: false,
      isPinned: false,
      isTimeCapsule: false,
      tags: ['Personal'],
      collectionId: filterState.selectedCollectionId !== 'all' ? filterState.selectedCollectionId : 'all',
      media: [],
      scrapbookLayout: 'standard',
    };

    setMemories((prev) => [newMemory, ...prev]);
    setSelectedMemoryId(newMemory.id);
    setCurrentLayout('studio');
    saveMemoryToDB(newMemory);
  };

  // Update existing memory
  const handleUpdateMemory = (updated: MemoryItem) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    saveMemoryToDB(updated);
  };

  // Delete memory
  const handleDeleteMemory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMemories((prev) => prev.filter((m) => m.id !== id));
    deleteMemoryFromDB(id);

    if (selectedMemoryId === id) {
      const remaining = memories.filter((m) => m.id !== id);
      setSelectedMemoryId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = memories.find((m) => m.id === id);
    if (target) {
      const updated = { ...target, isFavorite: !target.isFavorite, updatedAt: Date.now() };
      handleUpdateMemory(updated);
    }
  };

  // Toggle pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = memories.find((m) => m.id === id);
    if (target) {
      const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
      handleUpdateMemory(updated);
    }
  };

  // Add custom collection
  const handleAddCollection = (name: string, color: string) => {
    const newCol: MemoryCollection = {
      id: 'col-' + Date.now(),
      name,
      icon: 'BookOpen',
      color,
    };
    setCollections((prev) => [...prev, newCol]);
    saveCollectionToDB(newCol);
  };

  // Filter and Sort memories
  const filteredMemories = useMemo(() => {
    return memories
      .filter((mem) => {
        // Collection filter
        if (
          filterState.selectedCollectionId !== 'all' &&
          mem.collectionId !== filterState.selectedCollectionId
        ) {
          return false;
        }

        // Favorites filter
        if (filterState.onlyFavorites && !mem.isFavorite) {
          return false;
        }

        // Time capsule filter
        if (filterState.onlyTimeCapsules && !mem.isTimeCapsule) {
          return false;
        }

        // Mood filter
        if (filterState.selectedMood && mem.mood !== filterState.selectedMood) {
          return false;
        }

        // Media type filter
        if (filterState.selectedMediaType && filterState.selectedMediaType !== 'all') {
          if (filterState.selectedMediaType === 'text') {
            if (mem.media.length > 0) return false;
          } else {
            const hasType = mem.media.some((m) => m.type === filterState.selectedMediaType);
            if (!hasType) return false;
          }
        }

        // Tag filter
        if (filterState.selectedTag && !mem.tags.includes(filterState.selectedTag)) {
          return false;
        }

        // Search query
        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.toLowerCase();
          const matchTitle = (mem.title || '').toLowerCase().includes(q);
          const matchContent = (mem.content || '').toLowerCase().includes(q);
          const matchLocation = (mem.location || '').toLowerCase().includes(q);
          const matchTags = mem.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchLocation && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pin priority
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (filterState.sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (filterState.sortBy === 'date_asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (filterState.sortBy === 'updated_desc') {
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        }
        if (filterState.sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [memories, filterState]);

  const selectedMemory = memories.find((m) => m.id === selectedMemoryId) || filteredMemories[0];

  const currentCollectionName =
    collections.find((c) => c.id === filterState.selectedCollectionId)?.name || 'All Memories';

  // Dynamic theme styling classes
  const themeContainerClass = useMemo(() => {
    switch (currentTheme) {
      case 'slate':
        return 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-500/20';
      case 'studio':
        return 'dark bg-[#0a0d14] text-slate-100 selection:bg-indigo-500/30';
      case 'forest':
        return 'bg-[#f4f7f5] text-[#13221b] dark:bg-[#081510] dark:text-[#d1fae5] selection:bg-emerald-500/20';
      case 'sepia':
        return 'bg-[#fcf8f0] text-[#2d2217] dark:bg-[#18130e] dark:text-[#fef3c7] selection:bg-amber-500/20';
      case 'linen':
      default:
        return 'bg-[#f8fafc] text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 selection:bg-amber-500/20';
    }
  }, [currentTheme]);

  return (
    <div
      id="desktop-app-root"
      className={`w-screen h-screen flex flex-col overflow-hidden font-sans transition-colors duration-200 ${themeContainerClass}`}
    >
      {/* macOS / Desktop TitleBar */}
      <TitleBar
        currentLayout={currentLayout}
        onSelectLayout={setCurrentLayout}
        onNewMemory={handleCreateNewMemory}
        searchQuery={filterState.searchQuery}
        onSearchChange={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        collectionName={currentCollectionName}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Layout: Notes Studio (Three-pane layout: Sidebar + Memory List + Editor) */}
        {currentLayout === 'studio' && (
          <>
            <Sidebar
              collections={collections}
              memories={memories}
              filterState={filterState}
              onFilterChange={(update) => setFilterState((prev) => ({ ...prev, ...update }))}
              onAddCollection={handleAddCollection}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <MemoryList
              memories={filteredMemories}
              selectedMemoryId={selectedMemory?.id || null}
              onSelectMemory={(id) => setSelectedMemoryId(id)}
              onDeleteMemory={handleDeleteMemory}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              filterState={filterState}
              onFilterChange={(update) => setFilterState((prev) => ({ ...prev, ...update }))}
            />

            {selectedMemory ? (
              <MemoryEditor
                memory={selectedMemory}
                collections={collections}
                onUpdateMemory={handleUpdateMemory}
                onOpenAudioRecorder={() => setIsAudioRecorderOpen(true)}
                onOpenLightbox={(mediaList, index) =>
                  setLightboxState({ isOpen: true, mediaList, index })
                }
                onDeleteMemory={(id) => handleDeleteMemory(id)}
              />
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center text-stone-400">
                <span className="text-4xl mb-3">📖</span>
                <h3 className="text-base font-semibold text-stone-700 dark:text-stone-300">
                  Select or Capture a Memory
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Choose an existing note from the list or create a fresh memory reflection.
                </p>
                <button
                  id="btn-empty-state-new-memory"
                  onClick={handleCreateNewMemory}
                  className="mt-4 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold shadow-xs transition-all"
                >
                  Create New Memory
                </button>
              </div>
            )}
          </>
        )}

        {/* Layout: Chronicle Timeline */}
        {currentLayout === 'timeline' && (
          <TimelineView
            memories={filteredMemories}
            onSelectMemory={(id) => {
              setSelectedMemoryId(id);
              setCurrentLayout('studio');
            }}
            onOpenLightbox={(mediaList, index) =>
              setLightboxState({ isOpen: true, mediaList, index })
            }
          />
        )}

        {/* Layout: Memory Scrapbook Cinema */}
        {currentLayout === 'cinema' && (
          <MemoryCinemaView
            memories={filteredMemories}
            onExitCinema={() => setCurrentLayout('studio')}
            onSelectMemory={(id) => {
              setSelectedMemoryId(id);
              setCurrentLayout('studio');
            }}
          />
        )}

        {/* Layout: Time Capsules */}
        {currentLayout === 'capsule' && (
          <TimeCapsuleView
            memories={memories}
            onSelectMemory={(id) => {
              setSelectedMemoryId(id);
              setCurrentLayout('studio');
            }}
            onUpdateMemory={handleUpdateMemory}
          />
        )}
      </div>

      {/* Live Voice / Microphone Recording Modal */}
      <AudioRecorderModal
        isOpen={isAudioRecorderOpen}
        onClose={() => setIsAudioRecorderOpen(false)}
        onSaveAudio={(attachment) => {
          if (selectedMemory) {
            handleUpdateMemory({
              ...selectedMemory,
              media: [...selectedMemory.media, attachment],
              updatedAt: Date.now(),
            });
          }
        }}
      />

      {/* Media Lightbox Zoom Viewer */}
      <MediaLightbox
        isOpen={lightboxState.isOpen}
        mediaList={lightboxState.mediaList}
        initialIndex={lightboxState.index}
        onClose={() => setLightboxState({ isOpen: false, mediaList: [], index: 0 })}
      />

      {/* Backup & Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        memories={memories}
        onDataRestored={loadData}
      />
    </div>
  );
}
