// Property Coordinates Mapping & Geocoding Resolver

export const KNOWN_PROPERTY_COORDINATES = {
  "cmtdur9ap00011041l5curjy2": { lat: 14.5866, lng: 121.0827, area: "Rosario, Pasig" },
  "1": { lat: 14.4239, lng: 121.0264, area: "Ayala Alabang, Muntinlupa" },
  "2": { lat: 14.5670, lng: 121.0365, area: "Rockwell Center, Makati" },
  "3": { lat: 14.5576, lng: 121.0232, area: "Ayala Ave, Makati" },
  "4": { lat: 14.5547, lng: 121.0244, area: "Legazpi Village, Makati" },
  "5": { lat: 14.5450, lng: 121.0360, area: "Forbes Park, Makati" },
  "6": { lat: 14.5505, lng: 121.0478, area: "High Street, BGC" },
  "7": { lat: 14.5442, lng: 121.0489, area: "McKinley West, BGC" },
  "8": { lat: 14.5535, lng: 121.0504, area: "Grand Hyatt, BGC" },
  "9": { lat: 14.6015, lng: 121.0420, area: "Greenhills, San Juan" },
  "10": { lat: 14.5950, lng: 121.0650, area: "Corinthian Gardens, QC" },
  "11": { lat: 14.5518, lng: 121.0457, area: "Shangri-La, BGC" },
  "12": { lat: 10.7180, lng: 122.5510, area: "Mandurriao, Iloilo City" }
};

// District fallback coordinates in the Philippines
const DISTRICT_CENTERS = {
  "makati": { lat: 14.5547, lng: 121.0244 },
  "taguig": { lat: 14.5498, lng: 121.0504 },
  "bgc": { lat: 14.5505, lng: 121.0478 },
  "bonifacio": { lat: 14.5505, lng: 121.0478 },
  "pasig": { lat: 14.5866, lng: 121.0600 },
  "ortigas": { lat: 14.5866, lng: 121.0600 },
  "muntinlupa": { lat: 14.4239, lng: 121.0264 },
  "alabang": { lat: 14.4239, lng: 121.0264 },
  "quezon city": { lat: 14.6500, lng: 121.0500 },
  "san juan": { lat: 14.6015, lng: 121.0420 },
  "mandaluyong": { lat: 14.5794, lng: 121.0359 },
  "paranaque": { lat: 14.4793, lng: 121.0198 },
  "pasay": { lat: 14.5378, lng: 120.9993 },
  "manila": { lat: 14.5995, lng: 120.9842 },
  "cebu": { lat: 10.3157, lng: 123.8854 },
  "iloilo": { lat: 10.7180, lng: 122.5510 },
  "davao": { lat: 7.1907, lng: 125.4553 }
};

/**
 * Resolves latitude and longitude for any property
 * Returns { lat, lng }
 */
export function getPropertyCoordinates(property) {
  if (!property) return { lat: 14.5547, lng: 121.0244 };

  // Explicit coordinates on property record
  if (property.lat && property.lng) {
    return { lat: Number(property.lat), lng: Number(property.lng) };
  }
  if (property.coordinates && property.coordinates.lat && property.coordinates.lng) {
    return { lat: Number(property.coordinates.lat), lng: Number(property.coordinates.lng) };
  }

  // Known mock ID
  const known = KNOWN_PROPERTY_COORDINATES[property.id];
  if (known) {
    return { lat: known.lat, lng: known.lng };
  }

  // Match by location / address keywords
  const fullText = `${property.location || ''} ${property.address || ''} ${property.city || ''} ${property.district || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(DISTRICT_CENTERS)) {
    if (fullText.includes(key)) {
      // Add slight jitter so overlapping pins don't completely cover each other
      const hash = String(property.id || property.name || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitterLat = ((hash % 17) - 8) * 0.003;
      const jitterLng = (((hash * 3) % 17) - 8) * 0.003;
      return {
        lat: coords.lat + jitterLat,
        lng: coords.lng + jitterLng
      };
    }
  }

  // Default to Metro Manila center (Makati / BGC corridor)
  return { lat: 14.5547, lng: 121.0350 };
}

/**
 * Formats property price into short clean representation (e.g. ?185M, ?3.0M)
 */
export function formatPricePill(priceStr, priceRaw) {
  if (priceRaw && typeof priceRaw === 'number') {
    if (priceRaw >= 1000000) {
      const inMillions = priceRaw / 1000000;
      return `?${inMillions % 1 === 0 ? inMillions : inMillions.toFixed(1)}M`;
    }
    if (priceRaw >= 1000) {
      return `?${(priceRaw / 1000).toFixed(0)}K`;
    }
  }
  if (!priceStr) return '? --';
  const clean = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    if (num >= 1000000) {
      const inM = num / 1000000;
      return `?${inM % 1 === 0 ? inM : inM.toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `?${(num / 1000).toFixed(0)}K`;
    }
  }
  return priceStr;
}
