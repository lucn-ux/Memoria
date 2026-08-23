import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MediaAttachment } from '../types';

interface MediaLightboxProps {
  isOpen: boolean;
  mediaList: MediaAttachment[];
  initialIndex?: number;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  mediaList,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, mediaList.length]);

  if (!isOpen || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
    setZoom(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    setZoom(1);
  };

  return (
    <div
      id="media-lightbox-backdrop"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between text-white/80 p-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono bg-white/10 px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {mediaList.length}
          </span>
          <span className="truncate max-w-sm font-medium">{currentMedia?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {currentMedia?.type === 'image' && (
            <>
              <button
                id="btn-lightbox-zoom-in"
                onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                id="btn-lightbox-zoom-out"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.3))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                id="btn-lightbox-zoom-reset"
                onClick={() => setZoom(1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          <a
            id="btn-lightbox-download"
            href={currentMedia?.url}
            download={currentMedia?.name || 'media-memory'}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Download Media"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            id="btn-lightbox-close"
            onClick={onClose}
            className="p-2 hover:bg-rose-600 rounded-lg transition-colors text-white ml-2"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2">
        {mediaList.length > 1 && (
          <>
            <button
              id="btn-lightbox-prev"
              onClick={handlePrev}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              id="btn-lightbox-next"
              onClick={handleNext}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {currentMedia?.type === 'image' && (
          <img
            id="lightbox-current-image"
            src={currentMedia.url}
            alt={currentMedia.caption || currentMedia.name}
            className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-150 rounded-lg shadow-2xl"
            style={{ transform: `scale(${zoom})` }}
          />
        )}

        {currentMedia?.type === 'video' && (
          <video
            id="lightbox-current-video"
            src={currentMedia.url}
            controls
            autoPlay
            playsInline
            className="max-h-[82vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        )}

        {currentMedia?.type === 'audio' && (
          <div className="p-8 bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center text-2xl mb-4">
              🎙️
            </div>
            <h4 className="text-white font-medium text-base mb-1">{currentMedia.name}</h4>
            <p className="text-stone-400 text-xs mb-6">{currentMedia.caption || 'Audio memory recording'}</p>
            <audio src={currentMedia.url} controls autoPlay className="w-full" />
          </div>
        )}
      </div>

      {/* Bottom Caption & Thumbnails */}
      <div className="w-full text-center pb-2">
        {currentMedia?.caption && (
          <p className="text-white/90 text-sm max-w-2xl mx-auto px-4 py-1.5 bg-black/40 rounded-full backdrop-blur-sm inline-block">
            {currentMedia.caption}
          </p>
        )}
      </div>
    </div>
  );
};
