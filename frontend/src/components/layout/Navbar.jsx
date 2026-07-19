import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-surface-container-high transition-all duration-300 ${scrolled ? 'shadow-md' : ''
        }`}
    >
      <div
        className={`flex justify-between items-center px-5 md:px-10 lg:px-20 max-w-[1440px] mx-auto transition-all duration-300 ${scrolled ? 'h-[80px]' : 'h-[100px]'
          }`}
      >
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold font-display tracking-tight text-primary">PropAI</Link>
        </div>
        <div className="hidden md:flex gap-10 items-center">
          <Link 
            className={`text-xs font-bold uppercase tracking-widest font-sans nav-link transition-all ${location.pathname === '/' ? 'text-primary active' : 'text-gray-500 hover:text-primary'}`} 
            to="/"
          >
            Home
          </Link>
          <Link
            className={`text-xs font-bold uppercase tracking-widest font-sans nav-link transition-colors duration-300 ${location.pathname === '/properties' ? 'text-primary active' : 'text-gray-500 hover:text-primary'}`}
            to="/properties"
          >
            Properties
          </Link>
          <a
            className="text-xs font-bold uppercase tracking-widest font-sans text-gray-500 hover:text-primary nav-link transition-colors duration-300"
            href="#"
          >
            Agents
          </a>
          <a
            className="text-xs font-bold uppercase tracking-widest font-sans text-gray-500 hover:text-primary nav-link transition-colors duration-300"
            href="#"
          >
            About
          </a>
        </div>
        <button className="bg-primary text-on-primary px-8 py-3 text-xs font-bold uppercase tracking-widest font-sans rounded-lg premium-btn">
          Request Consultation
        </button>
      </div>
    </nav>
  );
}
