import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ChatWidget from './modules/Chat/ChatWidget';
import Footer from './components/Footer';
import Home from './pages/Home';
import PropertiesPage from './pages/PropertiesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PropertyDetailModal from './components/ui/PropertyDetailModal';
import LoginPage from './pages/auth/LoginPage';
import PageLoader from './components/ui/PageLoader';
import { ReactLenis, useLenis } from 'lenis/react';

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
    // Ensure the animation has time to play (at least 2.5s)
    // but also wait for window load if it takes longer.
    const startTime = Date.now();
    const minDelay = 2500;
    
    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setIsAppLoading(false);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <Router>
        <ScrollToTop />
        <div className={`transition-colors duration-700 min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
          <Header isDarkTheme={isDarkTheme} />
          <main>
            <Routes>
              <Route path="/" element={<Home setIsDarkTheme={setIsDarkTheme} />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
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