import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronDown, IconUser, IconLogout, IconLayoutDashboard } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [deepScrolled, setDeepScrolled] = useState(false);
  const [forceShowHeader, setForceShowHeader] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const forceShowRef = useRef(false);
  const clickScrollPosRef = useRef(0);
  const menuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isPropertiesPage = location.pathname === '/properties';
  const isSolidTheme = scrolled || location.pathname === '/properties' || location.pathname === '/login' || location.pathname === '/about' || location.pathname === '/contact';

  const isHeaderHidden = isPropertiesPage && deepScrolled && !forceShowHeader;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const role = (user.role || '').toLowerCase();
    if (role === 'broker' || role === 'admin') return '/broker/dashboard';
    if (role === 'agent') return '/agent/dashboard';
    return '/';
  };

  const getLinkColor = (path) => {
    const isActive = location.pathname === path || (path !== '/' && location.hash === path);

    if (!isSolidTheme) {
      return isActive
        ? 'text-[#E76F51] font-extrabold scale-105'
        : 'text-white hover:text-[#E76F51] font-bold transition-all';
    }

    return isActive
      ? 'text-[#E76F51] font-bold active scale-105 transition-transform'
      : 'text-gray-700 hover:text-[#E76F51] font-semibold transition-colors';
  };

  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'User';
  const roleLabel = (user?.role || 'Client').toUpperCase();
  const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D4446&color=fff&rounded=true`;

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isSolidTheme
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E5EBEB] shadow-md'
            : 'bg-transparent border-b-transparent shadow-none'
        } ${isHeaderHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div
          className={`relative flex justify-between items-center max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 w-full transition-all duration-300 ${
            isSolidTheme ? 'h-[80px]' : 'h-[100px]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center transition-transform hover:scale-105">
              <img src="https://ui-avatars.com/api/?name=C+N&background=0a0a0a&color=fff&rounded=true" alt="[Company Name] Logo" className="w-10 h-10 shadow-sm" />
            </Link>
          </div>
          <div className="hidden lg:flex gap-7 xl:gap-9 items-center absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-max">
            <Link className={`text-[11px] uppercase tracking-widest font-sans nav-link transition-all duration-500 ${getLinkColor('/')}`} to="/">
              Home
            </Link>
            <Link className={`text-[11px] uppercase tracking-widest font-sans nav-link transition-all duration-500 ${getLinkColor('/properties')}`} to="/properties">
              Properties
            </Link>
            <Link className={`text-[11px] uppercase tracking-widest font-sans nav-link transition-all duration-500 ${getLinkColor('/how-we-work')}`} to="/how-we-work">
              How We Work
            </Link>
            <Link className={`text-[11px] uppercase tracking-widest font-sans nav-link transition-all duration-500 ${getLinkColor('/our-partner')}`} to="/our-partner">
              Partner
            </Link>
            <Link className={`text-[11px] uppercase tracking-widest font-sans nav-link transition-all duration-500 ${getLinkColor('/contact')}`} to="/contact">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated || user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white/90 border border-[#D8DFDF] hover:border-[#0D4446] shadow-sm transition-all text-left"
                  aria-expanded={userMenuOpen}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-[#D8DFDF]"
                  />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[13px] font-semibold font-inter text-[#141717] leading-none line-clamp-1">
                      {displayName}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider font-semibold text-[#0D4446] leading-tight">
                      {roleLabel}
                    </span>
                  </div>
                  <IconChevronDown size={14} className={`text-[#5C6768] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      data-lenis-prevent="true"
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#D8DFDF] py-1.5 z-50 flex flex-col font-inter"
                    >
                      <div className="px-3.5 py-2 border-b border-[#E5EBEB]">
                        <p className="text-[13px] font-semibold text-[#141717] truncate">{displayName}</p>
                        <p className="text-[11px] text-[#5C6768] truncate">{user.email}</p>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#141717] hover:bg-[#F4F5F4] transition-colors"
                      >
                        <IconLayoutDashboard size={16} className="text-[#0D4446]" />
                        <span>Dashboard</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#E76F51] hover:bg-[#E76F51]/10 transition-colors text-left"
                      >
                        <IconLogout size={16} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`btn-shine premium-btn shine-sm h-[40px] px-5 min-w-[84px] rounded-full text-[12px] font-bold uppercase tracking-wider font-sans inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all ${
                    isSolidTheme
                      ? 'bg-black/5 hover:bg-black/10 text-[#0D4446] border border-black/10'
                      : 'bg-white/85 hover:bg-white text-[#0D4446] border border-white/80 shadow-[0_2px_8px_rgba(13,68,70,0.08)] backdrop-blur-md'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-shine premium-btn shine-sm h-[40px] px-6 min-w-[104px] rounded-full text-[12px] font-bold uppercase tracking-wider font-sans inline-flex items-center justify-center whitespace-nowrap shrink-0 bg-[#E76F51] hover:bg-[#d65c3e] text-white shadow-[0_4px_16px_rgba(231,111,81,0.35)] transition-all cursor-pointer"
                >
                  Register
                </Link>
              </>
            )}
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
