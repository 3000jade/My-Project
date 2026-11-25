/**
 * Standard 8-point spacing scale helper (1 step = 8px, 0.5 step = 4px).
 * Matches DESIGN.md Section 4.1.
 */
export const BASE_SPACE_PX = 8;

/**
 * Converts a spacing step (0, 0.5, 1, 2, ...) into pixels on the 8-point grid.
 * @param {number} step - Non-negative multiple of 0.5.
 * @returns {number} Size in pixels.
 */
export function space(step) {
  if (typeof step !== 'number' || Number.isNaN(step) || step < 0) {
    throw new RangeError('space(step) expects a non-negative number');
  }
  if (!Number.isInteger(step * 2)) {
    throw new RangeError('space(step) must be a multiple of 0.5 (4px grid)');
  }
  return step * BASE_SPACE_PX;
}

/**
 * Converts a spacing step into a rem string (16px root).
 * @param {number} step - Non-negative multiple of 0.5.
 * @returns {string} Size in rem units.
 */
export function spaceRem(step) {
  return `${space(step) / 16}rem`;
}

/**
 * 1.250 (Major Third) type scale tokens matching DESIGN.md Section 3.2.
 */
export const TYPE_SCALE = {
  caption: { px: 12, rem: '0.75rem', lineHeight: '1rem' },
  body: { px: 14, rem: '0.875rem', lineHeight: '1.25rem' },
  subhead: { px: 16, rem: '1rem', lineHeight: '1.5rem' },
  h2: { px: 20, rem: '1.25rem', lineHeight: '1.75rem' },
  h1: { px: 28, rem: '1.75rem', lineHeight: '2.25rem' },
  display: { px: 36, rem: '2.25rem', lineHeight: '2.75rem' },
};

/**
 * General UI element sizes matching DESIGN.md Sections 4.2, 5.1, and 5.3.
 */
export const UI_SCALE = {
  controlHeight: {
    standard: space(5),   // 40px
    touchMin: 44,         // 44px minimum touch target
    primaryCta: space(6), // 48px
    searchBar: space(7),  // 56px
  },
  shell: {
    headerHeight: space(8),  // 64px
    sidebarWidth: space(32), // 256px
    maxPublicWidth: 1440,
  },
  radius: {
    sm: space(0.5), // 4px
    md: space(1),   // 8px
    lg: 12,         // 12px
    full: 9999,
  },
};
