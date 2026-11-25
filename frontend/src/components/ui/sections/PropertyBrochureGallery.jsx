import React from 'react';
import {
  Building2,
  Camera,
  Tag,
  KeyRound,
  Landmark,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function getTransactionIcon(transactionLabel = '') {
  const lower = String(transactionLabel).toLowerCase();
  if (lower.includes('foreclos')) return Landmark;
  if (lower.includes('rent')) return KeyRound;
  return Tag;
}

/**
 * Hero Gallery View with Status badges and Price overlay.
 * Strictly adheres to DESIGN.md tokens (rounded-xl outer card, rounded-lg photo frames,
 * #FFFFFF / #E2E8F0 / #1E293B / #0F766E / #FF8559 with #1E293B text, 8pt spacing, 44px touch targets).
 */
export default function PropertyBrochureGallery({
  photos = [],
  title = 'Property',
  transactionLabel = 'For Sale',
  propertyCondition = '',
  isFeatured = false,
  standardStatus = 'Active',
  isStatusPending = false,
  isRent = false,
  rentFreq = 'mo',
  formattedPriceDisplay = 'Price on Request',
  pricePerSqm = null,
  onOpenGallery,
}) {
  const hasPhotos = Array.isArray(photos) && photos.length > 0;
  const hasMultiple = photos.length > 1;
  const TransactionIcon = getTransactionIcon(transactionLabel);

  const statusOverlay = (
    <div className="flex flex-wrap items-center gap-2 max-w-[85%]">
      <Badge
        variant="outline"
        className="bg-white/95 border-[#E2E8F0] text-[#1E293B] shadow-xs gap-1 normal-case tracking-normal"
      >
        <TransactionIcon className="size-3.5 text-[#0F766E]" aria-hidden="true" />
        <span>{transactionLabel}</span>
      </Badge>

      {propertyCondition && (
        <Badge
          variant="outline"
          className="bg-white/95 border-[#E2E8F0] text-[#0F766E] shadow-xs gap-1 normal-case tracking-normal"
        >
          <CheckCircle2 className="size-3.5 text-[#0F766E]" aria-hidden="true" />
          <span>{propertyCondition}</span>
        </Badge>
      )}

      {!isStatusPending ? (
        <Badge variant="primary" data-testid="reso-standard-status" className="shadow-xs">
          {standardStatus}
        </Badge>
      ) : (
        <span data-testid="reso-standard-status" className="sr-only">
          {standardStatus}
        </span>
      )}

      {isFeatured && (
        <Badge className="bg-[#FF8559] text-white border-transparent font-bold shadow-xs">
          Featured
        </Badge>
      )}
    </div>
  );

  const priceOverlay = (
    <div className="bg-white/95 backdrop-blur-xs border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-xs">
      <span className="block text-xs font-medium text-[#64748B]">
        {isRent ? 'Monthly Rent' : 'Selling Price'}
      </span>
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          data-testid="reso-list-price"
          className="text-xl sm:text-2xl font-bold text-[#0F766E] tracking-tight"
        >
          {formattedPriceDisplay}
          {isRent && (
            <span className="text-xs font-sans font-normal text-[#64748B]"> / {rentFreq}</span>
          )}
        </span>
        {pricePerSqm && (
          <span className="text-xs font-sans text-[#64748B]">{pricePerSqm}</span>
        )}
      </div>
    </div>
  );

  return (
    <Card className="rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        {!hasPhotos ? (
          <div className="md:col-span-12 relative h-72 sm:h-96 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-[#64748B] p-4">
            <div className="absolute top-4 left-4">{statusOverlay}</div>
            <Building2 className="size-10 text-[#64748B]" />
            <span className="text-sm font-semibold text-[#1E293B]">No photos uploaded yet</span>
            <div className="absolute bottom-4 left-4">{priceOverlay}</div>
          </div>
        ) : (
          <>
            <div
              className={`${
                hasMultiple ? 'md:col-span-8' : 'md:col-span-12'
              } relative h-72 sm:h-96 lg:h-[440px] rounded-lg overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] group`}
            >
              <button
                type="button"
                onClick={() => onOpenGallery?.(0)}
                aria-label={`View ${title} cover photo`}
                className="w-full h-full block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
              >
                <img
                  src={photos[0]}
                  alt={`${title} cover photo`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform motion-safe:duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />
              </button>

              {/* Top-left Status Pills */}
              <div className="absolute top-4 left-4 z-10">{statusOverlay}</div>

              {/* Bottom-left Price Card */}
              <div className="absolute bottom-4 left-4 z-10">{priceOverlay}</div>

              {!hasMultiple && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => onOpenGallery?.(0)}
                  className="absolute bottom-4 right-4 z-10 rounded-lg bg-white/95 hover:bg-white text-[#1E293B] border-[#E2E8F0] shadow-xs text-xs font-semibold normal-case tracking-normal min-h-11"
                >
                  <Camera data-icon="inline-start" className="text-[#0F766E]" />
                  All Photos ({photos.length})
                </Button>
              )}
            </div>

            {hasMultiple && (
              <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-2 h-96 lg:h-[440px]">
                <button
                  type="button"
                  onClick={() => onOpenGallery?.(1)}
                  aria-label={`View ${title} photo 2`}
                  className="relative rounded-lg overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                >
                  <img
                    src={photos[1]}
                    alt={`${title} preview 2`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform motion-safe:duration-500"
                  />
                </button>

                <div className="relative rounded-lg overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] group">
                  <button
                    type="button"
                    onClick={() => onOpenGallery?.(photos[2] ? 2 : 0)}
                    aria-label={`View ${title} photo 3`}
                    className="w-full h-full block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                  >
                    <img
                      src={photos[2] || photos[0]}
                      alt={`${title} preview 3`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform motion-safe:duration-500"
                    />
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onOpenGallery?.(0)}
                    className="absolute bottom-4 right-4 z-10 rounded-lg bg-white/95 hover:bg-white text-[#1E293B] border-[#E2E8F0] shadow-xs text-xs font-semibold normal-case tracking-normal min-h-11"
                  >
                    <Camera data-icon="inline-start" className="text-[#0F766E]" />
                    All Photos ({photos.length})
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
