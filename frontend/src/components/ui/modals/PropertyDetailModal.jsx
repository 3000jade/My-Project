import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import propertyService from '../../../services/propertyService';
import useViewingList from '../../../hooks/useViewingList';
import InspectionScheduleModal from './InspectionScheduleModal';
import ActionConsole from '../cards/ActionConsole';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  MapPin,
  Calendar,
  Bookmark,
  ExternalLink,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Sparkles
} from 'lucide-react';

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
    let isMounted = true;
    async function fetchProperty() {
      try {
        const prop = await propertyService.getPropertyById(id);
        if (isMounted) setProperty(prop || null);
      } catch (e) {
        if (isMounted) setProperty(null);
      }
    }
    fetchProperty();
    return () => { isMounted = false; };
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

  const standardStatus = property?.standard_status || property?.standardStatus || (property?.status === 'AVAILABLE' ? 'Active' : property?.status === 'SOLD' ? 'Closed' : property?.status === 'RESERVED' ? 'Active Under Contract' : property?.status || 'Active');
  const lowerStatus = String(standardStatus).toLowerCase();
  const isUnderContract = lowerStatus.includes('contract') || lowerStatus.includes('reserved') || property?.status === 'RESERVED';
  const isClosed = lowerStatus.includes('closed') || lowerStatus.includes('sold') || property?.status === 'SOLD';

  const images = property?.images || property?.gallery || (property?.mainImage ? [property.mainImage] : []);

  return (
    <>
      <AnimatePresence>
        {id && property && (
          <motion.div
            className="fixed inset-0 z-[200] bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center p-0 md:p-6 lg:p-8 overflow-hidden font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          >
            <motion.div
              className="w-full max-w-6xl h-full max-h-[92vh] bg-white border border-[#CBD5E1] flex flex-col lg:flex-row overflow-hidden md:rounded-xl shadow-2xl relative text-[#1E293B]"
              initial={{ y: 40, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              data-lenis-prevent="true"
            >
              {/* Left Section: Architectural Media Viewer */}
              <div className="relative w-full lg:w-[55%] h-[36vh] lg:h-full bg-[#F8FAFC] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-[#CBD5E1]">
                {/* Clean round close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 left-4 z-50 w-9 h-9 bg-white text-[#1E293B] shadow-sm rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-[#CBD5E1] cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Photo Counter Tag */}
                <div className="absolute top-4 right-4 z-40 px-2.5 py-1 rounded-md bg-white/95 text-[#0F766E] text-xs font-mono font-semibold border border-[#CBD5E1] shadow-2xs">
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
                          className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carousel Controls */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white hover:bg-slate-50 text-[#1E293B] rounded-lg flex items-center justify-center transition-all border border-[#CBD5E1] shadow-2xs cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white hover:bg-slate-50 text-[#1E293B] rounded-lg flex items-center justify-center transition-all border border-[#CBD5E1] shadow-2xs cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Right Section: Details Sidebar */}
              <div
                className="w-full lg:w-[45%] h-[64vh] lg:h-full bg-white overflow-y-auto custom-scrollbar flex flex-col relative z-10"
                data-lenis-prevent="true"
              >
                <div className="p-6 sm:p-7 flex flex-col gap-5">
                  {/* Cadastre Strip */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isClosed
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isUnderContract
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isClosed ? 'bg-rose-600' : isUnderContract ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`}></span>
                          {isClosed ? 'SOLD / CLOSED' : isUnderContract ? 'UNDER CONTRACT' : (property.status || 'AVAILABLE')}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-[#1E293B] text-[11px]">
                          {property.property_type || property.propertyType || 'Residential'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
                        <span className="text-slate-400">REF:</span>
                        <span className="font-bold text-[#1E293B]">{property.ref_code || property.id || 'HSR-101'}</span>
                        <button
                          type="button"
                          onClick={handleCopyRef}
                          className="text-slate-400 hover:text-[#0F766E] transition-colors cursor-pointer"
                          title="Copy Reference Code"
                        >
                          {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Title & Geographic Subhead */}
                    <div className="mt-3">
                      <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] leading-snug tracking-tight">
                        {property.title || property.name}
                      </h1>
                      <p className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span className="font-semibold text-[#1E293B]">{property.development || property.location || 'Metro Manila'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{property.city || property.address || 'Philippines'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Price Banner */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{isClosed ? "Sold Price Benchmark" : isUnderContract ? "Contract Pending Price" : "Valuation Price"}</span>
                      <div className="text-2xl font-bold font-mono text-[#0F766E] mt-0.5">
                        {property.price || `₱${(property.price_raw || 0).toLocaleString()}`}
                      </div>
                    </div>
                    {property.promo_cash_out && (
                      <div className="text-right border-l border-[#CBD5E1] pl-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B6B] flex items-center gap-1 justify-end">
                          <Sparkles className="w-3 h-3" />
                          Promo Terms
                        </span>
                        <p className="text-xs font-semibold text-[#1E293B] mt-0.5">{property.promo_cash_out}</p>
                      </div>
                    )}
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
                      <Bed className="w-4 h-4 mx-auto text-[#0F766E] mb-0.5" />
                      <p className="text-base font-bold text-[#1E293B]">{property.bedrooms || property.beds || 2}</p>
                      <p className="text-[10px] uppercase font-semibold text-[#64748B]">Beds</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
                      <Bath className="w-4 h-4 mx-auto text-[#0F766E] mb-0.5" />
                      <p className="text-base font-bold text-[#1E293B]">{property.bathrooms || property.baths || 1}</p>
                      <p className="text-[10px] uppercase font-semibold text-[#64748B]">Baths</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs">
                      <Maximize2 className="w-4 h-4 mx-auto text-[#0F766E] mb-0.5" />
                      <p className="text-base font-bold text-[#1E293B]">{property.sqm || property.floor_area || '30.60 sqm'}</p>
                      <p className="text-[10px] uppercase font-semibold text-[#64748B]">Floor Area</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-1">
                    {isClosed ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
                        <p className="text-xs font-bold text-slate-800">Transaction Closed • Sold Benchmark</p>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          This property has been successfully closed and remains visible as a price and architectural benchmark. Inquire below for comparable listings in this district.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleAction('Schedule Tour', { propertyId: property.id }, '/api/scheduling/tour');
                          setIsScheduleModalOpen(true);
                        }}
                        className={`w-full h-11 rounded-lg text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          isUnderContract
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-[#FF6B6B] hover:bg-[#EE5A5A]'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{isUnderContract ? 'Submit Backup Offer / Viewing' : 'Schedule Free Site Viewing'}</span>
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          toggleViewingList(property);
                          handleAction('Toggle Viewing List', { propertyId: property.id }, '/api/viewing-list');
                        }}
                        className={`w-full h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-[#1E293B] border-[#CBD5E1]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isSaved ? 'In Viewing List' : 'Add to Viewing List'}</span>
                      </button>

                      <Link
                        to={`/properties/${property.id}`}
                        onClick={handleClose}
                        className="w-full h-11 rounded-lg bg-white hover:bg-slate-50 text-[#0F766E] border border-[#CBD5E1] hover:border-[#0F766E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Full Listing View</span>
                      </Link>
                    </div>
                  </div>

                  {/* Narrative Description */}
                  {property.description && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Property Overview</h2>
                      <p className="text-xs text-[#1E293B] leading-relaxed whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Assigned Brokerage Information */}
                  <div className="p-3.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] flex items-center gap-3">
                    <img
                      src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={property.agent?.name || 'Agent'}
                      className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1E293B] truncate">
                        {property.agent?.name || 'Authorized Broker Representative'}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {property.agent?.title || 'Real Estate Specialist'} • Verified Partner
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
