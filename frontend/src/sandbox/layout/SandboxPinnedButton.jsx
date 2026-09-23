import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconFlask, IconExternalLink } from '@tabler/icons-react';

export default function SandboxPinnedButton() {
  const location = useLocation();

  // Hide the launcher when the user is already inside the Sandbox sub-app
  if (location.pathname.startsWith('/sandbox')) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 left-6 z-40 group pointer-events-auto"
      aria-label="Sandbox Labs Launcher"
    >
      <a
        href="/sandbox"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#080d0d]/90 backdrop-blur-xl border border-emerald-500/40 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_35px_rgba(16,185,129,0.4)] hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all duration-300"
      >
        {/* Glowing Beaker Icon */}
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          <IconFlask size={14} stroke={2.5} />
        </div>

        {/* Label */}
        <div className="flex flex-col text-left">
          <span className="text-[12px] font-bold font-sans tracking-wide uppercase leading-none text-white group-hover:text-emerald-300 transition-colors">
            Sandbox
          </span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-400/80 leading-none mt-1">
            LABS PREVIEW
          </span>
        </div>

        {/* External Link Icon */}
        <div className="pl-1 text-gray-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
          <IconExternalLink size={14} />
        </div>
      </a>
    </motion.aside>
  );
}
