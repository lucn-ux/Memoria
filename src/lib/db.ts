import { MemoryItem, MemoryCollection, MediaAttachment } from '../types';

const DB_NAME = 'memoria_notes_db';
const DB_VERSION = 1;
const STORE_MEMORIES = 'memories';
const STORE_COLLECTIONS = 'collections';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        const memoryStore = db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
        memoryStore.createIndex('date', 'date', { unique: false });
        memoryStore.createIndex('collectionId', 'collectionId', { unique: false });
        memoryStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_COLLECTIONS: MemoryCollection[] = [
  { id: 'all', name: 'All Memories', icon: 'BookOpen', color: 'emerald', isSystem: true },
  { id: 'milestones', name: 'Milestones & Journeys', icon: 'Compass', color: 'amber' },
  { id: 'soundscapes', name: 'Audio Diaries & Voice', icon: 'Mic', color: 'indigo' },
  { id: 'scrapbook', name: 'Visual Scrapbook', icon: 'Sparkles', color: 'rose' },
  { id: 'capsules', name: 'Time Capsules', icon: 'Hourglass', color: 'purple' },
];

/**
 * Creates a sample WAV audio blob (warm calming chime tone chord)
 */
function generateSampleAudioWav(): Blob {
  const sampleRate = 44100;
  const duration = 3.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Chords: 220Hz (A3), 277.18Hz (C#4), 329.63Hz (E4), 440Hz (A4)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 1.2) * (t < 0.05 ? t / 0.05 : 1);
    const sample =
      (Math.sin(2 * Math.PI * 220 * t) * 0.35 +
        Math.sin(2 * Math.PI * 277.18 * t) * 0.25 +
        Math.sin(2 * Math.PI * 329.63 * t) * 0.25 +
        Math.sin(2 * Math.PI * 440 * t) * 0.15) *
      envelope;

    const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Creates high quality SVG data URLs for rich default sample memories
 */
function createSampleCoverImage(title: string, subtitle: string, gradient1: string, gradient2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient1}" />
        <stop offset="100%" stop-color="${gradient2}" />
      </linearGradient>
      <radialGradient id="glow" cx="60%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
      </radialGradient>
      <filter id="blurFilter">
        <feGaussianBlur stdDeviation="30"/>
      </filter>
    </defs>
    <rect width="1200" height="800" fill="url(#bg)" />
    <circle cx="900" cy="250" r="280" fill="#fff" opacity="0.15" filter="url(#blurFilter)"/>
    <circle cx="300" cy="600" r="350" fill="#000" opacity="0.2" filter="url(#blurFilter)"/>
    <rect width="1200" height="800" fill="url(#glow)" />
    <!-- Golden grain/grid overlay -->
    <g opacity="0.08" stroke="#ffffff" stroke-width="1">
      <line x1="0" y1="200" x2="1200" y2="200" />
      <line x1="0" y1="400" x2="1200" y2="400" />
      <line x1="0" y1="600" x2="1200" y2="600" />
      <line x1="300" y1="0" x2="300" y2="800" />
      <line x1="600" y1="0" x2="600" y2="800" />
      <line x1="900" y1="0" x2="900" y2="800" />
    </g>
    <!-- Card Frame -->
    <rect x="80" y="80" width="1040" height="640" rx="28" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <!-- Typography -->
    <text x="140" y="580" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif" font-size="54" font-weight="700" fill="#ffffff" letter-spacing="-0.5">${title}</text>
    <text x="140" y="630" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="400" fill="rgba(255,255,255,0.85)" letter-spacing="1">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SEED_MEMORIES: MemoryItem[] = [
  {
    id: 'seed-1',
    title: 'Golden Hour at Cape Point Overlook',
    content: `We arrived right as the midday sea fog pulled back, revealing the jagged cliffs dropping into the emerald Atlantic below. The air was thick with the scent of wild coastal fynbos and salted spray.

### Sensory Notes
> *"The light was that rare liquid amber that turns even rough granite into velvet."*

We sat on the flat ledge for forty-five minutes without saying much, watching a lone fishing vessel navigate the channel. It reminded me how important it is to step away from screens and let time stretch out unmeasured.

**Key details to remember:**
- The crisp ocean breeze that cooled the sun on our faces
- The warmth of hot chai poured from the dented silver thermos
- The sudden flock of white terns carving arcs against the dusk sky`,
    date: '2025-11-14T17:45',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    mood: 'nostalgic',
    weather: 'golden_hour',
    location: 'Cape Point, Western Cape',
    isFavorite: true,
    isPinned: true,
    isTimeCapsule: false,
    tags: ['Travel', 'Ocean', 'GoldenHour', 'Solitude', 'Reflection'],
    collectionId: 'scrapbook',
    scrapbookLayout: 'polaroid',
    media: [
      {
        id: 'media-seed-1',
        type: 'image',
        name: 'cape-point-sunset.svg',
        mimeType: 'image/svg+xml',
        size: 14200,
        url: createSampleCoverImage('Cape Point Overlook', 'ATLANTIC OCEAN • 17:45 PM', '#c2410c', '#1e1b4b'),
        caption: 'The cliffside edge right before dusk fell over the ocean.',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      },
    ],
    aiReflection: {
      reflection:
        'This entry captures a profound moment of stillness at the threshold of land and sea. The juxtaposition of wild nature and quiet companionship turns a simple scenic view into a lasting touchstone for peace.',
      poeticSummary: '“Liquid amber over granite stone; time measured only by the tide.”',
      suggestedTags: ['Sanctuary', 'Horizons', 'Wildness', 'Presence'],
      writingPrompt: 'When you close your eyes now, what is the exact physical sensation you recall most vividly from that cliff?',
      resonanceScore: 94,
      generatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      isOfflineFallback: false,
    },
  },
  {
    id: 'seed-2',
    title: 'Rain on the Skylight & Lo-Fi Vinyl',
    content: `A slow Sunday afternoon in late October. The steady rhythmic patter against the attic window panes acted like an acoustic cocoon.

Put on an old Bill Evans trio record on the turntable. The needle had that slight, cozy hum in the pauses between tracks. Made a fresh pot of roasted genmaicha tea.

### Reflections
I realized today that memory isn't just about big milestone trips—it's preserved in the texture of quiet afternoons where nothing urgent needed to be done.`,
    date: '2025-10-26T15:20',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    mood: 'serene',
    weather: 'rainy',
    location: 'Attic Study, Home',
    isFavorite: true,
    isPinned: false,
    isTimeCapsule: false,
    tags: ['Home', 'Rain', 'Music', 'Tea', 'Peaceful'],
    collectionId: 'soundscapes',
    scrapbookLayout: 'standard',
    media: [
      {
        id: 'media-seed-2',
        type: 'audio',
        name: 'attic-chime-reflection.wav',
        mimeType: 'audio/wav',
        size: 308700,
        url: URL.createObjectURL(generateSampleAudioWav()),
        duration: 3.5,
        caption: 'Ambient harmonic chime recorded during the rainfall.',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
        waveform: [18, 42, 65, 88, 95, 78, 62, 45, 38, 52, 60, 48, 32, 24, 18, 14, 10, 8, 5, 3],
      },
    ],
    aiReflection: {
      reflection:
        'A warm sanctuary piece celebrating the beauty of ordinary moments. The audio resonance and tactile details of vinyl and steam form an anchor against daily noise.',
      poeticSummary: '“In the spaces between raindrops, the world softly breathes.”',
      suggestedTags: ['Cocoon', 'Mindfulness', 'Simplicity'],
      writingPrompt: 'What ritual from this afternoon do you want to carry into your busiest weeks?',
      resonanceScore: 91,
      generatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
      isOfflineFallback: true,
    },
  },
  {
    id: 'seed-3',
    title: 'First Melody on the Old Cedar Guitar',
    content: `After two weeks of sore fingertips and fumbling chords, the transition from C Major to A Minor finally clicked without a stutter. Played the opening phrase to a song I've loved since high school.

There is something so genuinely grounding about learning a physical acoustic instrument in an age of automated everything.

- **Milestone Achieved:** Clean barre chord sustain for 5 full seconds
- **Next Goal:** Fingerpicking cadence without glancing down at the frets`,
    date: '2025-09-08T19:10',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    mood: 'inspired',
    weather: 'starry',
    location: 'Music Corner',
    isFavorite: false,
    isPinned: false,
    isTimeCapsule: false,
    tags: ['Milestone', 'Music', 'Guitar', 'Practice', 'Craft'],
    collectionId: 'milestones',
    scrapbookLayout: 'film_strip',
    media: [
      {
        id: 'media-seed-3',
        type: 'image',
        name: 'cedar-guitar-craft.svg',
        mimeType: 'image/svg+xml',
        size: 13800,
        url: createSampleCoverImage('Cedar Guitar Practice', 'SESSION NO. 14 • 19:10 PM', '#065f46', '#0f172a'),
        caption: 'Sheet music and guitar resting on the woven rug.',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
    ],
  },
];

export async function initStorage(): Promise<{ memories: MemoryItem[]; collections: MemoryCollection[] }> {
  const db = await openDB();

  // Load collections
  const collections = await new Promise<MemoryCollection[]>((resolve, reject) => {
    const tx = db.transaction(STORE_COLLECTIONS, 'readonly');
    const store = tx.objectStore(STORE_COLLECTIONS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (collections.length === 0) {
    const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
    const store = tx.objectStore(STORE_COLLECTIONS);
    DEFAULT_COLLECTIONS.forEach((col) => store.put(col));
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  }

  // Load memories
  let memories = await new Promise<MemoryItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readonly');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (memories.length === 0) {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    SEED_MEMORIES.forEach((mem) => store.put(mem));
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    memories = [...SEED_MEMORIES];
  }

  return {
    memories,
    collections: collections.length > 0 ? collections : DEFAULT_COLLECTIONS,
  };
}

export async function saveMemoryToDB(memory: MemoryItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.put(memory);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMemoryFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveCollectionToDB(collection: MemoryCollection): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
    const store = tx.objectStore(STORE_COLLECTIONS);
    const req = store.put(collection);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function exportFullArchiveJSON(): Promise<string> {
  const db = await openDB();
  const memories = await new Promise<MemoryItem[]>((resolve) => {
    const tx = db.transaction(STORE_MEMORIES, 'readonly');
    const req = tx.objectStore(STORE_MEMORIES).getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
  const collections = await new Promise<MemoryCollection[]>((resolve) => {
    const tx = db.transaction(STORE_COLLECTIONS, 'readonly');
    const req = tx.objectStore(STORE_COLLECTIONS).getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  return JSON.stringify(
    {
      version: 1,
      appName: 'Memoria Notes',
      exportedAt: new Date().toISOString(),
      memories,
      collections,
    },
    null,
    2
  );
}

export async function importArchiveJSON(jsonString: string): Promise<number> {
  const parsed = JSON.parse(jsonString);
  if (!parsed.memories || !Array.isArray(parsed.memories)) {
    throw new Error('Invalid archive format: missing memories array');
  }

  const db = await openDB();
  const tx = db.transaction([STORE_MEMORIES, STORE_COLLECTIONS], 'readwrite');
  const memStore = tx.objectStore(STORE_MEMORIES);
  const colStore = tx.objectStore(STORE_COLLECTIONS);

  if (parsed.collections && Array.isArray(parsed.collections)) {
    parsed.collections.forEach((col: MemoryCollection) => colStore.put(col));
  }

  parsed.memories.forEach((mem: MemoryItem) => memStore.put(mem));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(parsed.memories.length);
    tx.onerror = () => reject(tx.error);
  });
}
