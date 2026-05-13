import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { getSongs } from '../api/client';
import Pagination from '../components/Pagination';

interface Song {
  id: number;
  title: string;
  artist: string;
  difficulty: number;
  xp_reward: number;
}

interface SongWithScore extends Song {
  best_score?: number;
  times_played?: number;
}

interface SongsResponse {
  data: SongWithScore[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const SongsPage: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<SongWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const response = await getSongs(currentPage);
        const data = response as SongsResponse;
        setSongs(data.data || []);
        const total = data.pagination?.total || 0;
        const limit = data.pagination?.limit || 20;
        setTotalPages(Math.ceil(total / limit) || 1);
      } catch (err) {
        setError('Failed to load songs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, [currentPage]);

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      case 4:
        return 'Expert';
      case 5:
        return 'Master';
      default:
        return 'Unknown';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'text-green-400';
      case 2:
        return 'text-yellow-400';
      case 3:
        return 'text-orange-400';
      case 4:
        return 'text-red-400';
      case 5:
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Song Library</h1>
            <p className="text-gray-400">Play along with your favorite songs</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="glass-panel rounded-2xl p-4 mb-8 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Songs List */}
        <div className="space-y-4">
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => navigate(`/songs/${song.id}/play`)}
              className="glass-panel rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Song Icon */}
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-purple-500" />
                  </div>

                  {/* Song Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{song.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{song.artist}</p>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-medium ${getDifficultyColor(
                          song.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(song.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">
                        +{song.xp_reward} XP
                      </span>
                      {song.best_score !== undefined && (
                        <span className="text-xs text-primary-400">
                          Best: {song.best_score}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Play Button */}
                <ChevronRight className="w-6 h-6 text-gray-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No songs available yet</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon!</p>
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default SongsPage;