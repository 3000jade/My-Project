import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconFlask,
  IconBuildingSkyscraper,
  IconMapPin,
  IconBook2,
  IconBoxModel2,
  IconLayoutDashboard,
  IconArrowUpRight,
  IconMenu2,
  IconX
} from '@tabler/icons-react';

const NAV_ITEMS = [
  { name: 'Hub', path: '/sandbox', icon: IconFlask, end: true },
  { name: 'Valuation', path: '/sandbox/valuation', icon: IconBuildingSkyscraper },
  { name: 'Neighborhoods', path: '/sandbox/neighborhoods', icon: IconMapPin },
  { name: 'Journal', path: '/sandbox/journal', icon: IconBook2 },
  { name: '3D Demo', path: '/sandbox/3d-demo', icon: IconBoxModel2 },
  { name: 'UI/UX Labs', path: '/sandbox/ui-ux-labs', icon: IconLayoutDashboard },
];

export default function SandboxHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#080d0d]/90 backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1700px] mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center gap-4">
          <Link
            to="/sandbox"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-900/60 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <IconFlask size={20} stroke={2} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-display font-extrabold text-[15px] tracking-wider">
                  SANDBOX
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  LABS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Preview</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-2 py-1.5 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.end 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive: active }) => `
                  relative px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase font-sans transition-all duration-200 flex items-center gap-1.5
                  ${active 
                    ? 'text-white bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.3)] border border-emerald-400/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-gray-400'} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Action: Exit to Main App */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:border-white/20 group"
          >
            <span>Exit to Main App</span>
            <IconArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-gray-400 group-hover:text-white" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white bg-white/5 border border-white/10"
          aria-label="Toggle Sandbox Navigation"
        >
          {mobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#080d0d] border-b border-white/10 px-6 py-4 flex flex-col gap-2"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase
                    ${isActive 
                      ? 'text-white bg-emerald-500/20 border border-emerald-400/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-white/10 mt-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <span>Exit to Main App</span>
                <IconArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
