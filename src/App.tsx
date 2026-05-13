import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('./screens/landing/LandingPage'));
const LoginPage = lazy(() => import('./screens/login/LoginPage'));
const Dashboard = lazy(() => import('./screens/dashboard/Dashboard'));
const AboutPage = lazy(() => import('./screens/landing/AboutPage'));
const TermsPage = lazy(() => import('./screens/landing/TermsPage'));
const PrivacyPage = lazy(() => import('./screens/landing/PrivacyPage'));
const LoadingSpinner = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
