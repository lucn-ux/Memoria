export type MoodType =
  | 'nostalgic'
  | 'serene'
  | 'joyful'
  | 'bittersweet'
  | 'reflective'
  | 'inspired'
  | 'peaceful'
  | 'adventurous'
  | 'cozy';

export type WeatherType =
  | 'sunny'
  | 'golden_hour'
  | 'rainy'
  | 'cloudy'
  | 'starry'
  | 'misty'
  | 'snowy'
  | 'breezy';

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaAttachment {
  id: string;
  type: MediaType;
  name: string;
  mimeType: string;
  size: number;
  url: string; // Blob URL or base64 data URL
  blob?: Blob;
  duration?: number; // Duration in seconds for audio/video
  caption?: string;
  createdAt: number;
  waveform?: number[];
  dimensions?: { width: number; height: number };
}

export interface AIReflection {
  reflection: string;
  poeticSummary: string;
  suggestedTags: string[];
  writingPrompt: string;
  resonanceScore: number;
  generatedAt: number;
  isOfflineFallback?: boolean;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string; // Written notes / Markdown
  date: string; // ISO date string "2024-06-15T18:00"
  createdAt: number;
  updatedAt: number;
  mood: MoodType;
  weather?: WeatherType;
  location?: string;
  isFavorite: boolean;
  isPinned: boolean;
  isTimeCapsule: boolean;
  unlockDate?: string; // Optional future unlock date
  tags: string[];
  collectionId: string;
  media: MediaAttachment[];
  aiReflection?: AIReflection;
  scrapbookLayout?: 'standard' | 'polaroid' | 'minimal' | 'film_strip';
}

export interface MemoryCollection {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isSystem?: boolean;
}

export type ViewMode = 'cards' | 'compact' | 'timeline' | 'scrapbook';
export type AppLayout = 'studio' | 'timeline' | 'cinema' | 'capsule';
export type AppTheme = 'linen' | 'slate' | 'forest' | 'sepia' | 'studio';

export interface FilterState {
  searchQuery: string;
  selectedCollectionId: string;
  selectedMood?: MoodType;
  selectedMediaType?: 'all' | 'image' | 'video' | 'audio' | 'text';
  selectedTag?: string;
  onlyFavorites: boolean;
  onlyTimeCapsules: boolean;
  sortBy: 'date_desc' | 'date_asc' | 'updated_desc' | 'title_asc';
  viewMode: ViewMode;
}
