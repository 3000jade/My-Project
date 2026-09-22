import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { mockProperties } from '../../mockData/mockProperties';
import useViewingList from '../../hooks/useViewingList';
import InspectionScheduleModal from './InspectionScheduleModal';
import ActionConsole from './ActionConsole';

export default function PropertyDetailModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('propertyId');
  const [property, setProperty] = useState(null);
  const [logs, setLogs] = useState([]);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { isInViewingList, toggleViewingList } = useViewingList();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!id) {
      setProperty(null);
      return;
    }
    let found = mockProperties.find(p => p.id === id || p.ref_code === id);
    if (!found) found = mockProperties[0]; // fallback
    if (found) {
      setProperty(found);
    }
  }, [id]);

  const handleAction = (actionName, payloadData, route, method = 'POST') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      route,
      method,
      payload: { action: actionName, data: payloadData },
      timestamp
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleClose = () => {
    searchParams.delete('propertyId');
    setSearchParams(searchParams);
  };

  const handleCopyRef = (e) => {
    e.stopPropagation();
    const textToCopy = property?.ref_code || 'MLSPH91M99LRH7';
    navigator.clipboard?.writeText(textToCopy);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const isSaved = property ? isInViewingList(property.id) : false;

  const images = property?.images || property?.gallery || (property?.mainImage ? [property.mainImage] : []);

  return (
    <>
      <AnimatePresence>
        {id && property && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-6 lg:p-8 overflow-hidden font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
          >
            <motion.div
              className="w-full max-w-6xl h-full max-h-[92vh] bg-white border border-[#e1e5df] flex flex-col lg:flex-row overflow-hidden md:rounded-[28px] shadow-2xl relative text-[#1c2224]"
              initial={{ y: 80, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 80, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              data-lenis-prevent="true"
            >
              {/* Left Section: Architectural Media Viewer (White Theme) */}
              <div className="relative w-full lg:w-[55%] h-[36vh] lg:h-full bg-[#f8f9f8] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-[#e1e5df]">
                {/* Standard w-9 h-9 solid white circular close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-5 left-5 z-50 w-9 h-9 bg-white text-black shadow-lg rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-[#e1e5df]"
                  aria-label="Close details"
                >
                  <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                </button>

                {/* Photo Counter Tag in Geist Mono */}
                <div className="absolute top-5 right-5 z-40 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-[#183d3b] text-xs font-mono font-semibold border border-[#e1e5df] shadow-sm">
                  {currentSlide + 1} / {images.length || 1}
                </div>

                {/* Carousel Viewport */}
                <div className="overflow-hidden w-full h-full flex items-center relative z-10" ref={emblaRef}>
                  <div className="flex w-full h-full items-center">
                    {images.map((img, index) => (
                      <div className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4 lg:p-8" key={index}>
                        <img
                          src={img}
                          alt={`${property.title || property.name} - ${index + 1}`}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-md transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carousel Controls */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white text-[#183d3b] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-[#e1e5df] shadow-md"
                  aria-label="Previous photo"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white text-[#183d3b] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-[#e1e5df] shadow-md"
                  aria-label="Next photo"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                </button>
              </div>

              {/* Right Section: Details Sidebar (Pure White & Architectural) */}
              <div
                className="w-full lg:w-[45%] h-[64vh] lg:h-full bg-white overflow-y-auto custom-scrollbar flex flex-col relative z-10"
                data-lenis-prevent="true"
              >
                <div className="p-6 sm:p-8 flex flex-col gap-6 font-sans">
                  {/* SECTION 1: ARCHITECTURAL CADASTRE STRIP */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e1e5df]">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#183d3b]"></span>
                          <span className="font-bold uppercase tracking-[0.16em] text-[#183d3b] text-[10px]">
                            {property.status || 'FOR SALE'}
                          </span>
                        </div>
                        <span className="text-[#c2c9bf]">|</span>
                        <span className="font-semibold uppercase tracking-wider text-[#1c2224] text-[10px]">
                          {property.unit_status || 'NEW'}
                        </span>
                        <span className="text-[#c2c9bf]">|</span>
                        <span className="font-medium text-[#5f6b6f] text-[10px]">
                          {property.property_type || property.propertyType || 'Residential Condominium'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-[#5f6b6f]">
                        <span className="text-[#7a868a]">REF:</span>
                        <span className="font-bold text-[#183d3b]">{property.ref_code || 'MLSPH91M99LRH7'}</span>
                        <button
                          type="button"
                          onClick={handleCopyRef}
                          className="ml-1 text-[#7a868a] hover:text-[#183d3b] transition-colors"
                          title="Copy Reference Code"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedRef ? 'done' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Title & Geographic Subhead */}
                    <div className="mt-4">
                      <h1 className="font-display text-2xl sm:text-3xl font-light text-[#183d3b] leading-[1.2] tracking-tight">
                        {property.title || property.name}
                      </h1>
                      <p className="flex items-center gap-1.5 text-xs text-[#5f6b6f] mt-2 font-sans">
                        <span className="material-symbols-outlined text-[#c4683c] text-[16px]">location_on</span>
                        <span className="font-semibold text-[#1c2224]">{property.development || property.location || 'Urban Deca Homes Ortigas'}</span>
                        <span className="text-[#c2c9bf]">•</span>
                        <span>{property.city || property.address || 'Pasig City'}</span>
                      </p>
                    </div>
                  </div>

                  {/* SECTION 2: PRICE & PROMO CALLOUT */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 p-5 bg-[#fafafa] border border-[#e1e5df] rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a868a]">Total Contract Price</span>
                      <div className="font-display text-3xl font-light text-[#183d3b] mt-0.5">
                        {property.price || `₱${(property.price_raw || 3000000).toLocaleString()}`}
                      </div>
                    </div>

                    <div className="border-l-2 border-[#c4683c] pl-3 py-0.5">
                      <span className="text-[10px] font-bold text-[#c4683c] uppercase tracking-[0.16em] block">
                        Promo Cash-Out
                      </span>
                      <p className="font-display text-base font-normal text-[#183d3b] mt-0.5">
                        {property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
                      </p>
                      <p className="text-[11px] text-[#5f6b6f] font-medium mt-0.5">
                        {property.monthly_amortization || 'Starting at PHP 15,000 / mo'}
                      </p>
                    </div>
                  </div>

                  {/* SECTION 3: KEY METRICS - ARCHITECTURAL LEDGER STRIP */}
                  <div className="border border-[#e1e5df] rounded-2xl p-4 bg-white shadow-sm">
                    <div className="grid grid-cols-3 gap-y-4 divide-x divide-[#e1e5df]">
                      <div className="px-3 first:pl-0">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Bedrooms</p>
                        <p className="font-display text-2xl font-light text-[#183d3b] mt-0.5">{property.bedrooms || property.beds || 2}</p>
                      </div>

                      <div className="px-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Bathrooms</p>
                        <p className="font-display text-2xl font-light text-[#183d3b] mt-0.5">{property.bathrooms || property.baths || 1}</p>
                      </div>

                      <div className="px-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Floor Area</p>
                        <p className="font-display text-2xl font-light text-[#183d3b] mt-0.5">{property.sqm || '30.60 sqm'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-y-4 divide-x divide-[#e1e5df] pt-4 mt-4 border-t border-[#e1e5df]">
                      <div className="px-3 first:pl-0">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Floor Level</p>
                        <p className="font-display text-xl font-light text-[#183d3b] mt-0.5">{property.floor_level || '6th Floor'}</p>
                      </div>

                      <div className="px-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Furnishing</p>
                        <p className="font-display text-xl font-light text-[#183d3b] mt-0.5">{property.furnishing || 'Bare'}</p>
                      </div>

                      <div className="px-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7a868a]">Year Built</p>
                        <p className="font-display text-xl font-light text-[#183d3b] mt-0.5">{property.year_built || 2023}</p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (Standardized h-[54px]) */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleAction('Schedule Tour', { propertyId: property.id }, '/api/scheduling/tour');
                        setIsScheduleModalOpen(true);
                      }}
                      className="w-full h-[54px] rounded-xl bg-[#c4683c] hover:bg-[#b0572d] text-white text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      Schedule Free Site Viewing
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          toggleViewingList(property);
                          handleAction('Toggle Viewing List', { propertyId: property.id }, '/api/viewing-list');
                        }}
                        className={`w-full h-[54px] rounded-xl text-xs font-bold uppercase tracking-wider font-sans flex items-center justify-center gap-2 transition-all ${
                          isSaved
                            ? 'bg-[#2d6a4f] text-white shadow-sm'
                            : 'bg-white hover:bg-gray-50 text-[#183d3b] border border-[#183d3b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isSaved ? 'check_circle' : 'playlist_add'}
                        </span>
                        {isSaved ? 'In Viewing List' : 'Add to Viewing List'}
                      </button>

                      <Link
                        to={`/properties/${property.id}`}
                        onClick={handleClose}
                        className="w-full h-[54px] rounded-xl border border-[#183d3b] text-[#183d3b] hover:bg-[#183d3b]/5 text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Open Full Listing View
                      </Link>
                    </div>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <div className="pt-2">
                      <h2 className="text-[10px] font-bold font-sans text-[#7a868a] mb-2 uppercase tracking-[0.16em]">Property Overview</h2>
                      <p className="font-sans text-xs text-[#5f6b6f] leading-relaxed">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Assigned Brokerage Information */}
                  <div className="mt-2 p-4 rounded-xl border border-[#e1e5df] bg-[#fafafa] flex items-center gap-3.5">
                    <img
                      src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={property.agent?.name || 'Jayson Canonico'}
                      className="w-12 h-12 rounded-xl object-cover border border-[#e1e5df]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#183d3b]">
                        {property.agent?.name || 'Jayson Canonico'}
                      </p>
                      <p className="text-[11px] text-[#7a868a]">
                        {property.agent?.title || 'Real Estate Agent'} • Verified Partner
                      </p>
                      <p className="text-[10px] text-[#c4683c] font-semibold mt-0.5">
                        {property.call_to_action || property.agent?.cta || 'Direct message for free site viewing'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Downstream Inspection Schedule Modal */}
      {property && (
        <InspectionScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          property={property}
        />
      )}

      {/* Action Console */}
      {id && property && <ActionConsole logs={logs} />}
    </>
  );
}
