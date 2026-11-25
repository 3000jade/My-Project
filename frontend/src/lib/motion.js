import React from 'react';
import { MotionConfig } from 'framer-motion';

export const MOTION_DURATIONS = Object.freeze({
  fast: 0.15,
  normal: 0.22,
  spring: 0.26,
});

export const fadeSlideReveal = Object.freeze({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: MOTION_DURATIONS.normal, ease: [0.22, 1, 0.36, 1] },
});

export const tapFeedback = Object.freeze({
  whileTap: { scale: 0.98 },
  transition: { duration: MOTION_DURATIONS.fast },
});

export const stepSpring = Object.freeze({
  type: 'spring',
  stiffness: 380,
  damping: 32,
});

export const REDUCED_MOTION_TRANSITION = Object.freeze({
  duration: 0,
});

export function AppMotionProvider({ children }) {
  return React.createElement(MotionConfig, { reducedMotion: 'user' }, children);
}
