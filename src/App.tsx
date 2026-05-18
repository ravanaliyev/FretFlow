import { lazy, Suspense } from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// KOD BÖLÜMLEME (Code Splitting & Lazy Loading):
// Web uygulamasının ilk yükleme süresini (Initial Load Time) optimize etmek amacıyla 
// sayfalar dinamik olarak import edilir. Kullanıcı ilgili sayfaya gitmediği sürece 
// o sayfanın JS paketi tarayıcıya yüklenmez, böylece gereksiz bant genişliği harcanmaz.
const LandingPage = lazy(() => import('./screens/landing/LandingPage'));
const LoginPage = lazy(() => import('./screens/login/LoginPage'));
const Dashboard = lazy(() => import('./screens/dashboard/Dashboard'));
const AboutPage = lazy(() => import('./screens/landing/AboutPage'));
const TermsPage = lazy(() => import('./screens/landing/TermsPage'));
const PrivacyPage = lazy(() => import('./screens/landing/PrivacyPage'));

/**
 * ScrollToTop - Sayfa Yönlendirmelerinde Sayfayı Yukarı Kaydırma Yardımcısı.
 * Single Page Application (SPA) yapılarında sayfa değiştiğinde tarayıcının dikey kaydırma (scroll)
 * konumunu sıfırlayarak kullanıcının yeni sayfaya en üstten başlamasını sağlar.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0); // Sayfa konumunu en üst sol köşeye (0, 0) sıfırlar
  }, [pathname]);
  return null;
}

/**
 * LoadingSpinner - Dinamik Sayfa Yüklemeleri Arasında Gösterilen Geçici Yükleme Arayüzü.
 * `Suspense` bileşeni tarafından, lazy loading ile belirtilen bileşenler arka planda 
 * indirilirken ekrana getirilen FretFlow spinner tasarımıdır.
 */
const LoadingSpinner = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

/**
 * App - FretFlow Ön Yüz Uygulamasının Ana Giriş Noktası (Root Component).
 * - `AuthProvider` ile tüm alt bileşenlerin kimlik doğrulama (JWT) durumuna erişmesini sağlar.
 * - `Router` ile SPA istemci taraflı yönlendirmelerini (Client-Side Routing) yönetir.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Her sayfa değişiminde pencereyi en yukarı kaydıran dinleyici */}
        <ScrollToTop />
        
        {/* Lazy load ile yüklenen sayfaların indirilme anını yöneten Suspense sarmalı */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Halka Açık (Public) Ziyaretçi Sayfaları */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* Giriş / Kayıt Ol Sayfası */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Korumalı Kullanıcı Paneli (Dashboard & Alt Yönlendirmeleri) */}
            <Route path="/dashboard/*" element={<Dashboard />} />
            
            {/* Tanımsız Tüm İstekleri Doğrudan Ana Sayfaya Yönlendiren Güvenlik Duvarı */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;