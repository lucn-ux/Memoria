import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  MapPin,
  Film,
  RotateCcw,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryCinemaViewProps {
  memories: MemoryItem[];
  onExitCinema: () => void;
  onSelectMemory: (id: string) => void;
}

export const MemoryCinemaView: React.FC<MemoryCinemaViewProps> = ({
  memories,
  onExitCinema,
  onSelectMemory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [intervalSecs, setIntervalSecs] = useState(7);

  // Auto-play presentation timer
  useEffect(() => {
    if (!isAutoPlaying || memories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, intervalSecs * 1000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, intervalSecs, memories.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % memories.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
      } else if (e.key === 'Escape') {
        onExitCinema();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memories.length, onExitCinema]);

  if (memories.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-12 h-12 text-amber-500/50 mb-3" />
        <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-200">No Memories to Present</h3>
        <p className="text-xs text-stone-500 mt-1">Add some photo or written memories to start your Scrapbook Cinema.</p>
        <button
          onClick={onExitCinema}
          className="mt-4 px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-semibold"
        >
          Back to Notes Studio
        </button>
      </div>
    );
  }

  const current = memories[currentIndex];
  const coverImage = current.media.find((m) => m.type === 'image')?.url;
  const audioAttachment = current.media.find((m) => m.type === 'audio');
  const videoAttachment = current.media.find((m) => m.type === 'video');

  return (
    <div
      id="scrapbook-cinema-stage"
      className="flex-1 h-full bg-stone-950 text-stone-100 flex flex-col justify-between select-none relative overflow-hidden animate-in fade-in duration-300"
    >
      {/* Background Ambience Layer */}
      {coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}

      {/* Top Header Bar */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button
            id="btn-exit-cinema-deck"
            onClick={onExitCinema}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors"
          >
            ← Exit Cinema
          </button>
          <span className="font-mono text-xs opacity-70">
            {currentIndex + 1} / {memories.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Autoplay toggle */}
          <button
            id="btn-cinema-autoplay-toggle"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors ${
              isAutoPlaying
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAutoPlaying ? 'Pause Slideshow' : 'Auto Play'}</span>
          </button>

          <button
            id="btn-open-memory-edit-cinema"
            onClick={() => {
              onSelectMemory(current.id);
              onExitCinema();
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors"
          >
            Edit in Studio
          </button>
        </div>
      </div>

      {/* Center Presentation Stage */}
      <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 py-4">
        {/* Visual Media Showcase */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          {videoAttachment ? (
            <div className="w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <video
                src={videoAttachment.url}
                controls
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
            </div>
          ) : coverImage ? (
            <div className="relative max-w-md w-full aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
              <img
                src={coverImage}
                alt={current.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="w-full max-w-md aspect-4/3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-12 h-12 text-amber-400 mb-3 opacity-60" />
              <p className="font-serif italic text-stone-400 text-sm">
                “A thought etched into memory carries its own visual resonance.”
              </p>
            </div>
          )}
        </div>

        {/* Written Reflection & Sensory Details */}
        <div className="w-full md:w-1/2 space-y-4 text-left">
          <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(current.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {current.location && (
              <>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1 text-stone-300">
                  <MapPin className="w-3.5 h-3.5" />
                  {current.location}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight text-white leading-tight">
            {current.title || 'Untitled Memory'}
          </h1>

          {/* Poetic synthesis quote */}
          {current.aiReflection?.poeticSummary && (
            <div className="p-3 bg-white/5 border-l-2 border-amber-400 rounded-r-xl text-amber-200 text-xs italic font-serif leading-relaxed">
              {current.aiReflection.poeticSummary}
            </div>
          )}

          {/* Written notes text */}
          <div className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed line-clamp-6 max-h-48 overflow-y-auto pr-2">
            {current.content || 'No written reflection recorded for this moment.'}
          </div>

          {/* Audio player if attached */}
          {audioAttachment && (
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs">
                  🎙️
                </div>
                <span className="text-xs font-medium truncate">{audioAttachment.name}</span>
              </div>
              <audio src={audioAttachment.url} controls className="h-8 max-w-[200px]" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation & Thumbnails */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between max-w-5xl w-full mx-auto">
        <button
          id="btn-cinema-prev"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          aria-label="Previous memory"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Mini dot indicators */}
        <div className="flex items-center gap-1.5 max-w-md overflow-x-auto px-4 py-2">
          {memories.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              title={m.title}
            />
          ))}
        </div>

        <button
          id="btn-cinema-next"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % memories.length)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          aria-label="Next memory"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
