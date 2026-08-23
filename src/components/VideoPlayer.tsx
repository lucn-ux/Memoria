import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Film, Trash2 } from 'lucide-react';
import { MediaAttachment } from '../types';

interface VideoPlayerProps {
  media: MediaAttachment;
  onRemove?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ media, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  return (
    <div
      ref={containerRef}
      id={`video-player-container-${media.id}`}
      onMouseMove={handleMouseMove}
      className="relative group rounded-xl overflow-hidden bg-black/90 border border-stone-800 shadow-md aspect-video flex items-center justify-center select-none"
    >
      <video
        ref={videoRef}
        src={media.url}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Top Banner with Video Info & Delete */}
      <div
        className={`absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="font-medium truncate max-w-xs">{media.name}</span>
        </div>
        {onRemove && (
          <button
            id={`btn-remove-video-${media.id}`}
            onClick={onRemove}
            className="p-1.5 bg-black/50 hover:bg-rose-600 rounded-md text-white/80 hover:text-white transition-colors"
            title="Remove Video"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Play Button Overlay on Pause */}
      {!isPlaying && (
        <button
          id={`btn-center-play-${media.id}`}
          onClick={togglePlay}
          className="absolute inset-auto w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-95 border border-white/40 shadow-lg"
          aria-label="Play video"
        >
          <Play className="w-6 h-6 fill-current ml-0.5" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber */}
        <div className="relative w-full h-2 flex items-center group/scrub cursor-pointer">
          <div className="absolute inset-x-0 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Video scrubber"
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              id={`btn-bottom-play-${media.id}`}
              onClick={togglePlay}
              className="hover:text-amber-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              id={`btn-video-mute-${media.id}`}
              onClick={toggleMute}
              className="hover:text-amber-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="font-mono text-[11px] opacity-80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`btn-video-speed-${media.id}`}
              onClick={toggleSpeed}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded font-semibold text-[11px]"
            >
              {playbackRate}x
            </button>
            <button
              id={`btn-video-restart-${media.id}`}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="p-1 hover:text-amber-400 transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-video-fullscreen-${media.id}`}
              onClick={toggleFullscreen}
              className="p-1 hover:text-amber-400 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
