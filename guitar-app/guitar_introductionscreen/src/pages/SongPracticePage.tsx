import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Square, Music, Trophy, Loader2 } from 'lucide-react';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { getSong, submitScore } from '../api/client';

interface Song {
  id: number;
  title: string;
  artist: string;
  difficulty: number;
  xp_reward: number;
  notes?: { note: string; time: number; duration: number }[];
}

const SongPracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [recordedNotes, setRecordedNotes] = useState<{ note: string; time: number }[]>([]);
  const [score, setScore] = useState<{ overallScore: number; pitchAccuracy: number; timingAccuracy: number; completeness: number; feedback: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noteBufferRef = useRef<any>(null);
  const playbackIntervalRef = useRef<number | null>(null);

  const handleNoteDetected = useCallback((note: string, frequency: number) => {
    if (!isRecording || !noteBufferRef.current) return;
    const timestamp = noteBufferRef.current.getDuration();
    noteBufferRef.current.addNote(frequency, note, 1.0);
    setRecordedNotes((prev) => [...prev, { note, time: timestamp }]);
  }, [isRecording]);

  const { start, stop } = usePitchDetector({
    onNoteDetected: handleNoteDetected,
  });

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;

      try {
        const data = await getSong(parseInt(id));
        setSong(data);
      } catch (err) {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id]);

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      stop();
    };
  }, [stop]);

  const startPlayback = () => {
    if (!song || !song.notes) return;

    setIsPlaying(true);
    setCurrentNoteIndex(0);
    setPlaybackTime(0);
    setRecordedNotes([]);
    setScore(null);

    noteBufferRef.current = {
      notes: [],
      startTime: performance.now(),
      endTime: null,
      isRecording: true,
      start: function() {
        this.notes = [];
        this.startTime = performance.now();
        this.isRecording = true;
      },
      end: function() {
        this.endTime = performance.now();
        this.isRecording = false;
      },
      addNote: function(frequency: number, note: string, volume: number) {
        if (!this.isRecording) return;
        const timestamp = (performance.now() - this.startTime) / 1000;
        this.notes.push({ frequency, note, timestamp, volume });
      },
      getNotes: function() {
        return this.notes.map((n: any) => ({ ...n }));
      },
      getDuration: function() {
        if (!this.startTime) return 0;
        const end = this.endTime || performance.now();
        return (end - this.startTime) / 1000;
      }
    };

    const songNotes = song.notes;
    let startTime = performance.now();

    start();
    setIsRecording(true);
    noteBufferRef.current.start();

    playbackIntervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      setPlaybackTime(elapsed);

      const nextNoteIndex = songNotes.findIndex((n) => n.time > elapsed);
      if (nextNoteIndex !== -1) {
        setCurrentNoteIndex(nextNoteIndex);
      } else if (elapsed > songNotes[songNotes.length - 1].time + 2) {
        stopPlayback();
      }
    }, 50);
  };

  const stopPlayback = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    if (isRecording && noteBufferRef.current) {
      noteBufferRef.current.end();
    }

    setIsPlaying(false);
    setIsRecording(false);
    stop();

    if (song && recordedNotes.length > 0) {
      calculateScore();
    }
  }, [song, recordedNotes, isRecording, stop]);

  const calculateScore = () => {
    if (!song || !song.notes || recordedNotes.length === 0) {
      setScore({ overallScore: 0, pitchAccuracy: 0, timingAccuracy: 0, completeness: 0, feedback: 'No notes recorded' });
      return;
    }

    const songNotes = song.notes;
    let correctNotes = 0;
    const totalExpected = songNotes.length;

    songNotes.forEach((expectedNote) => {
      const match = recordedNotes.find(
        (recorded) =>
          Math.abs(recorded.time - expectedNote.time) < 0.5 &&
          recorded.note.replace(/[0-9]/g, '') === expectedNote.note.replace(/[0-9]/g, '')
      );
      if (match) correctNotes++;
    });

    const accuracy = totalExpected > 0 ? (correctNotes / totalExpected) * 100 : 0;
    const pitchScore = accuracy * 0.6;
    const completenessScore = Math.min((recordedNotes.length / totalExpected) * 100, 100) * 0.2;
    const timingScore = accuracy * 0.2;
    const overallScore = Math.round(pitchScore + completenessScore + timingScore);

    setScore({
      overallScore,
      pitchAccuracy: Math.round(accuracy),
      timingAccuracy: Math.round(timingScore / 0.2),
      completeness: Math.round(completenessScore / 0.2),
      feedback: overallScore >= 80 ? 'Excellent!' : overallScore >= 60 ? 'Good job!' : 'Keep practicing!',
    });
  };

  const handleSubmitScore = async () => {
    if (!song || !score) return;

    setIsSubmitting(true);
    try {
      await submitScore(song.id, score.overallScore, score.pitchAccuracy);
      navigate('/songs');
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-white">Song not found</p>
      </div>
    );
  }

  const songNotes = song.notes || [];
  const maxTime = songNotes.length > 0 ? songNotes[songNotes.length - 1].time : 1;

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/songs')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Songs</span>
          </button>
        </div>

        {/* Song Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Music className="w-10 h-10 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
          <p className="text-gray-400">{song.artist}</p>
        </motion.div>

        {/* Playback Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-8 mb-8"
        >
          {/* Current Note Display */}
          <div className="text-center mb-8">
            {isPlaying ? (
              <>
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
                  {currentNoteIndex < songNotes.length ? 'Play Now' : 'Finished'}
                </p>
                <div className="text-6xl font-bold text-primary-500 neon-text-green">
                  {currentNoteIndex < songNotes.length
                    ? songNotes[currentNoteIndex].note
                    : '—'}
                </div>
              </>
            ) : score ? (
              <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-4xl font-bold mb-2">{score.overallScore}%</p>
                <p className="text-gray-400">{score.feedback}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Ready to Play</p>
                <div className="text-6xl font-bold text-gray-500">🎸</div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{
                  width: `${Math.min((playbackTime / maxTime) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(maxTime)}</span>
            </div>
          </div>

          {/* Mic Status */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">Recording...</span>
              </>
            ) : (
              <span className="text-gray-400">Press Play to start</span>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isPlaying ? (
              <button
                onClick={startPlayback}
                className="btn-duo btn-duo-primary py-4 px-8 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Play
              </button>
            ) : (
              <button
                onClick={stopPlayback}
                className="btn-duo btn-duo-secondary py-4 px-8 flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
            )}
          </div>
        </motion.div>

        {/* Score Details */}
        {score && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-bold mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{score.pitchAccuracy}%</p>
                <p className="text-sm text-gray-400">Pitch</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{score.timingAccuracy}%</p>
                <p className="text-sm text-gray-400">Timing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{score.completeness}%</p>
                <p className="text-sm text-gray-400">Complete</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        {score && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting}
              className="btn-duo btn-duo-primary w-full py-4 text-lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                `Save Score (+${song.xp_reward} XP)`
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SongPracticePage;