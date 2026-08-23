import React, { useState } from 'react';
import { Mic, Square, Pause, Play, Check, X, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '../lib/audioRecorder';
import { MediaAttachment } from '../types';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAudio: (attachment: MediaAttachment) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveAudio,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    waveformLive,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    error,
  } = useAudioRecorder();

  const [caption, setCaption] = useState('');
  const [recordedAttachment, setRecordedAttachment] = useState<MediaAttachment | null>(null);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinishRecording = async () => {
    const attachment = await stopRecording();
    if (attachment) {
      if (caption.trim()) {
        attachment.caption = caption.trim();
      }
      setRecordedAttachment(attachment);
    }
  };

  const handleConfirmSave = () => {
    if (recordedAttachment) {
      if (caption.trim()) {
        recordedAttachment.caption = caption.trim();
      }
      onSaveAudio(recordedAttachment);
      handleClose();
    }
  };

  const handleClose = () => {
    cancelRecording();
    setRecordedAttachment(null);
    setCaption('');
    onClose();
  };

  return (
    <div
      id="audio-recorder-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="audio-recorder-modal-dialog"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Record Voice Reflection
              </h3>
              <p className="text-xs text-slate-500">Capture the ambient acoustic memory</p>
            </div>
          </div>
          <button
            id="btn-close-recorder-modal"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* State: Not yet recorded / Currently Recording */}
        {!recordedAttachment ? (
          <div className="py-6 flex flex-col items-center justify-center">
            {/* Live Waveform or Idle State */}
            <div className="w-full h-24 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center px-4 overflow-hidden mb-5 relative">
              {isRecording ? (
                <div className="flex items-center justify-center gap-1 w-full h-full">
                  {waveformLive.map((val, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-rose-500 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(10, val)}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <Mic className="w-6 h-6 mx-auto mb-1.5 opacity-40 animate-pulse text-rose-500" />
                  Press record to capture your voice or surrounding sounds
                </div>
              )}

              {/* Status pill */}
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-semibold border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {isPaused ? 'Paused' : 'Recording'}
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="font-mono text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-6">
              {formatTime(recordingTime)}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button
                  id="btn-start-recording-live"
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  Start Recording
                </button>
              ) : (
                <>
                  <button
                    id="btn-toggle-pause-recording"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    id="btn-stop-recording-done"
                    onClick={handleFinishRecording}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Finish & Review
                  </button>

                  <button
                    id="btn-cancel-recording"
                    onClick={cancelRecording}
                    className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* State: Audio Recorded, Ready to Label & Attach */
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between font-medium">
              <span>Recorded successfully ({formatTime(recordedAttachment.duration || 0)})</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>

            <audio src={recordedAttachment.url} controls className="w-full rounded-lg" />

            <div>
              <label htmlFor="input-voice-caption" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audio Note Caption / Prompt (Optional)
              </label>
              <input
                id="input-voice-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Ambient cicadas outside the veranda"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-discard-recording"
                onClick={() => setRecordedAttachment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Re-record
              </button>
              <button
                id="btn-attach-voice-note"
                onClick={handleConfirmSave}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Attach Voice Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
