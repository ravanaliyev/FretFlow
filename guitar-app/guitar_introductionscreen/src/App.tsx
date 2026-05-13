import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const LessonPracticePage = lazy(() => import('./pages/LessonPracticePage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const SongPracticePage = lazy(() => import('./pages/SongPracticePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const AdminSongsPage = lazy(() => import('./pages/AdminSongsPage'));

function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ToastProvider>
          <Router>
          <Suspense fallback={<div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons"
                element={
                  <ProtectedRoute>
                    <LessonsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id/practice"
                element={
                  <ProtectedRoute>
                    <LessonPracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/songs"
                element={
                  <ProtectedRoute>
                    <SongsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/songs/:id/play"
                element={
                  <ProtectedRoute>
                    <SongPracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stats"
                element={
                  <ProtectedRoute>
                    <StatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/songs/new"
                element={
                  <ProtectedRoute>
                    <AdminSongsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
        </ToastProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

export default App;