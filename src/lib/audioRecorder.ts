import { useState, useRef, useCallback } from 'react';
import { MediaAttachment } from '../types';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  waveformLive: number[];
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<MediaAttachment | null>;
  cancelRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformLive, setWaveformLive] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const waveformSamplesRef = useRef<number[]>([]);

  const cleanupAudio = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setWaveformLive([]);
  }, []);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Compute average level across bands
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    const normalized = Math.min(100, Math.max(5, Math.round((avg / 255) * 100)));

    setWaveformLive((prev) => {
      const next = [...prev.slice(-35), normalized];
      return next;
    });

    if (Math.random() > 0.4) {
      waveformSamplesRef.current.push(normalized);
    }

    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    waveformSamplesRef.current = [];
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      updateWaveform();
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError(err.message || 'Could not access microphone');
      cleanupAudio();
    }
  }, [cleanupAudio, updateWaveform]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
      updateWaveform();
    }
  }, [updateWaveform]);

  const stopRecording = useCallback(async (): Promise<MediaAttachment | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupAudio();
        resolve(null);
        return;
      }

      const totalDuration = recordingTime;

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);

        // Normalize sampled waveform to 24 points
        const samples = waveformSamplesRef.current;
        const normalizedWaveform: number[] = [];
        const step = Math.max(1, Math.floor(samples.length / 24));
        for (let i = 0; i < samples.length && normalizedWaveform.length < 24; i += step) {
          normalizedWaveform.push(samples[i]);
        }
        while (normalizedWaveform.length < 24) {
          normalizedWaveform.push(Math.floor(Math.random() * 30 + 10));
        }

        const attachment: MediaAttachment = {
          id: 'audio-' + Date.now(),
          type: 'audio',
          name: `Voice Memory ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          mimeType,
          size: audioBlob.size,
          url,
          blob: audioBlob,
          duration: totalDuration || 1,
          createdAt: Date.now(),
          waveform: normalizedWaveform,
          caption: 'Live microphone recording',
        };

        cleanupAudio();
        resolve(attachment);
      };

      recorder.stop();
    });
  }, [cleanupAudio, recordingTime]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupAudio();
  }, [cleanupAudio]);

  return {
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
  };
}
