import React, { useState, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Film,
  Mic,
  Plus,
  Trash2,
  Maximize2,
  Sun,
  Sunset,
  CloudRain,
  Cloud,
  Moon,
  Wind,
  Snowflake,
  Clock,
  Tag,
  Folder,
  Hourglass,
  Bold,
  Italic,
  List,
  Quote,
  Heading2,
  Highlighter,
  CheckSquare,
  Volume2,
  HelpCircle,
  Wand2,
  Loader2,
  Heart,
  Pin,
  Share2,
} from 'lucide-react';
import {
  MemoryItem,
  MediaAttachment,
  MoodType,
  WeatherType,
  MemoryCollection,
  AIReflection,
} from '../types';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';

interface MemoryEditorProps {
  memory: MemoryItem;
  collections: MemoryCollection[];
  onUpdateMemory: (updated: MemoryItem) => void;
  onOpenAudioRecorder: () => void;
  onOpenLightbox: (mediaList: MediaAttachment[], index: number) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryEditor: React.FC<MemoryEditorProps> = ({
  memory,
  collections,
  onUpdateMemory,
  onOpenAudioRecorder,
  onOpenLightbox,
  onDeleteMemory,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Field update helpers
  const handleFieldChange = <K extends keyof MemoryItem>(field: K, value: MemoryItem[K]) => {
    onUpdateMemory({
      ...memory,
      [field]: value,
      updatedAt: Date.now(),
    });
  };

  // Tag helpers
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const tag = newTagInput.trim().replace(/^#/, '');
    if (tag && !memory.tags.includes(tag)) {
      handleFieldChange('tags', [...memory.tags, tag]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange(
      'tags',
      memory.tags.filter((t) => t !== tagToRemove)
    );
  };

  // Media upload handlers
  const handleFileUpload = (files: FileList | null, forcedType?: 'image' | 'video' | 'audio') => {
    if (!files || files.length === 0) return;

    const newAttachments: MediaAttachment[] = [];

    Array.from(files).forEach((file) => {
      let type: 'image' | 'video' | 'audio' = 'image';
      if (forcedType) {
        type = forcedType;
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }

      const url = URL.createObjectURL(file);
      const attachment: MediaAttachment = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        blob: file,
        createdAt: Date.now(),
        caption: '',
      };

      if (type === 'audio') {
        attachment.waveform = [30, 50, 75, 90, 60, 40, 65, 80, 55, 35, 45, 60, 40, 25];
      }

      newAttachments.push(attachment);
    });

    handleFieldChange('media', [...memory.media, ...newAttachments]);
  };

  const handleRemoveMedia = (mediaId: string) => {
    handleFieldChange(
      'media',
      memory.media.filter((m) => m.id !== mediaId)
    );
  };

  const handleUpdateMediaCaption = (mediaId: string, caption: string) => {
    handleFieldChange(
      'media',
      memory.media.map((m) => (m.id === mediaId ? { ...m, caption } : m))
    );
  };

  // Drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Markdown formatting shortcuts
  const insertMarkdown = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = memory.content || '';
    const selectedText = previousContent.substring(start, end);

    const replacement = before + (selectedText || 'text') + after;
    const newContent =
      previousContent.substring(0, start) + replacement + previousContent.substring(end);

    handleFieldChange('content', newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selectedText.length || 4)
      );
    }, 50);
  };

  // AI Reflection Generator
  const handleGenerateReflection = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const mediaTypes = Array.from(new Set(memory.media.map((m) => m.type)));
      const res = await fetch('/api/memory/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: memory.title,
          content: memory.content,
          mood: memory.mood,
          tags: memory.tags,
          mediaTypes,
          location: memory.location,
          date: memory.date,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const reflectionData: AIReflection = {
          reflection: data.reflection,
          poeticSummary: data.poeticSummary,
          suggestedTags: data.suggestedTags || [],
          writingPrompt: data.writingPrompt,
          resonanceScore: data.resonanceScore || 88,
          generatedAt: Date.now(),
          isOfflineFallback: data.isOfflineFallback,
        };
        handleFieldChange('aiReflection', reflectionData);
      } else {
        setAiError(data.error || 'Failed to curate reflection');
      }
    } catch (err: any) {
      console.error('Curate AI error:', err);
      setAiError(err.message || 'Connection error with AI curator');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Pre-categorize media
  const photoList = memory.media.filter((m) => m.type === 'image');
  const videoList = memory.media.filter((m) => m.type === 'video');
  const audioList = memory.media.filter((m) => m.type === 'audio');

  const moods: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'nostalgic', label: 'Nostalgic', emoji: '🌙' },
    { id: 'serene', label: 'Serene', emoji: '🌿' },
    { id: 'joyful', label: 'Joyful', emoji: '✨' },
    { id: 'reflective', label: 'Reflective', emoji: '🌊' },
    { id: 'inspired', label: 'Inspired', emoji: '⚡' },
    { id: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
    { id: 'cozy', label: 'Cozy', emoji: '☕' },
    { id: 'bittersweet', label: 'Bittersweet', emoji: '🍂' },
    { id: 'adventurous', label: 'Adventurous', emoji: '🧭' },
  ];

  const weatherOptions: { id: WeatherType; label: string; icon: any }[] = [
    { id: 'sunny', label: 'Sunny', icon: Sun },
    { id: 'golden_hour', label: 'Golden Hour', icon: Sunset },
    { id: 'rainy', label: 'Rainy', icon: CloudRain },
    { id: 'cloudy', label: 'Cloudy', icon: Cloud },
    { id: 'starry', label: 'Starry Night', icon: Moon },
    { id: 'breezy', label: 'Breezy', icon: Wind },
    { id: 'snowy', label: 'Snowy', icon: Snowflake },
  ];

  const wordCount = (memory.content || '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <main
      id="desktop-memory-editor-pane"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex-1 h-full overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 p-6 flex flex-col relative transition-all ${
        isDragOver ? 'ring-4 ring-indigo-500/50 ring-inset bg-indigo-500/5' : ''
      }`}
    >
      {/* Hidden File Inputs for Targeted Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        aria-label="Upload photo"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        aria-label="Upload video"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files, 'video')}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        aria-label="Upload audio"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files, 'audio')}
      />

      <div className="max-w-4xl w-full mx-auto space-y-6 pb-20">
        {/* Top Control Bar: Mood, Date, Location, Weather, Layout */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
          {/* Left: Date Picker & Mood Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Date Input */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                id="input-memory-date"
                type="datetime-local"
                value={memory.date || ''}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                aria-label="Memory date"
                className="bg-transparent text-xs font-mono focus:outline-none cursor-pointer"
              />
            </div>

            {/* Mood Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              <select
                id="select-memory-mood"
                value={memory.mood}
                onChange={(e) => handleFieldChange('mood', e.target.value as MoodType)}
                aria-label="Memory mood"
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {moods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              <select
                id="select-memory-weather"
                value={memory.weather || 'golden_hour'}
                onChange={(e) => handleFieldChange('weather', e.target.value as WeatherType)}
                aria-label="Memory weather"
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {weatherOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Collection Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-memory-collection"
                value={memory.collectionId}
                onChange={(e) => handleFieldChange('collectionId', e.target.value)}
                aria-label="Memory collection"
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Scrapbook Layout, Favorites, Pin, Delete */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Scrapbook Style Toggle */}
            <select
              id="select-scrapbook-layout"
              value={memory.scrapbookLayout || 'standard'}
              onChange={(e) => handleFieldChange('scrapbookLayout', e.target.value as any)}
              aria-label="Scrapbook style"
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="standard">Standard Frame</option>
              <option value="polaroid">Polaroid Scrapbook</option>
              <option value="minimal">Minimal Grid</option>
              <option value="film_strip">Film Strip</option>
            </select>

            <button
              id="btn-toggle-favorite-editor"
              onClick={() => handleFieldChange('isFavorite', !memory.isFavorite)}
              className={`p-2 rounded-lg border transition-colors ${
                memory.isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={memory.isFavorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${memory.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              id="btn-toggle-pin-editor"
              onClick={() => handleFieldChange('isPinned', !memory.isPinned)}
              className={`p-2 rounded-lg border transition-colors ${
                memory.isPinned
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={memory.isPinned ? 'Pinned' : 'Pin Note'}
            >
              <Pin className={`w-3.5 h-3.5 ${memory.isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              id="btn-delete-memory-editor"
              onClick={() => onDeleteMemory(memory.id)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Location Banner */}
        <div className="space-y-3">
          <input
            id="input-memory-title"
            type="text"
            value={memory.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Name this memory or special moment..."
            className="w-full text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white bg-transparent border-none focus:outline-none placeholder-slate-300 dark:placeholder-slate-700 tracking-tight"
          />

          <div className="flex flex-wrap items-center gap-3">
            {/* Location Pill Input */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <input
                id="input-memory-location"
                type="text"
                value={memory.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="Add place or location..."
                className="bg-transparent focus:outline-none text-xs w-44"
              />
            </div>

            {/* Time Capsule Toggle */}
            <button
              id="btn-toggle-capsule-mode"
              onClick={() => handleFieldChange('isTimeCapsule', !memory.isTimeCapsule)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                memory.isTimeCapsule
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>{memory.isTimeCapsule ? 'Sealed Time Capsule' : 'Mark as Time Capsule'}</span>
            </button>
          </div>
        </div>

        {/* Multimedia Showcase Area (Photos, Videos, Audio) */}
        {memory.media.length > 0 && (
          <div className="space-y-4">
            {/* Video Section */}
            {videoList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5 text-rose-500" />
                  <span>Video Memories ({videoList.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoList.map((vid) => (
                    <VideoPlayer
                      key={vid.id}
                      media={vid}
                      onRemove={() => handleRemoveMedia(vid.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Section */}
            {audioList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Mic className="w-3.5 h-3.5 text-purple-500" />
                  <span>Audio Clips & Voice Reflections ({audioList.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {audioList.map((aud) => (
                    <AudioPlayer
                      key={aud.id}
                      media={aud}
                      onRemove={() => handleRemoveMedia(aud.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Photos & Scrapbook Gallery */}
            {photoList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Photo Gallery & Visual Moments ({photoList.length})</span>
                  </div>
                  <span className="text-[11px] font-normal normal-case text-slate-400">
                    Click any image for lightbox zoom
                  </span>
                </div>

                <div
                  className={`grid gap-4 ${
                    memory.scrapbookLayout === 'polaroid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : memory.scrapbookLayout === 'film_strip'
                      ? 'grid-flow-col auto-cols-[280px] overflow-x-auto pb-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {photoList.map((photo, idx) => (
                    <div
                      key={photo.id}
                      id={`photo-card-${photo.id}`}
                      className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all hover:shadow-md ${
                        memory.scrapbookLayout === 'polaroid' ? 'p-2.5 pb-4 rotate-[-0.5deg] hover:rotate-0' : ''
                      }`}
                    >
                      <div
                        className="relative aspect-4/3 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                        onClick={() => onOpenLightbox(photoList, idx)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || photo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </div>

                      {/* Caption Field */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <input
                          id={`input-caption-${photo.id}`}
                          type="text"
                          value={photo.caption || ''}
                          onChange={(e) => handleUpdateMediaCaption(photo.id, e.target.value)}
                          placeholder="Add photo caption..."
                          className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none italic placeholder-slate-400 truncate"
                        />
                        <button
                          id={`btn-remove-photo-${photo.id}`}
                          onClick={() => handleRemoveMedia(photo.id)}
                          className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Ingestion Toolbar */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Attach to Memory:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (or drag & drop files anywhere)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Upload Photo Button */}
            <button
              id="btn-upload-photos-trigger"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-medium transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Add Photos</span>
            </button>

            {/* Upload Video Button */}
            <button
              id="btn-upload-video-trigger"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium transition-colors"
            >
              <Film className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Add Video</span>
            </button>

            {/* Upload Audio File */}
            <button
              id="btn-upload-audio-trigger"
              onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-medium transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Upload Audio</span>
            </button>

            {/* In-App Live Microphone Recording */}
            <button
              id="btn-open-live-mic-recorder"
              onClick={onOpenAudioRecorder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Record Voice Note</span>
            </button>
          </div>
        </div>

        {/* Written Notes Editor Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
          {/* Formatting Toolbar */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-900">
            <div className="flex items-center gap-1">
              <button
                id="btn-format-bold"
                onClick={() => insertMarkdown('**', '**')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-format-italic"
                onClick={() => insertMarkdown('*', '*')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-format-heading"
                onClick={() => insertMarkdown('\n### ', '\n')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Subheading"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-format-quote"
                onClick={() => insertMarkdown('\n> *"', '"*\n')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Memory Quote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-format-list"
                onClick={() => insertMarkdown('\n- ')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Bullet Point"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-format-highlight"
                onClick={() => insertMarkdown('==', '==')}
                className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Highlight"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{Math.max(1, Math.ceil(wordCount / 180))} min read</span>
            </div>
          </div>

          {/* Textarea for Written Reflection */}
          <div className="p-4">
            <textarea
              ref={textareaRef}
              id="textarea-memory-content"
              value={memory.content || ''}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder={`Write your memory reflections here...
- What sights, scents, or sounds stood out?
- What conversation or feeling stayed with you?
- Why will this day matter to you years from now?`}
              rows={12}
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 text-sm leading-relaxed focus:outline-none resize-none font-serif placeholder-slate-300 dark:placeholder-slate-700"
            />
          </div>

          {/* Tags Bar at bottom of note */}
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-400 hover:text-slate-600 ml-0.5 text-xs"
                >
                  ×
                </button>
              </span>
            ))}

            <input
              id="input-add-memory-tag"
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ add tag..."
              className="px-2 py-0.5 text-xs bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 placeholder-slate-400"
            />
          </div>
        </div>

        {/* AI Memory Curator & Deep Reflection Section */}
        <div
          id="ai-curator-section"
          className="p-5 bg-gradient-to-br from-indigo-500/5 via-slate-50 to-purple-500/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-indigo-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <span>AI Memory Curator</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium">
                    Gemini 3.7
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Synthesize sensory notes, generate poetic insights, and journal prompts
                </p>
              </div>
            </div>

            <button
              id="btn-generate-ai-reflection"
              onClick={handleGenerateReflection}
              disabled={isGeneratingAI}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Curating Memory...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{memory.aiReflection ? 'Regenerate Synthesis' : 'Curate Reflection'}</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {aiError}
            </div>
          )}

          {memory.aiReflection && (
            <div className="space-y-3 pt-2">
              {/* Poetic Summary */}
              {memory.aiReflection.poeticSummary && (
                <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs italic font-serif leading-relaxed text-center shadow-xs">
                  {memory.aiReflection.poeticSummary}
                </div>
              )}

              {/* Reflection Synthesis */}
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                <p>{memory.aiReflection.reflection}</p>
              </div>

              {/* Writing Prompt Trigger */}
              {memory.aiReflection.writingPrompt && (
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
                  <HelpCircle className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Deepening Journal Prompt:</span>
                    <span>{memory.aiReflection.writingPrompt}</span>
                  </div>
                </div>
              )}

              {/* Suggested Tags */}
              {memory.aiReflection.suggestedTags && memory.aiReflection.suggestedTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Suggested tags:</span>
                  {memory.aiReflection.suggestedTags.map((tag) => {
                    const alreadyHas = memory.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!alreadyHas) {
                            handleFieldChange('tags', [...memory.tags, tag]);
                          }
                        }}
                        disabled={alreadyHas}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          alreadyHas
                            ? 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200'
                        }`}
                      >
                        +{tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
