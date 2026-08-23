import React, { useState } from 'react';
import {
  Hourglass,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  PartyPopper,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemoryItem } from '../types';

interface TimeCapsuleViewProps {
  memories: MemoryItem[];
  onSelectMemory: (id: string) => void;
  onUpdateMemory: (updated: MemoryItem) => void;
}

export const TimeCapsuleView: React.FC<TimeCapsuleViewProps> = ({
  memories,
  onSelectMemory,
  onUpdateMemory,
}) => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // Filter memories designated as time capsules or past memories
  const capsuleMemories = memories.filter((m) => m.isTimeCapsule);

  // "On This Day" calculation: matches month & day
  const today = new Date();
  const onThisDayMemories = memories.filter((m) => {
    try {
      const d = new Date(m.date);
      return (
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        d.getFullYear() !== today.getFullYear()
      );
    } catch {
      return false;
    }
  });

  const handleUnlockCapsule = (memory: MemoryItem) => {
    // Fire confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
    });

    setUnlockedIds((prev) => [...prev, memory.id]);
    onUpdateMemory({
      ...memory,
      isTimeCapsule: false,
      updatedAt: Date.now(),
    });
  };

  return (
    <div
      id="time-capsule-dashboard"
      className="flex-1 h-full overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 p-6 sm:p-10"
    >
      <div className="max-w-4xl mx-auto space-y-10 pb-24">
        {/* Banner */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-2">
            <Hourglass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tracking-tight">
            Time Capsules & Vault
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Memories sealed for the future or rediscovered across the years
          </p>
        </div>

        {/* "On This Day" Rediscovery Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              On This Day in Your History
            </h3>
          </div>

          {onThisDayMemories.length === 0 ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-center text-xs text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-500" />
              <p className="font-medium text-slate-600 dark:text-slate-300">No past entries recorded on this exact calendar date.</p>
              <p className="text-[11px] mt-0.5 text-slate-400">As you build your memory vault, past anniversaries will surface here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onThisDayMemories.map((mem) => {
                const yearsAgo = today.getFullYear() - new Date(mem.date).getFullYear();
                return (
                  <div
                    key={mem.id}
                    id={`on-this-day-${mem.id}`}
                    onClick={() => onSelectMemory(mem.id)}
                    className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl cursor-pointer hover:shadow-md transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-semibold font-mono text-[10px]">
                        {yearsAgo} {yearsAgo === 1 ? 'Year' : 'Years'} Ago
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {new Date(mem.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold font-serif text-slate-900 dark:text-slate-100 text-sm">
                      {mem.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-serif">
                      {mem.content ? mem.content.replace(/[#*`>_-]/g, '') : 'No notes recorded.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sealed Time Capsules Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Sealed Memory Capsules ({capsuleMemories.length})
            </h3>
          </div>

          {capsuleMemories.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-center text-xs text-slate-400 space-y-2">
              <Hourglass className="w-8 h-8 mx-auto opacity-30 text-purple-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No sealed capsules currently</p>
              <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                You can turn any memory into a time capsule in the editor by clicking “Mark as Time Capsule”.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capsuleMemories.map((mem) => {
                const isUnlocked = unlockedIds.includes(mem.id);
                return (
                  <div
                    key={mem.id}
                    id={`capsule-card-${mem.id}`}
                    className="p-5 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800/80 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sealed Capsule</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(mem.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold font-serif text-slate-900 dark:text-slate-100 text-base">
                      {mem.title || 'Untitled Capsule'}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      Contains {mem.media.length} multimedia attachments and written reflections.
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        id={`btn-open-capsule-${mem.id}`}
                        onClick={() => handleUnlockCapsule(mem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
                      >
                        <PartyPopper className="w-3.5 h-3.5" />
                        <span>Unseal & Reveal</span>
                      </button>

                      <button
                        onClick={() => onSelectMemory(mem.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
