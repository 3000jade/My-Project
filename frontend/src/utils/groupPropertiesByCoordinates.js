import { getPropertyCoordinates } from './propertyCoordinates';

/**
 * Format a price number into a compact badge string (e.g. ₱5M, ₱850K).
 */
export function formatCompactPrice(val, currency = '₱') {
  if (val === null || val === undefined || isNaN(val)) return '';
  const num = Number(val);
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return `${currency}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return `${currency}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `${currency}${num.toLocaleString()}`;
}

/**
 * Generates formatted min - max price range string for a list of prices.
 */
export function getPriceRangeText(prices = [], currency = '₱') {
  const validPrices = prices
    .map(p => {
      if (typeof p === 'number') return p;
      if (typeof p === 'string') {
        const cleaned = p.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    })
    .filter(p => p > 0);

  if (validPrices.length === 0) return '';
  if (validPrices.length === 1) return formatCompactPrice(validPrices[0], currency);

  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);

  if (min === max) {
    return formatCompactPrice(min, currency);
  }

  return `${formatCompactPrice(min, currency)} - ${formatCompactPrice(max, currency)}`;
}

/**
 * Calculate approximate ground distance in meters between two coordinates.
 */
function getApproxDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * 111320;
  const dLon = (lon2 - lon1) * (111320 * Math.cos((lat1 * Math.PI) / 180));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Groups properties by shared coordinate anchor or physical co-location (< 15 meters).
 *
 * @param {Array<Object>} properties - Raw property listings
 * @param {number} [clusterThresholdMeters=15] - Maximum distance in meters to consider co-located
 * @returns {Array<Object>} List of grouped anchor cluster objects
 */
export function groupPropertiesByCoordinates(properties, clusterThresholdMeters = 15) {
  if (!Array.isArray(properties) || properties.length === 0) {
    return [];
  }

  const clusters = [];

  properties.forEach((property) => {
    const coords = getPropertyCoordinates(property);
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number' || isNaN(coords.lat) || isNaN(coords.lng)) {
      return;
    }

    const { lat, lng } = coords;

    // Check if this property matches any existing cluster within threshold
    let matchedCluster = null;
    for (const cluster of clusters) {
      const dist = getApproxDistanceMeters(cluster.lat, cluster.lng, lat, lng);
      if (dist <= clusterThresholdMeters) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.properties.push(property);
      matchedCluster.count = matchedCluster.properties.length;
      matchedCluster.isCluster = true;
    } else {
      clusters.push({
        id: `anchor-${lat.toFixed(6)}-${lng.toFixed(6)}`,
        lat,
        lng,
        isCluster: false,
        count: 1,
        properties: [property],
      });
    }
  });

  // Post-process clusters to set titles, price ranges, and anchor details
  return clusters.map((cluster) => {
    const isMulti = cluster.properties.length > 1;
    const firstProp = cluster.properties[0];

    // Determine representative title
    let title = firstProp.building_name || firstProp.project_name || firstProp.subdivision_name || firstProp.subdivision || firstProp.title || firstProp.name || 'Residence';
    
    // Extract price range
    const prices = cluster.properties.map(p => p.price_raw ?? p.price);
    const priceRange = getPriceRangeText(prices);

    return {
      ...cluster,
      isCluster: isMulti,
      title,
      priceRange,
      building_name: firstProp.building_name || firstProp.project_name || null,
      city: firstProp.city || firstProp.location || null,
    };
  });
}

