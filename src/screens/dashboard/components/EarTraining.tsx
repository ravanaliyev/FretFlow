import React, { useState, useEffect } from 'react';

/**
 * Properties for the EarTrainingGame component.
 * @property onComplete - Optional callback triggered once the user reaches 10 correct answers.
 */
export interface EarTrainingGameProps {
  onComplete?: (score: number, total: number) => void;
}

/**
 * EarTrainingGame Component
 * An interactive, gamified auditory training screen.
 * - Plays synthesized audio notes dynamically via the browser Web Audio API.
 * - Prompts users to identify the correct guitar string and fret position matching the sound.
 * - Builds 4-option multiple-choice questions automatically and tracks live score statistics.
 */
const EarTrainingGame: React.FC<EarTrainingGameProps> = ({ onComplete }) => {
  // Array representing the six standard guitar strings and their corresponding MIDI note numbers
  const strings = [
    { name: 'E2', midi: 40 }, // 6th String (Low E)
    { name: 'A2', midi: 45 }, // 5th String
    { name: 'D3', midi: 50 }, // 4th String
    { name: 'G3', midi: 55 }, // 3rd String
    { name: 'B3', midi: 59 }, // 2nd String
    { name: 'E4', midi: 64 }, // 1st String (High E)
  ];

  // Notes pool available for testing
  const availableNotes = [
    'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3',
    'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4'
  ] as const;

  // MIDI offset base values for the 12 chromatic scale pitches
  const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

  /**
   * Helper function to convert a standard note string (e.g., "A#3") into a standard MIDI number.
   */
  const noteToMidi = (note: string) => {
    const match = note.match(/^([A-G])(#?)(\d)$/);
    if (!match) return null;
    const [, letter, sharp, octave] = match;
    const base = noteValues[letter as keyof typeof noteValues];
    // Base pitch offset + accidental sharp + octave multiplier (octave 0 = MIDI 12)
    return base + (sharp ? 1 : 0) + 12 * (Number(octave) + 1);
  };

  /**
   * Helper function to convert a MIDI number into an absolute fundamental frequency in Hertz (Hz).
   * Uses standard A4 = 440 Hz reference pitch. Formula: 440 * 2^((midi - 69) / 12)
   */
  const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

  /**
   * Generates and plays a physical audio tone using standard Web Audio API oscillators.
   * Leverages a smooth linear volume ramp-up and exponential decay (ADSR envelope) to prevent audio clicks.
   */
  const playNote = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return;
    
    // Instantiate AudioContext cross-browser
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Use a soft, warm triangle wave resembling acoustic tones
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi), audioCtx.currentTime);
    
    // Audio Envelope setting volume over time
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    // Smooth fade-in
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    // Smooth decay to silence
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  };

  /**
   * Identifies all valid guitar string and fret combinations (from fret 0 to 12)
   * that can produce the requested note MIDI frequency.
   */
  const getPositions = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return [];
    return strings
      .map((string) => ({ string: string.name, fret: midi - string.midi }))
      // Exclude values outside standard 12-fret range
      .filter((pos) => pos.fret >= 0 && pos.fret <= 12);
  };

  // Helper function to randomly shuffle an array
  const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);

  // Core Game States
  const [currentNote, setCurrentNote] = useState<string>('E2');
  const [correctPosition, setCorrectPosition] = useState<{ string: string; fret: number } | null>(null);
  const [options, setOptions] = useState<Array<{ string: string; fret: number }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [correctCount, setCorrectCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);

  /**
   * Randomly selects a target note, registers its correct position, builds 3 incorrect
   * distractor answers, and plays the audio cue.
   */
  const buildQuestion = () => {
    const note = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    const positions = getPositions(note);
    // Retry if note cannot be played on standard 12 frets
    if (positions.length === 0) {
      return buildQuestion();
    }
    const correct = positions[Math.floor(Math.random() * positions.length)];
    
    // Collect all possible 78 guitar fret board positions
    const allPositions = strings.flatMap((string) =>
      Array.from({ length: 13 }, (_, idx) => ({ string: string.name, fret: idx }))
    );
    
    // Choose 3 random wrong options
    const wrongOptions = shuffle(
      allPositions.filter((pos) => pos.string !== correct.string || pos.fret !== correct.fret)
    ).slice(0, 3);

    setCurrentNote(note);
    setCorrectPosition(correct);
    setOptions(shuffle([correct, ...wrongOptions]));
    setSelectedId(null);
    setFeedback('');
    playNote(note);
  };

  // Launch initial question round on page load
  useEffect(() => {
    buildQuestion();
  }, []);

  /**
   * Validates option selected by user, sets visual feedback, and triggers completion or schedules the next round.
   */
  const handleAnswer = (option: { string: string; fret: number }) => {
    setSelectedId(`${option.string}-${option.fret}`);
    const isCorrect = correctPosition && option.string === correctPosition.string && option.fret === correctPosition.fret;
    
    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong — the right answer was ${correctPosition?.string} fret ${correctPosition?.fret}.`);
    }
    setRoundCount((count) => count + 1);

    // If victory count (10) is achieved, trigger complete callback. Else build next question.
    if (isCorrect && correctCount + 1 >= 10) {
      if (onComplete) {
        onComplete(correctCount + 1, roundCount + 1);
      }
    } else {
      setTimeout(buildQuestion, 1600);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-dark-950/70 shadow-2xl shadow-black/40">
        
        {/* Score Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Ear Training Practice</p>
            <h3 className="text-lg font-black text-white">Hear the note. Match the fretboard.</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Score</p>
            <p className="text-lg font-black text-primary-500">{correctCount}/{Math.max(roundCount, 1)}</p>
          </div>
        </div>

        {/* Audio control deck */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
          <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
            <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">A note is played without showing its name. Choose the correct string and fret.</p>
            <div className="text-3xl font-black text-white mb-1">♪</div>
          </div>
          <button
            onClick={() => currentNote && playNote(currentNote)}
            className="py-3 px-5 rounded-2xl bg-primary-500 text-dark-900 font-black uppercase tracking-widest hover:bg-primary-400 transition-all text-sm"
          >
            Play Note Again
          </button>
        </div>

        {/* Multiple choice options */}
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          {options.map((option) => {
            const optionId = `${option.string}-${option.fret}`;
            return (
              <button
                key={optionId}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedId}
                className={`p-4 rounded-2xl text-left font-bold transition-all border ${selectedId === optionId ? 'border-primary-500 bg-primary-500/20 text-white' : 'bg-dark-900 border-white/10 hover:border-primary-500/30 hover:bg-dark-800 text-gray-200'} ${selectedId ? 'cursor-not-allowed opacity-90' : 'active:scale-95 shadow-lg shadow-black/20'}`}
              >
                <div className="flex items-center justify-around py-1">
                  <div className="text-center min-w-[70px]">
                    <span className="block text-[8px] text-gray-500 uppercase tracking-[0.2em] mb-1">String</span>
                    <span className="text-lg font-black text-white leading-none">{option.string}</span>
                  </div>
                  <div className="w-px h-10 bg-white/10 mx-2" />
                  <div className="text-center min-w-[70px]">
                    <span className="block text-[8px] text-gray-500 uppercase tracking-[0.2em] mb-1">Fret</span>
                    <span className="text-lg font-black text-white leading-none">{option.fret}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Alert banner */}
        {feedback && (
          <div className="mt-6 rounded-3xl bg-white/5 p-4 border border-white/10 text-sm text-gray-200">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarTrainingGame;
