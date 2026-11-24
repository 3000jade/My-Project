import React, { useEffect } from 'react';
import { X, Building2, ChevronRight, Bed, Bath, Maximize2 } from 'lucide-react';
import { formatPriceBadge } from './googleMapMarkers';
import { resolveDriveImageUrl } from '../../../services/driveService';
import { formatPropertyAddressHeading } from '../../../services/propertyService';

/**
 * Slide-over drawer / bottom-sheet displaying co-located units at an anchor pinpoint.
 */
export default function MultiUnitDrawer({
  isOpen = false,
  cluster = null,
  onClose,
  onSelectProperty,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cluster) return null;

  const properties = cluster.properties || [];

  return (
    <div
      className="absolute inset-0 z-30 flex justify-end bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="multi-unit-drawer-backdrop"
    >
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Listings at ${cluster.title}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-100/80 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#1E293B] truncate">
                {cluster.title}
              </h3>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                <span>{properties.length} Residences available</span>
                {cluster.city && (
                  <>
                    <span>•</span>
                    <span className="truncate">{cluster.city}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price Range Banner */}
        {cluster.priceRange && (
          <div className="px-4 py-2 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-teal-900">Price Range</span>
            <span className="font-bold text-[#0F766E]">{cluster.priceRange}</span>
          </div>
        )}

        {/* Units Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100" data-lenis-prevent="true">
          {properties.map((property) => {
            const title = property.title || formatPropertyAddressHeading(property, 'Residence');
            const price =
              property.formattedPrice ||
              (typeof property.price === 'number'
                ? `₱${property.price.toLocaleString()}`
                : property.price) ||
              formatPriceBadge(property.price_raw);
            const rawImage =
              property.image ||
              property.mainImage ||
              property.images?.[0] ||
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
            const image = resolveDriveImageUrl(rawImage, rawImage);
            const unitLabel = [
              property.tower_name,
              property.floor_level ? `Flr ${property.floor_level}` : null,
              property.unit_number,
            ].filter(Boolean).join(' • ');

            return (
              <div
                key={property.id}
                data-testid={`unit-card-${property.id}`}
                onClick={() => onSelectProperty?.(property)}
                className="pt-3 first:pt-0 group flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-100 shrink-0 relative">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {property.property_type && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white uppercase tracking-wider">
                      {property.property_type.replace(/([A-Z])/g, ' $1')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-sm font-semibold text-[#1E293B] group-hover:text-[#0F766E] transition-colors line-clamp-1">
                      {title}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>

                  {unitLabel && (
                    <p className="text-xs font-medium text-[#0F766E] mt-0.5 truncate">
                      {unitLabel}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                    {(property.bedrooms != null || property.beds != null) && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        <span>{property.bedrooms ?? property.beds} bd</span>
                      </span>
                    )}
                    {(property.bathrooms != null || property.baths != null) && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        <span>{property.bathrooms ?? property.baths} ba</span>
                      </span>
                    )}
                    {(property.floor_area_sqm != null || property.sqm != null || property.area != null) && (
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-slate-400" />
                        <span>{property.floor_area_sqm ?? property.sqm ?? property.area} sqm</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-sm font-bold text-[#1E293B]">
                    {price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

