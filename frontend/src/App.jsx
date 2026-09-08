import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ChatWidget from './modules/Chat/ChatWidget';
import Footer from './components/Footer';
import Home from './pages/Home';
import PropertyDetailModal from './components/ui/PropertyDetailModal';
import PageLoader from './components/ui/PageLoader';
import { ReactLenis, useLenis } from 'lenis/react';

// Code-split secondary routes to shrink initial bundle size and boost startup speed
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const Duplex3DPage = lazy(() => import('./pages/Duplex3DPage'));
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Prevent the browser from retaining scroll positions natively
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Wait for DOM to paint before forcing scroll
    requestAnimationFrame(() => {
      if (hash) {
        if (lenis) {
          // Delay slightly to let the new page render, then scroll smoothly and slowly (3.5 seconds)
          setTimeout(() => {
            const butteryEasing = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
            lenis.scrollTo(hash, { offset: -100, duration: 3.5, easing: butteryEasing });
          }, 50);
        } else {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        }
        window.scrollTo(0, 0);
      }
    });
  }, [pathname, hash, lenis]);

  return null;
}

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Reveal site once brand animation completes (~1.1s)
    // without waiting indefinitely for heavy offscreen network assets / iframes
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <Router>
        <ScrollToTop />
        <div className={`transition-colors duration-700 min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
          <Header isDarkTheme={isDarkTheme} />
          <main>
            <Suspense fallback={<div className="min-h-[60vh] bg-transparent" />}>
              <Routes>
                <Route path="/" element={<Home setIsDarkTheme={setIsDarkTheme} />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/duplex-3d" element={<Duplex3DPage />} />
              </Routes>
            </Suspense>
          </main>
          <ChatWidget />
          <Footer />
          <PropertyDetailModal />
          <PageLoader isLoading={isAppLoading} />
        </div>
      </Router>
    </ReactLenis>
  );
}