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
 * Creates an interactive DOM badge element for a property pin.
 *
 * @param {object} property
 * @param {object} [options]
 * @param {boolean} [options.isSelected=false]
 * @param {function} [options.onClick]
 * @param {function} [options.onHover]
 * @returns {HTMLDivElement}
 */
export function createPriceBadgeElement(property, options = {}) {
  const { isSelected = false, onClick, onHover } = options;
  const priceText = formatPriceBadge(property.price || property.list_price || 0, property.currency || 'PHP');
  const title = property.title || property.name || 'Luxury Residence';
  const locationText = property.subdivision || property.city || 'Metro Manila';

  const container = document.createElement('div');
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute(
    'aria-label',
    `Residence: ${title}, ${priceText}, ${locationText}`
  );

  // Common styles
  const baseClasses =
    'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-mono cursor-pointer transition-all duration-200 select-none shadow-sm';

  if (isSelected) {
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
  createClusterBadgeElement,
};
