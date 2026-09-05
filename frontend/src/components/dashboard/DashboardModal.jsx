import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
  actions
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Heavy Backdrop Blur as required by AGENTS.md */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container with Spring Physics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            data-lenis-prevent="true"
            className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/80 bg-[#F1F0EC]/50">
              <div>
                {title && (
                  <h3 className="text-xl font-display font-bold text-[#174849]">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs font-sans text-gray-500 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Close Button X (solid white circle with shadow) */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body with native scroll prevented from Lenis hijack */}
            <div
              data-lenis-prevent="true"
              className="p-6 overflow-y-auto custom-scrollbar flex-1"
            >
              {children}
            </div>

            {/* Modal Footer Actions */}
            {actions && (
              <div className="px-6 py-4 border-t border-gray-200/80 bg-[#F1F0EC]/30 flex items-center justify-end gap-3">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
