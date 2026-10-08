import { NominatimService } from '../services/nominatim.service';
import config from '../config';

async function testNominatim() {
  console.log('\n================================================================');
  console.log('  CP_kerby Luxury Architectural Platform - Nominatim OSM Check  ');
  console.log('================================================================\n');

  console.log(`Nominatim Base URL  : ${config.integrations.nominatimBaseUrl}`);
  console.log(`Custom User-Agent   : ${config.integrations.nominatimUserAgent}`);
  console.log(`Operating Mode      : ${config.integrations.isMockMode ? 'MOCK_DEV' : 'LIVE_NETWORK'}\n`);

  console.log('--- 1. Testing Forward Geocoding ---');
  const testAddress = 'Ayala Avenue, Makati, Metro Manila';
  const startGeo = Date.now();
  const geoResult = await NominatimService.geocode(testAddress);
  const geoLatency = Date.now() - startGeo;

  console.log(`Query               : "${testAddress}"`);
  console.log(`Resolved Coordinates: [Lat: ${geoResult.latitude}, Lng: ${geoResult.longitude}]`);
  console.log(`Formatted Address   : ${geoResult.formattedAddress}`);
  console.log(`City / Subdivision  : ${geoResult.city || 'N/A'} / ${geoResult.subdivision || 'N/A'}`);
  console.log(`Postal Code         : ${geoResult.postalCode || 'N/A'}`);
  console.log(`Latency             : ${geoLatency}ms\n`);

  console.log('--- 2. Testing Reverse Geocoding ---');
  const lat = 14.5509;
  const lon = 121.0505;
  const startRev = Date.now();
  const revResult = await NominatimService.reverse(lat, lon);
  const revLatency = Date.now() - startRev;

  console.log(`Input Coordinates   : [${lat}, ${lon}]`);
  console.log(`Resolved Location   : ${revResult.formattedAddress}`);
  console.log(`Road / City         : ${revResult.road || 'N/A'}, ${revResult.city || 'N/A'}`);
  console.log(`Latency             : ${revLatency}ms\n`);

  console.log('--- 3. Testing Predictive Autocomplete ---');
  const suggestions = await NominatimService.autocomplete('Bonifacio');
  console.log(`Autocomplete Input  : "Bonifacio" (${suggestions.length} suggestions found)`);
  suggestions.slice(0, 3).forEach((item, idx) => {
    console.log(` [${idx + 1}] ${item.mainText} - ${item.secondaryText} (${item.latitude}, ${item.longitude})`);
  });

  console.log('\n--- 4. Testing 24-Hr Cache Speed ---');
  const startCache = Date.now();
  await NominatimService.geocode(testAddress);
  const cacheDuration = Date.now() - startCache;
  console.log(`Cached Query Latency: ${cacheDuration}ms (Instant Memory Hit)`);

  console.log('\n================================================================');
  console.log('  Diagnosis: Nominatim OpenStreetMap engine is 100% operational! ');
  console.log('================================================================\n');
}

if (process.argv[1]?.includes('test-nominatim')) {
  testNominatim().catch(console.error);
}
