import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Crown, Loader2, ArrowLeft } from 'lucide-react';
import { getLeaderboard, getMyScores } from '../api/client';
import Pagination from '../components/Pagination';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  level_name: string;
  best_score?: number;
}

interface MyScore {
  song_id: number;
  song_title: string;
  score: number;
  accuracy_percent: number;
  played_at: string;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScores, setMyScores] = useState<MyScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [leaderboardData, scoresData] = await Promise.all([
          getLeaderboard(currentPage),
          getMyScores(),
        ]);
        const lbData = leaderboardData as LeaderboardResponse;
        setLeaderboard(lbData.data || []);
        const total = lbData.pagination?.total || 0;
        const limit = lbData.pagination?.limit || 20;
        setTotalPages(Math.ceil(total / limit) || 1);
        // Handle both {data: [...]} and [...] response formats
        setMyScores((scoresData as any)?.data || scoresData || []);
      } catch (err) {
        setError('Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/10 border-gray-400/20';
      case 3:
        return 'bg-amber-600/20 border-amber-600/30';
      default:
        return 'bg-white/5 border-white/10';
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
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-gray-400">Top guitarists worldwide</p>
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

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-end justify-center gap-4 mb-8"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center mb-2 overflow-hidden">
                <span className="text-2xl font-bold text-gray-400">
                  {leaderboard[1]?.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <p className="font-bold text-lg">{leaderboard[1]?.username}</p>
              <p className="text-sm text-gray-400">{leaderboard[1]?.total_xp?.toLocaleString()} XP</p>
              <div className="mt-2 px-4 py-1 bg-gray-400/20 rounded-full">
                <Medal className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mb-2 overflow-hidden shadow-lg shadow-yellow-500/20">
                <span className="text-3xl font-bold text-yellow-500">
                  {leaderboard[0]?.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <p className="font-bold text-xl">{leaderboard[0]?.username}</p>
              <p className="text-sm text-gray-400">{leaderboard[0]?.total_xp?.toLocaleString()} XP</p>
              <div className="mt-2 px-4 py-1 bg-yellow-500/20 rounded-full">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center mb-2 overflow-hidden">
                <span className="text-2xl font-bold text-amber-600">
                  {leaderboard[2]?.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <p className="font-bold text-lg">{leaderboard[2]?.username}</p>
              <p className="text-sm text-gray-400">{leaderboard[2]?.total_xp?.toLocaleString()} XP</p>
              <div className="mt-2 px-4 py-1 bg-amber-600/20 rounded-full">
                <Medal className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4">All Rankings</h2>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${getRankBg(entry.rank)}`}
              >
                <div className="w-12 flex justify-center">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-500">
                    {entry.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold">{entry.username}</p>
                  <p className="text-sm text-gray-400">{entry.level_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-500">
                    {entry.total_xp?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <p className="text-center text-gray-400 py-8">No leaderboard data yet</p>
          )}
        </motion.div>

        {/* My Recent Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-500" />
            My Recent Scores
          </h2>
          <div className="space-y-3">
            {myScores.slice(0, 5).map((score) => (
              <div
                key={`${score.song_id}-${score.played_at}`}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
              >
                <div>
                  <p className="font-medium">{score.song_title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(score.played_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary-500">{score.score}%</p>
                  <p className="text-xs text-gray-400">
                    {Math.round(score.accuracy_percent)}% accuracy
                  </p>
                </div>
              </div>
            ))}
          </div>

          {myScores.length === 0 && (
            <p className="text-center text-gray-400 py-8">No scores yet. Play a song!</p>
          )}
        </motion.div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default LeaderboardPage;