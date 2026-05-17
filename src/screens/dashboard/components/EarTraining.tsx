import React, { useState, useEffect } from 'react';

export interface EarTrainingGameProps {
  onComplete?: (score: number, total: number) => void;
}

const EarTrainingGame: React.FC<EarTrainingGameProps> = ({ onComplete }) => {
  const strings = [
    { name: 'E2', midi: 40 },
    { name: 'A2', midi: 45 },
    { name: 'D3', midi: 50 },
    { name: 'G3', midi: 55 },
    { name: 'B3', midi: 59 },
    { name: 'E4', midi: 64 },
  ];

  const availableNotes = [
    'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3',
    'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4'
  ] as const;

  const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

  const noteToMidi = (note: string) => {
    const match = note.match(/^([A-G])(#?)(\d)$/);
    if (!match) return null;
    const [, letter, sharp, octave] = match;
    const base = noteValues[letter as keyof typeof noteValues];
    return base + (sharp ? 1 : 0) + 12 * (Number(octave) + 1);
  };

  const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

  const playNote = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi), audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  };

  const getPositions = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return [];
    return strings
      .map((string) => ({ string: string.name, fret: midi - string.midi }))
      .filter((pos) => pos.fret >= 0 && pos.fret <= 12);
  };

  const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);

  const [currentNote, setCurrentNote] = useState<string>('E2');
  const [correctPosition, setCorrectPosition] = useState<{ string: string; fret: number } | null>(null);
  const [options, setOptions] = useState<Array<{ string: string; fret: number }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [correctCount, setCorrectCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);

  const buildQuestion = () => {
    const note = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    const positions = getPositions(note);
    if (positions.length === 0) {
      return buildQuestion();
    }
    const correct = positions[Math.floor(Math.random() * positions.length)];
    const allPositions = strings.flatMap((string) =>
      Array.from({ length: 13 }, (_, idx) => ({ string: string.name, fret: idx }))
    );
    const wrongOptions = shuffle(allPositions.filter((pos) => pos.string !== correct.string || pos.fret !== correct.fret)).slice(0, 3);

    setCurrentNote(note);
    setCorrectPosition(correct);
    setOptions(shuffle([correct, ...wrongOptions]));
    setSelectedId(null);
    setFeedback('');
    playNote(note);
  };

  useEffect(() => {
    buildQuestion();
  }, []);

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

    // Check for victory condition
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
