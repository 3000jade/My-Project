import { useEffect, useState } from 'react';
import '../styles/Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
        className={`flex justify-between items-center px-margin-desktop max-w-container-max-width mx-auto transition-all duration-300 ${scrolled ? 'h-[80px]' : 'h-[100px]'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">PropAI</span>
        </div>
        <div className="hidden md:flex gap-10 items-center">
          <a className="font-label-lg text-label-lg text-primary nav-link active transition-all" href="#">Home</a>
          <a
            className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary nav-link transition-colors duration-300"
            href="#"
          >
            Properties
          </a>
          <a
            className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary nav-link transition-colors duration-300"
            href="#"
          >
            Agents
          </a>
          <a
            className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary nav-link transition-colors duration-300"
            href="#"
          >
            About
          </a>
        </div>
        <button className="bg-primary text-on-primary px-8 py-3 font-label-lg text-label-lg uppercase rounded-lg premium-btn">
          Request Consultation
        </button>
      </div>
    </nav>
  );
}
