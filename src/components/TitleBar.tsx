import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Sliders,
  Plus,
  Compass,
  Film,
  Hourglass,
  Layout,
  Palette,
  CloudRain,
  Flame,
  Disc,
  Trees,
  Waves,
} from 'lucide-react';
import { AppLayout, AppTheme } from '../types';
import { ambientSound, AmbientSoundType } from '../lib/ambientSound';

interface TitleBarProps {
  currentLayout: AppLayout;
  onSelectLayout: (layout: AppLayout) => void;
  onNewMemory: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (t: AppTheme) => void;
  collectionName: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentLayout,
  onSelectLayout,
  onNewMemory,
  searchQuery,
  onSearchChange,
  currentTheme,
  onThemeChange,
  collectionName,
}) => {
  const [ambientActive, setAmbientActive] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('rain');
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    ambientSound.setVolume(volume);
  }, [volume]);

  const toggleAmbientSound = () => {
    if (ambientActive) {
      ambientSound.stop();
      setAmbientActive(false);
    } else {
      ambientSound.play(ambientType);
      setAmbientActive(true);
    }
  };

  const changeAmbientSound = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (ambientActive) {
      ambientSound.play(type);
    }
  };

  const themes: { id: AppTheme; name: string; dot: string }[] = [
    { id: 'linen', name: 'Professional Slate', dot: 'bg-slate-700 dark:bg-slate-300' },
    { id: 'slate', name: 'Cool Slate', dot: 'bg-indigo-500' },
    { id: 'studio', name: 'Obsidian Dark', dot: 'bg-slate-900' },
    { id: 'forest', name: 'Emerald Forest', dot: 'bg-emerald-600' },
    { id: 'sepia', name: 'Warm Parchment', dot: 'bg-amber-600' },
  ];

  return (
    <header
      id="desktop-app-titlebar"
      className="h-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 flex items-center justify-between select-none z-30 shrink-0"
    >
      {/* Left: Window Dots & App Brand */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="flex items-center gap-1.5 px-1">
          <span className="w-3 h-3 rounded-full bg-rose-500/90 border border-rose-600/30 hover:opacity-80 transition-opacity" />
          <span className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600/30 hover:opacity-80 transition-opacity" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600/30 hover:opacity-80 transition-opacity" />
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
            <span>Memoria</span>
          </span>
          <span className="text-[11px] text-slate-300 dark:text-slate-700">/</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
            {collectionName}
          </span>
        </div>
      </div>

      {/* Center: App Layout Segmented Tabs */}
      <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs shadow-xs">
        <button
          id="tab-layout-studio"
          onClick={() => onSelectLayout('studio')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
            currentLayout === 'studio'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Notes Studio</span>
        </button>

        <button
          id="tab-layout-timeline"
          onClick={() => onSelectLayout('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
            currentLayout === 'timeline'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          id="tab-layout-cinema"
          onClick={() => onSelectLayout('cinema')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
            currentLayout === 'cinema'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Cinema</span>
        </button>

        <button
          id="tab-layout-capsule"
          onClick={() => onSelectLayout('capsule')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
            currentLayout === 'capsule'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Time Capsule</span>
        </button>
      </div>

      {/* Right Controls: Ambient Noise Synth, Theme, Search & New Button */}
      <div className="flex items-center gap-2">
        {/* Ambient Soundscape Controller */}
        <div className="relative">
          <button
            id="btn-toggle-ambient"
            onClick={() => setShowAmbientMenu(!showAmbientMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              ambientActive
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Focus Soundscapes (Synthesized Web Audio)"
          >
            {ambientActive ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </span>
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline capitalize">{ambientActive ? ambientType : 'Ambient'}</span>
          </button>

          {showAmbientMenu && (
            <div
              id="ambient-menu-dropdown"
              className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Writing Soundscape</span>
                <button
                  id="btn-play-pause-ambient-dropdown"
                  onClick={toggleAmbientSound}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    ambientActive
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {ambientActive ? 'Mute' : 'Play'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'rain' as AmbientSoundType, label: 'Rain & Mist', icon: CloudRain },
                  { id: 'fireplace' as AmbientSoundType, label: 'Fireplace', icon: Flame },
                  { id: 'vinyl' as AmbientSoundType, label: 'Lo-Fi Vinyl', icon: Disc },
                  { id: 'forest' as AmbientSoundType, label: 'Pine Forest', icon: Trees },
                  { id: 'waves' as AmbientSoundType, label: 'Ocean Waves', icon: Waves },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCurrent = ambientType === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`ambient-choice-${item.id}`}
                      onClick={() => changeAmbientSound(item.id)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Vol</span>
                <input
                  id="ambient-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Ambient volume"
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Theme Selector */}
        <div className="relative">
          <button
            id="btn-theme-selector"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Choose Aesthetic Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemeMenu && (
            <div
              id="theme-menu-dropdown"
              className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xl z-50 text-xs space-y-1"
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Color Palette
              </div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  onClick={() => {
                    onThemeChange(t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    currentTheme === t.id
                      ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick New Note Button */}
        <button
          id="btn-titlebar-new-memory"
          onClick={onNewMemory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all ml-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Memory</span>
        </button>
      </div>
    </header>
  );
};
