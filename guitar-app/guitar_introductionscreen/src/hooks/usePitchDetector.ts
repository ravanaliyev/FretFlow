import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePitchDetectorOptions {
  onNoteDetected?: (note: string, frequency: number) => void;
  targetNotes?: string[];
}

export function usePitchDetector({ onNoteDetected, targetNotes = [] }: UsePitchDetectorOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<{ note: string; frequency: number }[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const consecutiveCountRef = useRef<number>(0);
  const isStoppedRef = useRef<boolean>(false);

  const getOptimalBufferSize = () => 4096;

  // Guitar frequency range: E2 = 82Hz to E6 = 1318Hz
  // Ignore anything below 75Hz as it's room noise, not guitar
  const MIN_GUITAR_FREQUENCY = 75;
  const MAX_GUITAR_FREQUENCY = 1400;

  const yinDetector = useCallback((
    buffer: Float32Array,
    sampleRate: number,
    threshold = 0.1
  ): { frequency: number; confidence: number } => {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Float32Array(halfBufferSize);

    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
      for (let i = 0; i < halfBufferSize - tau; i++) {
        const delta = buffer[i] - buffer[i + tau];
        yinBuffer[tau] += delta * delta;
      }
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }

    for (let tau = 2; tau < halfBufferSize; tau++) {
      if (yinBuffer[tau] < threshold && yinBuffer[tau] < 0.5) {
        let bestTau = tau;
        for (let t = tau + 1; t < halfBufferSize; t++) {
          if (yinBuffer[t] < yinBuffer[bestTau]) {
            bestTau = t;
          } else {
            break;
          }
        }

        const y1 = yinBuffer[bestTau - 1] || 0;
        const y2 = yinBuffer[bestTau];
        const y3 = yinBuffer[bestTau + 1] || yinBuffer[bestTau];
        const a = (y1 - 2 * y2 + y3) / 2;
        const b = (y3 - y1) / 2;
        const interpolatedTau = a !== 0 ? bestTau - b / (2 * a) : bestTau;

        const confidence = 1 - yinBuffer[bestTau];
        if (confidence < 0.3) return { frequency: 0, confidence: 0 };

        const frequency = sampleRate / interpolatedTau;
        return { frequency, confidence };
      }
    }
    return { frequency: 0, confidence: 0 };
  }, []);

  const frequencyToNote = useCallback((frequency: number): string => {
    if (frequency <= 0) return '--';
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const noteIndex = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    return noteNames[noteIndex] + octave;
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);

      // Cancel any pending animation frames first
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // Reset detection state before starting fresh
      lastNoteRef.current = null;
      consecutiveCountRef.current = 0;
      isStoppedRef.current = false;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = getOptimalBufferSize();
      analyserRef.current = analyser;

      microphone.connect(analyser);
      setIsListening(true);

      const bufferLength = analyser.fftSize;
      const buffer = new Float32Array(bufferLength);
      const sampleRate = audioContext.sampleRate;

      const detect = () => {
        // Stop listening if stop() was called
        if (isStoppedRef.current) {
          consecutiveCountRef.current = 0;
          lastNoteRef.current = null;
          return;
        }

        analyser.getFloatTimeDomainData(buffer);
        const { frequency, confidence } = yinDetector(buffer, sampleRate);

        // Calculate RMS amplitude
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
          rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        // Require minimum amplitude to filter out ambient noise
        if (rms < 0.01) {
          setCurrentNote(null);
          setCurrentFrequency(null);
          consecutiveCountRef.current = 0;
          lastNoteRef.current = null;
          // Check if stopped BEFORE scheduling next frame
          if (isStoppedRef.current) {
            return;
          }
          animationIdRef.current = requestAnimationFrame(detect);
          return;
        }

        // Filter: only accept frequencies within guitar range
        if (frequency > MIN_GUITAR_FREQUENCY && frequency < MAX_GUITAR_FREQUENCY && confidence > 0.85) {
          const note = frequencyToNote(frequency);
          setCurrentNote(note);
          setCurrentFrequency(frequency);

          // Only trigger callback if same note detected 4+ times consecutively
          if (note === lastNoteRef.current) {
            consecutiveCountRef.current++;
          } else {
            consecutiveCountRef.current = 1;
            lastNoteRef.current = note;
          }

          if (consecutiveCountRef.current >= 4 && onNoteDetected && !isStoppedRef.current) {
            console.log('usePitchDetector: firing callback with', note, frequency);
            setDetectedNotes((prev) => [...prev, { note, frequency }]);
            onNoteDetected(note, frequency);
          }
        } else {
          setCurrentNote(null);
          setCurrentFrequency(null);
          consecutiveCountRef.current = 0;
          lastNoteRef.current = null;
        }

        // Check if stopped BEFORE scheduling next frame
        if (isStoppedRef.current) {
          return;
        }

        animationIdRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err: any) {
      let message = 'Microphone access failed';
      if (err.name === 'NotAllowedError') {
        message = 'Microphone permission denied';
      } else if (err.name === 'NotFoundError') {
        message = 'No microphone found';
      }
      setError(message);
      setIsListening(false);
    }
  }, [yinDetector, frequencyToNote, onNoteDetected]);

  const stop = useCallback(() => {
    console.log('usePitchDetector stop called');
    isStoppedRef.current = true;
    consecutiveCountRef.current = 0; // Reset immediately to block any in-flight callbacks
    lastNoteRef.current = null;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      microphoneRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {
        // Already closed
      }
      audioContextRef.current = null;
    }
    setIsListening(false);
    setCurrentNote(null);
    setCurrentFrequency(null);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const isCorrectNote = useCallback(
    (playedNote: string): boolean => {
      if (targetNotes.length === 0) return true;
      const normalizedPlayed = playedNote.replace(/[0-9]/g, '');
      return targetNotes.some(
        (target) => target.replace(/[0-9]/g, '') === normalizedPlayed
      );
    },
    [targetNotes]
  );

  return {
    isListening,
    error,
    currentNote,
    currentFrequency,
    detectedNotes,
    start,
    stop,
    isCorrectNote,
  };
}