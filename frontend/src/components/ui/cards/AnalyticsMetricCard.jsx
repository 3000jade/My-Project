import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconActivity, IconDots, IconTrendingUp, IconTrendingDown, IconRefresh, IconSparkles } from '@tabler/icons-react';

/**
 * Analytics & Portfolio Asset Metric Card
 * 
 * Design System Specifications & Motion Features:
 * 1. Surface: Glassmorphic dark theme (`bg-zinc-900/80`, `backdrop-blur-md`, subtle border `border-zinc-800`).
 * 2. Typography: Clear visual hierarchy with tabular numerals (`font-mono font-medium`) for live values.
 * 3. Radii: Standardized 16px (`rounded-2xl`).
 * 4. Skeleton Loading State: Asymmetric 20-degree linear-gradient shimmer wave (duration 1.5s, infinite repeat).
 * 5. Transitions & State Handshakes: AnimatePresence-driven cross-fade with scale shift, morphing without layout reflow.
 * 6. Hover Dynamics: Lift elevation along Y-axis (-4px) with dynamic ambient border glow.
 * 7. Tap/Press Feedback: Immediate micro-compression (scale: 0.985, spring physics stiffness: 400, damping: 25).
 * 8. Micro-Interactions: Tooltip reveals with orchestrated 150ms delay, metric updates trigger animated odometer slide.
 */

export function Tooltip({ children, content }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 8, scale: 0.95 }} 
            animate={{ opacity: 1, y: -4, scale: 1 }} 
            exit={{ opacity: 0, y: 8, scale: 0.95 }} 
            transition={{ duration: 0.2, delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Odometer({ value }) {
  return (
    <div className="relative overflow-hidden flex items-center h-9">
      <AnimatePresence mode="popLayout">
        <motion.span 
          key={value} 
          initial={{ y: 20, opacity: 0, filter: "blur(4px)" }} 
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} 
          exit={{ y: -20, opacity: 0, filter: "blur(4px)" }} 
          transition={{ type: "spring", stiffness: 350, damping: 30 }} 
          className="font-mono font-medium text-3xl tracking-tight text-zinc-50"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function ShimmerBlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-800/50 ${className}`}>
      <motion.div 
        className="absolute inset-0 z-10 w-[200%]" 
        style={{
          backgroundImage: "linear-gradient(20deg, transparent 20%, rgba(255,255,255,0.06) 50%, transparent 80%)" 
        }}
        animate={{ x: ["-100%", "50%"] }} 
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} 
      />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} 
      className="flex flex-col h-full w-full pointer-events-none"
    >
      {/* Header Skeleton */}
      <div className="flex justify-between items-center h-8 mb-4">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="h-8 w-8 rounded-lg" />
          <ShimmerBlock className="h-6 w-20 rounded-md" />
        </div>
        <ShimmerBlock className="h-8 w-8 rounded-lg" />
      </div>

      {/* Metric Skeleton */}
      <div className="flex items-end gap-3 h-10 mb-6">
        <ShimmerBlock className="h-9 w-40 rounded-lg" />
        <ShimmerBlock className="h-6 w-16 rounded-full mb-1" />
      </div>

      {/* Chart Skeleton */}
      <div className="mt-auto">
        <ShimmerBlock className="h-16 w-full rounded-lg" />
      </div>
    </motion.div>
  );
}

export function MetricCardContent({ value }) {
  const isPositive = value === "$25,104.20" || value === "$28,450.00";

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} 
      className="flex flex-col h-full w-full"
    >
      {/* Header */}
      <header className="flex justify-between items-center h-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <IconActivity className="w-4 h-4" stroke={2.5} />
          </div>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-700/50">
            Portfolio Asset
          </span>
        </div>

        <Tooltip content="Asset Settings">
          <button className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 flex items-center justify-center transition-colors">
            <IconDots className="w-4 h-4" />
          </button>
        </Tooltip>
      </header>

      {/* Core Metric Row */}
      <div className="flex items-end gap-3 h-10 mb-6">
        <Odometer value={value} />

        <Tooltip content="Compared to last 30 days">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-1 ${
            isPositive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {isPositive ? (
              <IconTrendingUp className="w-3 h-3" />
            ) : (
              <IconTrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+2.4%' : '-1.1%'}</span>
          </div>
        </Tooltip>
      </div>

      {/* Micro-chart Visualization Slot */}
      <div className="h-16 w-full relative mt-auto">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="metricChartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.25)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
            </linearGradient>
          </defs>
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }} 
            animate={{ pathLength: 1, opacity: 1 }} 
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            d="M0 30 Q 15 10, 25 25 T 50 15 T 75 20 T 100 5 L 100 40 L 0 40 Z" 
            fill="url(#metricChartGradient)" 
          />
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }} 
            animate={{ pathLength: 1, opacity: 1 }} 
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} 
            d="M0 30 Q 15 10, 25 25 T 50 15 T 75 20 T 100 5"
            fill="none" 
            stroke="rgba(99, 102, 241, 0.85)" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </motion.div>
  );
}

export default function AnalyticsMetricCard({
  isLoading: externalIsLoading,
  metricValue: externalMetricValue,
  showControls = true
}) {
  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [internalMetricValue, setInternalMetricValue] = useState("$24,892.50");

  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const metricValue = externalMetricValue !== undefined ? externalMetricValue : internalMetricValue;

  useEffect(() => {
    if (externalIsLoading === undefined) {
      const loadTimer = setTimeout(() => setInternalIsLoading(false), 2000);
      return () => clearTimeout(loadTimer);
    }
  }, [externalIsLoading]);

  const toggleLoading = () => {
    setInternalIsLoading(prev => !prev);
  };

  const toggleValue = () => {
    setInternalMetricValue(prev => prev === "$24,892.50" ? "$25,104.20" : "$24,892.50");
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {showControls && (
        <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
          <button 
            onClick={toggleLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Toggle Skeleton ({isLoading ? 'Loading' : 'Loaded'})
          </button>
          <button 
            onClick={toggleValue}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <IconSparkles className="w-3.5 h-3.5" />
            Trigger Live Odometer
          </button>
        </div>
      )}

      <motion.div 
        initial="initial" 
        animate="animate" 
        whileHover="hover" 
        whileTap="tap" 
        variants={{ 
          initial: { opacity: 0, scale: 0.98 }, 
          animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }, 
          hover: { 
            y: -4, 
            borderColor: 'rgba(99, 102, 241, 0.5)', 
            boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.15)', 
            transition: { duration: 0.3, ease: 'easeOut' } 
          }, 
          tap: { scale: 0.985, transition: { type: 'spring', stiffness: 400, damping: 25 } } 
        }}
        className="w-full max-w-sm p-5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden relative cursor-default"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <MetricCardSkeleton key="skeleton" />
          ) : (
            <MetricCardContent key="content" value={metricValue} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
