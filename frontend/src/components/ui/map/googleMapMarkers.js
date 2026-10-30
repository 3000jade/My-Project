/**
 * Utility functions for creating interactive luxury HTML DOM elements
 * for Google Maps Platform `google.maps.marker.AdvancedMarkerElement`.
 * Strictly adheres to Modern SaaS design tokens (`design.md`).
 */

/**
 * Formats a raw number into a luxury pill abbreviation (e.g. ₱145M, $2.5M, ₱850K).
 *
 * @param {number|string} amount
 * @param {string} [currency='PHP']
 * @returns {string}
 */
export function formatPriceBadge(amount, currency = 'PHP') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const symbol = currency === 'USD' ? '$' : '₱';

  if (numeric >= 1_000_000) {
    const millions = numeric / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${symbol}${formatted}M`;
  }
  if (numeric >= 1_000) {
    const thousands = numeric / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0);
    return `${symbol}${formatted}K`;
  }
  return `${symbol}${numeric.toLocaleString()}`;
}

/**
 * Creates an interactive regular SVG teardrop pin for property listings.
 * Displays an elegant brand teal pin (#0F766E) with white inner core, morphing
 * to active coral (#FF6B6B) with slight bounce when selected.
 * Contains no price text; displays a clean property title tooltip on hover.
 *
 * @param {object} property
 * @param {object} [options]
 * @param {boolean} [options.isSelected=false]
 * @param {boolean} [options.isHovered=false]
 * @param {function} [options.onClick]
 * @param {function} [options.onHover]
 * @returns {HTMLDivElement}
 */
export function createTeardropPinElement(property, options = {}) {
  const { isSelected = false, isHovered = false, onClick, onHover } = options;
  const title = property.title || property.name || 'Luxury Residence';
  const locationText = property.subdivision || property.city || 'Metro Manila';

  const container = document.createElement('div');
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute(
    'aria-label',
    `Residence: ${title}, ${locationText}`
  );
  container.setAttribute('data-property-id', String(property.id || ''));
  container.setAttribute('data-testid', `map-marker-${property.id}`);

  const fillColor = isSelected ? '#FF6B6B' : '#0F766E';
  const strokeColor = isSelected ? '#E05353' : '#0B5953';
  const scaleClass = isSelected
    ? 'scale-125 z-[9999] drop-shadow-xl'
    : 'hover:scale-115 hover:z-50 z-20 drop-shadow-md';

  container.className = `relative flex items-center justify-center cursor-pointer transition-all duration-200 select-none group ${scaleClass}`;

  container.innerHTML = `
    <!-- Floating Title Tooltip (Visible on Hover) -->
    <div class="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900/95 text-white text-[11px] font-sans font-semibold shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-slate-700/60 flex items-center gap-1.5">
      <span>${title}</span>
    </div>

    <!-- Regular SVG Teardrop Pin -->
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-200">
      <path
        d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z"
        fill="${fillColor}"
        stroke="${strokeColor}"
        stroke-width="1.5"
      />
      <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
      ${
        isSelected
          ? '<circle cx="14" cy="14" r="2.5" fill="#FF6B6B" class="animate-pulse" />'
          : ''
      }
    </svg>
  `;

  // Interactive callbacks
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof onClick === 'function') {
      onClick(property);
    }
  });

  container.addEventListener('mouseenter', () => {
    if (typeof onHover === 'function') {
      onHover(property);
    }
  });

  container.addEventListener('mouseleave', () => {
    if (typeof onHover === 'function') {
      onHover(null);
    }
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onClick === 'function') {
        onClick(property);
      }
    }
  });

  return container;
}

/**
 * Creates an interactive minimalist marker element for property pins.
 * Defaults to an elegant, compact teal circular dot to prevent clutter across dense listings,
 * and seamlessly expands to a luxury price pill on hover or selection.
 *
 * @param {object} property
 * @param {object} [options]
 * @param {boolean} [options.isSelected=false]
 * @param {boolean} [options.isHovered=false]
 * @param {function} [options.onClick]
 * @param {function} [options.onHover]
 * @returns {HTMLDivElement}
 */
export function createMinimalistMarkerElement(property, options = {}) {
  const { isSelected = false, isHovered = false, onClick, onHover } = options;
  const isExpanded = isSelected || isHovered;
  const priceText = formatPriceBadge(property.price_raw || property.price || property.list_price || 0, property.currency || 'PHP');
  const title = property.title || property.name || 'Luxury Residence';
  const locationText = property.subdivision || property.city || 'Metro Manila';

  const container = document.createElement('div');
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute(
    'aria-label',
    `Residence: ${title}, ${priceText}, ${locationText}`
  );
  container.setAttribute('data-property-id', String(property.id || ''));
  container.setAttribute('data-testid', `map-marker-${property.id}`);

  if (isExpanded) {
    container.className =
      'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-mono cursor-pointer transition-all duration-200 select-none shadow-xl bg-[#0F766E] text-white border border-[#0F766E] scale-110 z-[9999]';
    container.innerHTML = `
      <span class="beacon-dot w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse shrink-0"></span>
      <span class="tracking-tight">${priceText}</span>
    `;
  } else {
    container.className =
      'relative flex items-center justify-center cursor-pointer transition-all duration-200 select-none z-20 group hover:scale-125';
    container.innerHTML = `
      <div class="w-5 h-5 rounded-full bg-white/95 border-2 border-[#0F766E] shadow-md flex items-center justify-center transition-colors group-hover:border-[#FF6B6B] group-hover:bg-[#0F766E]">
        <div class="w-2 h-2 rounded-full bg-[#0F766E] group-hover:bg-white transition-colors"></div>
      </div>
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-mono font-medium shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
        ${priceText}
      </div>
    `;
  }

  // Interactive callbacks
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof onClick === 'function') {
      onClick(property);
    }
  });

  container.addEventListener('mouseenter', () => {
    if (typeof onHover === 'function') {
      onHover(property.id);
    }
  });

  container.addEventListener('mouseleave', () => {
    if (typeof onHover === 'function') {
      onHover(null);
    }
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onClick === 'function') {
        onClick(property);
      }
    }
  });

  return container;
}

/**
 * Creates an interactive DOM badge element for a property pin.
 *
 * @param {object} property
 * @param {object} [options]
 * @param {boolean} [options.isSelected=false]
 * @param {boolean} [options.isHovered=false]
 * @param {string} [options.variant='pill'] 'pill' | 'dot'
 * @param {function} [options.onClick]
 * @param {function} [options.onHover]
 * @returns {HTMLDivElement}
 */
export function createPriceBadgeElement(property, options = {}) {
  if (options.variant === 'dot' || options.dotOnly) {
    return createMinimalistMarkerElement(property, options);
  }
  const { isSelected = false, isHovered = false, onClick, onHover } = options;
  const isExpanded = isSelected || isHovered;
  const priceText = formatPriceBadge(property.price_raw || property.price || property.list_price || 0, property.currency || 'PHP');
  const title = property.title || property.name || 'Luxury Residence';
  const locationText = property.subdivision || property.city || 'Metro Manila';

  const container = document.createElement('div');
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute(
    'aria-label',
    `Residence: ${title}, ${priceText}, ${locationText}`
  );
  container.setAttribute('data-property-id', String(property.id || ''));
  container.setAttribute('data-testid', `map-marker-${property.id}`);

  // Common styles
  const baseClasses =
    'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-mono cursor-pointer transition-all duration-200 select-none shadow-sm';

  if (isExpanded) {
    container.className = `${baseClasses} bg-[#0F766E] text-white border border-[#0F766E] scale-110 shadow-lg z-[9999]`;
    container.innerHTML = `
      <span class="beacon-dot w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse shrink-0"></span>
      <span class="tracking-tight">${priceText}</span>
    `;
  } else {
    container.className = `${baseClasses} bg-white text-[#0F766E] border border-[#E2E8F0] hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E] hover:scale-105 hover:shadow-md`;
    container.innerHTML = `
      <span class="tracking-tight">${priceText}</span>
    `;
  }

  // Interactive callbacks
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof onClick === 'function') {
      onClick(property);
    }
  });

  container.addEventListener('mouseenter', () => {
    if (typeof onHover === 'function') {
      onHover(property.id);
    }
  });

  container.addEventListener('mouseleave', () => {
    if (typeof onHover === 'function') {
      onHover(null);
    }
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onClick === 'function') {
        onClick(property);
      }
    }
  });

  return container;
}

/**
 * Creates an interactive cluster badge DOM element for grouped markers.
 *
 * @param {number} count
 * @returns {HTMLDivElement}
 */
export function createClusterBadgeElement(count) {
  const container = document.createElement('div');
  container.className =
    'inline-flex items-center justify-center px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F766E] border border-[#E2E8F0] font-mono text-xs font-bold shadow-md cursor-pointer hover:bg-[#0F766E] hover:text-white transition-all scale-100 hover:scale-110';
  container.setAttribute('role', 'button');
  container.setAttribute('aria-label', `Group of ${count} properties`);
  container.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-[#14B8A6] mr-1.5"></span>
    <span>${count} Homes</span>
  `;
  return container;
}

export default {
  formatPriceBadge,
  createPriceBadgeElement,
  createMinimalistMarkerElement,
  createTeardropPinElement,
  createClusterBadgeElement,
};
