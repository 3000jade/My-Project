import React from 'react';
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  Maximize2,
  LandPlot,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Property Details Card placed below the Hero Gallery and Navigation Panel.
 * Focuses strictly on Property Title, Tagline (when present), Address, and Key Specs.
 * Status and Price live in PropertyBrochureGallery; Agent and actions live in PropertyAgentCard.
 */
export default function PropertyHeroDetailsCard({
  propertyType = 'Residential',
  propertyCategory = '',
  title = 'Untitled Property',
  tagline = '',
  fullAddress = '',
  isVacantLot = false,
  bedrooms = null,
  bathrooms = null,
  parkingTotal = null,
  livingAreaFormatted = null,
  lotAreaFormatted = null,
}) {
  const eyebrowText = [propertyCategory, propertyType].filter(Boolean).join(' · ') || propertyType;
  const isStudioEligibleType = ['studio', 'condominium'].includes(
    String(propertyType || '').trim().toLowerCase()
  );
  const isZeroBedrooms = bedrooms !== null && bedrooms !== undefined && bedrooms !== '' && Number(bedrooms) === 0;
  const showBedroomsChip = !isZeroBedrooms || isStudioEligibleType;

  return (
    <Card className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs flex flex-col gap-4">
      {/* Coral Dash Eyebrow + Bold Title with Coral Dot + Tagline + Address */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          <span className="w-4 h-0.5 bg-[#FF8559] rounded-full shrink-0" aria-hidden="true" />
          <span className="truncate">{eyebrowText}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight leading-tight">
          <span>{title}</span>
          <span className="text-[#FF8559]">.</span>
        </h1>

        {tagline && (
          <p className="text-sm font-medium text-[#64748B] leading-relaxed">
            {tagline}
          </p>
        )}

        <p className="flex items-start gap-2 text-sm text-[#64748B]">
          <MapPin className="size-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{fullAddress}</span>
        </p>
      </div>

      {/* Inline Key Specs Row */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-4 text-sm text-[#64748B] font-medium">
        {!isVacantLot ? (
          <>
            {showBedroomsChip && (
              <div className="flex items-center gap-2">
                <BedDouble className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
                <span>
                  <span data-testid="reso-bedrooms" className="font-semibold text-[#1E293B]">
                    {isZeroBedrooms ? 'Studio' : bedrooms != null ? String(bedrooms) : '—'}
                  </span>
                  {!isZeroBedrooms && ' beds'}
                </span>
              </div>
            )}

            {Number(bathrooms) !== 0 && (
              <div className="flex items-center gap-2">
                <Bath className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
                <span>
                  <span data-testid="reso-bathrooms" className="font-semibold text-[#1E293B]">
                    {bathrooms != null ? String(bathrooms) : '—'}
                  </span>{' '}
                  baths
                </span>
              </div>
            )}

            {Number(parkingTotal) !== 0 && (
              <div className="flex items-center gap-2">
                <Car className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#1E293B]">
                    {parkingTotal != null ? String(parkingTotal) : '—'}
                  </span>{' '}
                  parking space
                </span>
              </div>
            )}

            {!/^0(?:\.0+)?\b/.test(String(livingAreaFormatted || '').trim()) && (
              <div className="flex items-center gap-2">
                <Maximize2 className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
                <span data-testid="reso-living-area" className="font-semibold text-[#1E293B]">
                  {livingAreaFormatted || '—'}
                </span>
              </div>
            )}

            {lotAreaFormatted && (
              <div className="flex items-center gap-2">
                <LandPlot className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
                <span>
                  Lot:{' '}
                  <span data-testid="reso-lot-size" className="font-semibold text-[#1E293B]">
                    {lotAreaFormatted}
                  </span>
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <LandPlot className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
            <span>
              Lot Area:{' '}
              <span data-testid="reso-lot-size" className="font-semibold text-[#1E293B]">
                {lotAreaFormatted || '—'}
              </span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
