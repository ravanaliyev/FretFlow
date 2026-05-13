import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Play, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSong } from '../api/client';

interface SongNote {
  note: string;
  time: number;
  duration: number;
}

const AdminSongsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    difficulty: 1,
    xp_reward: 50,
  });
  const [notes, setNotes] = useState<SongNote[]>([
    { note: 'E2', time: 0, duration: 0.5 },
    { note: 'E2', time: 1, duration: 0.5 },
  ]);

  const addNote = () => {
    setNotes([...notes, { note: 'E2', time: notes[notes.length - 1]?.time + 1 || 0, duration: 0.5 }]);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const updateNote = (index: number, field: keyof SongNote, value: string | number) => {
    const newNotes = [...notes];
    newNotes[index] = { ...newNotes[index], [field]: value };
    setNotes(newNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.artist) return;

    setIsSubmitting(true);
    try {
      await createSong(formData.title, formData.artist, formData.difficulty, formData.xp_reward, JSON.stringify(notes));
      navigate('/songs');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playPreview = () => {
    // Simple preview - just show the note sequence
    let index = 0;
    const interval = setInterval(() => {
      if (index < notes.length) {
        console.log('Playing:', notes[index].note);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/songs')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Songs</span>
          </button>
          <h1 className="text-2xl font-bold">Create Song</h1>
          <div className="w-24" />
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-8 mb-8"
          >
            <h2 className="text-xl font-bold mb-6">Song Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Song title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Artist</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Artist name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Difficulty (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">XP Reward</label>
                <input
                  type="number"
                  min="0"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Notes</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={playPreview}
                  className="btn-duo btn-duo-secondary py-2 px-4 flex items-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={addNote}
                  className="btn-duo btn-duo-primary py-2 px-4 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                  <span className="text-gray-500 w-8">#{index + 1}</span>

                  <select
                    value={note.note}
                    onChange={(e) => updateNote(index, 'note', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                  >
                    {['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A3', 'D4', 'F4', 'G4', 'A4', 'B4', 'C4', 'E5'].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Time:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={note.time}
                      onChange={(e) => updateNote(index, 'time', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Duration:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={note.duration}
                      onChange={(e) => updateNote(index, 'duration', parseFloat(e.target.value) || 0.5)}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeNote(index)}
                    className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {notes.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No notes yet. Click "Add Note" to start building your song.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-duo btn-duo-primary w-full py-4 text-lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Create Song'
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default AdminSongsPage;