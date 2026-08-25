import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { mockProperties } from '../../utils/mockProperties';
import ActionConsole from './ActionConsole';
import Button from './Button';

export default function PropertyDetailModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('propertyId');
  const [property, setProperty] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!id) {
      setProperty(null);
      return;
    }
    let found = mockProperties.find(p => p.id === id);
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

  return (
    <>
      <AnimatePresence>
        {id && property && (
          <motion.div 
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-8 overflow-hidden" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-full h-full bg-black flex flex-col lg:flex-row overflow-hidden md:rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative"
              initial={{ y: 100, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
            {/* Left Section: Immersive Media Viewer */}
            <div className="relative w-full lg:w-[65%] h-[40vh] lg:h-full bg-[#050505] flex items-center justify-center overflow-hidden">
               {/* Blurred Background Layer for Immersive Feel */}
               <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center blur-[80px] opacity-40 transform scale-125"
                  style={{ backgroundImage: `url(${property.mainImage})` }}
               />
               
               <button 
                onClick={handleClose}
                className="absolute top-6 left-6 z-50 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="Close details"
              >
                <span className="material-symbols-outlined text-[20px] font-bold group-hover:rotate-90 transition-transform">close</span>
              </button>

              <div className="overflow-hidden w-full h-full flex items-center relative z-10" ref={emblaRef}>
                <div className="flex w-full h-full items-center">
                  {[property.mainImage, ...property.gallery].map((img, index) => (
                    <div className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-0 lg:p-12" key={index}>
                       <img src={img} alt={`${property.name} - ${index}`} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              <button onClick={scrollPrev} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all hover:scale-105 border border-white/20 shadow-lg">
                 <span className="material-symbols-outlined text-[28px]">chevron_left</span>
              </button>
              <button onClick={scrollNext} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all hover:scale-105 border border-white/20 shadow-lg">
                 <span className="material-symbols-outlined text-[28px]">chevron_right</span>
              </button>
              
              {/* Bottom Gradient overlay for text contrast if needed */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
            </div>

            {/* Right Section: Details Sidebar */}
            <div 
              className="w-full lg:w-[35%] h-[60vh] lg:h-full bg-[#FDFCF8] overflow-y-auto custom-scrollbar flex flex-col relative z-10 border-l border-white/20"
              data-lenis-prevent="true"
            >
               <div className="p-8 md:p-10 flex flex-col gap-10">
                  
                  {/* Header Area */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      {property.badge && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold font-sans bg-[#266F71]/10 text-[#266F71] uppercase tracking-widest border border-[#266F71]/20 shadow-sm">
                          {property.badge}
                        </div>
                      )}
                      {property.propertyType && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold font-sans bg-[#F4A261]/10 text-[#F4A261] uppercase tracking-widest border border-[#F4A261]/20 shadow-sm">
                          {property.propertyType}
                        </div>
                      )}
                    </div>
                    <h1 className="font-display text-4xl text-[#1B1C1A] mb-3 font-extrabold leading-[1.1] tracking-tight">{property.name}</h1>
                    <div className="flex items-center text-gray-500 font-sans text-sm mb-6">
                      <span className="material-symbols-outlined text-[#266F71] mr-1.5 text-[20px]">location_on</span>
                      {property.location}
                    </div>
                    <div className="font-display text-4xl font-extrabold mb-1 bg-gradient-to-r from-[#266F71] to-[#174849] bg-clip-text text-transparent">{property.price}</div>
                    <div className="text-gray-400 font-sans text-[11px] uppercase tracking-widest font-bold">
                      Estimated Market Value
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 border-y border-[#E5E7EB] py-8">
                    <Button 
                      variant="primary" 
                      size="full" 
                      onClick={() => handleAction('Schedule Tour', { propertyId: property.id }, '/api/scheduling/tour')}
                      className="bg-[#266F71] hover:bg-[#174849] text-white shadow-xl shadow-[#266F71]/20 h-[54px]"
                    >
                      Schedule Tour
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-[54px] w-[54px] border-[#E5E7EB] hover:bg-[#266F71]/5 hover:border-[#266F71]/30 hover:text-[#266F71]"
                      onClick={() => handleAction('Save Property', { propertyId: property.id }, '/api/users/saved-properties')}
                    >
                      <span className="material-symbols-outlined">favorite</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-[54px] w-[54px] border-[#E5E7EB] hover:bg-[#266F71]/5 hover:border-[#266F71]/30 hover:text-[#266F71]"
                      onClick={() => handleAction('Share Property', { propertyId: property.id }, '/api/actions/share')}
                    >
                      <span className="material-symbols-outlined">share</span>
                    </Button>
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#266F71] text-[20px]">bed</span>
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-[#1B1C1A] leading-none mb-1">{property.beds}</div>
                        <div className="text-[#266F71]/70 text-[10px] uppercase tracking-widest font-bold">Beds</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#266F71] text-[20px]">bathtub</span>
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-[#1B1C1A] leading-none mb-1">{property.baths}</div>
                        <div className="text-[#266F71]/70 text-[10px] uppercase tracking-widest font-bold">Baths</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#266F71] text-[20px]">square_foot</span>
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-[#1B1C1A] leading-none mb-1">{property.sqm}</div>
                        <div className="text-[#266F71]/70 text-[10px] uppercase tracking-widest font-bold">Sqm</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                      <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#266F71] text-[20px]">garage</span>
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-[#1B1C1A] leading-none mb-1">{property.parking || "0"}</div>
                        <div className="text-[#266F71]/70 text-[10px] uppercase tracking-widest font-bold">Parking</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-[11px] font-bold font-sans text-[#266F71] mb-4 uppercase tracking-[0.2em]">Property Description</h2>
                    <p className="font-sans text-[15px] text-gray-600 leading-[1.8]">
                      {property.description}
                    </p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h2 className="text-[11px] font-bold font-sans text-[#266F71] mb-4 uppercase tracking-[0.2em]">Premium Amenities</h2>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      {property.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#266F71] text-[18px]">check_circle</span>
                          <span className="font-sans text-sm text-gray-700 font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map / Location */}
                  <div>
                    <h2 className="text-[11px] font-bold font-sans text-[#266F71] mb-4 uppercase tracking-[0.2em]">Location Details</h2>
                    <div className="h-56 w-full rounded-2xl overflow-hidden relative shadow-inner border border-[#E5E7EB] bg-[#F1F0EC] flex flex-col items-center justify-center">
                       <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">map</span>
                       <span className="text-gray-400 font-sans text-sm font-medium">Interactive Map Unavailable</span>
                    </div>
                    <div className="mt-4 font-sans text-[13px] text-gray-500 font-medium tracking-wide flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#266F71] text-[18px] mt-0.5">pin_drop</span>
                      {property.address}
                    </div>
                  </div>

                  {/* Agent Card */}
                  <div className="mt-2 mb-8 flex flex-col gap-5 p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#266F71]/5 rounded-bl-full -z-10"></div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md">
                        <img alt="Agent" src={property.agent.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-[#1B1C1A] font-sans">{property.agent.name}</div>
                        <div className="text-[10px] text-[#F4A261] uppercase font-bold tracking-widest font-sans mt-0.5">{property.agent.title}</div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 bg-[#266F71] hover:bg-[#174849] text-white shadow-[0_4px_14px_rgba(38,111,113,0.3)] transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none"
                        onClick={() => handleAction('Call Agent', { propertyId: property.id, agent: property.agent.name }, '/api/inquiries/call')}
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        Call Agent
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 bg-[#F4A261] hover:bg-[#D97706] text-white shadow-[0_4px_14px_rgba(244,162,97,0.3)] transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none"
                        onClick={() => handleAction('Contact Agent', { propertyId: property.id, agent: property.agent.name }, '/api/inquiries/contact')}
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        Message
                      </Button>
                    </div>
                  </div>

               </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Action Console */}
      {id && property && <ActionConsole logs={logs} />}
    </>
  );
}
