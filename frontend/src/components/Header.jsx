import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronDown } from '@tabler/icons-react';

export default function Header({ isDarkTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [deepScrolled, setDeepScrolled] = useState(false);
  const [forceShowHeader, setForceShowHeader] = useState(false);
  const forceShowRef = useRef(false);
  const clickScrollPosRef = useRef(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const lenis = useLenis();

  const isPropertiesPage = location.pathname === '/properties';
  const isSolidTheme = scrolled || location.pathname === '/login' || location.pathname === '/about' || location.pathname === '/contact';
  
  const isHeaderHidden = isPropertiesPage && deepScrolled && !forceShowHeader;

  // Dispatch global event when header visibility changes
  useEffect(() => {
    const event = new CustomEvent('header-visibility', { detail: { isVisible: !isHeaderHidden } });
    window.dispatchEvent(event);
  }, [isHeaderHidden]);

  // Listen to exactly when the search bar touches the header in PropertiesPage
  useEffect(() => {
    const handleStickyToggle = (e) => {
      setDeepScrolled(e.detail.isTouching);
      if (!e.detail.isTouching) {
        setForceShowHeader(false);
        forceShowRef.current = false;
      }
    };
    window.addEventListener('search-sticky-toggle', handleStickyToggle);
    return () => window.removeEventListener('search-sticky-toggle', handleStickyToggle);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setScrolled(scrollPos > 50);
      
      if (forceShowRef.current) {
        // If user scrolls more than 50px away from where they clicked the button, hide header again
        if (Math.abs(scrollPos - clickScrollPosRef.current) > 50) {
          setForceShowHeader(false);
          forceShowRef.current = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShowClick = () => {
    setForceShowHeader(true);
    forceShowRef.current = true;
    clickScrollPosRef.current = window.scrollY;
  };

  const handleAnchorClick = (e, hash) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Smooth and slow scroll if already on home page
      const butteryEasing = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      lenis?.scrollTo(hash, { offset: -100, duration: 3.5, easing: butteryEasing });
      // Optionally update URL without jumping
      window.history.pushState(null, '', `/${hash}`);
    } else {
      // Navigate to home and let App.jsx handle the immediate scroll
      navigate(`/${hash}`);
    }
  };

  const getLinkColor = (path) => {
    const isActive = location.pathname === path || (path !== '/' && location.hash === path);
    
    if (isDarkTheme || !isSolidTheme) {
      return isActive 
        ? 'text-accent drop-shadow-md scale-105' 
        : 'text-white hover:text-accent transition-all drop-shadow-md';
    }
    return isActive ? 'text-primary active scale-105 transition-transform' : 'text-gray-500 hover:text-primary transition-colors';
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isDarkTheme 
            ? 'bg-black/95 backdrop-blur-md border-b border-white/10 shadow-md'
            : isSolidTheme
              ? 'bg-white/95 backdrop-blur-md border-b border-surface-container-high shadow-md'
              : 'bg-transparent border-b-transparent shadow-none'
          } ${isHeaderHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div
          className={`relative flex justify-between items-center px-5 md:px-10 lg:px-20 w-full transition-all duration-300 ${isSolidTheme ? 'h-[80px]' : 'h-[100px]'
            }`}
        >
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center transition-transform hover:scale-105">
              <img src="https://ui-avatars.com/api/?name=C+N&background=0a0a0a&color=fff&rounded=true" alt="[Company Name] Logo" className="w-10 h-10 shadow-sm" />
            </Link>
          </div>
          <div className="hidden lg:flex gap-10 items-center absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-max">
            <Link className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('/')}`} to="/">
              Home
            </Link>
            <Link className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('/properties')}`} to="/properties">
              Properties
            </Link>
            <Link className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('/about')}`} to="/about">
              About
            </Link>
            <a className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('#services')}`} href="#">
              Services
            </a>
            <a className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('#agents')}`} href="#">
              Agents
            </a>
            <a className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('#testimonials')}`} href="/#testimonials" onClick={(e) => handleAnchorClick(e, '#testimonials')}>
              Testimonials
            </a>
            <Link className={`text-[11px] font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-700 ${getLinkColor('/contact')}`} to="/contact">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant={isSolidTheme && !isDarkTheme ? "outline" : "secondary"} size="sm" to="/login">
              Login
            </Button>
            <Button variant={isSolidTheme && !isDarkTheme ? "primary" : "secondary"} size="sm" to="/register">
              Register
            </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isHeaderHidden && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShowClick}
            className="fixed top-4 right-4 z-[60] bg-[#266F71] text-white p-3 rounded-full shadow-lg border border-transparent hover:bg-[#174849] transition-colors"
            title="Show Menu"
          >
            <IconChevronDown size={24} stroke={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
