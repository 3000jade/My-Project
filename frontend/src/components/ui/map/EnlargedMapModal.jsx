import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  IconX, 
  IconMapPin, 
  IconCrosshair, 
  IconBuildingSkyscraper, 
  IconCompass,
  IconExternalLink 
} from '@tabler/icons-react';
import GooglePropertyMap from './GooglePropertyMap';
import propertyService from '../../../services/propertyService';
import { mockProperties } from '../../../mockData/mockProperties';
import { getPropertyCoordinates } from '../../../utils/propertyCoordinates';

/**
 * EnlargedMapModal: Fullscreen interactive map dialog to explore
 * the full scale of active properties across the platform/region,
 * anchored onto the current property with Approved Coral (#FF6B6B) highlighting.
 */
export default function EnlargedMapModal({
  isOpen,
  onClose,
  currentProperty,
  properties: initialProperties = null,
  onSelectProperty,
}) {
  const [properties, setProperties] = useState(initialProperties || []);
  const [selectedPropertyId, setSelectedPropertyId] = useState(currentProperty?.id || null);
  const [isLoading, setIsLoading] = useState(!initialProperties || initialProperties.length === 0);

  // Sync selectedPropertyId with currentProperty when modal opens
  useEffect(() => {
    if (currentProperty?.id) {
      setSelectedPropertyId(currentProperty.id);
    }
  }, [currentProperty?.id, isOpen]);

  // Load properties if not provided
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    if (initialProperties && initialProperties.length > 0) {
      setProperties(initialProperties);
      setIsLoading(false);
      return;
    }

    async function fetchProperties() {
      setIsLoading(true);
      try {
        const getFn = propertyService?.getProperties || (propertyService?.default && propertyService.default.getProperties);
        const result = typeof getFn === 'function' ? await getFn({ limit: 100 }) : mockProperties;
        const list = Array.isArray(result) ? result : (result?.data || result?.properties || []);
        if (isMounted) {
          if (list && list.length > 0) {
            // Ensure currentProperty is included in the list
            const hasCurrent = currentProperty?.id && list.some(p => p.id === currentProperty.id);
            setProperties(hasCurrent || !currentProperty ? list : [currentProperty, ...list]);
          } else {
            // Fallback to mock data for resilience
            setProperties(mockProperties);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[EnlargedMapModal] Failed fetching live properties, using fallback dataset:', err);
          setProperties(mockProperties);
          setIsLoading(false);
        }
      }
    }

    fetchProperties();

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialProperties, currentProperty]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Current property coordinates
  const currentCoords = useMemo(() => {
    return currentProperty ? getPropertyCoordinates(currentProperty) : { lat: 14.5547, lng: 121.0244 };
  }, [currentProperty]);

  // Handle re-center on current property
  const handleRecenter = useCallback(() => {
    if (currentProperty?.id) {
      setSelectedPropertyId(currentProperty.id);
    }
  }, [currentProperty?.id]);

  if (!isOpen) return null;

  const currentTitle = currentProperty?.title || 'Selected Property';
  const currentAddress = currentProperty?.location || currentProperty?.address || 'Metro Manila, Philippines';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged property location and neighborhood map"
      data-lenis-prevent="true"
      data-testid="enlarged-map-modal"
      data-modal="broker-dialog"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
    >
      {/* Top Navigation & Status Bar */}
      <header className="shrink-0 h-16 sm:h-18 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0">
            <IconBuildingSkyscraper size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-[#1E293B] truncate">
                {currentTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF6B6B]/15 text-[#1E293B] border border-[#FF6B6B]/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]"></span>
                Current Property
              </span>
            </div>
            <p className="text-xs text-[#64748B] truncate mt-0.5 flex items-center gap-1">
              <IconMapPin size={13} className="text-[#0F766E] shrink-0" />
              <span>{currentAddress}</span>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono bg-teal-50 border border-teal-200 text-[#0F766E]">
            {properties.length} Active Listings
          </span>

          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Re-center on this property"
            title="Re-center on this property"
            className="h-10 px-3 sm:px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <IconCrosshair size={16} className="text-[#0F766E]" />
            <span className="hidden sm:inline">Center on Property</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close enlarged map"
            className="w-10 h-10 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-100 text-[#1E293B] flex items-center justify-center transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <IconX size={20} />
          </button>
        </div>
      </header>

      {/* Main Full-Scale Map Canvas Viewport */}
      <main className="relative flex-1 w-full h-full min-h-0 bg-[#F8FAFC]">
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <div className="px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] shadow-lg flex items-center gap-2.5 text-xs font-semibold text-[#0F766E]">
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              <span>Loading marketplace catalog...</span>
            </div>
          </div>
        )}

        <GooglePropertyMap
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          singlePropertyMode={false}
          interactive={true}
          showControls={true}
          searchAsMove={false}
          className="w-full h-full"
          onSelectProperty={(p) => {
            setSelectedPropertyId(p?.id);
            if (typeof onSelectProperty === 'function') {
              onSelectProperty(p);
            }
          }}
        />

        {/* Floating Quick Legend Indicator */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-md text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] border border-white ring-1 ring-[#FF6B6B]/40"></span>
            <span className="font-semibold text-[#1E293B]">Current Property</span>
          </div>
          <div className="h-3 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] border border-white ring-1 ring-teal-200"></span>
            <span className="text-[#64748B]">Other Active Listings</span>
          </div>
        </div>
      </main>
    </div>
  );
}
