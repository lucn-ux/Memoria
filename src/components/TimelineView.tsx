import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Pin,
  Image as ImageIcon,
  Film,
  Mic,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { MemoryItem, MediaAttachment } from '../types';

interface TimelineViewProps {
  memories: MemoryItem[];
  onSelectMemory: (id: string) => void;
  onOpenLightbox: (mediaList: MediaAttachment[], index: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  memories,
  onSelectMemory,
  onOpenLightbox,
}) => {
  // Sort chronologically (newest first)
  const sortedMemories = [...memories].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Group by Year and Month
  const grouped: { [key: string]: MemoryItem[] } = {};
  sortedMemories.forEach((mem) => {
    const d = new Date(mem.date);
    const key = isNaN(d.getTime())
      ? 'Unspecified Date'
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(mem);
  });

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
      id="chronicle-timeline-view"
      className="flex-1 h-full overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 p-6 sm:p-10"
    >
      <div className="max-w-3xl mx-auto space-y-10 pb-24">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Chronicle Stream
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tracking-tight">
            The Flow of Memories
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            A chronological tapestry of written reflections, visual moments, and audio diaries
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            No memories captured yet in your chronicle.
          </div>
        ) : (
          Object.entries(grouped).map(([period, items]) => (
            <div key={period} className="space-y-6 relative">
              {/* Period Header */}
              <div className="sticky top-0 z-10 py-1.5 flex items-center gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
                <span className="px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold font-mono tracking-tight shadow-xs">
                  {period}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Timeline Items with Vertical Line */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 ml-4">
                {items.map((mem) => {
                  const photos = mem.media.filter((m) => m.type === 'image');
                  const audios = mem.media.filter((m) => m.type === 'audio');
                  const videos = mem.media.filter((m) => m.type === 'video');

                  return (
                    <div
                      key={mem.id}
                      id={`timeline-card-${mem.id}`}
                      className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
                    >
                      {/* Timeline Dot on the left line */}
                      <span className="absolute -left-[31px] sm:-left-[39px] top-6 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-slate-50 dark:border-slate-950 shadow-xs" />

                      {/* Top Row: Date, Mood & Action */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-sm">{getMoodEmoji(mem.mood)}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {new Date(mem.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {mem.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {mem.location}
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          id={`btn-open-memory-from-timeline-${mem.id}`}
                          onClick={() => onSelectMemory(mem.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <span>Open in Studio</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-2">
                        {mem.title || 'Untitled Memory'}
                      </h3>

                      {/* Content excerpt */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif mb-4 line-clamp-3">
                        {mem.content ? mem.content.replace(/[#*`>_-]/g, '') : 'No written notes recorded.'}
                      </p>

                      {/* Media Thumbnails Showcase */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                          {photos.slice(0, 3).map((photo, i) => (
                            <div
                              key={photo.id}
                              onClick={() => onOpenLightbox(photos, i)}
                              className="aspect-4/3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer relative group/img"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || photo.name}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Media pills summary */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          {photos.length > 0 && (
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{photos.length} photos</span>
                            </span>
                          )}
                          {videos.length > 0 && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                              <Film className="w-3.5 h-3.5" />
                              <span>{videos.length} videos</span>
                            </span>
                          )}
                          {audios.length > 0 && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                              <Mic className="w-3.5 h-3.5" />
                              <span>{audios.length} audio notes</span>
                            </span>
                          )}
                        </div>

                        {mem.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {mem.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
