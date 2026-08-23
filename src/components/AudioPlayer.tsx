import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward } from 'lucide-react';
import { MediaAttachment } from '../types';

interface AudioPlayerProps {
  media: MediaAttachment;
  onRemove?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ media, onRemove, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || media.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, media.duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const togglePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate or use waveform bars
  const waveform = media.waveform || [25, 40, 65, 80, 95, 60, 45, 70, 85, 90, 55, 30, 45, 60, 80, 50, 35, 20];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id={`audio-player-${media.id}`}
      className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs transition-all"
    >
      <audio ref={audioRef} src={media.url} preload="metadata" />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-400/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            🎙️
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{media.name}</h4>
            {media.caption && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{media.caption}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`btn-speed-${media.id}`}
            onClick={togglePlaybackRate}
            title="Change Playback Speed"
            className="px-2 py-1 text-xs font-semibold rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
          >
            {playbackRate}x
          </button>
          <button
            id={`btn-mute-${media.id}`}
            onClick={toggleMute}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {onRemove && (
            <button
              id={`btn-remove-audio-${media.id}`}
              onClick={onRemove}
              className="p-1.5 text-rose-500 hover:text-rose-700 rounded transition-colors text-xs ml-1 font-medium"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Waveform Scrubber Display */}
      <div className="relative py-2">
        <div className="flex items-center justify-between gap-1 h-10 px-1 select-none">
          {waveform.map((val, idx) => {
            const barPercent = (idx / waveform.length) * 100;
            const isPlayed = barPercent <= progressPercent;
            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full cursor-pointer group"
                onClick={() => {
                  const targetSec = (idx / waveform.length) * duration;
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetSec;
                    setCurrentTime(targetSec);
                  }
                }}
              >
                <div
                  className={`w-full max-w-[6px] rounded-full transition-all duration-150 ${
                    isPlayed
                      ? 'bg-purple-600 dark:bg-purple-400 group-hover:bg-purple-500'
                      : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'
                  }`}
                  style={{ height: `${Math.max(15, val)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Range input scrub overlay */}
        <input
          id={`scrubber-audio-${media.id}`}
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Audio scrubber"
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <button
            id={`btn-play-audio-${media.id}`}
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition-all"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            id={`btn-restart-audio-${media.id}`}
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            title="Restart from beginning"
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="font-mono text-xs">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1 text-slate-400">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
