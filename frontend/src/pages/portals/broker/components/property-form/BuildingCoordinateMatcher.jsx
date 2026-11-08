import React, { useMemo } from 'react';
import { MapPin, Check } from 'lucide-react';

// Popular master condominium towers and master-planned projects in the Philippines
export const KNOWN_PROJECT_ANCHORS = [
  { name: 'One Serendra', lat: 14.5512, lng: 121.0501, city: 'Taguig', barangay: 'Fort Bonifacio' },
  { name: 'Two Serendra', lat: 14.5501, lng: 121.0520, city: 'Taguig', barangay: 'Fort Bonifacio' },
  { name: 'The Proscenium at Rockwell', lat: 14.5670, lng: 121.0365, city: 'Makati', barangay: 'Poblacion' },
  { name: 'Rockwell Center', lat: 14.5670, lng: 121.0365, city: 'Makati', barangay: 'Poblacion' },
  { name: 'Grand Hyatt Residences', lat: 14.5535, lng: 121.0504, city: 'Taguig', barangay: 'Fort Bonifacio' },
  { name: 'Shangri-La at the Fort', lat: 14.5518, lng: 121.0457, city: 'Taguig', barangay: 'Fort Bonifacio' },
  { name: 'The Albany Luxury Residences', lat: 14.5442, lng: 121.0489, city: 'Taguig', barangay: 'Fort Bonifacio' },
  { name: 'Twin Oaks Place', lat: 14.5794, lng: 121.0522, city: 'Mandaluyong', barangay: 'Highway Hills' },
  { name: 'Suntrust Shanata', lat: 14.6850, lng: 121.0250, city: 'Quezon City', barangay: 'Talipapa' },
  { name: 'Ayala Alabang Village', lat: 14.4239, lng: 121.0264, city: 'Muntinlupa', barangay: 'Ayala Alabang' },
  { name: 'Horizon Ridge Subdivision', lat: 14.5498, lng: 121.0504, city: 'Taguig', barangay: 'Fort Bonifacio' },
];

/**
 * Lightweight helper that detects if an entered building or project name
 * matches known development anchors or existing projects, and offers a 1-click
 * "Snap to Building Pin" action (Option A).
 */
export default function BuildingCoordinateMatcher({
  buildingName = '',
  currentLatitude = null,
  currentLongitude = null,
  onApplyCoordinates,
}) {
  const match = useMemo(() => {
    if (!buildingName || buildingName.trim().length < 3) return null;
    const query = buildingName.trim().toLowerCase();

    // Check known anchors
    return KNOWN_PROJECT_ANCHORS.find((anchor) => {
      const aName = anchor.name.toLowerCase();
      return aName.includes(query) || query.includes(aName);
    }) || null;
  }, [buildingName]);

  if (!match) return null;

  // Check if current coordinates already match the anchor within ~10 meters
  const curLat = parseFloat(currentLatitude);
  const curLng = parseFloat(currentLongitude);
  const isAlreadySnapped =
    !isNaN(curLat) &&
    !isNaN(curLng) &&
    Math.abs(curLat - match.lat) < 0.0001 &&
    Math.abs(curLng - match.lng) < 0.0001;

  if (isAlreadySnapped) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium" data-testid="anchor-snapped-indicator">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Anchored to {match.name} pin ({match.lat.toFixed(4)}, {match.lng.toFixed(4)})</span>
      </div>
    );
  }

  return (
    <div
      className="mt-1.5 flex items-center justify-between gap-2 p-2 rounded-md bg-teal-50/80 border border-teal-200/90 text-xs"
      data-testid="building-coordinate-match-pill"
    >
      <div className="flex items-center gap-1.5 min-w-0 text-[#0F766E]">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0F766E]" />
        <span className="truncate">
          Match found: <strong>{match.name}</strong> ({match.lat.toFixed(4)}, {match.lng.toFixed(4)})
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          onApplyCoordinates?.({
            latitude: match.lat,
            longitude: match.lng,
            city: match.city,
            barangay: match.barangay,
          });
        }}
        className="px-2.5 py-1 rounded bg-[#0F766E] hover:bg-teal-800 text-white font-semibold text-[11px] whitespace-nowrap cursor-pointer transition-colors shadow-xs"
      >
        Snap to Building Pin
      </button>
    </div>
  );
}

