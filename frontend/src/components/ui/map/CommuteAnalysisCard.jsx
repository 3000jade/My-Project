import React, { useEffect, useState } from 'react';
import { mapsService } from '../../../services/mapsService';

export default function CommuteAnalysisCard({
  latitude,
  longitude,
  propertyName = 'This Property',
  className = '',
}) {
  const [commutes, setCommutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCommutes() {
      if (!latitude || !longitude) return;
      setIsLoading(true);
      try {
        const results = await mapsService.getCommute(Number(latitude), Number(longitude));
        if (isMounted) {
          setCommutes(Array.isArray(results) ? results : []);
        }
      } catch (err) {
        console.warn('[CommuteAnalysisCard] Failed to calculate commutes:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCommutes();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <div
      data-lenis-prevent="true"
      className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Lifestyle & Commercial Connectivity
          </h3>
        </div>
        <span className="text-[11px] text-[#64748B]">Driving Durations</span>
      </div>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
          <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Calculating commute times to luxury hubs...</span>
        </div>
      ) : commutes.length === 0 ? (
        <p className="text-xs text-[#64748B] italic py-2">
          Commute benchmarks calculating from {propertyName}...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {commutes.map((item, idx) => (
            <div
              key={item.destinationId || idx}
              className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-teal-200 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold text-[#1E293B] line-clamp-1">
                  {item.destinationName}
                </p>
                {item.distanceKm && (
                  <p className="text-[11px] text-[#64748B]">
                    {item.distanceKm} km
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-1 rounded bg-teal-50 text-[#0F766E] border border-teal-200 font-mono text-xs font-bold">
                  {item.durationText || `${item.durationMinutes} mins`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
