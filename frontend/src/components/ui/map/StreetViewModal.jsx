import React, { useEffect, useRef, useState } from 'react';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../../../services/googleMapsLoader';

export default function StreetViewModal({
  isOpen,
  onClose,
  coordinates,
  lat,
  lng,
  propertyTitle = 'Luxury Residence',
  propertyName,
  hasCoverage: coverageOverride,
}) {
  const resolvedCoords = coordinates || (lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null);
  const resolvedTitle = propertyTitle || propertyName || 'Luxury Residence';

  const panoramaContainerRef = useRef(null);
  const panoramaInstanceRef = useRef(null);

  const [loading, setLoading] = useState(
    coverageOverride !== undefined ? false : true
  );
  const [coverageAvailable, setCoverageAvailable] = useState(
    coverageOverride !== undefined ? coverageOverride : true
  );

  useEffect(() => {
    if (!isOpen || !resolvedCoords || !resolvedCoords.lat || !resolvedCoords.lng) {
      return;
    }

    if (coverageOverride !== undefined) {
      setCoverageAvailable(coverageOverride);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initStreetView() {
      if (!isGoogleMapsConfigured()) {
        if (isMounted) {
          setCoverageAvailable(false);
          setLoading(false);
        }
        return;
      }

      try {
        const google = await loadGoogleMapsApi();
        if (!isMounted || !google) {
          setCoverageAvailable(false);
          setLoading(false);
          return;
        }

        const svService = new google.maps.StreetViewService();
        const latLng = new google.maps.LatLng(resolvedCoords.lat, resolvedCoords.lng);

        svService.getPanorama({ location: latLng, radius: 100 }, (data, status) => {
          if (!isMounted) return;

          if (status === google.maps.StreetViewStatus.OK && data && data.location) {
            setCoverageAvailable(true);
            setLoading(false);

            // Mount Panorama
            if (panoramaContainerRef.current) {
              panoramaInstanceRef.current = new google.maps.StreetViewPanorama(
                panoramaContainerRef.current,
                {
                  position: data.location.latLng,
                  pov: { heading: 165, pitch: 0 },
                  zoom: 1,
                  disableDefaultUI: false,
                  addressControl: false,
                  fullscreenControl: true,
                  motionTracking: false,
                }
              );
            }
          } else {
            setCoverageAvailable(false);
            setLoading(false);
          }
        });
      } catch (err) {
        if (isMounted) {
          setCoverageAvailable(false);
          setLoading(false);
        }
      }
    }

    initStreetView();

    return () => {
      isMounted = false;
      if (panoramaInstanceRef.current && panoramaInstanceRef.current.setVisible) {
        panoramaInstanceRef.current.setVisible(false);
      }
    };
  }, [isOpen, resolvedCoords?.lat, resolvedCoords?.lng, coverageOverride]);

  if (!isOpen) return null;

  return (
    <div
      data-lenis-prevent="true"
      data-testid="street-view-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
              <h3 className="text-sm font-bold text-[#1E293B]">
                360° Panoramic Street View
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
              {resolvedTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Street View"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Modal Body / Panorama Frame */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-900 overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="text-center text-white space-y-2">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-300">Checking Street View coverage...</p>
            </div>
          ) : !coverageAvailable ? (
            <div className="max-w-md p-8 bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E8F0] text-center space-y-3 m-4 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <h4 className="text-sm font-bold text-[#1E293B]">
                Street View Not Available
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Direct Google Street View imagery has not been surveyed for this specific private estate entrance or gated corridor.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0F766E] text-white text-xs font-bold rounded-lg hover:bg-[#115E59] transition-colors min-h-[44px]"
                >
                  Return to Overview
                </button>
              </div>
            </div>
          ) : (
            <div ref={panoramaContainerRef} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
